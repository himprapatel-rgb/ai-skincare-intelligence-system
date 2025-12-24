from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime

# Shared properties
class SkinAnalysisBase(BaseModel):
    skin_type: str = Field(..., example="Combination")
    concerns: List[str] = Field(..., example=["Acne", "Hyperpigmentation"])
    confidence_score: float = Field(..., ge=0, le=1.0)

# Properties to return to the client
class AnalysisResponse(SkinAnalysisBase):
    id: int
    user_id: int
    image_url: str
    created_at: datetime
    
    class Config:
        from_attributes = True  # Allows compatibility with SQLAlchemy models

# Schema for Recommendation Engine input
class RecommendationRequest(BaseModel):
    analysis_id: int
    preferences: Optional[List[str]] = ["Vegan", "Fragrance-Free"]