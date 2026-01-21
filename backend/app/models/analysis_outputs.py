"""Extended analysis output models for future-proof storage."""
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ScanOutput(Base):
    """Raw and normalized outputs from scan analysis."""

    __tablename__ = "scan_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scan_sessions.id"),
        nullable=False,
        index=True,
    )
    raw_result = Column(JSONB, nullable=True)
    normalized_result = Column(JSONB, nullable=True)
    model_name = Column(String(50), nullable=True)
    model_version = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    scan_session = relationship("ScanSession", back_populates="outputs")


class SkinCondition(Base):
    """Catalog of supported skin conditions."""

    __tablename__ = "skin_conditions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class ScanCondition(Base):
    """Per-scan condition measurements."""

    __tablename__ = "scan_conditions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scan_sessions.id"),
        nullable=False,
        index=True,
    )
    condition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("skin_conditions.id"),
        nullable=False,
        index=True,
    )
    severity_label = Column(String(20), nullable=True)
    severity_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    affected_regions = Column(JSONB, nullable=True)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    scan_session = relationship("ScanSession", back_populates="conditions")
    condition = relationship("SkinCondition")


class ScanRecommendation(Base):
    """Recommendation outputs tied to a scan."""

    __tablename__ = "scan_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scan_sessions.id"),
        nullable=False,
        index=True,
    )
    recommendation_type = Column(String(50), nullable=False)
    payload = Column(JSONB, nullable=True)
    confidence = Column(Float, nullable=True)
    source = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    scan_session = relationship("ScanSession", back_populates="recommendations")


class ProductRecommendation(Base):
    """Product recommendation linked to a scan."""

    __tablename__ = "product_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scan_sessions.id"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True,
        index=True,
    )
    reason = Column(Text, nullable=True)
    match_score = Column(Float, nullable=True)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    scan_session = relationship("ScanSession", back_populates="product_recommendations")


class GeoLocation(Base):
    """User location history for geo-based guidance."""

    __tablename__ = "geo_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    source = Column(String(50), nullable=True)
    collected_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class EnvironmentalReading(Base):
    """Environmental readings for a specific location."""

    __tablename__ = "environmental_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(
        UUID(as_uuid=True),
        ForeignKey("geo_locations.id"),
        nullable=False,
        index=True,
    )
    uv_index = Column(Float, nullable=True)
    temperature_celsius = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    air_quality_index = Column(Integer, nullable=True)
    pollen_index = Column(Integer, nullable=True)
    weather_conditions = Column(String(100), nullable=True)
    raw_payload = Column(JSONB, nullable=True)
    source = Column(String(50), nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class DailySkinGuidance(Base):
    """Daily personalized guidance derived from scans and environment."""

    __tablename__ = "daily_skin_guidance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    guidance_date = Column(Date, default=date.today, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    uv_alert = Column(Text, nullable=True)
    hydration_tip = Column(Text, nullable=True)
    sunscreen_tip = Column(Text, nullable=True)
    routine_tip = Column(Text, nullable=True)
    reasoning = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class Store(Base):
    """Retail store locations for product availability."""

    __tablename__ = "stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    chain = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class ProductStoreAvailability(Base):
    """Store-level product availability and pricing."""

    __tablename__ = "product_store_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False, index=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    in_stock = Column(Boolean, default=True)
    purchase_url = Column(String(500), nullable=True)
    last_checked_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)


class UserEvent(Base):
    """User activity and audit events."""

    __tablename__ = "user_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    details = Column("metadata", JSONB, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class UserProgressSnapshot(Base):
    """Lightweight progress snapshots for trend reporting."""

    __tablename__ = "user_progress_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    snapshot_date = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    overall_score = Column(Float, nullable=True)
    hydration = Column(Float, nullable=True)
    acne = Column(Float, nullable=True)
    redness = Column(Float, nullable=True)
    wrinkles = Column(Float, nullable=True)
    pigmentation = Column(Float, nullable=True)
    details = Column("metadata", JSONB, nullable=True)
