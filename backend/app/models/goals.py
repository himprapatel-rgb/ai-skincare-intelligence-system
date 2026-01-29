"""
User Skin Goals database model.
Sprint: GUI-2 - Story: Skin Goals API
"""
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SkinGoal(Base):
    """User's skin goals with progress tracking."""
    __tablename__ = "skin_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Goal definition
    goal_type = Column(String(100), nullable=False)  # anti_aging, acne_control, hydration, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=1)  # 1 = highest priority
    
    # Progress tracking
    target_date = Column(DateTime(timezone=True), nullable=True)
    progress_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metrics (optional - for measurable goals)
    baseline_value = Column(Float, nullable=True)
    target_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    metric_unit = Column(String(50), nullable=True)  # e.g., "hydration_score", "acne_count"
    
    # Milestones (JSON array of milestone objects)
    milestones = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="skin_goals")
    
    def __repr__(self):
        return f"<SkinGoal user_id={self.user_id} type={self.goal_type}>"


# Predefined goal types for the UI
GOAL_TYPES = [
    {"id": "anti_aging", "title": "Anti-Aging", "description": "Reduce fine lines and wrinkles"},
    {"id": "acne_control", "title": "Acne Control", "description": "Clear breakouts and prevent new ones"},
    {"id": "hydration", "title": "Hydration", "description": "Improve skin moisture levels"},
    {"id": "brightening", "title": "Brightening", "description": "Even skin tone and add radiance"},
    {"id": "dark_spots", "title": "Dark Spot Reduction", "description": "Fade hyperpigmentation"},
    {"id": "pore_minimizing", "title": "Pore Minimizing", "description": "Reduce appearance of pores"},
    {"id": "oil_control", "title": "Oil Control", "description": "Balance sebum production"},
    {"id": "sensitivity", "title": "Reduce Sensitivity", "description": "Calm and strengthen skin barrier"},
    {"id": "texture", "title": "Improve Texture", "description": "Smoother, more refined skin"},
    {"id": "firmness", "title": "Improve Firmness", "description": "Tighter, more lifted appearance"},
]
