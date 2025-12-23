"""User Profile Pydantic Schemas

SRS Traceability:
- UR1: Create account, define goals, and specify primary concerns
- FR46: Profile management
- NFR4: AES-256 encryption for sensitive data

Sprint: 1.2 - Story 1.2, 1.6
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List, Optional

class ProfileCreate(BaseModel):
    """Schema for creating baseline user profile during onboarding."""
    goals: List[str] = Field(
        ..., min_length=1, max_length=3,
        description="User skincare goals (1-3 selections)"
    )
    concerns: List[str] = Field(
        ..., min_length=1, max_length=5,
        description="Primary skin concerns (1-5 selections)"
    )
    skin_type: str = Field(
        ..., description="Skin type: oily, dry, combination, sensitive, normal"
    )
    routine_frequency: str = Field(
        ..., description="Current routine frequency"
    )
    climate: str = Field(
        ..., description="Climate zone"
    )
    
    @field_validator('goals')
    @classmethod
    def validate_goals(cls, v):
        if not (1 <= len(v) <= 3):
            raise ValueError('Goals must be 1-3 selections')
        return v
    
    @field_validator('concerns')
    @classmethod
    def validate_concerns(cls, v):
        if not (1 <= len(v) <= 5):
            raise ValueError('Concerns must be 1-5 selections')
        return v
    
    @field_validator('skin_type')
    @classmethod
    def validate_skin_type(cls, v):
        valid_types = ['oily', 'dry', 'combination', 'sensitive', 'normal']
        if v.lower() not in valid_types:
            raise ValueError(f'Skin type must be one of: {valid_types}')
        return v.lower()
    
    class Config:
        json_schema_extra = {
            "example": {
                "goals": ["anti_aging", "hydration"],
                "concerns": ["fine_lines", "dryness"],
                "skin_type": "combination",
                "routine_frequency": "twice_daily",
                "climate": "temperate"
            }
        }

class ProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    goals: Optional[List[str]] = Field(
        None, min_length=1, max_length=3
    )
    concerns: Optional[List[str]] = Field(
        None, min_length=1, max_length=5
    )
    skin_type: Optional[str] = None
    routine_frequency: Optional[str] = None
    climate: Optional[str] = None
    
    @field_validator('goals')
    @classmethod
    def validate_goals(cls, v):
        if v and not (1 <= len(v) <= 3):
            raise ValueError('Goals must be 1-3 selections')
        return v
    
    @field_validator('concerns')
    @classmethod
    def validate_concerns(cls, v):
        if v and not (1 <= len(v) <= 5):
            raise ValueError('Concerns must be 1-5 selections')
        return v

class ProfileResponse(BaseModel):
    """Schema for profile response."""
    id: int
    user_id: int
    goals: List[str]
    concerns: List[str]
    skin_type: str
    routine_frequency: str
    climate: str
    profile_complete: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
