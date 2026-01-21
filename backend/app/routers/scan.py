"""Sprint 2: Face Scan & AI Analysis Router

FastAPI router for face scan API endpoints.
Designed for GitHub Pages frontend + Railway backend architecture.

Status: Phase 1 Implementation - Foundation Layer
Created: December 6, 2025
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import get_current_user_optional
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
from app.services.youcam_service import (
    YouCamError,
    get_default_skin_analysis_actions,
    get_supported_skin_actions,
    get_youcam_client,
)

router = APIRouter(prefix="/api/v1/scan", tags=["Face Scan"])
logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
SCAN_MEDIA_ROOT = "media/face_scans"  # adjust if you have a different media root


# ---------- Helper functions ----------

def _create_scan(db: Session, user: Optional[User]) -> ScanSession:
    scan = ScanSession(
        user_id=user.id if user else None,  # Guest users have no user_id
        status="pending",
        image_path=None,
        result=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def _get_user_scan_or_404(db: Session, scan_id: str, user: Optional[User]) -> ScanSession:
    try:
        scan_uuid = uuid.UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format",
        )
    scan = db.query(ScanSession).filter(ScanSession.id == scan_uuid).first()
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


async def _validate_and_save_image(scan: ScanSession, image: UploadFile, user: Optional[User]) -> str:
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
    
    return file_path


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
    image_path: Optional[str] = None,
) -> ScanSession:
    scan.status = status_value
    scan.updated_at = datetime.utcnow()
    
    if image_path is not None:
        scan.image_path = image_path
    
    if result is not None:
        scan.result = result
    
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
    Return supported YouCam skin analysis actions and current defaults.
    """
    return ScanActionsResponse(
        default_actions=get_default_skin_analysis_actions(),
        supported_actions=get_supported_skin_actions(),
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
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user)
    
    if scan.status not in {"pending", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upload image when scan status is '{scan.status}'.",
        )
    
    # Save image and update scan to 'processing'
    image_path = await _validate_and_save_image(scan, file, current_user)
    scan = _update_scan_status(
        db=db,
        scan=scan,
        status_value="processing",
        image_path=image_path,
    )
    
    # Run analysis synchronously (TODO: move to background worker)
    try:
        if settings.YOUCAM_API_KEY:
            with open(image_path, "rb") as image_file:
                image_bytes = image_file.read()

            youcam_client = get_youcam_client()
            youcam_result = await youcam_client.run_skin_analysis(
                image_bytes=image_bytes,
                filename=file.filename or os.path.basename(image_path),
                content_type=file.content_type or "image/jpeg",
                dst_actions=get_default_skin_analysis_actions(),
                response_format=settings.YOUCAM_SKIN_ANALYSIS_FORMAT,
                poll_interval_seconds=settings.YOUCAM_POLL_INTERVAL_SECONDS,
                max_wait_seconds=settings.YOUCAM_MAX_POLL_SECONDS,
            )
            analysis_result = {
                "scan_id": scan.id,
                "status": "completed",
                "provider": "youcam",
                "youcam": youcam_result,
                "generated_at": datetime.utcnow().isoformat(),
            }
        else:
            analysis_result = _run_mock_analysis(scan)

        scan = _update_scan_status(
            db=db,
            scan=scan,
            status_value="completed",
            result=analysis_result,
        )
    except YouCamError as exc:
        logger.warning("YouCam API failure: %s", exc)
        scan = _update_scan_status(
            db=db,
            scan=scan,
            status_value="failed",
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"YouCam API error: {exc}",
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
        image_url=scan.image_path,
        message="Image uploaded successfully. Processing completed.",
    )


@router.get(
    "/{scan_id}/status",
    response_model=ScanStatusResponse,
)
def get_scan_status(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get the current status of a face scan (works for both authenticated and guest users).
    """
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user)
    
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
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get analysis results for a completed face scan (works for both authenticated and guest users).
    """
    scan = _get_user_scan_or_404(db=db, scan_id=scan_id, user=current_user)
    
    if scan.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scan is not completed yet. Current status: '{scan.status}'.",
        )
    
    if not scan.result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan result is missing. Please try re-running the scan.",
        )
    
    # If result is stored as text JSON in DB, handle parsing
    result_data = scan.result
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
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get the user's face scan history (returns empty list for guest users).
    """
    # Guest users have no history
    if not current_user:
        return ScanHistoryResponse(scans=[])
    
    scans: List[ScanSession] = (
        db.query(ScanSession)
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
            image_path=getattr(s, "image_path", None),
        )
        for s in scans
    ]
    
    return ScanHistoryResponse(scans=items)
