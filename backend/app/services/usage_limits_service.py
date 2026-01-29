"""
Usage Limits Service - Freemium Rate Limiting

Controls access to premium AI features based on user tier:
- GUEST: No access to premium features
- FREE: Limited access (1/day per feature)
- PREMIUM: Unlimited access (future)

Premium Features:
- Background Removal
- Face Enhancement  
- Image Upscaling
- 3D Face Reconstruction
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

from app.database import Base, SessionLocal

logger = logging.getLogger(__name__)


class UserTier(str, Enum):
    """User subscription tier"""
    GUEST = "guest"       # Not logged in
    FREE = "free"         # Logged in, free tier
    PREMIUM = "premium"   # Paid subscription (future)


class FeatureType(str, Enum):
    """Premium AI features that require limits"""
    BACKGROUND_REMOVAL = "background_removal"
    FACE_ENHANCEMENT = "face_enhancement"
    UPSCALE = "upscale"
    FACE_3D = "face_3d"
    FULL_PIPELINE = "full_pipeline"


# Daily limits per tier
DAILY_LIMITS = {
    UserTier.GUEST: {
        FeatureType.BACKGROUND_REMOVAL: 0,
        FeatureType.FACE_ENHANCEMENT: 0,
        FeatureType.UPSCALE: 0,
        FeatureType.FACE_3D: 0,
        FeatureType.FULL_PIPELINE: 0,
    },
    UserTier.FREE: {
        FeatureType.BACKGROUND_REMOVAL: 1,
        FeatureType.FACE_ENHANCEMENT: 1,
        FeatureType.UPSCALE: 1,
        FeatureType.FACE_3D: 1,
        FeatureType.FULL_PIPELINE: 1,  # Full pipeline counts as 1
    },
    UserTier.PREMIUM: {
        FeatureType.BACKGROUND_REMOVAL: 999999,  # Unlimited
        FeatureType.FACE_ENHANCEMENT: 999999,
        FeatureType.UPSCALE: 999999,
        FeatureType.FACE_3D: 999999,
        FeatureType.FULL_PIPELINE: 999999,
    },
}


class FeatureUsage(Base):
    """Track daily usage of premium features per user."""
    __tablename__ = "feature_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    feature = Column(String(50), index=True)
    used_at = Column(DateTime, default=datetime.utcnow)
    date_key = Column(String(10), index=True)  # YYYY-MM-DD for daily tracking
    
    @staticmethod
    def get_date_key() -> str:
        """Get today's date key for daily limit tracking."""
        return datetime.utcnow().strftime("%Y-%m-%d")


class UsageLimitsService:
    """
    Service to check and enforce usage limits for premium features.
    
    Usage:
        service = UsageLimitsService(db)
        
        # Check if user can use feature
        can_use, message = service.check_limit(user_id, FeatureType.FACE_3D)
        
        # Record usage after successful processing
        service.record_usage(user_id, FeatureType.FACE_3D)
        
        # Get remaining usage
        remaining = service.get_remaining(user_id, FeatureType.FACE_3D)
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_tier(self, user_id: Optional[int]) -> UserTier:
        """
        Get user's subscription tier.
        
        Args:
            user_id: User ID, or None for guest
            
        Returns:
            UserTier enum value
        """
        if user_id is None:
            return UserTier.GUEST
        
        # TODO: Check if user has premium subscription
        # For now, all logged-in users are FREE tier
        # Future: Query subscription table
        
        # Example future logic:
        # subscription = self.db.query(Subscription).filter(
        #     Subscription.user_id == user_id,
        #     Subscription.is_active == True,
        #     Subscription.expires_at > datetime.utcnow()
        # ).first()
        # if subscription:
        #     return UserTier.PREMIUM
        
        return UserTier.FREE
    
    def get_daily_limit(self, user_id: Optional[int], feature: FeatureType) -> int:
        """Get daily limit for a feature based on user tier."""
        tier = self.get_user_tier(user_id)
        return DAILY_LIMITS[tier].get(feature, 0)
    
    def get_usage_today(self, user_id: int, feature: FeatureType) -> int:
        """Get how many times user has used a feature today."""
        date_key = FeatureUsage.get_date_key()
        
        count = self.db.query(FeatureUsage).filter(
            FeatureUsage.user_id == user_id,
            FeatureUsage.feature == feature.value,
            FeatureUsage.date_key == date_key
        ).count()
        
        return count
    
    def get_remaining(self, user_id: Optional[int], feature: FeatureType) -> int:
        """Get remaining uses for today."""
        if user_id is None:
            return 0
        
        limit = self.get_daily_limit(user_id, feature)
        used = self.get_usage_today(user_id, feature)
        
        return max(0, limit - used)
    
    def check_limit(
        self, 
        user_id: Optional[int], 
        feature: FeatureType
    ) -> tuple[bool, str]:
        """
        Check if user can use a premium feature.
        
        Args:
            user_id: User ID, or None for guest
            feature: Feature to check
            
        Returns:
            (can_use: bool, message: str)
        """
        tier = self.get_user_tier(user_id)
        
        # Guest - must login
        if tier == UserTier.GUEST:
            return False, f"Please login to use {feature.value.replace('_', ' ')}. It's free!"
        
        # Check daily limit
        limit = self.get_daily_limit(user_id, feature)
        used = self.get_usage_today(user_id, feature)
        remaining = limit - used
        
        if remaining <= 0:
            # FREE tier - suggest upgrade
            if tier == UserTier.FREE:
                return False, (
                    f"You've used your free {feature.value.replace('_', ' ')} for today. "
                    f"Come back tomorrow or upgrade to Premium for unlimited access!"
                )
            else:
                return False, f"Daily limit reached for {feature.value.replace('_', ' ')}."
        
        return True, f"OK ({remaining} remaining today)"
    
    def record_usage(self, user_id: int, feature: FeatureType) -> None:
        """Record that user has used a feature."""
        usage = FeatureUsage(
            user_id=user_id,
            feature=feature.value,
            date_key=FeatureUsage.get_date_key()
        )
        self.db.add(usage)
        self.db.commit()
        
        logger.info(f"User {user_id} used {feature.value}")
    
    def get_all_remaining(self, user_id: Optional[int]) -> dict:
        """Get remaining uses for all features."""
        return {
            feature.value: self.get_remaining(user_id, feature)
            for feature in FeatureType
        }
    
    def get_limits_info(self, user_id: Optional[int]) -> dict:
        """Get complete limits info for frontend display."""
        tier = self.get_user_tier(user_id)
        
        features = {}
        for feature in FeatureType:
            limit = self.get_daily_limit(user_id, feature)
            used = self.get_usage_today(user_id, feature) if user_id else 0
            remaining = max(0, limit - used)
            
            features[feature.value] = {
                "limit": limit,
                "used": used,
                "remaining": remaining,
                "available": remaining > 0,
                "requires_login": tier == UserTier.GUEST,
            }
        
        return {
            "tier": tier.value,
            "is_premium": tier == UserTier.PREMIUM,
            "features": features,
            "upgrade_url": "/pricing" if tier != UserTier.PREMIUM else None,
        }


def get_usage_service(db: Session) -> UsageLimitsService:
    """Get usage limits service instance."""
    return UsageLimitsService(db)
