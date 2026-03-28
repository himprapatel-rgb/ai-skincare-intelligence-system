"""
Authentication API endpoints.

Handles user registration, login, email verification, and password reset.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.geo import fetch_geolocation, get_client_ip
from app.core.rate_limit import check_login_rate_limit, record_login_attempt
from app.core.security import (
    blacklist_token,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
)
from app.database import get_db
from app.models.user import User, UserAccessLog
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

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set refresh token as httpOnly, Secure, SameSite cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.ENV != "development",
        samesite="lax",
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.ENV != "development",
        samesite="lax",
        path="/api/v1/auth",
    )


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
    import logging
    logger = logging.getLogger(__name__)
    request_id = uuid.uuid4().hex[:8]
    logger.info("[%s] REGISTER called", request_id)
    
    existing_user = auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        # If user exists but has a recent verification token, they may have double-submitted
        if existing_user.email_verification_token and existing_user.email_verification_expires_at:
            if existing_user.email_verification_expires_at > datetime.now(timezone.utc):
                logger.warning(f"[{request_id}] Duplicate registration attempt for {user_data.email} - user exists with valid token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    try:
        user = auth_service.create_user(db, user_data)
        logger.info("[%s] User created", request_id)
    except IntegrityError:
        db.rollback()
        logger.warning(f"[{request_id}] IntegrityError during registration for {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    verification_token = uuid.uuid4().hex
    user.email_verification_token = verification_token
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    user.email_verification_sent_at = datetime.now(timezone.utc)  # Track when email was sent
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info("[%s] Verification token generated", request_id)

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
            logger.info(f"[{request_id}] Adding background task to send email")
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


def _login_record_ip_geo(user_id: int, ip: str) -> None:
    """Background task: fetch geo for IP and update user + UserAccessLog. Never raises."""
    import logging

    from app.database import SessionLocal
    _log = logging.getLogger(__name__)
    try:
        geo = fetch_geolocation(ip)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return
            now = datetime.now(timezone.utc)
            if hasattr(user, "last_ip_address"):
                user.last_ip_address = ip
            if hasattr(user, "last_geolocation"):
                user.last_geolocation = geo
            if hasattr(user, "last_seen_at"):
                user.last_seen_at = now
            db.add(user)
            db.add(UserAccessLog(user_id=user_id, ip_address=ip, geolocation=geo))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        _log.warning("Login IP/geo logging failed (background): %s", e)


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user and return access token",
)
def login(
    request: Request,
    response: Response,
    user_data: UserLogin,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Authenticate user and return access token. Rate limited per IP. IP/geo logged in background so login returns fast."""
    check_login_rate_limit(request)

    email = user_data.email
    password = user_data.password

    # Get user by email
    user = auth_service.get_user_by_email(db, email)
    if not user:
        record_login_attempt(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Account lockout check (5 failed attempts → 15 min lock)
    try:
        if getattr(user, 'locked_until', None) and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account temporarily locked due to too many failed attempts. Try again later.",
            )
    except HTTPException:
        raise  # Re-raise the 423
    except Exception:
        pass  # Column may not exist in production yet

    if not auth_service.verify_password(user.hashed_password, password):
        record_login_attempt(request)
        # Increment failed count and possibly lock (graceful if columns missing)
        try:
            user.failed_login_count = (user.failed_login_count or 0) + 1
            if user.failed_login_count >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
            db.add(user)
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to login. Check your inbox for the verification link or contact support.",
        )

    # Successful login — reset lockout counters (graceful if columns missing)
    try:
        user.failed_login_count = 0
        user.locked_until = None
        user.login_count = (user.login_count or 0) + 1
        db.add(user)
        db.commit()
    except Exception:
        db.rollback()

    # Return token immediately; record IP/geo in background (was blocking login by up to ~2s for geo API)
    ip = get_client_ip(request)
    background_tasks.add_task(_login_record_ip_geo, user.id, ip)

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    # Generate refresh token (graceful if column missing in DB)
    refresh = None
    try:
        refresh = create_refresh_token(data={"sub": str(user.id)})
        user.refresh_token = refresh
        db.add(user)
        db.commit()
    except Exception:
        db.rollback()

    if refresh:
        _set_refresh_cookie(response, refresh)
    return AuthResponse(token=token, token_type="bearer", user=UserResponse.model_validate(user), refresh_token=refresh)


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
    import logging
    logger = logging.getLogger(__name__)
    request_id = uuid.uuid4().hex[:8]
    logger.info("[%s] verify-email/request called", request_id)
    
    user = auth_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.is_verified:
        logger.info(f"[{request_id}] User {payload.email} already verified, skipping email")
        return EmailVerificationResponse(message="Email already verified.", verified=True)

    # Rate limit: don't send if email was sent in the last 60 seconds
    if hasattr(user, 'email_verification_sent_at') and user.email_verification_sent_at:
        time_since_last = datetime.now(timezone.utc) - user.email_verification_sent_at.replace(tzinfo=timezone.utc)
        if time_since_last.total_seconds() < 60:
            logger.warning("[%s] Rate limited: verification email sent recently", request_id)
            return EmailVerificationResponse(
                message="Verification email was recently sent. Please check your inbox or wait a moment before requesting again.",
                verified=False,
            )

    verification_token = uuid.uuid4().hex
    user.email_verification_token = verification_token
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    user.email_verification_sent_at = datetime.now(timezone.utc)  # Track when email was sent
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"[{request_id}] New token generated for {payload.email}: {verification_token[:8]}...")

    response = EmailVerificationResponse(
        message="Verification email sent. Please check your inbox.",
        verified=False,
    )
    try:
        if settings.SMTP_HOST and settings.SMTP_FROM_EMAIL:
            logger.info("[%s] Adding background task to send verification email", request_id)
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
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special)",
    )
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength with comprehensive checks."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/~`]', v):
            raise ValueError("Password must contain at least one special character")
        
        weak_passwords = {
            "password123", "12345678", "qwerty123", "password1!",
            "welcome123", "admin123", "letmein1!", "password!",
            "changeme1!", "test1234!", "password1", "abc12345!"
        }
        if v.lower() in weak_passwords:
            raise ValueError("Password is too common. Please choose a stronger password")
        
        if re.search(r"(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)", v.lower()):
            raise ValueError("Password should not contain sequential letters")
        if re.search(r"(0123|1234|2345|3456|4567|5678|6789)", v):
            raise ValueError("Password should not contain sequential numbers")
        
        return v


