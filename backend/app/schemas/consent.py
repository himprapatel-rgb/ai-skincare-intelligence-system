"""Consent and Privacy Policy Pydantic Schemas

SRS Traceability:
- BR12: Policies must be accepted before registration
- NFR6: GDPR compliance

Sprint: 1.2 - Story 1.9
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict
from uuid import UUID

class ConsentCreate(BaseModel):
    """Schema for creating/updating consent."""
    terms_accepted: bool = Field(..., description="Terms of Service accepted")
    privacy_accepted: bool = Field(..., description="Privacy Policy accepted")
    terms_version: str = Field(..., min_length=1, max_length=20)
    privacy_version: str = Field(..., min_length=1, max_length=20)
    ip_address: Optional[str] = Field(None, max_length=45)
    
    class Config:
        json_schema_extra = {
            "example": {
                "terms_accepted": True,
                "privacy_accepted": True,
                "terms_version": "1.0.0",
                "privacy_version": "1.0.0",
                "ip_address": "192.168.1.1"
            }
        }

class ConsentResponse(BaseModel):
    """Schema for consent response."""
    id: int
    user_id: int
    terms_accepted: bool
    privacy_accepted: bool
    terms_version: str
    privacy_version: str
    accepted_at: datetime
    
    class Config:
        from_attributes = True

class PolicyResponse(BaseModel):
    """Schema for current policy versions."""
    terms_of_service: Dict[str, str] = Field(
        ..., description="Current Terms of Service metadata"
    )
    privacy_policy: Dict[str, str] = Field(
        ..., description="Current Privacy Policy metadata"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "terms_of_service": {
                    "version": "1.0.0",
                    "effective_date": "2025-01-01T00:00:00Z",
                    "content_url": "/terms",
                    "summary": "Summary of ToS changes"
                },
                "privacy_policy": {
                    "version": "1.0.0",
                    "effective_date": "2025-01-01T00:00:00Z",
                    "content_url": "/privacy",
                    "summary": "Summary of Privacy changes"
                }
            }
        }
