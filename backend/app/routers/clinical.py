"""Clinical Intelligence API router.

Endpoints:
- GET    /clinical/report/{scan_id}      — generate dermatologist-ready report
- POST   /clinical/share-report          — create shareable report link
- GET    /clinical/shared/{share_token}   — view shared report (public)
- GET    /clinical/trends                — skin health trends
- GET    /clinical/alerts                — active skin alerts
- POST   /clinical/alerts/{id}/dismiss   — dismiss an alert
- POST   /clinical/ingredient-check      — ingredient interaction safety check
- GET    /clinical/benchmark             — comparative benchmarking
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.clinical import DermReport
from app.models.user import User
from app.schemas.clinical_schemas import (
    BenchmarkResponse,
    DermReportResponse,
    IngredientCheckRequest,
    IngredientCheckResponse,
    IngredientInteractionItem,
    ShareReportRequest,
    ShareReportResponse,
    SkinAlertListResponse,
    SkinAlertResponse,
    TrendAnalysis,
)
from app.services.clinical_insights_service import clinical_insights_service

router = APIRouter(prefix="/clinical", tags=["clinical"])
logger = logging.getLogger(__name__)


# ── Derm Report ──────────────────────────────────────────────────────────────

@router.get("/report/{scan_id}", response_model=DermReportResponse)
async def generate_derm_report(
    scan_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a comprehensive dermatologist-ready report from a scan."""
    try:
        report = clinical_insights_service.generate_derm_report(user.id, scan_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return report


@router.post("/share-report", response_model=ShareReportResponse)
async def share_report(
    body: ShareReportRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a shareable link for a derm report (7-day expiry)."""
    report = (
        db.query(DermReport)
        .filter(DermReport.id == body.report_id, DermReport.user_id == user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    token = uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    report.share_token = token
    report.share_expires_at = expires_at
    db.commit()
    db.refresh(report)

    return ShareReportResponse(
        share_token=token,
        share_url=f"/clinical/shared/{token}",
        expires_at=expires_at,
    )


@router.get("/shared/{share_token}", response_model=DermReportResponse)
async def view_shared_report(
    share_token: str,
    db: Session = Depends(get_db),
):
    """View a shared derm report (public endpoint, no auth required)."""
    report = (
        db.query(DermReport)
        .filter(DermReport.share_token == share_token)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or link expired")
    if report.share_expires_at and report.share_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")
    return report


# ── Trends ───────────────────────────────────────────────────────────────────

@router.get("/trends", response_model=TrendAnalysis)
async def get_trends(
    days: int = Query(30, ge=7, le=365),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyse skin health trends over the specified number of days."""
    result = clinical_insights_service.analyze_trends(user.id, days, db)
    return result


# ── Skin Alerts ──────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=SkinAlertListResponse)
async def get_alerts(
    include_dismissed: bool = Query(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get active skin alerts for the current user."""
    alerts = clinical_insights_service.check_skin_alerts(
        user.id, db, include_dismissed=include_dismissed,
    )
    return SkinAlertListResponse(
        data=[SkinAlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
    )


@router.post("/alerts/{alert_id}/dismiss", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss a skin alert."""
    dismissed = clinical_insights_service.dismiss_alert(alert_id, user.id, db)
    if not dismissed:
        raise HTTPException(status_code=404, detail="Alert not found")


# ── Ingredient Interactions ──────────────────────────────────────────────────

@router.post("/ingredient-check", response_model=IngredientCheckResponse)
async def check_ingredients(
    body: IngredientCheckRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check a list of ingredients for known interactions (conflicts, cautions, synergies)."""
    result = clinical_insights_service.check_ingredient_interactions(body.ingredients, db)
    conflicts = [IngredientInteractionItem.model_validate(i) for i in result["conflicts"]]
    warnings = [IngredientInteractionItem.model_validate(i) for i in result["warnings"]]
    synergies = [IngredientInteractionItem.model_validate(i) for i in result["synergies"]]

    return IngredientCheckResponse(
        conflicts=conflicts,
        warnings=warnings,
        synergies=synergies,
        total_checked=len(body.ingredients),
        safe=len(conflicts) == 0,
    )


# ── Benchmark ────────────────────────────────────────────────────────────────

@router.get("/benchmark", response_model=BenchmarkResponse)
async def get_benchmark(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comparative benchmarking data against similar users."""
    result = clinical_insights_service.comparative_benchmark(user.id, db)
    return result
