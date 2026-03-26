import logging
import os
import sys
from datetime import date, datetime
from pathlib import Path

import anyio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError

from app.api.v1 import api_router
from app.api.v1.products import router as external_products_router
from app.api.v1.progress import router as progress_router
from app.api.v1.routines import router as routines_router
from app.config import settings
from app.core.security import encrypt_sensitive_data
from app.database import Base, SessionLocal, engine, health_engine
from app.models.analysis_outputs import (
    DailySkinGuidance,
    EnvironmentalReading,
    GeoLocation,
    ProductRecommendation,
    ProductStoreAvailability,
    ScanCondition,
    ScanOutput,
    ScanRecommendation,
    SkinCondition,
    Store,
    UserEvent,
    UserProgressSnapshot,
)
from app.models.content import Blog, NewsItem, Video
from app.models.engagement import (
    GeoAlert,
    NotificationEvent,
    ProductOffer,
    ProductScanItem,
    ProductScanSession,
    RoutineCheckin,
    RoutineRecommendation,
    UserNotification,
)
from app.models.favorites import UserFavorite
from app.models.goals import SkinGoal
from app.models.notifications import Notification
from app.models.product_models import (
    Ingredient,
    Product,
    ProductIngredient,
    ProductReview,
)
from app.models.progress_photo import ProgressPhoto
from app.models.saved_routine import SavedRoutine
from app.models.scan import (
    ConfidenceMetrics,
    FairnessMetrics,
    ScanSession,
    SkinAnalysis,
)
from app.models.shelf import ShelfProduct

# Import ALL models to ensure tables are created at startup
from app.models.twin_models import (  # noqa: F401 — Digital Twin models
    EnvironmentSnapshot,
    RoutineInstance,
    RoutineProductUsage,
    SkinRegionState,
    SkinStateSnapshot,
)
from app.models.ai_chat import AIChatMessage, AIChatSession, AIUsageLog  # noqa: F401
from app.models.clinical import DermReport, IngredientInteraction, SkinAlert  # noqa: F401 — Clinical Intelligence
from app.models.user import PolicyVersion, User, UserAccessLog, UserConsent, UserProfile
from app.product_database import check_product_database_health, create_product_tables
from app.core.exceptions import AppException, app_exception_handler
from app.routers import ai_chat as ai_chat_router_module
from app.routers import clinical as clinical_router_module
from app.routers import (  # GDPR & User Management
    admin,
    catalog,
    consent,
    content,
    digital_twin,
    favorites,
    goals,
    notifications,
    products,
    profile,
    search,
    shelf,
)
from app.core.websocket import manager as ws_manager  # noqa: F401 — WebSocket manager singleton
from app.services.auth_service import auth_service
from middleware.ip_geo_logging import IPGeoLoggingMiddleware
from middleware.request_tracing import RequestTracingMiddleware
from middleware.slow_query_logger import setup_slow_query_logging

logger = logging.getLogger(__name__)

# Sentry error tracking (optional — only init if SENTRY_DSN is set)
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=0.1,  # 10% of requests
            profiles_sample_rate=0.05,
            environment=settings.ENV,
            release=settings.APP_VERSION,
        )
        logger.info("Sentry initialized for %s", settings.ENV)
    except Exception as exc:
        logger.warning("Sentry init failed: %s", exc)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered skincare intelligence system",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Rate limit scan endpoints to prevent abuse (per-IP when unauthenticated)
from middleware.rate_limiter import RateLimiterMiddleware

if settings.ENV not in {"test", "testing"} and "pytest" not in sys.modules:
    app.add_middleware(RateLimiterMiddleware, max_requests=10, window_seconds=60)

# TrustedHostMiddleware removed: Starlette rejects bare * and *.domain patterns.
# CORS + explicit origins provide adequate protection for Railway deployment.

# Task 425: Request tracing with correlation IDs
app.add_middleware(RequestTracingMiddleware)
# Record IP and geolocation on each authenticated request; update User and UserAccessLog
app.add_middleware(IPGeoLoggingMiddleware)
# Performance logging: track slow requests (>1s) and add X-Response-Time header
from middleware.performance_logging import PerformanceLoggingMiddleware

