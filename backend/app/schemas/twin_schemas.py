# twin_schemas.py

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, conint, confloat

# ---------------------------------------------------------------------------
# Core Enums
# ---------------------------------------------------------------------------

class RegionName(str, Enum):
    """Canonical names for facial/body regions that the Digital Twin understands."""
    FULL_FACE = "full_face"
    FOREHEAD = "forehead"
    LEFT_CHEEK = "left_cheek"
    RIGHT_CHEEK = "right_cheek"
    NOSE = "nose"
    CHIN = "chin"
    EYE_AREA = "eye_area"
    LIP_AREA = "lip_area"
    NECK = "neck"
    UPPER_BACK = "upper_back"
    OTHER = "other"

class SkinMood(str, Enum):
    """High-level emotional/qualitative state of the skin."""
    HAPPY = "happy"
    BALANCED = "balanced"
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"
    STRESSED = "stressed"
    IRRITATED = "irritated"
    BREAKOUT_PRONE = "breakout_prone"
    RECOVERING = "recovering"
    AGGRAVATED = "aggravated"
    UNKNOWN = "unknown"

# ---------------------------------------------------------------------------
# Low-level geometry & metrics
# ---------------------------------------------------------------------------

class BoundingBox(BaseModel):
    """Normalized bounding box for a region."""
    x: confloat(ge=0.0, le=1.0) = Field(..., description="X coordinate (left) of the top-left corner, normalized 0–1.")
    y: confloat(ge=0.0, le=1.0) = Field(..., description="Y coordinate (top) of the top-left corner, normalized 0–1.")
    width: confloat(ge=0.0, le=1.0) = Field(..., description="Width of the box, normalized 0–1.")
    height: confloat(ge=0.0, le=1.0) = Field(..., description="Height of the box, normalized 0–1.")

class RegionMetrics(BaseModel):
    """Quantitative metrics for a single skin region at a point in time."""
    region_name: RegionName = Field(..., description="Which part of the face/body.")
    bounding_box: Optional[BoundingBox] = Field(None, description="Bounding box for the region in the original image coordinates.")
    overall_score: Optional[confloat(ge=0.0, le=100.0)] = Field(None, description="Aggregate health score (0–100) for this region.")
    hydration_score: Optional[confloat(ge=0.0, le=100.0)] = None
    oiliness_score: Optional[confloat(ge=0.0, le=100.0)] = None
    redness_score: Optional[confloat(ge=0.0, le=100.0)] = None
    pigmentation_score: Optional[confloat(ge=0.0, le=100.0)] = None
    texture_score: Optional[confloat(ge=0.0, le=100.0)] = None
    pores_score: Optional[confloat(ge=0.0, le=100.0)] = None
    acne_score: Optional[confloat(ge=0.0, le=100.0)] = None
    sensitivity_score: Optional[confloat(ge=0.0, le=100.0)] = None
    flags: List[str] = Field(default_factory=list, description="Short machine-readable tags such as 'dry_patches', 'active_acne'.")
    notes: Optional[str] = Field(None, description="Optional human-readable notes or explanation for this region.")

    class Config:
        orm_mode = True
        use_enum_values = True

# ---------------------------------------------------------------------------
# Context models
# ---------------------------------------------------------------------------

class EnvironmentContext(BaseModel):
    local_datetime: Optional[datetime] = None
    timezone: Optional[str] = None
    indoor: Optional[bool] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[confloat(ge=0.0, le=100.0)] = None
    uv_index: Optional[confloat(ge=0.0)] = None
    class Config:
        orm_mode = True

class RoutineContext(BaseModel):
    last_routine_at: Optional[datetime] = None
    products_used: List[str] = Field(default_factory=list)
    actives_present: List[str] = Field(default_factory=list)
    spf_used: Optional[bool] = None
    average_sleep_hours: Optional[confloat(ge=0.0, le=24.0)] = None
    class Config:
        orm_mode = True

class SkinStateVector(BaseModel):
    hydration_level: confloat(ge=0.0, le=1.0) = Field(...)
    oiliness_level: confloat(ge=0.0, le=1.0) = Field(...)
    sensitivity_level: confloat(ge=0.0, le=1.0) = Field(...)
    barrier_impairment: confloat(ge=0.0, le=1.0) = Field(...)
    inflammation_level: confloat(ge=0.0, le=1.0) = Field(...)
    pigmentation_issues: confloat(ge=0.0, le=1.0) = Field(...)
    aging_signs: confloat(ge=0.0, le=1.0) = Field(...)
    congestion_level: confloat(ge=0.0, le=1.0) = Field(...)
    class Config:
        orm_mode = True
        use_enum_values = True

class DigitalTwinSnapshot(BaseModel):
    snapshot_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    skin_mood: SkinMood = SkinMood.UNKNOWN
    regions: List[RegionMetrics] = Field(default_factory=list)
    environment: Optional[EnvironmentContext] = None
    routine: Optional[RoutineContext] = None
    global_state_vector: SkinStateVector
    image_id: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    class Config:
        orm_mode = True
        use_enum_values = True

class TimelinePoint(BaseModel):
    timestamp: datetime
    snapshot_id: Optional[str] = None
    skin_mood: Optional[SkinMood] = None
    overall_score: Optional[confloat(ge=0.0, le=100.0)] = None
    state_vector: Optional[SkinStateVector] = None
    markers: List[str] = Field(default_factory=list)
    class Config:
        orm_mode = True
        use_enum_values = True

class DigitalTwinTimelineResponse(BaseModel):
    user_id: str
    points: List[TimelinePoint] = Field(default_factory=list)
    total_points: int
    summary_insights: Dict[str, Any] = Field(default_factory=dict)
    class Config:
        orm_mode = True
        use_enum_values = True

class DigitalTwinQueryResponse(BaseModel):
    user_id: str
    latest_snapshot: Optional[DigitalTwinSnapshot] = None
    snapshots: List[DigitalTwinSnapshot] = Field(default_factory=list)
    timeline: Optional[DigitalTwinTimelineResponse] = None
    insights: Dict[str, Any] = Field(default_factory=dict)
    class Config:
        orm_mode = True
        use_enum_values = True

class ScenarioChanges(BaseModel):
    updated_environment: Optional[EnvironmentContext] = None
    updated_routine: Optional[RoutineContext] = None
    target_skin_mood: Optional[SkinMood] = None
    state_vector_overrides: Dict[str, float] = Field(default_factory=dict)
    class Config:
        orm_mode = True
        use_enum_values = True

class ScenarioSimulationRequest(BaseModel):
    user_id: str
    base_snapshot_id: Optional[str] = None
    changes: ScenarioChanges
    horizon_days: conint(ge=1, le=365) = 30
    include_timeline: bool = True
    class Config:
        orm_mode = True
        use_enum_values = True

class ScenarioSimulationResponse(BaseModel):
    scenario_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    request: ScenarioSimulationRequest
    simulated_timeline: Optional[DigitalTwinTimelineResponse] = None
    expected_final_state: Optional[SkinStateVector] = None
    expected_final_mood: Optional[SkinMood] = None
    insights: Dict[str, Any] = Field(default_factory=dict)
    class Config:
        orm_mode = True
        use_enum_values = True