class PasswordResetResponse(BaseModel):
    """Schema for password reset response."""
    message: str
    success: bool = True


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


# ===== Google OAuth =====

# Allowed redirect URIs for Google OAuth (must match Google Console). Frontend can pass redirect_uri when using shared backend.
ALLOWED_GOOGLE_REDIRECT_URIS = [
    "https://pellicura.com/auth/google/callback",
    "https://www.pellicura.com/auth/google/callback",
    "https://pellicura.pages.dev/auth/google/callback",
    "https://staging.pellicura.pages.dev/auth/google/callback",
    "https://frontend-production-0415.up.railway.app/auth/google/callback",
    "http://localhost:5173/auth/google/callback",
]


class GoogleAuthRequest(BaseModel):
    """Google OAuth authorization code."""
    code: str
    redirect_uri: str | None = None  # Optional: use when backend serves multiple frontends (e.g. Railway for both)


class GoogleRedirectUriResponse(BaseModel):
    """Public config so frontend can show the exact redirect URI for Google Console."""
    redirect_uri: str


class GoogleOAuthStatusResponse(BaseModel):
    """Whether Google OAuth is configured (no secrets). For debugging login."""
    configured: bool


@router.get(
    "/google/status",
    response_model=GoogleOAuthStatusResponse,
    summary="Google OAuth configured",
    description="Returns whether Google OAuth is configured (client ID and secret set). No auth required.",
)
def google_oauth_status():
    """Let support/frontend check if Google login can work."""
    configured = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)
    return GoogleOAuthStatusResponse(configured=configured)


