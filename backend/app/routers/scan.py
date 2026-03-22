"""Sprint 2: Face Scan & AI Analysis Router

FastAPI router for face scan API endpoints.
Designed for GitHub Pages frontend + Railway backend architecture.

Status: Phase 1 Implementation - Foundation Layer
Created: December 6, 2025
"""

import hashlib
import io
import json
import logging
import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from PIL import Image
from sqlalchemy.orm import Session, defer

from app.config import settings
from app.core.security import get_current_user, get_current_user_optional
from app.database import get_db
from app.models import ScanSession, SkinAnalysis, User
from app.schemas.scan_schemas import (
    ScanActionsResponse,
    ScanHistoryItem,
    ScanHistoryResponse,
    ScanInitResponse,
    ScanResultResponse,
    ScanStatusResponse,
    ScanUploadResponse,
)
from app.services.openai_vision_service import (
    OpenAIVisionError,
    get_openai_client,
    get_supported_signals,
)

router = APIRouter(prefix="/api/v1/scan", tags=["Face Scan"])
logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_IMAGE_DIMENSION = 4096  # max width or height (prevents decompression bombs)
SCAN_MEDIA_ROOT = "media/face_scans"  # adjust if you have a different media root

# Magic bytes for strict validation (content-type can be spoofed)
_MAGIC_JPEG = b"\xff\xd8\xff"
_MAGIC_PNG = b"\x89PNG\r\n\x1a\n"
_MAGIC_WEBP_RIFF = b"RIFF"
_MAGIC_WEBP_WEBP = b"WEBP"  # at offset 8


# ---------- Helper functions ----------

def _create_scan(db: Session, user: Optional[User]) -> ScanSession:
    scan = ScanSession(
        user_id=user.id if user else None,  # Guest users have no user_id
        status="pending",
        image_url=None,
        scan_metadata=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def _get_user_scan_or_404(
    db: Session,
    scan_id: str,
    user: Optional[User],
    defer_image_data: bool = True,
) -> ScanSession:
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format",
        )
    query = db.query(ScanSession)
    if defer_image_data:
        query = query.options(defer(ScanSession.image_data))
    scan = query.filter(ScanSession.id == scan_uuid).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    # For authenticated users, verify ownership
    if user and scan.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this scan",
        )
    # For guest users, allow access to any scan (or you could add session-based auth later)
    return scan


def _validate_magic_bytes(contents: bytes, content_type: str) -> None:
    """Raise HTTPException if magic bytes do not match claimed content type."""
    if content_type == "image/jpeg":
        if not contents.startswith(_MAGIC_JPEG):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image: not a valid JPEG file.",
            )
    elif content_type == "image/png":
        if not contents.startswith(_MAGIC_PNG):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image: not a valid PNG file.",
            )
    elif content_type == "image/webp":
        if len(contents) < 12 or not contents.startswith(_MAGIC_WEBP_RIFF) or contents[8:12] != _MAGIC_WEBP_WEBP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image: not a valid WEBP file.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Allowed: JPEG, PNG, WEBP.",
        )


def _validate_image_dimensions(contents: bytes, content_type: str) -> None:
    """Validate image can be opened and dimensions are within limits. Prevents decompression bombs."""
    try:
        with Image.open(io.BytesIO(contents)) as img:
            w, h = img.size  # read size before verify(); verify() invalidates the image
            if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image dimensions too large. Maximum side is {MAX_IMAGE_DIMENSION}px.",
                )
            img.verify()  # detect truncated/corrupt images
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Image validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file.",
        )


async def _validate_and_save_image(
    scan: ScanSession,
    image: UploadFile,
    user: Optional[User],
) -> tuple[str, bytes, str, str]:
    # Validate content type
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type. Allowed: JPEG, PNG, WEBP.",
        )
    
    # Validate size
    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE // (1024 * 1024)} MB.",
        )
    if len(contents) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image: file too small.",
        )

    # Strict validation: magic bytes must match claimed type (prevents spoofing)
    _validate_magic_bytes(contents, image.content_type)
    # Validate dimensions and that image is not corrupt (prevents decompression bombs)
    _validate_image_dimensions(contents, image.content_type)
    
    # Build safe file path (use "guest" folder for unauthenticated users)
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(image.content_type, "jpg")
    user_id_str = str(user.id) if user else "guest"
    user_dir = os.path.join(SCAN_MEDIA_ROOT, user_id_str)
    os.makedirs(user_dir, exist_ok=True)
    filename = f"{scan.id}_{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(user_dir, filename)
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {e}",
        )
    
    return file_path, contents, filename, image.content_type

