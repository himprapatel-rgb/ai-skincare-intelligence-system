"""Digital Twin API Router for Sprint 3."""
import json
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.digital_twin import SkinStateSnapshot
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
    query = db.query(ScanSession).filter(
        ScanSession.user_id == current_user.id,
        ScanSession.status == "completed",
    )
    if start_at:
        query = query.filter(ScanSession.created_at >= start_at)
    if end_at:
        query = query.filter(ScanSession.created_at <= end_at)
    scans = query.order_by(ScanSession.created_at.desc()).limit(limit).all()
    scans_by_latest = sorted(
        scans, key=lambda scan: scan.completed_at or scan.created_at, reverse=True
    )
    latest_scan = scans_by_latest[0] if scans_by_latest else None
    timeline = _build_timeline_from_scans(current_user.id, scans)
    insights = {
        "snapshot_count": len(scans_by_latest),
        **(timeline.summary_insights or {}),
    }
    return DigitalTwinQueryResponse(
        user_id=str(current_user.id),
        latest_snapshot=_build_snapshot_from_scan(latest_scan) if latest_scan else None,
        snapshots=[_build_snapshot_from_scan(item) for item in scans_by_latest],
        timeline=timeline,
        insights=insights,
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
    query = db.query(ScanSession).filter(
        ScanSession.user_id == current_user.id,
        ScanSession.status == "completed",
    )
    if start_at:
        query = query.filter(ScanSession.created_at >= start_at)
    if end_at:
        query = query.filter(ScanSession.created_at <= end_at)
    scans = (
        query.order_by(ScanSession.created_at.desc())
        .limit(max_points)
        .all()
    )
    return _build_timeline_from_scans(current_user.id, scans)


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


def _parse_scan_payload(scan: ScanSession) -> Dict[str, Any]:
    payload = scan.scan_metadata
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            return {}
    return payload if isinstance(payload, dict) else {}


def _extract_scan_summary(scan: ScanSession) -> tuple[Dict[str, Any], Dict[str, float], list[str]]:
    payload = _parse_scan_payload(scan)
    summary: Dict[str, Any] = {}
    concerns: list[str] = []
    scores: Dict[str, float] = {}

    root_summary = payload.get("summary") if isinstance(payload, dict) else None
    result = payload.get("result") if isinstance(payload, dict) else None
    if isinstance(result, dict):
        result_summary = result.get("summary")
        analysis = result.get("analysis") if isinstance(result.get("analysis"), dict) else None
        analysis_summary = analysis.get("summary") if isinstance(analysis, dict) else None
        summary = (
            result_summary if isinstance(result_summary, dict)
            else analysis_summary if isinstance(analysis_summary, dict)
            else summary
        )
    if not summary and isinstance(root_summary, dict):
        summary = root_summary

    if isinstance(summary.get("scores"), dict):
        for key, value in summary.get("scores", {}).items():
            if isinstance(value, (int, float)):
                scores[key] = float(value)

    raw_concerns = summary.get("concerns")
    if isinstance(raw_concerns, list):
        concerns = [item for item in raw_concerns if isinstance(item, str)]

    return summary, scores, concerns


def _get_score(scores: Dict[str, float], keys: list[str], fallback: Optional[float] = None) -> Optional[float]:
    for key in keys:
        value = scores.get(key)
        if isinstance(value, (int, float)):
            return float(value)
    return fallback


def _derive_overall_score(summary: Dict[str, Any], scores: Dict[str, float]) -> float:
    if isinstance(summary.get("overall_score"), (int, float)):
        return float(summary.get("overall_score"))
    if scores:
        return sum(scores.values()) / len(scores)
    return 0.0


def _derive_skin_mood(payload: Dict[str, Any], overall_score: float) -> SkinMood:
    mood = payload.get("skin_mood")
    if isinstance(mood, str):
        try:
            return SkinMood(mood)
        except ValueError:
            pass
    if overall_score >= 80:
        return SkinMood.HAPPY
    if overall_score >= 65:
        return SkinMood.BALANCED
    if overall_score >= 45:
        return SkinMood.SENSITIVE
    return SkinMood.UNKNOWN


def _build_state_vector_from_scores(scores: Dict[str, float]) -> SkinStateVector:
    hydration = _get_score(scores, ["hydration", "moisture"], None)
    dehydration = _get_score(scores, ["dehydration"], None)
    hydration_score = hydration if hydration is not None else (100.0 - dehydration) if dehydration is not None else 50.0

    oiliness_score = _get_score(scores, ["oiliness", "oil"], 50.0)
    sensitivity_score = _get_score(scores, ["sensitivity"], 50.0)
    redness_score = _get_score(scores, ["redness"], 50.0)
    pigmentation_score = _get_score(scores, ["pigmentation", "age_spot"], 50.0)
    wrinkle_score = _get_score(scores, ["wrinkles", "wrinkle"], 50.0)
    acne_score = _get_score(scores, ["acne"], 50.0)
    pores_score = _get_score(scores, ["pores"], 50.0)

    return SkinStateVector(
        hydration_level=_normalize_score(hydration_score),
        oiliness_level=_normalize_score(oiliness_score),
        sensitivity_level=_normalize_score(sensitivity_score),
        barrier_impairment=_normalize_score(redness_score),
        inflammation_level=_normalize_score(acne_score),
        pigmentation_issues=_normalize_score(pigmentation_score),
        aging_signs=_normalize_score(wrinkle_score),
        congestion_level=_normalize_score(pores_score),
    )


def _build_snapshot_from_scan(scan: ScanSession) -> DigitalTwinSnapshot:
    summary, scores, concerns = _extract_scan_summary(scan)
    overall_score = _derive_overall_score(summary, scores)
    payload = _parse_scan_payload(scan)

    image_url = None
    if isinstance(summary.get("image_url"), str):
        image_url = summary.get("image_url")
    elif isinstance(scan.image_url, str):
        image_url = scan.image_url

    return DigitalTwinSnapshot(
        snapshot_id=str(scan.id),
        user_id=str(scan.user_id),
        created_at=scan.completed_at or scan.created_at,
        skin_mood=_derive_skin_mood(payload, overall_score),
        regions=[],
        environment=None,
        routine=None,
        global_state_vector=_build_state_vector_from_scores(scores),
        image_id=str(scan.id),
        meta={
            "overall_score": overall_score,
            "image_url": image_url,
            "concerns": concerns,
            "score_count": len(scores),
        },
    )


def _build_timeline_from_scans(user_id: int, scans: list[ScanSession]) -> DigitalTwinTimelineResponse:
    points = []
    ordered = sorted(scans, key=lambda scan: scan.completed_at or scan.created_at)
    for scan in ordered:
        summary, scores, _concerns = _extract_scan_summary(scan)
        overall_score = _derive_overall_score(summary, scores)
        state_vector = _build_state_vector_from_scores(scores)
        payload = _parse_scan_payload(scan)
        points.append(
            TimelinePoint(
                timestamp=scan.completed_at or scan.created_at,
                snapshot_id=str(scan.id),
                skin_mood=_derive_skin_mood(payload, overall_score),
                overall_score=overall_score,
                state_vector=state_vector,
                markers=[],
            )
        )
    summary_insights = _build_summary_insights(points, ordered)
    return DigitalTwinTimelineResponse(
        user_id=str(user_id),
        points=points,
        total_points=len(points),
        summary_insights=summary_insights,
    )


def _build_summary_insights(points: list[TimelinePoint], scans: list[ScanSession]) -> Dict[str, Any]:
    if not points:
        return {
            "latest_score": None,
            "trend": "stable",
            "delta_score": 0,
            "best_improvement": None,
            "top_concern": None,
        }

    latest_score = points[-1].overall_score or 0
    first_score = points[0].overall_score or 0
    delta_score = latest_score - first_score
    trend = "stable"
    if delta_score > 2:
        trend = "improving"
    elif delta_score < -2:
        trend = "declining"

    best_improvement = _find_best_improvement(scans)
    top_concern = _find_top_concern(scans[-1] if scans else None)

    return {
        "latest_score": latest_score,
        "trend": trend,
        "delta_score": delta_score,
        "best_improvement": best_improvement,
        "top_concern": top_concern,
    }


def _find_best_improvement(scans: list[ScanSession]) -> Optional[str]:
    if len(scans) < 2:
        return None
    oldest = scans[0]
    newest = scans[-1]
    _summary_old, scores_old, _ = _extract_scan_summary(oldest)
    _summary_new, scores_new, _ = _extract_scan_summary(newest)
    concern_keys = [
        "acne",
        "redness",
        "pigmentation",
        "dehydration",
        "sensitivity",
        "wrinkles",
        "pores",
        "dark_circles",
        "texture",
        "oiliness",
    ]
    best_key = None
    best_delta = 0.0
    for key in concern_keys:
        if key in scores_old and key in scores_new:
            delta = float(scores_old[key]) - float(scores_new[key])
            if delta > best_delta:
                best_delta = delta
                best_key = key
    if not best_key:
        return None
    return best_key.replace("_", " ").title()


def _find_top_concern(scan: Optional[ScanSession]) -> Optional[str]:
    if not scan:
        return None
    _summary, scores, concerns = _extract_scan_summary(scan)
    if concerns:
        return concerns[0].replace("_", " ").title()
    if not scores:
        return None
    concern_scores = {key: value for key, value in scores.items()}
    top_key = max(concern_scores, key=concern_scores.get)
    return top_key.replace("_", " ").title()


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
