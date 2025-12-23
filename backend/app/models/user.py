"""
User database model.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    """User model for authentication and profile management."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(
        String, unique=True, index=True, default=lambda: str(uuid.uuid4())
    )
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

        # Relationships
    scan_sessions = relationship("ScanSession", back_populates="user", cascade="all, delete-orphan")
    skin_snapshots = relationship("SkinStateSnapshot", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class UserConsent(Base):
    """User consent records for GDPR compliance."""
    __tablename__ = "user_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    terms_accepted = Column(Boolean, default=False)
    privacy_accepted = Column(Boolean, default=False)
    terms_version = Column(String, nullable=False)
    privacy_version = Column(String, nullable=False)
    accepted_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<UserConsent user_id={self.user_id}>"


class PolicyVersion(Base):
    """Policy version tracking for Terms of Service and Privacy Policy."""
    __tablename__ = "policy_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    policy_type = Column(String, nullable=False, index=True)  # "terms_of_service" or "privacy_policy"
    version = Column(String, nullable=False, unique=True)
    effective_date = Column(DateTime(timezone=True), nullable=False)
    content_url = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<PolicyVersion {self.policy_type} v{self.version}>"
