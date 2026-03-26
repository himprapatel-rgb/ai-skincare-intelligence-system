"""SQLAlchemy models for Clinical Intelligence Engine.

Tables: skin_alerts, derm_reports, ingredient_interactions
"""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SkinAlert(Base):
    """Proactive skin health alert for a user."""

    __tablename__ = "skin_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # low / medium / high / critical
    concern = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)
    is_dismissed = Column(Boolean, server_default="false", nullable=False)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="skin_alerts")


class DermReport(Base):
    """Shareable dermatologist-ready skin report."""

    __tablename__ = "derm_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scan_ids = Column(JSON, nullable=False)  # array of scan UUIDs
    report_data = Column(JSON, nullable=False)
    share_token = Column(String(64), unique=True, nullable=True, index=True)
    share_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="derm_reports")


class IngredientInteraction(Base):
    """Known interaction between two skincare ingredients."""

    __tablename__ = "ingredient_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ingredient_a = Column(String(200), nullable=False, index=True)
    ingredient_b = Column(String(200), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False)  # conflict / caution / synergy
    severity = Column(String(20), nullable=False)  # low / medium / high
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
