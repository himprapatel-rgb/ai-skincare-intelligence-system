"""Face scan API endpoints."""
import hashlib
import logging
import pathlib
import re
import sys
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.analysis_outputs import (
    ScanCondition,
    ScanOutput,
    ScanRecommendation,
    SkinCondition,
)
from app.models.scan import ScanSession, ScanStatus

backend_dir = pathlib.Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.openai_vision_service import (
    OpenAIVisionError,
    get_openai_client,
    get_supported_signals,
)

router = APIRouter()
logger = logging.getLogger(__name__)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def _status_value(status_field: ScanStatus | str) -> str:
    return status_field.value if isinstance(status_field, ScanStatus) else str(status_field)


def _run_mock_analysis(scan_id: UUID) -> dict:
    base_score = int(scan_id.int % 10) * 10
    return {
        "scan_id": str(scan_id),
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
        "summary": {
            "overall_score": (base_score + 50) % 100,
            "concerns": ["redness", "acne", "pigmentation", "dehydration", "sensitivity"],
            "scores": {
                "redness": (base_score + 15) % 100,
                "acne": (base_score + 30) % 100,
                "pigmentation": (base_score + 45) % 100,
                "dehydration": (base_score + 60) % 100,
                "sensitivity": (base_score + 75) % 100,
            },
            "mask_urls": {},
            "image_url": None,
        },
    }


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "unknown"

@router.post(
    "/init",
    status_code=status.HTTP_201_CREATED,
    summary="Init Scan Session",
    description="Initialize a new face scan session for the authenticated user or guest."
)
def init_scan_session(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Initialize a new scan session."""
    scan_session = ScanSession(
        user_id=current_user.id if current_user else None,
        status=ScanStatus.PENDING,
    )
    db.add(scan_session)
    db.commit()
    db.refresh(scan_session)
    
    return {
        "scan_id": str(scan_session.id),
        "session_id": str(scan_session.id),
        "status": _status_value(scan_session.status),
    }


@router.get(
    "/actions",
    status_code=status.HTTP_200_OK,
    summary="Get supported skin analysis actions",
)
def get_scan_actions():
    """Return supported OpenAI skin analysis signals."""
    return {
        "default_actions": get_supported_signals(),
        "supported_actions": {"signals": get_supported_signals()},
    }

@router.post(
    "/{scan_id}/upload",
    status_code=status.HTTP_200_OK,
    summary="Upload Scan Image"
)
async def upload_scan(
    scan_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Upload image for scan session."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, or WEBP images are allowed."
        )
    
    # Validate UUID format
    try:
        uuid_obj = UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )
    
    scan_session = (
        db.query(ScanSession)
        .filter(ScanSession.id == uuid_obj)
        .first()
    )

    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    if current_user:
        if scan_session.user_id is None:
            scan_session.user_id = current_user.id
        elif scan_session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this scan session"
            )
    
    scan_session.status = ScanStatus.PROCESSING
        
    # Read image data
    image_data = await file.read()
    if len(image_data) > MAX_IMAGE_SIZE:
        scan_session.status = ScanStatus.FAILED
        scan_session.error_message = "Image too large."
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE // (1024 * 1024)} MB.",
        )
    
    # Persist raw image data and metadata in DB
    scan_session.image_data = image_data
    scan_session.image_content_type = file.content_type
    scan_session.image_filename = file.filename
    scan_session.image_hash = hashlib.sha256(image_data).hexdigest()

    # Get skin analysis service and perform analysis
    try:
        if settings.OPENAI_API_KEY:
            openai_client = get_openai_client()
            openai_result = await openai_client.analyze_skin(
                image_bytes=image_data,
                filename=file.filename or "scan.jpg",
                content_type=file.content_type or "image/jpeg",
            )
            analysis_result = {
                "scan_id": str(scan_session.id),
                "status": "completed",
                "provider": "openai",
                "model_version": settings.OPENAI_MODEL,
                "analysis": openai_result,
                "summary": openai_result.get("summary"),
                "recommendations": openai_result.get("recommendations"),
                "notes": openai_result.get("notes"),
                "processing_time_ms": openai_result.get("processing_time_ms"),
            }
        else:
            analysis_result = _run_mock_analysis(scan_session.id)

        scan_session.scan_metadata = analysis_result
        scan_session.status = ScanStatus.COMPLETED

        raw_result = openai_result if settings.OPENAI_API_KEY else analysis_result
        output_record = ScanOutput(
            scan_session_id=scan_session.id,
            raw_result=raw_result,
            normalized_result=analysis_result,
            model_name="openai" if settings.OPENAI_API_KEY else "mock",
            model_version=settings.OPENAI_MODEL if settings.OPENAI_API_KEY else "mock",
            confidence_score=(
                openai_result.get("confidence_score") if settings.OPENAI_API_KEY else None
            ),
        )
        db.add(output_record)

        if settings.OPENAI_API_KEY:
            concerns = openai_result.get("concerns_detail") or []
            if isinstance(concerns, list):
                for concern in concerns:
                    if not isinstance(concern, dict):
                        continue
                    concern_type = str(concern.get("concern_type") or "unknown")
                    slug = _slugify(concern_type)
                    condition = (
                        db.query(SkinCondition)
                        .filter(SkinCondition.slug == slug)
                        .first()
                    )
                    if not condition:
                        condition = SkinCondition(
                            slug=slug,
                            name=concern_type,
                            category="skin_condition",
                        )
                        db.add(condition)
                        db.flush()
                    scan_condition = ScanCondition(
                        scan_session_id=scan_session.id,
                        condition_id=condition.id,
                        severity_label=concern.get("severity"),
                        confidence=concern.get("confidence"),
                        affected_regions=concern.get("affected_areas"),
                        details=concern,
                    )
                    db.add(scan_condition)

            recommendations = openai_result.get("recommendations") or []
            if isinstance(recommendations, list) and recommendations:
                db.add(
                    ScanRecommendation(
                        scan_session_id=scan_session.id,
                        recommendation_type="general",
                        payload={"items": recommendations},
                        source="openai",
                    )
                )
    except ValueError as e:
        scan_session.status = ScanStatus.FAILED
        scan_session.scan_metadata = {"error": str(e)}
    except OpenAIVisionError as exc:
        logger.warning(
            "OpenAI analysis failed: status=%s payload=%s",
            getattr(exc, "status_code", None),
            getattr(exc, "payload", None),
        )
        scan_session.status = ScanStatus.FAILED
        scan_session.scan_metadata = {
            "error": f"OpenAI API error: {exc}",
            "openai_status": getattr(exc, "status_code", None),
            "openai_payload": getattr(exc, "payload", None),
        }
    except Exception as e:
        logger.exception("Scan analysis failed unexpectedly.")
        scan_session.status = ScanStatus.FAILED
        scan_session.scan_metadata = {"error": "Analysis failed"}
    
    db.commit()
    
    return {
        "scan_id": str(scan_session.id),
        "session_id": str(scan_session.id),
        "status": _status_value(scan_session.status),
    }


@router.get(
    "/{scan_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Get Scan Status"
)
def get_scan_status(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get scan status."""
    # Validate UUID format
    try:
        uuid_obj = UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    scan_session = (
        db.query(ScanSession)
        .filter(ScanSession.id == uuid_obj)
        .first()
    )

    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    if current_user:
        if scan_session.user_id is None:
            scan_session.user_id = current_user.id
            db.add(scan_session)
            db.commit()
            db.refresh(scan_session)
        elif scan_session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this scan session"
            )

    return {
        "scan_id": str(scan_session.id),
        "session_id": str(scan_session.id),
        "status": _status_value(scan_session.status),
    }

