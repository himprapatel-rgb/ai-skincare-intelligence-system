from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class ProgressPhotoBase(BaseModel):
    routine_id: Optional[UUID] = None
    photo_type: str
    image_url: str
    taken_at: datetime


class ProgressPhotoCreate(ProgressPhotoBase):
    photo_metadata: Optional[str] = None


class ProgressPhotoResponse(ProgressPhotoBase):
    id: UUID
    photo_metadata: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
