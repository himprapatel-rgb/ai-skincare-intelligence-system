"""User Profile Pydantic Schemas - Comprehensive Profile Management

SRS Traceability:
- UR1: Create account, define goals, and specify primary concerns
- FR46: Profile management
- NFR4: AES-256 encryption for sensitive data
- US-401 to US-404: User profile dashboard requirements

Sprint: 1.2 - Story 1.2, 1.6
"""
import re
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ProfileCreate(BaseModel):
    """Schema for creating baseline user profile during onboarding."""
    # Basic required fields for onboarding
    goals: List[str] = Field(
        ..., min_length=1, max_length=5,
        description="User skincare goals (1-5 selections)"
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
        if not (1 <= len(v) <= 5):
            raise ValueError('Goals must be 1-5 selections')
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
    """Schema for updating user profile with all 30+ fields."""
    
    # ===== PERSONAL INFORMATION =====
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, description="male, female, non-binary, prefer-not-to-say")
    location: Optional[str] = Field(None, max_length=255)
    timezone: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    profile_photo_url: Optional[str] = Field(None, max_length=500)

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        if not re.match(r'^\+?[\d\s\-().]{7,20}$', v.strip()):
            raise ValueError('Invalid phone number format')
        return v.strip()
    
    # ===== SKIN PROFILE =====
    skin_type: Optional[str] = None
    skin_tone: Optional[str] = Field(None, description="fair, light, medium, olive, tan, deep")
    skin_texture: Optional[str] = Field(None, description="smooth, rough, bumpy, uneven")
    pore_size: Optional[str] = Field(None, description="small, medium, large")
    moisture_level: Optional[str] = Field(None, description="low, normal, high")
    oil_production: Optional[str] = Field(None, description="low, normal, high")
    sensitivity_level: Optional[str] = Field(None, description="low, medium, high")
    primary_concern: Optional[str] = None
    secondary_concerns: Optional[List[str]] = None
    
    # ===== LIFESTYLE & ENVIRONMENTAL =====
    sun_exposure: Optional[str] = Field(None, description="minimal, moderate, frequent")
    outdoor_activity_level: Optional[str] = Field(None, description="low, moderate, high")
    water_intake: Optional[int] = Field(None, ge=0, le=20, description="glasses per day")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="average hours")
    diet_type: Optional[str] = None
    stress_level: Optional[str] = Field(None, description="low, moderate, high")
    exercise_frequency: Optional[str] = None
    smoking_status: Optional[str] = Field(None, description="never, former, current")
    alcohol_consumption: Optional[str] = Field(None, description="none, occasional, moderate, frequent")
    climate: Optional[str] = None
    
    # ===== MEDICAL & HISTORY =====
    known_allergies: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    skin_conditions: Optional[List[str]] = None
    previous_treatments: Optional[str] = None
    
    # ===== PREFERENCES =====
    preferred_ingredients: Optional[List[str]] = None
    ingredients_to_avoid: Optional[List[str]] = None
    product_texture_preference: Optional[str] = Field(None, description="gel, cream, serum, oil, lotion")
    fragrance_preference: Optional[str] = Field(None, description="fragrance-free, light, any")
    budget_range: Optional[str] = Field(None, description="budget, mid-range, premium, luxury")
    brand_preferences: Optional[List[str]] = None
    
    # ===== SKINCARE ROUTINE =====
    routine_frequency: Optional[str] = None
    current_routine_products: Optional[List[str]] = None
    
    # ===== GOALS =====
    goals: Optional[List[str]] = Field(None, min_length=1, max_length=5)
    concerns: Optional[List[str]] = Field(None, min_length=1, max_length=5)
    
    # ===== NOTIFICATION PREFERENCES =====
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    
    # ===== PRIVACY SETTINGS =====
    profile_visibility: Optional[str] = Field(None, description="private, friends, public")
    share_progress: Optional[bool] = None
    allow_data_analysis: Optional[bool] = None

    @field_validator('goals')
    @classmethod
    def validate_goals(cls, v):
        if v and not (1 <= len(v) <= 5):
            raise ValueError('Goals must be 1-5 selections')
        return v

    @field_validator('concerns')
    @classmethod
    def validate_concerns(cls, v):
        if v and not (1 <= len(v) <= 5):
            raise ValueError('Concerns must be 1-5 selections')
        return v


class ProfileResponse(BaseModel):
    """Schema for comprehensive profile response."""
    id: int
    user_id: int
    
    # Personal Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    phone_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    
    # Skin Profile
    skin_type: Optional[str] = None
    skin_tone: Optional[str] = None
    skin_texture: Optional[str] = None
    pore_size: Optional[str] = None
    moisture_level: Optional[str] = None
    oil_production: Optional[str] = None
    sensitivity_level: Optional[str] = None
    primary_concern: Optional[str] = None
    secondary_concerns: Optional[List[str]] = None
    
    # Lifestyle & Environmental
    sun_exposure: Optional[str] = None
    outdoor_activity_level: Optional[str] = None
    water_intake: Optional[int] = None
    sleep_hours: Optional[float] = None
    diet_type: Optional[str] = None
    stress_level: Optional[str] = None
    exercise_frequency: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    climate: Optional[str] = None
    
    # Medical & History
    known_allergies: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    skin_conditions: Optional[List[str]] = None
    previous_treatments: Optional[str] = None
    
    # Preferences
    preferred_ingredients: Optional[List[str]] = None
    ingredients_to_avoid: Optional[List[str]] = None
    product_texture_preference: Optional[str] = None
    fragrance_preference: Optional[str] = None
    budget_range: Optional[str] = None
    brand_preferences: Optional[List[str]] = None
    
    # Skincare Routine
    routine_frequency: Optional[str] = None
    current_routine_products: Optional[List[str]] = None
    
    # Goals
    goals: Optional[List[str]] = None
    concerns: Optional[List[str]] = None
    
    # Notification Preferences
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    marketing_emails: bool = False
    
    # Privacy Settings
    profile_visibility: str = "private"
    share_progress: bool = False
    allow_data_analysis: bool = True
    
    # Metadata
    profile_complete: bool = False
    completion_percentage: int = 0
    last_profile_update: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