app.add_middleware(PerformanceLoggingMiddleware)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    # API responses must be readable by cross-origin frontends (pellicura.com → Railway backend).
    # "same-site" would block responses when frontend and backend are on different domains.
    if request.url.path.startswith("/api/"):
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    else:
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://accounts.google.com https://apis.google.com; "
        "style-src 'self' 'unsafe-inline' https://accounts.google.com; "
        "img-src 'self' data: https://images.unsplash.com https://*.pellicura.com https://*.googleusercontent.com; "
        "connect-src 'self' https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com https://*.pellicura.com wss://*.pellicura.com; "
        "font-src 'self'; "
        "frame-src https://accounts.google.com; "
        "frame-ancestors 'none'"
    )
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.middleware("http")
async def request_timeout_middleware(request: Request, call_next):
    if request.url.path in {"/", "/robots.txt", "/api/health", "/api/health/ready", "/api/health/live"}:
        return await call_next(request)
    try:
        with anyio.fail_after(settings.REQUEST_TIMEOUT_SECONDS):
            return await call_next(request)
    except TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timed out"},
        )


@app.middleware("http")
async def request_size_limit_middleware(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH"}:
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit():
            if int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request body too large"},
                )
    return await call_next(request)


@app.exception_handler(OperationalError)
async def handle_db_operational_error(request: Request, exc: OperationalError) -> JSONResponse:
    message = "Database unavailable. Please retry shortly."
    if "too many clients" in str(exc).lower():
        message = "Database overloaded. Please retry shortly."
    logger.warning("Database operational error: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": message},
        headers={"Retry-After": "5"},
    )

def _add_missing_columns(eng) -> None:
    """Add Sprint 2+ columns to existing production tables. Safe to run repeatedly."""
    _cols = [
        ("users", "refresh_token", "VARCHAR(512)"),
        ("users", "failed_login_count", "INTEGER DEFAULT 0"),
        ("users", "locked_until", "TIMESTAMPTZ"),
        ("users", "login_count", "INTEGER DEFAULT 0"),
        ("users", "deleted_at", "TIMESTAMPTZ"),
        ("users", "language", "VARCHAR(10) DEFAULT 'en'"),
        ("users", "password_reset_token", "VARCHAR(255)"),
        ("users", "password_reset_expires_at", "TIMESTAMPTZ"),
    ]
    try:
        with eng.connect() as conn:
            for table, col, col_type in _cols:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                except Exception:
                    pass  # Column may already exist or DB doesn't support IF NOT EXISTS
            conn.commit()
        logger.info("✅ Missing columns check complete")
    except Exception as exc:
        logger.warning("Column migration skipped: %s", exc)


