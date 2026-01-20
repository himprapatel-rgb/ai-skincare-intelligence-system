"""Face scan API endpoints."""
import logging
import pathlib
import sys
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.scan import ScanSession, ScanStatus

backend_dir = pathlib.Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))
from app.core.security import get_current_user
from app.models.user import User
from app.services.youcam_service import (YouCamError,
                                         get_default_skin_analysis_actions,
                                         get_supported_skin_actions,
                                         get_youcam_client)

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
    }

@router.post(
    "/init",
    status_code=status.HTTP_201_CREATED,
    summary="Init Scan Session",
    description="Initialize a new face scan session for the authenticated user."
)
def init_scan_session(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Initialize a new scan session."""
    user_id = current_user.id if current_user else 1
    scan_session = ScanSession(
        user_id=user_id,
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
    """Return supported YouCam skin analysis actions and current defaults."""
    return {
        "default_actions": get_default_skin_analysis_actions(),
        "supported_actions": get_supported_skin_actions(),
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
    current_user: Optional[User] = Depends(get_current_user)
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
    
    user_id = current_user.id if current_user else 1
    scan_session = db.query(ScanSession).filter(
        ScanSession.id == uuid_obj,
        ScanSession.user_id == user_id
    ).first()
    
    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
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
    
    # Get skin analysis service and perform analysis
    try:
        if settings.YOUCAM_API_KEY:
            youcam_client = get_youcam_client()
            youcam_result = await youcam_client.run_skin_analysis(
                image_bytes=image_data,
                filename=file.filename or "scan.jpg",
                content_type=file.content_type or "image/jpeg",
                dst_actions=get_default_skin_analysis_actions(),
                response_format=settings.YOUCAM_SKIN_ANALYSIS_FORMAT,
                poll_interval_seconds=settings.YOUCAM_POLL_INTERVAL_SECONDS,
                max_wait_seconds=settings.YOUCAM_MAX_POLL_SECONDS,
            )
            analysis_result = {
                "scan_id": str(scan_session.id),
                "status": "completed",
                "provider": "youcam",
                "youcam": youcam_result,
            }
        else:
            analysis_result = _run_mock_analysis(scan_session.id)

        scan_session.scan_metadata = analysis_result
        scan_session.status = ScanStatus.COMPLETED
    except ValueError as e:
        scan_session.status = ScanStatus.FAILED
        scan_session.scan_metadata = {"error": str(e)}
    except YouCamError as exc:
        logger.warning(
            "YouCam analysis failed: status=%s error_code=%s payload=%s",
            getattr(exc, "status_code", None),
            getattr(exc, "error_code", None),
            getattr(exc, "payload", None),
        )
        scan_session.status = ScanStatus.FAILED
        scan_session.scan_metadata = {
            "error": f"YouCam API error: {exc}",
            "youcam_status": getattr(exc, "status_code", None),
            "youcam_error_code": getattr(exc, "error_code", None),
            "youcam_payload": getattr(exc, "payload", None),
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
    current_user: Optional[User] = Depends(get_current_user)
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

    user_id = current_user.id if current_user else 1
    scan_session = db.query(ScanSession).filter(
        ScanSession.id == uuid_obj,
        ScanSession.user_id == user_id
    ).first()

    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
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
    current_user: Optional[User] = Depends(get_current_user)
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
    
    user_id = current_user.id if current_user else 1
    scan_session = db.query(ScanSession).filter(
        ScanSession.id == uuid_obj,
        ScanSession.user_id == user_id
    ).first()
    
    if not scan_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan session not found"
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
    current_user: Optional[User] = Depends(get_current_user)
):
    """Alias for get scan results to support older clients."""
    return get_scan_results(scan_id=scan_id, db=db, current_user=current_user)

@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Get Scan History"
)
def get_scan_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user's scan history."""
    user_id = current_user.id if current_user else 1
    scans = db.query(ScanSession).filter(
        ScanSession.user_id == user_id
    ).all()
    
    return {
        "scans": [
            {
                "scan_id": str(scan.id),
                "status": _status_value(scan.status),
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            }
            for scan in scans
        ]
    }
