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
        String,
        unique=True,
        index=True,
        default=lambda: str(uuid.uuid4()),
    )

    # Core identity
    email = Column(String, unique=True, index=True, nullable=False)

    # Password is optional so Gmail-only users can exist without a local password
    hashed_password = Column(String, nullable=True)

    full_name = Column(String, nullable=True)

    # Optional phone identity
    phone_number = Column(String, unique=True, index=True, nullable=True)
    is_phone_verified = Column(Boolean, default=False)

    # Status flags
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
    )

    # Relationships
    scan_sessions = relationship(
        "ScanSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    skin_snapshots = relationship(
        "SkinStateSnapshot",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
