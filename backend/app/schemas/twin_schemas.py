"""Sprint 3: Digital Twin Schemas"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SkinStateResponse(BaseModel):
    id: UUID
    user_id: int
    overall_health_score: float
    hydration_level: float
    snapshot_date: datetime
    
    class Config:
        from_attributes = True

class TimelineQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