@router.get(
    "/{scan_id}/results",
    status_code=status.HTTP_200_OK,
    summary="Get Scan Results"
)
def get_scan_results(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get scan results."""
    # Validate UUID format
    try:
        uuid_obj = UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )
    
    scan_session = (
        db.query(ScanSession)
        .filter(ScanSession.id == uuid_obj)
        .first()
    )

    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    if current_user:
        if scan_session.user_id is None:
            scan_session.user_id = current_user.id
            db.add(scan_session)
            db.commit()
            db.refresh(scan_session)
        elif scan_session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this scan session"
            )
    
    return {
        "scan_id": str(scan_session.id),
        "session_id": str(scan_session.id),
        "result": scan_session.scan_metadata if scan_session.scan_metadata else {}
    }


@router.get(
    "/{scan_id}/result",
    status_code=status.HTTP_200_OK,
    summary="Get Scan Result (Alias)"
)
def get_scan_result_alias(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Alias for get scan results to support older clients."""
    return get_scan_results(scan_id=scan_id, db=db, current_user=current_user)

@router.get(
    "/{scan_id}/image",
    status_code=status.HTTP_200_OK,
    summary="Get Scan Image"
)
def get_scan_image(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Return scan image bytes or stored file."""
    try:
        uuid_obj = UUID(scan_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    scan_session = (
        db.query(ScanSession)
        .filter(ScanSession.id == uuid_obj)
        .first()
    )

    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
        )

    if current_user:
        if scan_session.user_id is None:
            scan_session.user_id = current_user.id
            db.add(scan_session)
            db.commit()
            db.refresh(scan_session)
        elif scan_session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this scan session"
            )

    if scan_session.image_data:
        content_type = scan_session.image_content_type or "image/jpeg"
        headers = {
            "Cache-Control": "public, max-age=31536000, immutable",
        }
        if scan_session.image_hash:
            headers["ETag"] = scan_session.image_hash
        return Response(
            content=scan_session.image_data,
            media_type=content_type,
            headers=headers,
        )

    if scan_session.image_url:
        image_path = pathlib.Path(scan_session.image_url)
        if not image_path.is_absolute():
            image_path = backend_dir / image_path
        if image_path.exists() and image_path.is_file():
            return FileResponse(
                image_path,
                media_type=scan_session.image_content_type or "image/jpeg",
                filename=scan_session.image_filename or image_path.name,
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Scan image not available"
    )

@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get Scan History"
)
def get_scan_history(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get user's scan history."""
    if not current_user:
        return {"scans": []}
    user_id = current_user.id
    base_url = str(request.base_url).rstrip("/")
    scans = db.query(ScanSession).filter(
        ScanSession.user_id == user_id
    ).all()
    
    items = []
    for scan in scans:
        summary = None
        image_url = None
        if isinstance(scan.scan_metadata, dict):
            summary = scan.scan_metadata.get("summary")
            image_url = (summary or {}).get("image_url") if isinstance(summary, dict) else None
        if not image_url and scan.image_url:
            image_url = scan.image_url
        if not image_url and scan.image_data:
            image_url = f"{base_url}/api/v1/scan/{scan.id}/image"
        items.append(
            {
                "scan_id": str(scan.id),
                "status": _status_value(scan.status),
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
                "summary": summary,
                "image_url": image_url,
            }
        )

    return {"scans": items}


@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a scan",
)
def delete_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of your scans (removes from history and digital twin)."""
    try:
        uuid_obj = UUID(scan_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scan ID format")
    scan_session = db.query(ScanSession).filter(
        ScanSession.id == uuid_obj,
        ScanSession.user_id == current_user.id,
    ).first()
    if not scan_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    db.delete(scan_session)
    db.commit()
    logger.info("User %s deleted scan %s", current_user.id, scan_id)
    return None
