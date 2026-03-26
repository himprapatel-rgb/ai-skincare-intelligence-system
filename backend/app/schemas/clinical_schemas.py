"""Pydantic schemas for Clinical Intelligence endpoints."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Skin Alerts ──────────────────────────────────────────────────────────────

class SkinAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    concern: str
    message: str
    recommendation: Optional[str] = None
    is_dismissed: bool
    scan_id: Optional[str] = None
    created_at: datetime
    dismissed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SkinAlertListResponse(BaseModel):
    data: list[SkinAlertResponse]
    total: int


# ── Derm Reports ─────────────────────────────────────────────────────────────

class DermReportResponse(BaseModel):
    id: int
    scan_ids: list[str]
    report_data: dict[str, Any]
    share_token: Optional[str] = None
    share_expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ShareReportRequest(BaseModel):
    report_id: int


class ShareReportResponse(BaseModel):
    share_token: str
    share_url: str
    expires_at: datetime


# ── Ingredient Interactions ──────────────────────────────────────────────────

class IngredientInteractionItem(BaseModel):
    ingredient_a: str
    ingredient_b: str
    interaction_type: str
    severity: str
    description: str

    model_config = {"from_attributes": True}


class IngredientCheckRequest(BaseModel):
    ingredients: list[str] = Field(..., min_length=1, max_length=50)


class IngredientCheckResponse(BaseModel):
    conflicts: list[IngredientInteractionItem]
    warnings: list[IngredientInteractionItem]
    synergies: list[IngredientInteractionItem]
    total_checked: int
    safe: bool


# ── Trend Analysis ───────────────────────────────────────────────────────────

class TrendDataPoint(BaseModel):
    date: str
    overall_score: Optional[float] = None
    concerns: Optional[dict[str, Any]] = None


class TrendAnalysis(BaseModel):
    data_points: list[TrendDataPoint]
    period_days: int
    trend_direction: str  # improving / declining / stable
    average_score: Optional[float] = None
    score_change: Optional[float] = None
    insights: list[str]


# ── Benchmark ────────────────────────────────────────────────────────────────

class BenchmarkResponse(BaseModel):
    overall_percentile: Optional[float] = None
    category_percentiles: dict[str, float]
    total_users_compared: int
    skin_type: Optional[str] = None
    age_group: Optional[str] = None
    insights: list[str]


# ── Longitudinal Report ──────────────────────────────────────────────────────

class LongitudinalReport(BaseModel):
    user_id: int
    period_start: datetime
    period_end: datetime
    scan_count: int
    trend: TrendAnalysis
    alerts: list[SkinAlertResponse]
    benchmark: BenchmarkResponse