def _run_mock_analysis(scan: ScanSession) -> dict:
    """
    Run mock ML analysis and return placeholder results.
    
    TODO: Replace this with actual ML inference pipeline:
    - Load trained model
    - Run prediction on face scan image
    - Parse model outputs
    - Calculate confidence scores
    - Generate personalized recommendations
    """
    # Simple deterministic mock based on scan id (use hash of UUID for randomness)
    base_score = (hash(scan.id) % 10) * 10
    
    mock_results = {
        "scan_id": str(scan.id),  # Convert UUID to string for JSON
        "status": "completed",
        "skin_mood": "balanced",
        "skin_type": ["normal", "oily", "dry", "combination", "sensitive"][base_score % 5],
        "summary": {
            "overall_score": (base_score + 50) % 100,
            "skin_type": ["normal", "oily", "dry", "combination", "sensitive"][base_score % 5],
            "concerns": ["redness", "acne", "pigmentation", "dehydration", "sensitivity"],
            "scores": {
                "redness": (base_score + 15) % 100,
                "acne": (base_score + 30) % 100,
                "pigmentation": (base_score + 45) % 100,
                "dehydration": (base_score + 60) % 100,
                "sensitivity": (base_score + 75) % 100,
                "wrinkles": (base_score + 20) % 100,
                "pores": (base_score + 35) % 100,
                "dark_circles": (base_score + 40) % 100,
                "texture": (base_score + 55) % 100,
                "oiliness": (base_score + 25) % 100,
            },
        },
        "scores": {
            "redness": (base_score + 15) % 100,
            "acne": (base_score + 30) % 100,
            "pigmentation": (base_score + 45) % 100,
            "dehydration": (base_score + 60) % 100,
            "sensitivity": (base_score + 75) % 100,
        },
        "recommendations": {
            "summary": "Maintain a gentle routine and consistent SPF use.",
            "priority_actions": [
                "Use a non-stripping cleanser.",
                "Apply moisturizer twice daily.",
                "Use broad-spectrum SPF 30+ every morning.",
            ],
        },
        "generated_at": datetime.utcnow().isoformat(),
    }
    
    return mock_results


def _update_scan_status(
    db: Session,
    scan: ScanSession,
    status_value: str,
    result: Optional[dict] = None,
    image_url: Optional[str] = None,
) -> ScanSession:
    scan.status = status_value
    scan.updated_at = datetime.utcnow()
    
    if image_url is not None:
        scan.image_url = image_url
    
    if result is not None:
        scan.scan_metadata = result
    
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


# ---------- Endpoints ----------

