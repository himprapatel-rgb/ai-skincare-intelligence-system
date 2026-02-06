import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from datetime import date, datetime

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, ProgrammingError

from middleware.request_tracing import RequestTracingMiddleware
from middleware.ip_geo_logging import IPGeoLoggingMiddleware
from app.api.v1 import api_router
from app.api.v1.products import router as external_products_router
from app.api.v1.progress import router as progress_router
from app.api.v1.routines import router as routines_router
from app.config import settings
from app.core.security import encrypt_sensitive_data
from app.database import Base, SessionLocal, engine
from app.product_database import create_product_tables, check_product_database_health
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
from app.models.twin_models import *  # Digital Twin models
from app.models.content import Blog, NewsItem, Video
from app.models.user import PolicyVersion, User, UserAccessLog, UserConsent, UserProfile
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
    shelf,
)
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)

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

# TrustedHostMiddleware removed: Starlette rejects bare * and *.domain patterns.
# CORS + explicit origins provide adequate protection for Railway deployment.

# Task 425: Request tracing with correlation IDs
app.add_middleware(RequestTracingMiddleware)
# Record IP and geolocation on each authenticated request; update User and UserAccessLog
app.add_middleware(IPGeoLoggingMiddleware)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    # API responses must be readable by cross-origin frontends (pellicura.com → Railway backend).
    # "same-site" would block responses when frontend and backend are on different domains.
    if request.url.path.startswith("/api/"):
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    else:
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.on_event("startup")
def ensure_test_user() -> None:
    """Create all database tables and seed test user if missing."""
    try:
        # Create all tables from SQLAlchemy models (non-destructive)
        logger.info("Creating database tables (if not exist)...")
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("✅ Main database tables ensured")
        
        # Create product catalog tables (separate database)
        logger.info("Creating product catalog tables...")
        create_product_tables()
        logger.info("✅ Product catalog tables ensured")
        
        if engine.dialect.name != "sqlite":
            with engine.begin() as conn:
                # Ensure admin flag exists on users table (production safety)
                try:
                    conn.execute(
                        text(
                            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE"
                        )
                    )
                except ProgrammingError:
                    pass
                try:
                    conn.execute(
                        text("ALTER TABLE user_profiles ALTER COLUMN skin_type TYPE TEXT")
                    )
                except ProgrammingError:
                    pass
                # Allow NULL user_id for guest scans
                try:
                    conn.execute(
                        text("ALTER TABLE scan_sessions ALTER COLUMN user_id DROP NOT NULL")
                    )
                except ProgrammingError:
                    pass  # Column might already be nullable
                # Ensure scan image storage columns exist (Railway/Postgres)
                try:
                    conn.execute(
                        text("ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS image_data BYTEA")
                    )
                    conn.execute(
                        text(
                            "ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS image_content_type VARCHAR(100)"
                        )
                    )
                    conn.execute(
                        text(
                            "ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255)"
                        )
                    )
                except ProgrammingError:
                    pass
                # IP & geolocation tracking
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip_address VARCHAR(45)"))
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_geolocation JSONB"))
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE"))
                except ProgrammingError:
                    pass
    except ProgrammingError:
        logger.warning("Unable to create auth tables; skipping seed.")
        return

    db = SessionLocal()
    try:
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
        with engine.connect() as conn:
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
        with engine.connect() as conn:
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

# Admin image uploads (blog covers, video thumbnails)
_uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
    }


# Sprint 3 Digital Twin deployment trigger - Force redeploy
# Backend redeploy stamp: 2026-01-19-02
# Watch path test: /backend/** configured
