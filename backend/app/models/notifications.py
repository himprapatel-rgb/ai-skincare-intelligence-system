"""
Notifications database model.
Sprint: GUI-2 - Story: Notifications API
"""
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class NotificationType(str, enum.Enum):
    """Notification types."""
    REMINDER = "reminder"
    PROGRESS = "progress"
    ALERT = "alert"
    INFO = "info"
    RECOMMENDATION = "recommendation"
    SYSTEM = "system"


class Notification(Base):
    """User notifications."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    type = Column(String(50), nullable=False, default="info")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(500), nullable=True)
    
    read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")

    __table_args__ = (
        Index('ix_notifications_user_read', 'user_id', 'read'),
        Index('ix_notifications_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<Notification id={self.id} user_id={self.user_id} type={self.type}>"


class NotificationSettings(Base):
    """User notification preferences."""
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Notification type preferences
    routine_reminders = Column(Boolean, default=True)
    progress_updates = Column(Boolean, default=True)
    product_recommendations = Column(Boolean, default=True)
    skin_change_alerts = Column(Boolean, default=True)
    system_notifications = Column(Boolean, default=True)
    
    # Delivery preferences
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String(5), nullable=True)  # "22:00"
    quiet_hours_end = Column(String(5), nullable=True)    # "08:00"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="notification_settings")
    
    def __repr__(self):
        return f"<NotificationSettings user_id={self.user_id}>"
