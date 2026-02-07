"""
Pydantic schemas for user data validation.
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special)",
    )
    full_name: Optional[str] = Field(None, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength with comprehensive checks."""
        # Length check (8-128 characters)
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        
        # Character type requirements
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/~`]', v):
            raise ValueError("Password must contain at least one special character")
        
        # Check for common weak passwords
        weak_passwords = {
            "password123", "12345678", "qwerty123", "password1!",
            "welcome123", "admin123", "letmein1!", "password!",
            "changeme1!", "test1234!", "password1", "abc12345!"
        }
        if v.lower() in weak_passwords:
            raise ValueError("Password is too common. Please choose a stronger password")
        
        # Check for sequential characters
        if re.search(r"(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)", v.lower()):
            raise ValueError("Password should not contain sequential letters")
        if re.search(r"(0123|1234|2345|3456|4567|5678|6789)", v):
            raise ValueError("Password should not contain sequential numbers")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass9!8",
                "full_name": "John Doe",
            }
        }


class UserResponse(BaseModel):
    """Schema for user response (excluding password)."""

    id: int
    public_id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Authentication response with token and user."""
    token: str
    user: UserResponse
    message: Optional[str] = None
    verification_required: bool = False
    verification_token: Optional[str] = None


class EmailVerificationRequest(BaseModel):
    """Request email verification for a user."""
    email: EmailStr = Field(..., description="User email address")


class EmailVerificationConfirm(BaseModel):
    """Confirm email verification using a token."""
    token: str = Field(..., min_length=16, description="Email verification token")


class EmailVerificationResponse(BaseModel):
    """Response for email verification actions."""
    message: str
    verified: bool = False
    verification_token: Optional[str] = None