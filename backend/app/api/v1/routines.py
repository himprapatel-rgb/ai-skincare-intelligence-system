from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.engagement import RoutineCheckin
from app.models.routine_product import RoutineProduct
from app.models.saved_routine import SavedRoutine
from app.models.user import User
from app.schemas.routine_schemas import (
    SavedRoutineCreate,
    SavedRoutineResponse,
    SavedRoutineUpdate,
)


class CheckinRequest(BaseModel):
    routine_type: str = Field(..., description="'morning' or 'evening'")
    steps_completed: int = Field(..., ge=0)
    steps_total: int = Field(..., ge=1)
    date: date | None = None  # defaults to today


class CheckinResponse(BaseModel):
    id: str
    routine_type: str
    steps_completed: int
    steps_total: int
    date: str
    completion_pct: float


class AdherenceResponse(BaseModel):
    days_completed: int
    days_total: int
    completion_rate: float
    current_streak: int
    longest_streak: int
    this_week: list[dict]

router = APIRouter(prefix="/routines", tags=["routines"])


@router.post("/", response_model=SavedRoutineResponse)
def create_routine(
    payload: SavedRoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = SavedRoutine(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        routine_type=payload.routine_type,
        is_active=payload.is_active,
    )
    db.add(routine)
    db.flush()

    # Add products
    for p in payload.products:
        db.add(
            RoutineProduct(
                routine_id=routine.id,
                product_id=p.product_id,
                step_order=p.step_order,
                notes=p.notes,
            )
        )

    db.commit()
    db.refresh(routine)
    return routine


@router.get("/", response_model=list[SavedRoutineResponse])
def list_routines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(SavedRoutine).filter(SavedRoutine.user_id == current_user.id).all()
    return items


@router.get("/{routine_id}", response_model=SavedRoutineResponse)
def get_routine(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@router.put("/{routine_id}", response_model=SavedRoutineResponse)
def update_routine(
    routine_id: UUID,
    payload: SavedRoutineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    update_data = payload.dict(exclude_unset=True)
    products = update_data.pop("products", None)
    for field, value in update_data.items():
        setattr(routine, field, value)

    if products is not None:
        db.query(RoutineProduct).filter(RoutineProduct.routine_id == routine.id).delete()
        for p in products:
            db.add(
                RoutineProduct(
                    routine_id=routine.id,
                    product_id=p.product_id,
                    step_order=p.step_order,
                    notes=p.notes,
                )
            )

    db.commit()
    db.refresh(routine)
    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user.id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    db.delete(routine)
    db.commit()
    return None


# ── Routine Check-ins & Adherence ──────────────────────────────────


@router.post("/checkin", response_model=CheckinResponse)
def record_checkin(
    payload: CheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a routine completion for today (or a specific date)."""
    checkin_date = payload.date or date.today()

    # Upsert: update if already checked in for this type+date
    existing = (
        db.query(RoutineCheckin)
        .filter(
            RoutineCheckin.user_id == current_user.id,
            func.date(RoutineCheckin.checked_in_at) == checkin_date,
            RoutineCheckin.status == payload.routine_type,
        )
        .first()
    )

    if existing:
        existing.status = payload.routine_type
        existing.checked_in_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return CheckinResponse(
            id=str(existing.id),
            routine_type=payload.routine_type,
            steps_completed=payload.steps_completed,
            steps_total=payload.steps_total,
            date=str(checkin_date),
            completion_pct=round(payload.steps_completed / payload.steps_total * 100, 1),
        )

    checkin = RoutineCheckin(
        user_id=current_user.id,
        status=payload.routine_type,
        checked_in_at=datetime.combine(checkin_date, datetime.min.time()),
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    return CheckinResponse(
        id=str(checkin.id),
        routine_type=payload.routine_type,
        steps_completed=payload.steps_completed,
        steps_total=payload.steps_total,
        date=str(checkin_date),
        completion_pct=round(payload.steps_completed / payload.steps_total * 100, 1),
    )


@router.get("/adherence", response_model=AdherenceResponse)
def get_adherence(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get routine adherence stats for the last N days."""
    since = date.today() - timedelta(days=days)

    checkins = (
        db.query(RoutineCheckin)
        .filter(
            RoutineCheckin.user_id == current_user.id,
            RoutineCheckin.checked_in_at >= datetime.combine(since, datetime.min.time()),
        )
        .order_by(RoutineCheckin.checked_in_at.asc())
        .all()
    )

    # Unique days with at least one checkin
    checked_dates = sorted({c.checked_in_at.date() for c in checkins})
    days_completed = len(checked_dates)
    days_total = days
    completion_rate = round(days_completed / days_total * 100, 1) if days_total > 0 else 0

    # Streak calculation
    current_streak = 0
    longest_streak = 0
    streak = 0
    today = date.today()

    # Check from today backwards
    for i in range(days):
        d = today - timedelta(days=i)
        if d in set(checked_dates):
            if i == 0 or (today - timedelta(days=i - 1)) in set(checked_dates) or streak > 0:
                streak += 1
                longest_streak = max(longest_streak, streak)
        else:
            if streak > 0 and current_streak == 0:
                current_streak = streak
            streak = 0

    if current_streak == 0:
        current_streak = streak

    # This week breakdown (Mon-Sun)
    week_start = today - timedelta(days=today.weekday())
    this_week = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        day_checkins = [c for c in checkins if c.checked_in_at.date() == d]
        this_week.append({
            "date": str(d),
            "day": d.strftime("%a"),
            "completed": len(day_checkins) > 0,
            "types": list({c.status for c in day_checkins}),
        })

    return AdherenceResponse(
        days_completed=days_completed,
        days_total=days_total,
        completion_rate=completion_rate,
        current_streak=current_streak,
        longest_streak=longest_streak,
        this_week=this_week,
    )


@router.get("/streak")
def get_routine_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current routine streak (consecutive days with at least one checkin)."""
    checkins = (
        db.query(RoutineCheckin)
        .filter(RoutineCheckin.user_id == current_user.id)
        .order_by(RoutineCheckin.checked_in_at.desc())
        .limit(365)
        .all()
    )

    checked_dates = sorted({c.checked_in_at.date() for c in checkins}, reverse=True)
    streak = 0
    today = date.today()

    for i, d in enumerate(checked_dates):
        expected = today - timedelta(days=i)
        if d == expected:
            streak += 1
        elif d == expected - timedelta(days=1) and i == 0:
            # Allow yesterday if today hasn't been checked in yet
            streak += 1
            today = d
        else:
            break

    return {"current_streak": streak, "last_checkin": str(checked_dates[0]) if checked_dates else None}
