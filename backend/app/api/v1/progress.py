from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.progress_photo import ProgressPhoto
from app.schemas.progress_schemas import ProgressPhotoCreate, ProgressPhotoResponse

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/", response_model=ProgressPhotoResponse)
def upload_photo(payload: ProgressPhotoCreate, db: Session = Depends(get_db), current_user_id: int = 1):
    photo = ProgressPhoto(
        user_id=current_user_id,
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
def list_photos(db: Session = Depends(get_db), current_user_id: int = 1):
    photos = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == current_user_id).all()
    return photos


@router.get("/{photo_id}", response_model=ProgressPhotoResponse)
def get_photo(photo_id: UUID, db: Session = Depends(get_db), current_user_id: int = 1):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user_id
    ).first()
    if not photo:
        raise HTTPException(404, "Photo not found")
    return photo


@router.delete("/{photo_id}")
def delete_photo(photo_id: UUID, db: Session = Depends(get_db), current_user_id: int = 1):
    photo = db.query(ProgressPhoto).filter(
        ProgressPhoto.id == photo_id,
        ProgressPhoto.user_id == current_user_id
    ).first()
    if not photo:
        raise HTTPException(404, "Not found")

    db.delete(photo)
    db.commit()
    return {"status": "deleted"}