@router.post(
    "/init",
    response_model=ScanInitResponse,
    status_code=status.HTTP_201_CREATED,
)
def init_scan_session(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Initialize a new face scan session (works for both authenticated and guest users).
    """
    scan = _create_scan(db=db, user=current_user)
    return ScanInitResponse(
        scan_id=str(scan.id),
        status=scan.status,
        created_at=scan.created_at,
    )


@router.get(
    "/actions",
    response_model=ScanActionsResponse,
)
def get_scan_actions():
    """
    Return supported OpenAI skin analysis signals.
    """
    return ScanActionsResponse(
        default_actions=get_supported_signals(),
        supported_actions={"signals": get_supported_signals()},
    )


@router.post(
    "/{scan_id}/upload",
    response_model=ScanUploadResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_scan_image(
    scan_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Upload face image for an existing scan session (works for both authenticated and guest users).
    Performs image validation and runs mock analysis.
    """
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user, defer_image_data=True)
    
    if scan.status not in {"pending", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upload image when scan status is '{scan.status}'.",
        )
    
    # Save image and update scan to 'processing'
    image_path, image_bytes, image_filename, image_content_type = await _validate_and_save_image(
        scan, file, current_user
    )
    
    # Compute image hash for deduplication and ML training
    image_hash = hashlib.sha256(image_bytes).hexdigest()
    
    # Store image data in database for ML training
    scan.image_data = image_bytes
    scan.image_hash = image_hash
    scan.image_content_type = image_content_type
    scan.image_filename = image_filename
    scan = _update_scan_status(
        db=db,
        scan=scan,
        status_value="processing",
        image_url=image_path,
    )
    
    # Run analysis synchronously (TODO: move to background worker)
    try:
        if settings.OPENAI_API_KEY:
            openai_client = get_openai_client()
            openai_result = await openai_client.analyze_skin(
                image_bytes=image_bytes,
                filename=file.filename or os.path.basename(image_path),
                content_type=file.content_type or "image/jpeg",
            )
            analysis_result = {
                "scan_id": str(scan.id),
                "status": "completed",
                "provider": "openai",
                "model_version": settings.OPENAI_MODEL,
                "analysis": openai_result,
                "summary": openai_result.get("summary"),
                "recommendations": openai_result.get("recommendations"),
                "notes": openai_result.get("notes"),
                "processing_time_ms": openai_result.get("processing_time_ms"),
                "generated_at": datetime.utcnow().isoformat(),
            }
            # Populate skin_analyses table for normalized ML training data
            skin_analysis = SkinAnalysis(
                scan_session_id=scan.id,
                skin_type=openai_result.get("skin_type") or "normal",
                fitzpatrick_scale=openai_result.get("fitzpatrick_scale") or 1,
                concerns=openai_result.get("concerns_detail") or [],
                confidence_scores=(openai_result.get("summary") or {}).get("scores") or {},
                overall_confidence=openai_result.get("confidence_score") or 0.0,
                analysis_version=settings.OPENAI_MODEL,
            )
            db.add(skin_analysis)
        else:
            analysis_result = _run_mock_analysis(scan)
        scan = _update_scan_status(
            db=db,
            scan=scan,
            status_value="completed",
            result=analysis_result,
        )
    except OpenAIVisionError as exc:
        logger.warning("OpenAI API failure: %s", exc)
        scan = _update_scan_status(
            db=db,
            scan=scan,
            status_value="failed",
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {exc}",
        )
    except Exception:
        scan = _update_scan_status(
            db=db,
            scan=scan,
            status_value="failed",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process scan. Please try again later.",
        )
    
    return ScanUploadResponse(
        scan_id=str(scan.id),
        status=scan.status,
        image_url=scan.image_url,
        message="Image uploaded successfully. Processing completed.",
    )


@router.get(
    "/{scan_id}/status",
    response_model=ScanStatusResponse,
)
def get_scan_status(
    scan_id: str,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get the current status of a face scan (works for both authenticated and guest users).
    """
    response.headers["Cache-Control"] = "private, max-age=15"
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user, defer_image_data=True)
    
    return ScanStatusResponse(
        scan_id=str(scan.id),
        status=scan.status,
        created_at=scan.created_at,
        updated_at=scan.updated_at,
    )


@router.get(
    "/{scan_id}/results",
    response_model=ScanResultResponse,
)
def get_scan_results(
    scan_id: str,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get analysis results for a completed face scan (works for both authenticated and guest users).
    """
    response.headers["Cache-Control"] = "private, max-age=30"
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user)
    
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is not completed yet. Current status: '{scan.status}'.",
        )
    
    if not scan.scan_metadata:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan result is missing. Please try re-running the scan.",
        )
    
    # If result is stored as text JSON in DB, handle parsing
    result_data = scan.scan_metadata
    if isinstance(result_data, str):
        try:
            result_data = json.loads(result_data)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse scan result data.",
            )
    
    return ScanResultResponse(
        scan_id=str(scan.id),
        status=scan.status,
        result=result_data,
        created_at=scan.created_at,
        updated_at=scan.updated_at,
    )


@router.get(
    "/history",
    response_model=ScanHistoryResponse,
)
def get_scan_history(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get the user's face scan history (returns empty list for guest users).
    """
    response.headers["Cache-Control"] = "private, max-age=30"
    # Guest users have no history
    if not current_user:
        return ScanHistoryResponse(scans=[])
    
    scans: List[ScanSession] = (
        db.query(ScanSession)
        .options(defer(ScanSession.image_data))
        .filter(ScanSession.user_id == current_user.id)
        .order_by(ScanSession.created_at.desc())
        .all()
    )
    
    items: List[ScanHistoryItem] = [
        ScanHistoryItem(
            scan_id=s.id,
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
            image_path=getattr(s, "image_url", None),
        )
        for s in scans
    ]
    
    return ScanHistoryResponse(scans=items)


@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a scan",
    description="Delete one of your scans. Requires authentication.",
)
def delete_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a scan session for the current user (removes from history and digital twin)."""
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user)
    db.delete(scan)
    db.commit()
    logger.info("User %s deleted scan %s", current_user.id, scan_id)
    return None
