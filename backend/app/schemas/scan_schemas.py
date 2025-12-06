"""Sprint 2: Pydantic Schemas for Face Scan & AI Analysis

Request and Response schemas for scan API endpoints.
Designed for GitHub Pages frontend + Railway backend architecture.

Status: Phase 1 Implementation - Foundation Layer
Created: December 6, 2025
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class ScanStatusEnum(str, Enum):
    """Scan processing status"""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class SkinTypeEnum(str, Enum):
    """Skin type classification"""
    normal = "normal"
    dry = "dry"
    oily = "oily"
    combination = "combination"
    sensitive = "sensitive"


class SeverityEnum(str, Enum):
    """Concern severity levels"""
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


# Request Schemas
class ScanInitRequest(BaseModel):
    """Request to initialize a new scan session"""
    device_type: str = Field(..., description="Device type: web, ios, android")
    camera_info: Optional[Dict[str, Any]] = Field(None, description="Camera metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "device_type": "web",
                "camera_info": {"resolution": "1920x1080", "browser": "Chrome"}
            }
        }


class ImageUploadRequest(BaseModel):
    """Request for image upload validation"""
    mime_type: str = Field(..., description="Image MIME type")
    file_size: int = Field(..., description="File size in bytes", gt=0, le=10485760)  # Max 10MB

    @validator('mime_type')
    def validate_mime_type(cls, v):
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if v not in allowed_types:
            raise ValueError(f'MIME type must be one of {allowed_types}')
        return v


# Response Schemas
class ScanSessionResponse(BaseModel):
    """Response after scan session initialization"""
    scan_id: UUID = Field(..., description="Unique scan session ID")
    status: ScanStatusEnum = Field(..., description="Current scan status")
    upload_url: Optional[str] = Field(None, description="Presigned URL for image upload")
    expires_at: datetime = Field(..., description="Upload URL expiration time")
    created_at: datetime = Field(..., description="Session creation timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "scan_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "pending",
                "upload_url": "https://storage.example.com/upload/...",
                "expires_at": "2025-12-06T13:00:00Z",
                "created_at": "2025-12-06T12:00:00Z"
            }
        }


class DetectedConcern(BaseModel):
    """Individual skin concern detection"""
    concern_type: str = Field(..., description="Type of skin concern")
    severity: SeverityEnum = Field(..., description="Severity level")
    confidence: float = Field(..., description="Detection confidence (0.0-1.0)", ge=0.0, le=1.0)
    affected_areas: List[str] = Field(..., description="Facial areas affected")
    recommendations: Optional[List[str]] = Field(None, description="Treatment recommendations")

    class Config:
        json_schema_extra = {
            "example": {
                "concern_type": "acne",
                "severity": "moderate",
                "confidence": 0.87,
                "affected_areas": ["forehead", "chin"],
                "recommendations": ["Use salicylic acid cleanser", "Apply spot treatment"]
            }
        }


class AnalysisResponse(BaseModel):
    """Complete analysis results response"""
    scan_id: UUID = Field(..., description="Scan session ID")
    status: ScanStatusEnum = Field(..., description="Analysis status")
    skin_type: Optional[SkinTypeEnum] = Field(None, description="Detected skin type")
    fitzpatrick_scale: Optional[int] = Field(None, description="Fitzpatrick scale (1-6)", ge=1, le=6)
    concerns: List[DetectedConcern] = Field(default_factory=list, description="Detected concerns")
    confidence_score: Optional[float] = Field(None, description="Overall confidence", ge=0.0, le=1.0)
    analysis_version: Optional[str] = Field(None, description="ML model version")
    created_at: datetime = Field(..., description="Analysis timestamp")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "scan_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "skin_type": "combination",
                "fitzpatrick_scale": 3,
                "concerns": [
                    {
                        "concern_type": "acne",
                        "severity": "moderate",
                        "confidence": 0.87,
                        "affected_areas": ["forehead", "chin"]
                    }
                ],
                "confidence_score": 0.85,
                "analysis_version": "1.0.0",
                "created_at": "2025-12-06T12:05:00Z",
                "processing_time_ms": 3200
            }
        }


class ScanHistoryItem(BaseModel):
    """Summary item for scan history list"""
    scan_id: UUID = Field(..., description="Scan session ID")
    status: ScanStatusEnum = Field(..., description="Scan status")
    skin_type: Optional[SkinTypeEnum] = Field(None, description="Detected skin type")
    concerns_count: int = Field(..., description="Number of detected concerns", ge=0)
    created_at: datetime = Field(..., description="Scan timestamp")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail image URL")

    class Config:
        json_schema_extra = {
            "example": {
                "scan_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "skin_type": "combination",
                "concerns_count": 3,
                "created_at": "2025-12-06T12:00:00Z",
                "thumbnail_url": "https://storage.example.com/thumb/..."
            }
        }


class ScanHistoryResponse(BaseModel):
    """Paginated scan history response"""
    scans: List[ScanHistoryItem] = Field(..., description="List of scan history items")
    total: int = Field(..., description="Total number of scans", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Items per page", ge=1, le=100)
    has_more: bool = Field(..., description="More pages available")

    class Config:
        json_schema_extra = {
            "example": {
                "scans": [],
                "total": 15,
                "page": 1,
                "page_size": 10,
                "has_more": True
            }
        }


# Error Response Schema
class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid image format",
                "details": {"field": "mime_type", "accepted": ["image/jpeg", "image/png"]},
                "timestamp": "2025-12-06T12:00:00Z"
            }
        }

# Router compatibility aliases - maps router import names to schema classes
# These ensure backward compatibility with existing router code

# Alias for scan initialization response
ScanInitResponse = ScanSessionResponse

# Upload response schema
class ScanUploadResponse(BaseModel):
    """Response after successful image upload"""
    scan_id: UUID = Field(..., description="Scan session ID")
    status: ScanStatusEnum = Field(..., description="Upload status")
    image_url: Optional[str] = Field(None, description="Uploaded image URL")
    message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "scan_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "image_url": "https://storage.example.com/scans/...",
                "message": "Image uploaded successfully. Processing started."
            }
        }

# Status check response schema  
class ScanStatusResponse(BaseModel):
    """Response for scan status check"""
    scan_id: UUID = Field(..., description="Scan session ID")
    status: ScanStatusEnum = Field(..., description="Current scan status")
    progress: Optional[int] = Field(None, description="Processing progress (0-100)", ge=0, le=100)
    message: Optional[str] = Field(None, description="Status message")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")
    
    class Config:
        json_schema_extra = {
            "example": {
                "scan_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "progress": 75,
                "message": "Analyzing skin concerns...",
                "estimated_completion": "2025-12-06T12:05:30Z"
            }
        }

# Alias for analysis/result response
ScanResultResponse = AnalysisResponse
