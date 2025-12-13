"""Face scan API endpoints."""
from typing import Optional
from uuid import UUID
import sys
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scan import ScanSession
# Add backend directory to path to import services
import pathlib
backend_dir = pathlib.Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))
from services.skin_analysis_service import get_skin_analysis_service

router = APIRouter()

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
        status="pending"
    )
    db.add(scan_session)
    db.commit()
    db.refresh(scan_session)
    
    return {
        "scan_id": str(scan_session.id),
        "status": scan_session.status
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
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG and PNG images are allowed."
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
    
    scan_session.status = "processing"
        
    # Read image data
    image_data = await file.read()
    
    # Get skin analysis service and perform analysis
    try:
        skin_service = get_skin_analysis_service()
        analysis_result = await skin_service.analyze_skin(image_data)
        
        # Update scan session with results
        scan_session.result = {
            "skin_tone": analysis_result.skin_tone,
            "texture_quality": analysis_result.texture_quality,
            "acne_detected": analysis_result.acne_detected,
            "acne_severity": analysis_result.acne_severity,
            "wrinkles_detected": analysis_result.wrinkles_detected,
            "wrinkle_density": analysis_result.wrinkle_density,
            "dark_circles_detected": analysis_result.dark_circles_detected,
            "dark_circle_severity": analysis_result.dark_circle_severity,
            "skin_type": analysis_result.skin_type,
            "confidence_score": analysis_result.confidence_score
        }
        scan_session.status = "completed"
    except ValueError as e:
        scan_session.status = "failed"
        scan_session.result = {"error": str(e)}
    except Exception as e:
        scan_session.status = "failed"
        scan_session.result = {"error": "Analysis failed"}
    
    db.commit()
    
    return {
        "scan_id": str(scan_session.id),
        "status": scan_session.status
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
        "result": scan_session.result if scan_session.result else {}    }

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
                "status": scan.status,
                "created_at": scan.created_at.isoformat() if scan.created_at else None
            }
            for scan in scans
        ]
    }
