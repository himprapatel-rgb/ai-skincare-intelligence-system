"""Models for product scans, routines, and notifications."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ProductScanSession(Base):
    """Product scan session for at-home product identification."""

    __tablename__ = "product_scan_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="pending", index=True)
    image_data = Column(LargeBinary, nullable=True)
    image_content_type = Column(String(100), nullable=True)
    image_filename = Column(String(255), nullable=True)
    image_hash = Column(String(64), nullable=True)
    image_url = Column(String(500), nullable=True)
    scan_metadata = Column(JSONB, nullable=True)
    result = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    items = relationship("ProductScanItem", back_populates="scan", cascade="all, delete-orphan")


class ProductScanItem(Base):
    """Resolved products from a product scan."""

    __tablename__ = "product_scan_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_session_id = Column(
        UUID(as_uuid=True), ForeignKey("product_scan_sessions.id"), nullable=False, index=True
    )
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True, index=True)
    matched_name = Column(String(300), nullable=True)
    match_confidence = Column(Float, nullable=True)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    scan = relationship("ProductScanSession", back_populates="items")


class RoutineRecommendation(Base):
    """Recommended routine generated from scans and product scans."""

    __tablename__ = "routine_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scan_session_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=True, index=True)
    product_scan_id = Column(
        UUID(as_uuid=True), ForeignKey("product_scan_sessions.id"), nullable=True, index=True
    )
    payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class RoutineCheckin(Base):
    """User confirmation of routine completion."""

    __tablename__ = "routine_checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    routine_instance_id = Column(
        UUID(as_uuid=True), ForeignKey("routine_instances.id"), nullable=True, index=True
    )
    status = Column(String(20), nullable=False, default="completed")
    notes = Column(Text, nullable=True)
    checked_in_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class UserNotification(Base):
    """Scheduled notifications for routine and environmental alerts."""

    __tablename__ = "user_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    body = Column(Text, nullable=True)
    channel = Column(String(20), nullable=True)  # push, sms, email
    status = Column(String(20), nullable=False, default="scheduled")
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    timezone = Column(String(50), nullable=True)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    events = relationship("NotificationEvent", back_populates="notification", cascade="all, delete-orphan")


class NotificationEvent(Base):
    """Delivery events for notifications."""

    __tablename__ = "notification_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(
        UUID(as_uuid=True), ForeignKey("user_notifications.id"), nullable=False, index=True
    )
    event_type = Column(String(30), nullable=False)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    notification = relationship("UserNotification", back_populates="events")


class GeoAlert(Base):
    """Geo-based alerts (UV, heat, humidity) for users."""

    __tablename__ = "geo_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("geo_locations.id"), nullable=True, index=True)
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    severity = Column(String(20), nullable=True)
    uv_index = Column(Float, nullable=True)
    temperature_celsius = Column(Float, nullable=True)
    details = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class ProductOffer(Base):
    """Discount offers for products."""

    __tablename__ = "product_offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=True, index=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    discount_percent = Column(Float, nullable=True)
    offer_url = Column(String(500), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
