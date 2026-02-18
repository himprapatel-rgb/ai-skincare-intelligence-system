"""
Notifications API Router.
Sprint: GUI-2 - Story: Notifications API (FR40)

Provides endpoints for managing user notifications.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import Base, engine
from app.dependencies import get_db
from app.models.notifications import Notification, NotificationSettings
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


# ===== Pydantic Schemas =====

class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    type: str = "info"  # reminder, progress, alert, info, recommendation, system
    title: str
    message: str
    action_url: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    type: str
    title: str
    message: str
    action_url: Optional[str] = None
    read: bool
    created_at: str
    read_at: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    """Schema for notifications list response."""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings."""
    routine_reminders: Optional[bool] = None
    progress_updates: Optional[bool] = None
    product_recommendations: Optional[bool] = None
    skin_change_alerts: Optional[bool] = None
    system_notifications: Optional[bool] = None
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


class NotificationSettingsResponse(BaseModel):
    """Schema for notification settings response."""
    routine_reminders: bool
    progress_updates: bool
    product_recommendations: bool
    skin_change_alerts: bool
    system_notifications: bool
    email_enabled: bool
    push_enabled: bool
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None

    class Config:
        from_attributes = True


# ===== Endpoints =====

@router.get("", response_model=NotificationsListResponse)
async def get_notifications(
    filter_type: Optional[str] = None,
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's notifications.
    
    SRS: FR40 - Notification Center
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if filter_type and filter_type != "all":
        query = query.filter(Notification.type == filter_type)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    total = db.query(Notification).filter(Notification.user_id == current_user.id).count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    return NotificationsListResponse(
        notifications=[
            NotificationResponse(
                id=n.id,
                type=n.type,
                title=n.title,
                message=n.message,
                action_url=n.action_url,
                read=n.read,
                created_at=n.created_at.isoformat() if n.created_at else "",
                read_at=n.read_at.isoformat() if n.read_at else None,
            )
            for n in notifications
        ],
        total=total,
        unread_count=unread_count,
    )


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new notification (for testing/admin purposes).
    """
    notification = Notification(
        user_id=current_user.id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        action_url=notification_data.action_url,
        read=False,
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    logger.info(f"Created notification {notification.id} for user {current_user.id}")
    
    return NotificationResponse(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        action_url=notification.action_url,
        read=notification.read,
        created_at=notification.created_at.isoformat() if notification.created_at else "",
        read_at=None,
    )


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read", "id": notification_id}


@router.patch("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all notifications as read.
    """
    now = datetime.utcnow()
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({
        "read": True,
        "read_at": now,
    })
    
    db.commit()
    
    logger.info(f"User {current_user.id} marked {updated} notifications as read")
    
    return {"message": f"Marked {updated} notifications as read", "count": updated}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    logger.info(f"User {current_user.id} deleted notification {notification_id}")
    return None


@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's notification settings.
    """
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings
        settings = NotificationSettings(
            user_id=current_user.id,
            routine_reminders=True,
            progress_updates=True,
            product_recommendations=True,
            skin_change_alerts=True,
            system_notifications=True,
            email_enabled=True,
            push_enabled=True,
            quiet_hours_enabled=False,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return NotificationSettingsResponse(
        routine_reminders=settings.routine_reminders,
        progress_updates=settings.progress_updates,
        product_recommendations=settings.product_recommendations,
        skin_change_alerts=settings.skin_change_alerts,
        system_notifications=settings.system_notifications,
        email_enabled=settings.email_enabled,
        push_enabled=settings.push_enabled,
        quiet_hours_enabled=settings.quiet_hours_enabled,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
    )


@router.patch("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user's notification settings.
    """
    settings = db.query(NotificationSettings).filter(
        NotificationSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.add(settings)
    
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    logger.info(f"User {current_user.id} updated notification settings")
    
    return NotificationSettingsResponse(
        routine_reminders=settings.routine_reminders,
        progress_updates=settings.progress_updates,
        product_recommendations=settings.product_recommendations,
        skin_change_alerts=settings.skin_change_alerts,
        system_notifications=settings.system_notifications,
        email_enabled=settings.email_enabled,
        push_enabled=settings.push_enabled,
        quiet_hours_enabled=settings.quiet_hours_enabled,
        quiet_hours_start=settings.quiet_hours_start,
        quiet_hours_end=settings.quiet_hours_end,
    )


@router.get("/check-reminders")
async def check_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check and create routine reminders if due.
    
    Frontend should call this on app load to trigger in-app notifications.
    """
    from app.services.notification_service import NotificationService
    
    service = NotificationService(db)
    created = service.check_and_create_routine_reminders(current_user.id)
    
    return {
        "reminders_created": len(created),
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
            }
            for n in created
        ],
    }