@app.on_event("startup")
def ensure_test_user() -> None:
    """Best-effort startup bootstrap. Never crash the API process."""
    db_bootstrap_available = True
    try:
        # Setup slow query logging for monitoring
        setup_slow_query_logging(engine, threshold_seconds=0.5)
        logger.info("✅ Slow query logging enabled")

        # Create all tables from SQLAlchemy models (non-destructive)
        logger.info("Creating database tables (if not exist)...")
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("✅ Main database tables ensured")

        # Sprint 2+: Add new columns to existing tables if missing (safe for production)
        _add_missing_columns(engine)
    except (ProgrammingError, OperationalError) as exc:
        logger.warning("Main DB bootstrap unavailable; startup continues without seed: %s", exc)
        db_bootstrap_available = False
    except Exception as exc:  # defensive: never crash app startup
        logger.exception("Unexpected main DB bootstrap error; startup continues: %s", exc)
        db_bootstrap_available = False

    try:
        # Create product catalog tables (separate database)
        logger.info("Creating product catalog tables...")
        create_product_tables()
        logger.info("✅ Product catalog tables ensured")
    except Exception as exc:
        # Product DB is optional for API liveness; keep service up and report via /api/health
        logger.warning("Product DB bootstrap skipped: %s", exc)

    # Schema migrations are now managed by Alembic (see alembic/versions/).
    # Run: alembic upgrade head

    if not db_bootstrap_available:
        return

    try:
        db = SessionLocal()
    except Exception as exc:
        logger.warning("Unable to open DB session for seeding; skipping seed: %s", exc)
        return
    try:
        # Do not seed test users unless explicitly enabled via SEED_TEST_USERS=1
        if os.getenv("SEED_TEST_USERS", "").lower() not in ("1", "true", "yes"):
            db.close()
            return
        test_users = [
            ("himanshu@test.com", "Test1234!", "Himanshu Patel"),
            ("himprapatel@gmail.com", "Test1234!", "Himanshu Patel"),
        ]
        for email, password, full_name in test_users:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                hashed_password = auth_service.hash_password(password)
                user = User(
                    email=email,
                    hashed_password=hashed_password,
                    full_name=full_name,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info("✅ Seeded test user: %s (%s)", full_name, email)
            else:
                needs_update = False
                if not user.is_verified:
                    user.is_verified = True
                    needs_update = True
                if not user.is_active:
                    user.is_active = True
                    needs_update = True
                if not auth_service.verify_password(user.hashed_password, password):
                    user.hashed_password = auth_service.hash_password(password)
                    needs_update = True
                if needs_update:
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    logger.info("✅ Updated test user: %s - verified and password set", email)

        terms = None
        privacy = None
        try:
            terms = (
                db.query(PolicyVersion)
                .filter(
                    PolicyVersion.policy_type == "terms_of_service",
                    PolicyVersion.is_active == True,
                )
                .first()
            )
            privacy = (
                db.query(PolicyVersion)
                .filter(
                    PolicyVersion.policy_type == "privacy_policy",
                    PolicyVersion.is_active == True,
                )
                .first()
            )
            policies_changed = False
            if not terms:
                terms = PolicyVersion(
                    policy_type="terms_of_service",
                    version="terms-1.0.0",
                    effective_date=datetime(2025, 1, 1),
                    content_url="/terms",
                    summary="Terms of Service - Version 1.0.0",
                    is_active=True,
                )
                db.add(terms)
                policies_changed = True
            if not privacy:
                privacy = PolicyVersion(
                    policy_type="privacy_policy",
                    version="privacy-1.0.0",
                    effective_date=datetime(2025, 1, 1),
                    content_url="/privacy",
                    summary="Privacy Policy - Version 1.0.0",
                    is_active=True,
                )
                db.add(privacy)
                policies_changed = True
            if policies_changed:
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()
                    logger.warning("Policy versions already seeded; skipping insert.")
        except ProgrammingError:
            db.rollback()
            logger.warning("Policy tables not available yet; skipping seed.")

        try:
            profile = (
                db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            )
            if not profile:
                profile = UserProfile(
                    user_id=user.id,
                    first_name="Himanshu",
                    last_name="Patel",
                    date_of_birth=date(1990, 6, 15),
                    gender="male",
                    location="Dublin, IE",
                    timezone="Europe/Dublin",
                    phone_number="+353-1-555-0199",
                    profile_photo_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
                    skin_type="combination",
                    skin_tone="medium",
                    skin_texture="uneven",
                    pore_size="medium",
                    moisture_level="normal",
                    oil_production="normal",
                    sensitivity_level="low",
                    primary_concern="fine_lines",
                    secondary_concerns=["dryness", "dullness", "dark_spots"],
                    sun_exposure="moderate",
                    outdoor_activity_level="moderate",
                    water_intake=8,
                    sleep_hours=7.5,
                    diet_type="balanced",
                    stress_level="moderate",
                    exercise_frequency="3-5x/week",
                    smoking_status="never",
                    alcohol_consumption="occasional",
                    climate="temperate",
                    known_allergies=["fragrance", "lanolin"],
                    current_medications=["vitamin_d", "omega_3"],
                    skin_conditions=["mild_acne"],
                    previous_treatments="Topical retinoid and glycolic acid.",
                    preferred_ingredients=["niacinamide", "hyaluronic_acid", "ceramides"],
                    ingredients_to_avoid=["alcohol_denat", "fragrance"],
                    product_texture_preference="serum",
                    fragrance_preference="fragrance-free",
                    budget_range="mid-range",
                    brand_preferences=["CeraVe", "La Roche-Posay", "The Ordinary"],
                    routine_frequency="twice_daily",
                    current_routine_products=[
                        "gentle_cleanser",
                        "hydrating_serum",
                        "moisturizer",
                        "broad_spectrum_spf",
                    ],
                    goals=["anti_aging", "hydration", "brightening"],
                    email_notifications=True,
                    push_notifications=True,
                    sms_notifications=False,
                    marketing_emails=False,
                    profile_visibility="private",
                    share_progress=True,
                    allow_data_analysis=True,
                    profile_complete=True,
                    completion_percentage=100,
                    last_profile_update=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
        except ProgrammingError:
            db.rollback()
            logger.warning("Profile tables not available yet; skipping seed.")

        try:
            consent_record = (
                db.query(UserConsent).filter(UserConsent.user_id == user.id).first()
            )
            if not consent_record:
                terms_version = terms.version if terms else "1.0.0"
                privacy_version = privacy.version if privacy else "1.0.0"
                consent_record = UserConsent(
                    user_id=user.id,
                    terms_accepted=True,
                    privacy_accepted=True,
                    terms_version=terms_version,
                    privacy_version=privacy_version,
                    accepted_at=datetime.utcnow(),
                    ip_address="127.0.0.1",
                )
                db.add(consent_record)
                db.commit()
                db.refresh(consent_record)
        except ProgrammingError:
            db.rollback()
            logger.warning("Consent tables not available yet; skipping seed.")
    finally:
        db.close()


@app.get("/")
async def root_health():
    """Lightweight health check for platform probes."""
    return {"status": "ok"}


@app.get("/robots.txt")
async def robots_txt() -> PlainTextResponse:
    return PlainTextResponse("User-agent: *\nDisallow: /\n")


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint with detailed status (Task 421-422).
    Returns status of both main and product databases.
    """
    import time
    from datetime import datetime
    
    checks = {
        "main_database": {"status": "ok", "latency_ms": 0},
        "product_database": {"status": "ok", "latency_ms": 0},
        "api": {"status": "ok"},
    }
    overall_status = "healthy"
    
    # Main Database health check
    try:
        start = time.time()
        with health_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["main_database"]["latency_ms"] = int((time.time() - start) * 1000)
    except Exception as e:
        checks["main_database"]["status"] = "error"
        checks["main_database"]["error"] = str(e)[:100]
        overall_status = "degraded"
    
    if checks["main_database"]["latency_ms"] > 500:
        checks["main_database"]["status"] = "slow"
        if overall_status == "healthy":
            overall_status = "degraded"
    
    # Product Database health check (separate database)
    try:
        product_health = await check_product_database_health()
        checks["product_database"] = product_health
        if product_health["status"] == "error":
            overall_status = "degraded"
    except Exception as e:
        checks["product_database"]["status"] = "error"
        checks["product_database"]["error"] = str(e)[:100]
    
    return {
        "status": overall_status,
        "service": "ai-skincare-intelligence-system",
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks,
    }


@app.get("/api/health/ready")
async def readiness_check():
    """
    Kubernetes-style readiness probe.
    Returns 200 if service is ready to accept traffic.
    """
    try:
        with health_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database not ready")


@app.get("/api/health/live")
async def liveness_check():
    """
    Kubernetes-style liveness probe.
    Returns 200 if service is alive.
    """
    return {"alive": True}
    
# Mount all routers under /api/v1 for consistency
app.include_router(api_router, prefix="/api/v1")
app.include_router(digital_twin.router, prefix="/api/v1", tags=["digital_twin"])  # Sprint 3: Digital Twin
app.include_router(routines_router, prefix="/api/v1", tags=["routines"])
app.include_router(progress_router, prefix="/api/v1", tags=["progress"])
app.include_router(external_products_router, prefix="/api/v1", tags=["external_products"])
app.include_router(products.router)  # Router already includes /api/v1/products prefix
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])  # Admin endpoints
app.include_router(consent.router, prefix="/api/v1", tags=["consent"])  # GDPR Compliance (FR44-FR46)
app.include_router(profile.router, prefix="/api/v1", tags=["profile"])  # User Profile Management

# Sprint GUI-2: New API endpoints for mock-data pages
app.include_router(favorites.router, prefix="/api/v1", tags=["favorites"])  # Favorites API
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])  # Notifications API
app.include_router(shelf.router, prefix="/api/v1", tags=["shelf"])  # Product Shelf API
app.include_router(goals.router, prefix="/api/v1", tags=["goals"])  # Skin Goals API
app.include_router(catalog.router, prefix="/api/v1", tags=["catalog"])  # Product Catalog Database
app.include_router(content.router, prefix="/api/v1", tags=["content"])  # Public blogs, videos, news
app.include_router(search.router, prefix="/api/v1", tags=["search"])  # Unified search

# AI Intelligence Engine — all AI-powered features
from app.routers import ai as ai_router_module
app.include_router(ai_router_module.router)  # Router already includes /api/v1/ai prefix

# Sprint 2: AI Chat Assistant (SSE streaming)
app.include_router(ai_chat_router_module.router, prefix="/api/v1", tags=["ai_chat"])

# Sprint 5: Clinical Intelligence Engine
app.include_router(clinical_router_module.router, prefix="/api/v1", tags=["clinical"])

# Sprint 2: Standardized exception handler
app.add_exception_handler(AppException, app_exception_handler)

# Admin image uploads (blog covers, video thumbnails)
_uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")

# Sprint 3 Digital Twin deployment trigger - Force redeploy
# Backend redeploy stamp: 2026-01-19-02
# Watch path test: /backend/** configured
