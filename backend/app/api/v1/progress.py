from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.scan import ScanSession
from app.models.progress_photo import ProgressPhoto
from app.models.user import User
from app.schemas.progress_schemas import (
    ProgressPhotoCreate,
    ProgressPhotoResponse,
    ProgressSummaryPoint,
    ProgressSummaryResponse,
)

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/", response_model=ProgressPhotoResponse)
def upload_photo(
    payload: ProgressPhotoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = ProgressPhoto(
        user_id=current_user.id,
        routine_id=payload.routine_id,
        photo_type=payload.photo_type,
        image_url=payload.image_url,
        taken_at=payload.taken_at,
        metadata=payload.metadata,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/", response_model=list[ProgressPhotoResponse])
def list_photos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photos = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == current_user.id).all()
    return photos


@router.get("/summary", response_model=ProgressSummaryResponse)
def get_progress_summary(
    range: str = Query("month", description="week | month | 3months"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    range_days = 30
    if range == "week":
        range_days = 7
    elif range == "3months":
        range_days = 90

    scans = db.query(ScanSession).filter(ScanSession.user_id == current_user.id).all()
    now = datetime.utcnow()
    points: list[ProgressSummaryPoint] = []

    for scan in scans:
        created_at = scan.created_at or scan.completed_at
        if not created_at:
            continue
        diff_days = (now - created_at).days
        if diff_days > range_days:
            continue
        summary = {}
        scores = {}
        if isinstance(scan.scan_metadata, dict):
            summary_candidate = scan.scan_metadata.get("summary")
            if isinstance(summary_candidate, dict):
                summary = summary_candidate
                scores = summary.get("scores") or {}

        def get_score(keys: list[str]) -> float:
            for key in keys:
                value = scores.get(key)
                if isinstance(value, (int, float)):
                    return float(value)
            return 0.0

        overall_score = summary.get("overall_score")
        if not isinstance(overall_score, (int, float)):
            overall_score = get_score(["overall_score"])

        points.append(
            ProgressSummaryPoint(
                date=created_at,
                overall_score=float(overall_score or 0),
                acne=get_score(["acne", "hd_acne"]),
                wrinkles=get_score(["wrinkle", "hd_wrinkle"]),
                hydration=get_score(["moisture", "hd_moisture"]),
                dark_spots=get_score(["age_spot", "hd_age_spot"]),
            )
        )

    points.sort(key=lambda p: p.date)
    improvement = 0.0
    if len(points) >= 2:
        improvement = points[-1].overall_score - points[0].overall_score

    return ProgressSummaryResponse(
        points=points,
        total_scans=len(points),
        improvement=improvement,
    )


@router.get("/{photo_id}", response_model=ProgressPhotoResponse)
def get_photo(
    photo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id
    ).first()
    if not photo:
        raise HTTPException(404, "Photo not found")
    return photo


@router.delete("/{photo_id}")
def delete_photo(
    photo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user.id
    ).first()
    if not photo:
        raise HTTPException(404, "Not found")

    db.delete(photo)
    db.commit()
    return {"status": "deleted"}
