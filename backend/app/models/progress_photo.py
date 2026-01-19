import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("saved_routines.id", ondelete="SET NULL"), nullable=True)

    photo_type = Column(Text, nullable=False)  # "before", "after", "daily", "comparison"
    image_url = Column(Text, nullable=False)
    taken_at = Column(DateTime(timezone=True), nullable=False)

    photo_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    routine = relationship("SavedRoutine", back_populates="progress_photos")
