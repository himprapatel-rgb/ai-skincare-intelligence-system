"""Weekly progress summary report endpoint."""
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.engagement import RoutineCheckin
from app.models.goals import SkinGoal
from app.models.scan import ScanSession
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


class WeeklySummaryResponse(BaseModel):
    scans_this_week: int
    scans_last_week: int
    avg_score_this_week: Optional[float]
    avg_score_last_week: Optional[float]
    score_trend: str  # "improving" | "stable" | "declining"
    routine_adherence_pct: float
    routine_days_completed: int
    active_goals: int
    completed_goals: int
    insight: str


@router.get("/weekly-summary", response_model=WeeklySummaryResponse)
def weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    last_week_start = week_start - timedelta(days=7)

    # Scans this week
    scans_this_week_q = (
        db.query(ScanSession)
        .filter(
            ScanSession.user_id == current_user.id,
            ScanSession.created_at >= datetime.combine(week_start, datetime.min.time()),
        )
        .all()
    )
    scans_this_week = len(scans_this_week_q)

    # Scans last week
    scans_last_week_q = (
        db.query(ScanSession)
        .filter(
            ScanSession.user_id == current_user.id,
            ScanSession.created_at >= datetime.combine(last_week_start, datetime.min.time()),
            ScanSession.created_at < datetime.combine(week_start, datetime.min.time()),
        )
        .all()
    )
    scans_last_week = len(scans_last_week_q)

    # Average scores (extract from summary JSON if available)
    def avg_score(scans):
        scores = []
        for s in scans:
            try:
                summary = s.summary if hasattr(s, 'summary') and s.summary else {}
                if isinstance(summary, dict):
                    sc = summary.get('overall_score')
                    if isinstance(sc, (int, float)):
                        scores.append(float(sc))
            except Exception:
                pass
        return round(sum(scores) / len(scores), 1) if scores else None

    avg_this = avg_score(scans_this_week_q)
    avg_last = avg_score(scans_last_week_q)

    # Score trend
    if avg_this is not None and avg_last is not None:
        diff = avg_this - avg_last
        score_trend = "improving" if diff > 2 else ("declining" if diff < -2 else "stable")
    elif avg_this is not None:
        score_trend = "stable"
    else:
        score_trend = "stable"

    # Routine adherence this week
    checkins = (
        db.query(RoutineCheckin)
        .filter(
            RoutineCheckin.user_id == current_user.id,
            RoutineCheckin.checked_in_at >= datetime.combine(week_start, datetime.min.time()),
        )
        .all()
    )
    routine_days = len({c.checked_in_at.date() for c in checkins})
    days_elapsed = min((today - week_start).days + 1, 7)
    adherence_pct = round(routine_days / days_elapsed * 100, 1) if days_elapsed > 0 else 0

    # Goals
    active_goals = db.query(func.count(SkinGoal.id)).filter(
        SkinGoal.user_id == current_user.id,
        SkinGoal.is_active == True,
        SkinGoal.is_completed == False,
    ).scalar() or 0

    completed_goals = db.query(func.count(SkinGoal.id)).filter(
        SkinGoal.user_id == current_user.id,
        SkinGoal.is_completed == True,
    ).scalar() or 0

    # Generate insight
    parts = []
    if scans_this_week > scans_last_week:
        parts.append(f"You scanned {scans_this_week - scans_last_week} more time{'s' if scans_this_week - scans_last_week > 1 else ''} than last week")
    elif scans_this_week == 0:
        parts.append("No scans this week — try scanning to track your progress")
    if score_trend == "improving":
        parts.append("your skin score is trending up")
    elif score_trend == "declining":
        parts.append("your skin score dipped — check your routine")
    if adherence_pct >= 80:
        parts.append("great routine consistency")
    elif adherence_pct > 0:
        parts.append(f"routine adherence at {adherence_pct}%")
    insight = ". ".join(parts).capitalize() + "." if parts else "Keep scanning and tracking your routine for insights."

    return WeeklySummaryResponse(
        scans_this_week=scans_this_week,
        scans_last_week=scans_last_week,
        avg_score_this_week=avg_this,
        avg_score_last_week=avg_last,
        score_trend=score_trend,
        routine_adherence_pct=adherence_pct,
        routine_days_completed=routine_days,
        active_goals=active_goals,
        completed_goals=completed_goals,
        insight=insight,
    )


@router.get("/dashboard-aggregate")
def dashboard_aggregate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Single endpoint returning all dashboard data in one request.
    Replaces 5 parallel frontend calls (summary, adherence, prediction, routines, history).
    """
    from app.models.saved_routine import SavedRoutine

    # Weekly summary (inline to avoid extra DB session)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    scans_this_week_q = (
        db.query(ScanSession)
        .filter(ScanSession.user_id == current_user.id, ScanSession.created_at >= datetime.combine(week_start, datetime.min.time()))
        .all()
    )

    def avg_score(scans):
        scores = []
        for s in scans:
            try:
                summary = s.summary if hasattr(s, 'summary') and s.summary else {}
                if isinstance(summary, dict):
                    sc = summary.get('overall_score')
                    if isinstance(sc, (int, float)):
                        scores.append(float(sc))
            except Exception:
                pass
        return round(sum(scores) / len(scores), 1) if scores else None

    avg_this = avg_score(scans_this_week_q)

    # Adherence
    checkins = (
        db.query(RoutineCheckin)
        .filter(
            RoutineCheckin.user_id == current_user.id,
            RoutineCheckin.checked_in_at >= datetime.combine(week_start, datetime.min.time()),
        )
        .all()
    )
    routine_days = len({c.checked_in_at.date() for c in checkins})
    days_elapsed = min((today - week_start).days + 1, 7)
    adherence_pct = round(routine_days / days_elapsed * 100, 1) if days_elapsed > 0 else 0

    # This week breakdown
    this_week = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        day_checkins = [c for c in checkins if c.checked_in_at.date() == d]
        this_week.append({
            "date": str(d),
            "day": d.strftime("%a"),
            "completed": len(day_checkins) > 0,
        })

    # Streak
    all_checkins = (
        db.query(RoutineCheckin)
        .filter(RoutineCheckin.user_id == current_user.id)
        .order_by(RoutineCheckin.checked_in_at.desc())
        .limit(60)
        .all()
    )
    checked_dates = sorted({c.checked_in_at.date() for c in all_checkins}, reverse=True)
    streak = 0
    for i, d in enumerate(checked_dates):
        if d == today - timedelta(days=i):
            streak += 1
        else:
            break

    # Active routines count
    active_routines = db.query(func.count(SavedRoutine.id)).filter(
        SavedRoutine.user_id == current_user.id
    ).scalar() or 0

    # Goals
    active_goals = db.query(func.count(SkinGoal.id)).filter(
        SkinGoal.user_id == current_user.id, SkinGoal.is_active == True, SkinGoal.is_completed == False,
    ).scalar() or 0

    return {
        "weekly_summary": {
            "scans_this_week": len(scans_this_week_q),
            "avg_score": avg_this,
            "routine_adherence_pct": adherence_pct,
            "routine_days": routine_days,
            "active_goals": active_goals,
        },
        "adherence": {
            "completion_rate": adherence_pct,
            "current_streak": streak,
            "this_week": this_week,
        },
        "active_routines": active_routines,
    }