@router.get(
    "/google/redirect-uri",
    response_model=GoogleRedirectUriResponse,
    summary="Google OAuth redirect URI",
    description="Returns the redirect URI this backend uses for Google OAuth. Add this exact URL to Authorized redirect URIs in Google Cloud Console.",
)
def google_redirect_uri():
    """Return the redirect URI the backend sends to Google (for config verification)."""
    base = (settings.FRONTEND_URL or "").rstrip("/")
    return GoogleRedirectUriResponse(redirect_uri=f"{base}/auth/google/callback")


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Google OAuth login",
    description="Authenticate with Google OAuth and return access token",
)
async def google_auth(
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate with Google OAuth.
    
    1. Exchange authorization code for tokens
    2. Verify and extract user info
    3. Find or create user
    4. Return JWT token
    """
    import logging

    from app.services.google_auth_service import GoogleAuthError, google_auth_service

    logger = logging.getLogger(__name__)

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    # Determine redirect_uri: use frontend-provided if valid, else FRONTEND_URL
    redirect_uri = None
    if payload.redirect_uri and payload.redirect_uri in ALLOWED_GOOGLE_REDIRECT_URIS:
        redirect_uri = payload.redirect_uri
    # Exchange code and get user info
    try:
        user_info = await google_auth_service.verify_and_get_user(payload.code, redirect_uri=redirect_uri)
    except GoogleAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        ) from e

    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to verify Google authentication",
        )
    
    email = user_info["email"]
    name = user_info.get("name", "")
    
    # Find or create user
    user = auth_service.get_user_by_email(db, email)
    
    if not user:
        # Create new user (auto-verified since Google verified the email)
        user = User(
            email=email,
            full_name=name,
            hashed_password=auth_service.hash_password(uuid.uuid4().hex),  # Random password
            is_verified=True,  # Google verified the email
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user via Google OAuth: {email}")
    else:
        # Update name if not set
        if not user.full_name and name:
            user.full_name = name
            db.add(user)
            db.commit()
        
        # Mark as verified if not already
        if not user.is_verified:
            user.is_verified = True
            db.add(user)
            db.commit()
    
    # Generate JWT token
    token_data = {"sub": str(user.id)}
    token = create_access_token(token_data)
    
    return AuthResponse(
        token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        verification_required=False,
    )


# ── Sprint 2: New Auth Endpoints ─────────────────────────────────────────────


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class TokenPairResponse(BaseModel):
    token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


@router.post(
    "/refresh",
    response_model=TokenPairResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access + refresh token pair",
)
def refresh_token(
    request: Request,
    response: Response,
    body: RefreshRequest,
    db: Session = Depends(get_db),
):
    """Token refresh with rotation — each refresh token is single-use."""
    # Accept refresh token from body OR httpOnly cookie
    token_value = body.refresh_token or request.cookies.get(REFRESH_COOKIE_NAME)
    if not token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    payload = decode_refresh_token(token_value)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    subject = payload.get("sub")
    user = db.query(User).filter(User.id == int(subject)).first() if subject else None
    if not user or user.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotation check: only accept the token currently stored
    if user.refresh_token != token_value:
        # Potential token reuse attack — revoke
        user.refresh_token = None
        db.add(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

    # Issue new pair
    new_access = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh = create_refresh_token(data={"sub": str(user.id)})
    user.refresh_token = new_refresh
    db.add(user)
    db.commit()

    _set_refresh_cookie(response, new_refresh)
    return TokenPairResponse(token=new_access, refresh_token=new_refresh)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (server-side)",
    description="Blacklist the current access token and revoke the refresh token",
)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invalidate both access and refresh tokens."""
    # Blacklist access token
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        blacklist_token(auth_header[7:])

    # Revoke refresh token
    current_user.refresh_token = None
    db.add(current_user)
    db.commit()
    _clear_refresh_cookie(response)


class AccountDeleteResponse(BaseModel):
    message: str
    grace_period_days: int = 30


@router.delete(
    "/account",
    response_model=AccountDeleteResponse,
    summary="GDPR: Request account deletion",
    description="Soft-delete user account with 30-day grace period",
)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GDPR-compliant account deletion. Sets deleted_at, 30-day grace before hard delete."""
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False
    current_user.refresh_token = None
    db.add(current_user)
    db.commit()

    return AccountDeleteResponse(
        message="Account scheduled for deletion. You have 30 days to reactivate by logging in.",
        grace_period_days=30,
    )
