"""Sprint 2: Face Scan & AI Analysis - Database Models

Scan Session Model for tracking user face scans and analysis results.

Status: Phase 1 Implementation - Foundation Layer
Created: December 6, 2025
"""

from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLEnum, Float, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base


class ScanStatus(str, enum.Enum):
    """Scan processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SkinType(str, enum.Enum):
    """Skin type classification"""
    NORMAL = "normal"
    DRY = "dry"
    OILY = "oily"
    COMBINATION = "combination"
    SENSITIVE = "sensitive"


class ScanSession(Base):
    """Face scan session model
    
    Tracks individual face scanning sessions including:
    - User identification
    - Scan status and timing
    - Image metadata
    - Processing results linkage
    """
    __tablename__ = "scan_sessions"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Scan status tracking
    status = Column(SQLEnum(ScanStatus), default=ScanStatus.PENDING, nullable=False, index=True)
    
    # Image information
    image_url = Column(String(500), nullable=True)  # Cloud storage URL
    image_hash = Column(String(64), nullable=True)  # SHA-256 hash for deduplication
    
    # Metadata
    metadata = Column(JSONB, nullable=True)  # lighting_quality, image_dimensions, device_info
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="scan_sessions")
    analysis = relationship("SkinAnalysis", back_populates="scan_session", uselist=False)
    
    def __repr__(self):
        return f"<ScanSession(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "status": self.status.value,
            "image_url": self.image_url,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message
        }


class SkinAnalysis(Base):
    """Skin analysis results model
    
    Stores AI-powered skin analysis results including:
    - Skin type classification
    - Detected concerns
    - Confidence scores
    - Fitzpatrick scale
    - Facial landmarks
    """
    __tablename__ = "skin_analyses"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=False, unique=True, index=True)
    
    # Skin classification
    skin_type = Column(SQLEnum(SkinType), nullable=False)
    fitzpatrick_scale = Column(Integer, nullable=False)  # 1-6 scale
    
    # Analysis results (JSONB for flexibility)
    concerns = Column(JSONB, nullable=False)  # List[{concern_type, severity, confidence, affected_areas}]
    landmarks = Column(JSONB, nullable=True)  # Facial landmark coordinates
    confidence_scores = Column(JSONB, nullable=False)  # Dict[concern_type, float]
    
    # Overall metrics
    overall_confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    analysis_version = Column(String(20), nullable=False)  # ML model version
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    scan_session = relationship("ScanSession", back_populates="analysis")
    confidence_metrics = relationship("ConfidenceMetrics", back_populates="analysis", uselist=False)
    fairness_metrics = relationship("FairnessMetrics", back_populates="analysis", uselist=False)
    
    def __repr__(self):
        return f"<SkinAnalysis(id={self.id}, scan_session_id={self.scan_session_id}, skin_type={self.skin_type})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": str(self.id),
            "scan_session_id": str(self.scan_session_id),
            "skin_type": self.skin_type.value,
            "fitzpatrick_scale": self.fitzpatrick_scale,
            "concerns": self.concerns,
            "confidence_scores": self.confidence_scores,
            "overall_confidence": self.overall_confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ConfidenceMetrics(Base):
    """Confidence metrics for analysis quality tracking
    
    Tracks confidence levels and uncertainty factors for each analysis.
    Used for quality assurance and model improvement.
    """
    __tablename__ = "confidence_metrics"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("skin_analyses.id"), nullable=False, unique=True, index=True)
    
    # Confidence metrics
    overall_confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    concern_confidences = Column(JSONB, nullable=False)  # Dict[concern_type, float]
    
    # Uncertainty factors
    uncertainty_factors = Column(JSONB, nullable=False)  # List[str] - reasons for low confidence
    
    # Quality indicators
    image_quality_score = Column(Float, nullable=True)  # 0.0 - 1.0
    lighting_quality_score = Column(Float, nullable=True)  # 0.0 - 1.0
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    analysis = relationship("SkinAnalysis", back_populates="confidence_metrics")
    
    def __repr__(self):
        return f"<ConfidenceMetrics(id={self.id}, analysis_id={self.analysis_id}, confidence={self.overall_confidence})>"


class FairnessMetrics(Base):
    """Fairness monitoring metrics for ML model bias detection
    
    Tracks performance across different skin tones (Fitzpatrick scale)
    to ensure equitable AI analysis across all users.
    """
    __tablename__ = "fairness_metrics"
    
    # Primary identification  
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("skin_analyses.id"), nullable=False, unique=True, index=True)
    
    # Fitzpatrick scale tracking
    fitzpatrick_scale = Column(Integer, nullable=False, index=True)  # 1-6
    
    # Performance metrics by skin tone
    accuracy_by_tone = Column(JSONB, nullable=True)  # Dict[int (1-6), float]
    bias_indicators = Column(JSONB, nullable=True)  # Dict[metric_name, float]
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    analysis = relationship("SkinAnalysis", back_populates="fairness_metrics")
    
    def __repr__(self):
        return f"<FairnessMetrics(id={self.id}, analysis_id={self.analysis_id}, fitzpatrick={self.fitzpatrick_scale})>"
