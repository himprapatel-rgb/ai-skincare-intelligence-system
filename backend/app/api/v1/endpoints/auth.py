"""
Authentication API endpoints.
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import create_access_token, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    AuthResponse,
    EmailVerificationConfirm,
    EmailVerificationRequest,
    EmailVerificationResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth_service import auth_service
from app.services.email_service import send_verification_email

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Create a new user account and return access token",
)
def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Register a new user."""
    existing_user = auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    try:
        user = auth_service.create_user(db, user_data)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    verification_token = uuid.uuid4().hex
    user.email_verification_token = verification_token
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    response = AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
        message="Verification email sent. Please verify your email to complete setup.",
        verification_required=True,
    )
    try:
        if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
            background_tasks.add_task(send_verification_email, user.email, verification_token)
        elif settings.ENV == "production":
            raise RuntimeError("SMTP settings missing.")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {exc}",
        )
    if settings.ENV != "production":
        response.verification_token = verification_token
    return response


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user and return access token",
)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    email = user_data.email
    password = user_data.password
    
    # Get user by email
    user = auth_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not auth_service.verify_password(user.hashed_password, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    # Development bypass: auto-verify test user in non-production
    if not user.is_verified:
        if settings.ENV != "production" and email == "himanshu@test.com":
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email to login. Check your inbox for the verification link or contact support.",
            )

    token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.post(
    "/verify-email/request",
    response_model=EmailVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Request email verification",
    description="Send or re-send a verification email to the user",
)
def request_email_verification(
    payload: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = auth_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.is_verified:
        return EmailVerificationResponse(message="Email already verified.", verified=True)

    verification_token = uuid.uuid4().hex
    user.email_verification_token = verification_token
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(user)
    db.commit()
    db.refresh(user)

    response = EmailVerificationResponse(
        message="Verification email sent. Please check your inbox.",
        verified=False,
    )
    try:
        if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
            background_tasks.add_task(send_verification_email, user.email, verification_token)
        elif settings.ENV == "production":
            raise RuntimeError("SMTP settings missing.")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {exc}",
        )
    if settings.ENV != "production":
        response.verification_token = verification_token
    return response


@router.post(
    "/verify-email",
    response_model=EmailVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email address",
    description="Verify a user's email using the verification token",
)
def verify_email(
    payload: EmailVerificationConfirm, db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email_verification_token == payload.token)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )
    if user.email_verification_expires_at and user.email_verification_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token expired",
        )

    user.is_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.add(user)
    db.commit()
    db.refresh(user)

    return EmailVerificationResponse(message="Email verified successfully.", verified=True)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Return the authenticated user's profile",
)
def get_current_user_profile(current_user=Depends(get_current_user)):
    return current_user


# ===== Password Reset Endpoints (US-103) =====

class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: str


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    """Schema for password reset response."""
    message: str
    success: bool = True


from pydantic import BaseModel


@router.post(
    "/password-reset/request",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Send a password reset link to the user's email",
)
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Request password reset.
    
    SRS: US-103 - Password Reset Flow
    Sprint: GUI-2
    """
    user = auth_service.get_user_by_email(db, payload.email)
    
    # Always return success to prevent email enumeration
    if not user:
        return PasswordResetResponse(
            message="If an account exists with this email, a reset link will be sent.",
            success=True,
        )
    
    # Generate reset token
    reset_token = uuid.uuid4().hex
    user.email_verification_token = f"reset_{reset_token}"
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send reset email (async)
    try:
        if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
            from app.services.email_service import send_password_reset_email
            background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    except Exception:
        pass  # Fail silently for security
    
    response = PasswordResetResponse(
        message="If an account exists with this email, a reset link will be sent.",
        success=True,
    )
    
    # Include token in non-production for testing
    if settings.ENV != "production":
        response.message = f"Reset token (dev only): {reset_token}"
    
    return response


@router.post(
    "/password-reset/confirm",
    response_model=PasswordResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm password reset",
    description="Reset password using the token from email",
)
def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    """
    Confirm password reset with token.
    
    SRS: US-103 - Password Reset Flow
    Sprint: GUI-2
    """
    # Find user with reset token
    user = (
        db.query(User)
        .filter(User.email_verification_token == f"reset_{payload.token}")
        .first()
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    if user.email_verification_expires_at and user.email_verification_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one.",
        )
    
    # Validate password
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    
    # Update password
    user.hashed_password = auth_service.hash_password(payload.new_password)
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.add(user)
    db.commit()
    
    return PasswordResetResponse(
        message="Password reset successfully. You can now login with your new password.",
        success=True,
    )
