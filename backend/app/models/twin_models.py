"""Sprint 3: Digital Twin Engine - Database Models

Digital Twin models for tracking skin state evolution over time.

Status: Sprint 3 Implementation
Created: December 8, 2025
"""

from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class SkinStateSnapshot(Base):
    """Global Digital Twin snapshot - comprehensive skin state at a point in time"""
    
    __tablename__ = "skin_state_snapshots"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scan_session_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=False, index=True)
    
    # Global metrics (0-100 scale)
    overall_health_score = Column(Float, nullable=False)
    hydration_level = Column(Float, nullable=False)
    oil_level = Column(Float, nullable=False)
    sensitivity_score = Column(Float, nullable=False)
    
    # Aggregated concern scores
    acne_severity = Column(Float, nullable=True)  # 0-100
    wrinkle_severity = Column(Float, nullable=True)
    pigmentation_severity = Column(Float, nullable=True)
    redness_severity = Column(Float, nullable=True)
    
    # Environmental snapshot reference
    environment_snapshot_id = Column(UUID(as_uuid=True), ForeignKey("environment_snapshots.id"), nullable=True)
    
    # Recent routine reference
    recent_routine_id = Column(UUID(as_uuid=True), ForeignKey("routine_instances.id"), nullable=True)
    
    # Metadata
    ml_model_version = Column(String(20), nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0-1
    
    # Timestamps
    snapshot_date = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="skin_snapshots")
    scan_session = relationship("ScanSession")
    regions = relationship("SkinRegionState", back_populates="snapshot", cascade="all, delete-orphan")
    environment = relationship("EnvironmentSnapshot", foreign_keys=[environment_snapshot_id])
    routine = relationship("RoutineInstance", foreign_keys=[recent_routine_id])
    
    __table_args__ = (
        Index('idx_user_snapshot_date', 'user_id', 'snapshot_date'),
    )
    
    def __repr__(self):
        return f"<SkinStateSnapshot(id={self.id}, user_id={self.user_id}, date={self.snapshot_date})>"


class SkinRegionState(Base):
    """Per-region metrics and heatmap data"""
    
    __tablename__ = "skin_region_states"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_id = Column(UUID(as_uuid=True), ForeignKey("skin_state_snapshots.id"), nullable=False, index=True)
    
    # Region identification
    region_name = Column(String(50), nullable=False)  # forehead, left_cheek, right_cheek, nose, chin, etc.
    region_type = Column(String(30), nullable=False)  # t_zone, u_zone, cheeks, etc.
    
    # Per-region metrics (0-100 scale)
    texture_score = Column(Float, nullable=False)
    acne_severity = Column(Float, nullable=False)
    redness_level = Column(Float, nullable=False)
    pigmentation_level = Column(Float, nullable=False)
    oil_level = Column(Float, nullable=False)
    hydration_level = Column(Float, nullable=False)
    sensitivity_score = Column(Float, nullable=False)
    
    # Heatmap metadata
    heatmap_url = Column(String(500), nullable=True)  # Cloud storage URL for heatmap image
    bounding_box = Column(JSONB, nullable=True)  # {"x": 0, "y": 0, "width": 100, "height": 100}
    
    # Detected concerns in this region
    concerns = Column(JSONB, nullable=True)  # [{"type": "acne", "count": 3, "locations": [...]}]
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    snapshot = relationship("SkinStateSnapshot", back_populates="regions")
    
    __table_args__ = (
        Index('idx_snapshot_region', 'snapshot_id', 'region_name'),
    )
    
    def __repr__(self):
        return f"<SkinRegionState(id={self.id}, region={self.region_name})>"


class EnvironmentSnapshot(Base):
    """Environmental conditions at time of scan"""
    
    __tablename__ = "environment_snapshots"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Environmental data
    uv_index = Column(Float, nullable=True)  # 0-11+
    humidity_percent = Column(Float, nullable=True)  # 0-100
    temperature_celsius = Column(Float, nullable=True)
    air_quality_index = Column(Integer, nullable=True)  # AQI 0-500
    pollution_level = Column(String(20), nullable=True)  # low, moderate, high, very_high
    
    # Location data
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Season/Time context
    season = Column(String(20), nullable=True)  # spring, summer, fall, winter
    time_of_day = Column(String(20), nullable=True)  # morning, afternoon, evening, night
    
    # Data source
    data_source = Column(String(50), nullable=True)  # openweather, manual, etc.
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_user_recorded', 'user_id', 'recorded_at'),
    )
    
    def __repr__(self):
        return f"<EnvironmentSnapshot(id={self.id}, user_id={self.user_id}, recorded_at={self.recorded_at})>"


class RoutineInstance(Base):
    """Individual execution of a skincare routine (AM/PM)"""
    
    __tablename__ = "routine_instances"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Routine metadata
    routine_type = Column(String(20), nullable=False)  # AM, PM, special
    routine_name = Column(String(100), nullable=True)  # "My Morning Routine"
    
    # Execution details
    executed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=True)
    completed = Column(Integer, default=1, nullable=False)  # 0 = skipped, 1 = completed
    
    # User notes
    notes = Column(Text, nullable=True)
    mood = Column(String(20), nullable=True)  # great, good, okay, bad
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    products_used = relationship("RoutineProductUsage", back_populates="routine", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_user_executed', 'user_id', 'executed_at'),
        Index('idx_routine_type', 'routine_type'),
    )
    
    def __repr__(self):
        return f"<RoutineInstance(id={self.id}, type={self.routine_type}, executed_at={self.executed_at})>"


class RoutineProductUsage(Base):
    """Products used in a specific routine instance"""
    
    __tablename__ = "routine_product_usage"
    
    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("routine_instances.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    
    # Usage details
    step_order = Column(Integer, nullable=False)  # 1, 2, 3...
    amount_used = Column(String(50), nullable=True)  # "1 pump", "pea-sized", etc.
    application_area = Column(String(100), nullable=True)  # "full face", "t-zone", etc.
    
    # Effectiveness feedback (optional, filled later)
    effectiveness_rating = Column(Integer, nullable=True)  # 1-5 stars
    user_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    routine = relationship("RoutineInstance", back_populates="products_used")
    product = relationship("Product")
    
    __table_args__ = (
        Index('idx_routine_step', 'routine_id', 'step_order'),
    )
    
    def __repr__(self):
        return f"<RoutineProductUsage(id={self.id}, routine_id={self.routine_id}, product_id={self.product_id})>"
