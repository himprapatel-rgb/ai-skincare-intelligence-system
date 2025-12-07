"""Digital Twin Pydantic Schemas for Sprint 3

Request/Response schemas for Digital Twin Engine API endpoints.
Complies with SRS V5 Enhanced FR1-FR5, UR3, EPIC 3.
"""

from pydantic import BaseModel, Field, UUID4, validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class SkinMoodEnum(str, Enum):
    """Skin Mood Index classification"""
    BALANCED = "balanced"
    INFLAMED = "inflamed"
    OVER_EXFOLIATED = "over_exfoliated"
    BARRIER_STRESSED = "barrier_stressed"
    UV_OVEREXPOSED = "uv_overexposed"
    DEHYDRATED = "dehydrated"
    DULL = "dull"


class RegionEnum(str, Enum):
    """Facial regions for localized analysis"""
    FOREHEAD = "forehead"
    LEFT_CHEEK = "left_cheek"
    RIGHT_CHEEK = "right_cheek"
    NOSE = "nose"
    CHIN = "chin"
    UNDER_EYE_LEFT = "under_eye_left"
    UNDER_EYE_RIGHT = "under_eye_right"


# State Vector Schema
class StateVector(BaseModel):
    """9-dimensional skin state vector"""
    texture_score: float = Field(..., ge=0.0, le=100.0, description="Skin texture quality (0-100)")
    pore_score: float = Field(..., ge=0.0, le=100.0, description="Pore visibility (0-100)")
    redness_index: float = Field(..., ge=0.0, le=100.0, description="Redness level (0-100)")
    pigmentation_index: float = Field(..., ge=0.0, le=100.0, description="Hyperpigmentation severity (0-100)")
    oil_balance: float = Field(..., ge=0.0, le=100.0, description="Sebum production (0-100)")
    hydration_index: float = Field(..., ge=0.0, le=100.0, description="Hydration level (0-100)")
    sensitivity_index: float = Field(..., ge=0.0, le=100.0, description="Sensitivity (0-100)")
    barrier_risk_score: float = Field(..., ge=0.0, le=100.0, description="Barrier health (0-100)")
    microbiome_risk_proxy: float = Field(..., ge=0.0, le=100.0, description="Microbiome disruption (0-100)")

    class Config:
        schema_extra = {
            "example": {
                "texture_score": 75.5,
                "pore_score": 45.2,
                "redness_index": 30.1,
                "pigmentation_index": 55.8,
                "oil_balance": 60.0,
                "hydration_index": 70.5,
                "sensitivity_index": 25.3,
                "barrier_risk_score": 40.0,
                "microbiome_risk_proxy": 35.2
            }
        }


class RegionalProfile(BaseModel):
    """Regional sub-profile for specific facial zone"""
    region: RegionEnum
    state_vector: StateVector
    concerns: List[str] = Field(default_factory=list, description="Primary concerns in this region")
    severity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Overall severity in region")


# Digital Twin Response Schemas
class DigitalTwinBase(BaseModel):
    """Base Digital Twin data"""
    texture_score: float = Field(..., ge=0.0, le=100.0)
    pore_score: float = Field(..., ge=0.0, le=100.0)
    redness_index: float = Field(..., ge=0.0, le=100.0)
    pigmentation_index: float = Field(..., ge=0.0, le=100.0)
    oil_balance: float = Field(..., ge=0.0, le=100.0)
    hydration_index: float = Field(..., ge=0.0, le=100.0)
    sensitivity_index: float = Field(..., ge=0.0, le=100.0)
    barrier_risk_score: float = Field(..., ge=0.0, le=100.0)
    microbiome_risk_proxy: float = Field(..., ge=0.0, le=100.0)


class DigitalTwinResponse(DigitalTwinBase):
    """Complete Digital Twin response with metadata"""
    id: UUID4
    user_id: int
    regional_profiles: Dict[str, Any] = Field(default_factory=dict, description="Regional breakdown")
    skin_mood: Optional[SkinMoodEnum] = Field(None, description="Current skin mood classification")
    last_scan_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": 1,
                "texture_score": 75.5,
                "pore_score": 45.2,
                "redness_index": 30.1,
                "pigmentation_index": 55.8,
                "oil_balance": 60.0,
                "hydration_index": 70.5,
                "sensitivity_index": 25.3,
                "barrier_risk_score": 40.0,
                "microbiome_risk_proxy": 35.2,
                "skin_mood": "balanced",
                "regional_profiles": {},
                "last_scan_id": "650e8400-e29b-41d4-a716-446655440001",
                "created_at": "2025-12-07T20:00:00Z",
                "updated_at": "2025-12-07T20:00:00Z"
            }
        }


class DigitalTwinUpdate(BaseModel):
    """Update Digital Twin state after new scan"""
    scan_id: UUID4
    state_vector: StateVector
    regional_profiles: Optional[List[RegionalProfile]] = None
    environment_data: Optional[Dict[str, Any]] = None
    active_products: Optional[List[UUID4]] = None


class TwinSnapshotResponse(BaseModel):
    """Historical snapshot response"""
    id: UUID4
    twin_id: UUID4
    scan_id: Optional[UUID4]
    state_vector: Dict[str, float]
    environment_data: Optional[Dict[str, Any]]
    active_products: Optional[List[UUID4]]
    change_from_previous: Optional[Dict[str, float]]
    created_at: datetime

    class Config:
        orm_mode = True


class TwinTimelineRequest(BaseModel):
    """Request for Digital Twin timeline"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    concerns: Optional[List[str]] = None
    regions: Optional[List[RegionEnum]] = None


class TwinTimelineResponse(BaseModel):
    """Timeline of Digital Twin evolution"""
    twin_id: UUID4
    snapshots: List[TwinSnapshotResponse]
    total_scans: int
    date_range: Dict[str, datetime]
    trend_analysis: Dict[str, Any] = Field(default_factory=dict)


class TwinQueryRequest(BaseModel):
    """Query Digital Twin state at specific time or condition"""
    timestamp: Optional[datetime] = None
    scan_id: Optional[UUID4] = None
    comparison_scan_id: Optional[UUID4] = None


class TwinComparisonResponse(BaseModel):
    """Compare two Digital Twin states"""
    baseline_snapshot: TwinSnapshotResponse
    current_snapshot: TwinSnapshotResponse
    changes: Dict[str, float]
    improvements: List[str]
    regressions: List[str]
    stable_metrics: List[str]
    overall_trend: str  # "improving", "stable", "declining"
