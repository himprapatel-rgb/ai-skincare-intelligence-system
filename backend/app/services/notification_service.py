"""
Notification Service for creating in-app notifications.
Sprint: Final Features - Routine reminders and progress alerts
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notifications import Notification, NotificationSettings
from app.models.saved_routine import SavedRoutine

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and managing notifications."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_settings(self, user_id: int) -> Optional[NotificationSettings]:
        """Get user's notification settings."""
        return self.db.query(NotificationSettings).filter(
            NotificationSettings.user_id == user_id
        ).first()
    
    def create_routine_reminder(
        self, 
        user_id: int, 
        routine_name: str,
        routine_type: str = "am"
    ) -> Optional[Notification]:
        """Create a routine reminder notification."""
        settings = self.get_user_settings(user_id)
        if settings and not settings.routine_reminders:
            return None
        
        notification = Notification(
            user_id=user_id,
            type="reminder",
            title=f"Time for your {routine_type.upper()} routine!",
            message=f"Don't forget to complete your {routine_name} routine for healthy skin.",
            action_url="/routine-builder",
            read=False,
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Created routine reminder for user {user_id}: {routine_name}")
        return notification
    
    def create_progress_milestone(
        self, 
        user_id: int, 
        milestone: str,
        score_change: float
    ) -> Optional[Notification]:
        """Create a progress milestone notification."""
        settings = self.get_user_settings(user_id)
        if settings and not settings.progress_updates:
            return None
        
        direction = "improved" if score_change > 0 else "changed"
        
        notification = Notification(
            user_id=user_id,
            type="progress",
            title=f"Skin Health Milestone: {milestone}",
            message=f"Your skin score has {direction} by {abs(score_change):.1f} points! Keep up the great work.",
            action_url="/progress",
            read=False,
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Created progress milestone for user {user_id}: {milestone}")
        return notification
    
    def create_scan_complete(
        self, 
        user_id: int, 
        scan_id: str,
        overall_score: float
    ) -> Optional[Notification]:
        """Create a scan completion notification."""
        notification = Notification(
            user_id=user_id,
            type="info",
            title="Skin Analysis Complete",
            message=f"Your skin analysis is ready! Overall score: {overall_score:.0f}/100",
            action_url=f"/analysis/{scan_id}",
            read=False,
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Created scan complete notification for user {user_id}")
        return notification
    
    def check_and_create_routine_reminders(self, user_id: int) -> list:
        """Check if any routine reminders are due and create them."""
        now = datetime.now(timezone.utc)
        current_hour = now.hour
        current_minute = now.minute
        current_time = f"{current_hour:02d}:{current_minute:02d}"
        
        # Get user's routines with reminders enabled
        routines = self.db.query(SavedRoutine).filter(
            SavedRoutine.user_id == user_id,
            SavedRoutine.reminder_enabled == True,
        ).all()
        
        created = []
        for routine in routines:
            if routine.reminder_time:
                # Check if reminder time matches (within 30 min window)
                reminder_hour, reminder_min = map(int, routine.reminder_time.split(":"))
                time_diff = abs((current_hour * 60 + current_minute) - (reminder_hour * 60 + reminder_min))
                
                if time_diff <= 30:
                    # Check if we already sent a reminder today
                    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    existing = self.db.query(Notification).filter(
                        Notification.user_id == user_id,
                        Notification.type == "reminder",
                        Notification.created_at >= today_start,
                        Notification.title.contains(routine.name),
                    ).first()
                    
                    if not existing:
                        notif = self.create_routine_reminder(
                            user_id, 
                            routine.name, 
                            routine.routine_type
                        )
                        if notif:
                            created.append(notif)
        
        return created
