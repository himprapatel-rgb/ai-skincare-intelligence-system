"""
Skin Goals API Router.
Sprint: GUI-2 - Story: Skin Goals API (US-402)

Provides endpoints for managing user's skin goals.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import Base, engine
from app.dependencies import get_db
from app.models.goals import GOAL_TYPES, SkinGoal
from app.models.user import User

router = APIRouter(prefix="/goals", tags=["goals"])
logger = logging.getLogger(__name__)


# ===== Pydantic Schemas =====

class GoalCreate(BaseModel):
    """Schema for creating a goal."""
    goal_type: str
    title: str
    description: Optional[str] = None
    priority: int = 1
    target_date: Optional[datetime] = None
    baseline_value: Optional[float] = None
    target_value: Optional[float] = None
    metric_unit: Optional[str] = None


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    target_date: Optional[datetime] = None
    progress_percentage: Optional[float] = None
    current_value: Optional[float] = None
    is_completed: Optional[bool] = None
    is_active: Optional[bool] = None
    milestones: Optional[List[dict]] = None


class GoalResponse(BaseModel):
    """Schema for goal response."""
    id: int
    goal_type: str
    title: str
    description: Optional[str] = None
    priority: int
    target_date: Optional[str] = None
    progress_percentage: float
    is_completed: bool
    completed_at: Optional[str] = None
    baseline_value: Optional[float] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    metric_unit: Optional[str] = None
    milestones: Optional[List[dict]] = None
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class GoalsListResponse(BaseModel):
    """Schema for goals list response."""
    goals: List[GoalResponse]
    total: int
    active_count: int
    completed_count: int


class GoalTypeInfo(BaseModel):
    """Schema for goal type info."""
    id: str
    title: str
    description: str


# ===== Endpoints =====

@router.get("/types", response_model=List[GoalTypeInfo])
async def get_goal_types():
    """
    Get available goal types.
    """
    return [GoalTypeInfo(**gt) for gt in GOAL_TYPES]


@router.get("", response_model=GoalsListResponse)
async def get_goals(
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's skin goals.
    
    SRS: US-402 - Skin Goals
    """
    query = db.query(SkinGoal).filter(SkinGoal.user_id == current_user.id)
    
    if active_only:
        query = query.filter(SkinGoal.is_active == True)
    
    goals = query.order_by(SkinGoal.priority.asc(), SkinGoal.created_at.desc()).all()
    
    active_count = sum(1 for g in goals if g.is_active and not g.is_completed)
    completed_count = sum(1 for g in goals if g.is_completed)
    
    return GoalsListResponse(
        goals=[
            GoalResponse(
                id=g.id,
                goal_type=g.goal_type,
                title=g.title,
                description=g.description,
                priority=g.priority,
                target_date=g.target_date.isoformat() if g.target_date else None,
                progress_percentage=g.progress_percentage or 0.0,
                is_completed=g.is_completed,
                completed_at=g.completed_at.isoformat() if g.completed_at else None,
                baseline_value=g.baseline_value,
                target_value=g.target_value,
                current_value=g.current_value,
                metric_unit=g.metric_unit,
                milestones=g.milestones,
                is_active=g.is_active,
                created_at=g.created_at.isoformat() if g.created_at else "",
                updated_at=g.updated_at.isoformat() if g.updated_at else None,
            )
            for g in goals
        ],
        total=len(goals),
        active_count=active_count,
        completed_count=completed_count,
    )


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new skin goal.
    
    SRS: US-402 - Set skin goals
    """
    # Validate goal type
    valid_types = [gt["id"] for gt in GOAL_TYPES]
    if goal_data.goal_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal_type. Must be one of: {valid_types}"
        )
    
    goal = SkinGoal(
        user_id=current_user.id,
        goal_type=goal_data.goal_type,
        title=goal_data.title,
        description=goal_data.description,
        priority=goal_data.priority,
        target_date=goal_data.target_date,
        baseline_value=goal_data.baseline_value,
        target_value=goal_data.target_value,
        metric_unit=goal_data.metric_unit,
        progress_percentage=0.0,
        is_completed=False,
        is_active=True,
    )
    
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    logger.info(f"User {current_user.id} created goal: {goal_data.title}")
    
    return GoalResponse(
        id=goal.id,
        goal_type=goal.goal_type,
        title=goal.title,
        description=goal.description,
        priority=goal.priority,
        target_date=goal.target_date.isoformat() if goal.target_date else None,
        progress_percentage=goal.progress_percentage or 0.0,
        is_completed=goal.is_completed,
        completed_at=None,
        baseline_value=goal.baseline_value,
        target_value=goal.target_value,
        current_value=goal.current_value,
        metric_unit=goal.metric_unit,
        milestones=goal.milestones,
        is_active=goal.is_active,
        created_at=goal.created_at.isoformat() if goal.created_at else "",
        updated_at=None,
    )


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific goal.
    """
    goal = db.query(SkinGoal).filter(
        SkinGoal.id == goal_id,
        SkinGoal.user_id == current_user.id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    return GoalResponse(
        id=goal.id,
        goal_type=goal.goal_type,
        title=goal.title,
        description=goal.description,
        priority=goal.priority,
        target_date=goal.target_date.isoformat() if goal.target_date else None,
        progress_percentage=goal.progress_percentage or 0.0,
        is_completed=goal.is_completed,
        completed_at=goal.completed_at.isoformat() if goal.completed_at else None,
        baseline_value=goal.baseline_value,
        target_value=goal.target_value,
        current_value=goal.current_value,
        metric_unit=goal.metric_unit,
        milestones=goal.milestones,
        is_active=goal.is_active,
        created_at=goal.created_at.isoformat() if goal.created_at else "",
        updated_at=goal.updated_at.isoformat() if goal.updated_at else None,
    )


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a goal.
    """
    goal = db.query(SkinGoal).filter(
        SkinGoal.id == goal_id,
        SkinGoal.user_id == current_user.id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    update_data = goal_update.dict(exclude_unset=True)
    
    # Handle completion
    if "is_completed" in update_data and update_data["is_completed"] and not goal.is_completed:
        goal.completed_at = datetime.utcnow()
        goal.progress_percentage = 100.0
    
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    db.commit()
    db.refresh(goal)
    
    logger.info(f"User {current_user.id} updated goal {goal_id}")
    
    return GoalResponse(
        id=goal.id,
        goal_type=goal.goal_type,
        title=goal.title,
        description=goal.description,
        priority=goal.priority,
        target_date=goal.target_date.isoformat() if goal.target_date else None,
        progress_percentage=goal.progress_percentage or 0.0,
        is_completed=goal.is_completed,
        completed_at=goal.completed_at.isoformat() if goal.completed_at else None,
        baseline_value=goal.baseline_value,
        target_value=goal.target_value,
        current_value=goal.current_value,
        metric_unit=goal.metric_unit,
        milestones=goal.milestones,
        is_active=goal.is_active,
        created_at=goal.created_at.isoformat() if goal.created_at else "",
        updated_at=goal.updated_at.isoformat() if goal.updated_at else None,
    )


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a goal.
    """
    goal = db.query(SkinGoal).filter(
        SkinGoal.id == goal_id,
        SkinGoal.user_id == current_user.id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    db.delete(goal)
    db.commit()
    
    logger.info(f"User {current_user.id} deleted goal {goal_id}")
    return None


@router.post("/{goal_id}/progress")
async def update_progress(
    goal_id: int,
    current_value: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update goal progress based on current value.
    """
    goal = db.query(SkinGoal).filter(
        SkinGoal.id == goal_id,
        SkinGoal.user_id == current_user.id,
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    goal.current_value = current_value
    
    # Calculate progress percentage if baseline and target are set
    if goal.baseline_value is not None and goal.target_value is not None:
        if goal.target_value != goal.baseline_value:
            progress = (current_value - goal.baseline_value) / (goal.target_value - goal.baseline_value) * 100
            goal.progress_percentage = max(0, min(100, progress))
            
            # Auto-complete if 100%
            if goal.progress_percentage >= 100 and not goal.is_completed:
                goal.is_completed = True
                goal.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(goal)
    
    return {
        "goal_id": goal_id,
        "current_value": goal.current_value,
        "progress_percentage": goal.progress_percentage,
        "is_completed": goal.is_completed,
    }
