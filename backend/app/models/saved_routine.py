import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SavedRoutine(Base):
    __tablename__ = "saved_routines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    routine_type = Column(String(32), default="custom")
    is_active = Column(Boolean, default=True)
    
    # Reminder settings
    reminder_enabled = Column(Boolean, default=False)
    reminder_time = Column(String(5), nullable=True)  # "08:00" or "21:00"

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("RoutineProduct", back_populates="routine", cascade="all, delete-orphan")
    progress_photos = relationship("ProgressPhoto", back_populates="routine")
