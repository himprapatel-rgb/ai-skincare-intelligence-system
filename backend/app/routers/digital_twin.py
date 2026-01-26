"""Digital Twin API Router for Sprint 3."""
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.digital_twin import SkinRegionState, SkinStateSnapshot
from app.models.scan import ScanSession
from app.models.user import User
from app.schemas.twin_schemas import (
    DigitalTwinQueryResponse,
    DigitalTwinSnapshot,
    DigitalTwinTimelineResponse,
    EnvironmentContext,
    RegionMetrics,
    RoutineContext,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
    SkinMood,
    SkinStateVector,
    TimelinePoint,
)

router = APIRouter(prefix="/digital-twin", tags=["digital_twin"])


class SnapshotRequest(BaseModel):
    """Request to create Digital Twin snapshot."""
    scan_id: str
    environment: Optional[EnvironmentContext] = None
    routine: Optional[RoutineContext] = None


@router.post("/snapshot", response_model=DigitalTwinSnapshot, status_code=status.HTTP_201_CREATED)
async def create_digital_twin_snapshot(
    request: SnapshotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new Digital Twin snapshot from scan."""
    scan = db.query(ScanSession).filter(
        ScanSession.id == request.scan_id,
        ScanSession.user_id == current_user.id,
    ).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    summary = None
    scores = {}
    if isinstance(scan.scan_metadata, dict):
        summary = scan.scan_metadata.get("summary")
        if isinstance(summary, dict):
            scores = summary.get("scores") or {}

    def _score(key: str, fallback: float = 50.0) -> float:
        value = scores.get(key)
        try:
            return float(value)
        except (TypeError, ValueError):
            return fallback

    overall_score = _score("overall_score", 50.0)
    snapshot = SkinStateSnapshot(
        user_id=current_user.id,
        scan_session_id=scan.id,
        overall_health_score=overall_score,
        hydration_level=_score("moisture", 50.0),
        oil_level=_score("oil", 50.0),
        sensitivity_score=_score("sensitivity", 50.0),
        acne_severity=_score("acne", 0.0),
        wrinkle_severity=_score("wrinkle", 0.0),
        pigmentation_severity=_score("age_spot", 0.0),
        redness_severity=_score("redness", 0.0),
        ml_model_version=str((summary or {}).get("model_version") or "v1"),
        confidence_score=0.8,
        snapshot_date=scan.completed_at or scan.created_at,
        created_at=scan.completed_at or scan.created_at,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return _build_snapshot_response(snapshot)


@router.get("/query", response_model=DigitalTwinQueryResponse)
async def query_digital_twin(
    start_at: Optional[datetime] = Query(None),
    end_at: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Query Digital Twin snapshots with filters."""
    query = db.query(SkinStateSnapshot).filter(SkinStateSnapshot.user_id == current_user.id)
    if start_at:
        query = query.filter(SkinStateSnapshot.snapshot_date >= start_at)
    if end_at:
        query = query.filter(SkinStateSnapshot.snapshot_date <= end_at)
    snapshots = query.order_by(SkinStateSnapshot.snapshot_date.desc()).limit(limit).all()
    latest = snapshots[0] if snapshots else None
    timeline = _build_timeline_response(current_user.id, snapshots)
    return DigitalTwinQueryResponse(
        user_id=str(current_user.id),
        latest_snapshot=_build_snapshot_response(latest) if latest else None,
        snapshots=[_build_snapshot_response(item) for item in snapshots],
        timeline=timeline,
        insights={"count": len(snapshots)},
    )


@router.get("/timeline", response_model=DigitalTwinTimelineResponse)
async def get_digital_twin_timeline(
    start_at: Optional[datetime] = Query(None),
    end_at: Optional[datetime] = Query(None),
    max_points: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Digital Twin timeline evolution."""
    query = db.query(SkinStateSnapshot).filter(SkinStateSnapshot.user_id == current_user.id)
    if start_at:
        query = query.filter(SkinStateSnapshot.snapshot_date >= start_at)
    if end_at:
        query = query.filter(SkinStateSnapshot.snapshot_date <= end_at)
    snapshots = (
        query.order_by(SkinStateSnapshot.snapshot_date.desc())
        .limit(max_points)
        .all()
    )
    return _build_timeline_response(current_user.id, snapshots)


@router.post("/simulate", response_model=ScenarioSimulationResponse)
async def simulate_scenario(request: ScenarioSimulationRequest):
    """Run what-if scenario simulation."""
    # TODO: Implement scenario simulation with DigitalTwinService
    raise HTTPException(status_code=501, detail="Scenario simulation - Coming soon in Sprint 3 Phase 2")


def _normalize_score(value: Optional[float], fallback: float = 0.5) -> float:
    if value is None:
        return fallback
    try:
        return max(0.0, min(float(value) / 100.0, 1.0))
    except (TypeError, ValueError):
        return fallback


def _build_state_vector(snapshot: SkinStateSnapshot) -> SkinStateVector:
    return SkinStateVector(
        hydration_level=_normalize_score(snapshot.hydration_level),
        oiliness_level=_normalize_score(snapshot.oil_level),
        sensitivity_level=_normalize_score(snapshot.sensitivity_score),
        barrier_impairment=_normalize_score(snapshot.redness_severity),
        inflammation_level=_normalize_score(snapshot.acne_severity),
        pigmentation_issues=_normalize_score(snapshot.pigmentation_severity),
        aging_signs=_normalize_score(snapshot.wrinkle_severity),
        congestion_level=_normalize_score(snapshot.acne_severity),
    )


def _build_snapshot_response(snapshot: SkinStateSnapshot) -> DigitalTwinSnapshot:
    regions = []
    if getattr(snapshot, "regions", None):
        for region in snapshot.regions:
            regions.append(
                RegionMetrics(
                    region_name=region.region_name,
                    bounding_box=region.bounding_box,
                    hydration_score=region.hydration_level,
                    oiliness_score=region.oil_level,
                    redness_score=region.redness_level,
                    pigmentation_score=region.pigmentation_level,
                    texture_score=region.texture_score,
                    acne_score=region.acne_severity,
                    sensitivity_score=region.sensitivity_score,
                    notes=None,
                )
            )

    overall_score = snapshot.overall_health_score or 0
    skin_mood = SkinMood.BALANCED if overall_score >= 70 else SkinMood.UNKNOWN
    image_url = None
    if getattr(snapshot, "scan_session", None) and snapshot.scan_session:
        image_url = snapshot.scan_session.image_url

    return DigitalTwinSnapshot(
        snapshot_id=str(snapshot.id),
        user_id=str(snapshot.user_id),
        created_at=snapshot.snapshot_date,
        skin_mood=skin_mood,
        regions=regions,
        environment=None,
        routine=None,
        global_state_vector=_build_state_vector(snapshot),
        image_id=str(snapshot.scan_session_id) if snapshot.scan_session_id else None,
        meta={"overall_score": overall_score, "image_url": image_url},
    )


def _build_timeline_response(
    user_id: int, snapshots: list[SkinStateSnapshot]
) -> DigitalTwinTimelineResponse:
    points = []
    for snapshot in sorted(snapshots, key=lambda s: s.snapshot_date):
        overall_score = snapshot.overall_health_score or 0
        skin_mood = SkinMood.BALANCED if overall_score >= 70 else SkinMood.UNKNOWN
        points.append(
            TimelinePoint(
                timestamp=snapshot.snapshot_date,
                snapshot_id=str(snapshot.id),
                skin_mood=skin_mood,
                overall_score=overall_score,
                state_vector=_build_state_vector(snapshot),
                markers=[],
            )
        )
    return DigitalTwinTimelineResponse(
        user_id=str(user_id),
        points=points,
        total_points=len(points),
        summary_insights={"latest_score": points[-1].overall_score if points else None},
    )
