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
    """Add ALL Sprint 1-5 columns to existing production tables. Safe to run repeatedly."""
    _cols = [
        # Users (Sprint 1-2)
        ("users", "refresh_token", "VARCHAR(512)"),
        ("users", "failed_login_count", "INTEGER DEFAULT 0"),
        ("users", "locked_until", "TIMESTAMPTZ"),
        ("users", "login_count", "INTEGER DEFAULT 0"),
        ("users", "deleted_at", "TIMESTAMPTZ"),
        ("users", "language", "VARCHAR(10) DEFAULT 'en'"),
        ("users", "password_reset_token", "VARCHAR(255)"),
        ("users", "password_reset_expires_at", "TIMESTAMPTZ"),
        # Scan sessions (Sprint 1)
        ("scan_sessions", "device_type", "VARCHAR(50)"),
        ("scan_sessions", "client_version", "VARCHAR(50)"),
        ("scan_sessions", "processing_duration_ms", "INTEGER"),
        ("scan_sessions", "storage_key", "VARCHAR(500)"),
        # Shelf products (Sprint 1)
        ("shelf_products", "opened_date", "TIMESTAMPTZ"),
        ("shelf_products", "pao_months", "INTEGER"),
        # Notifications (Sprint 1)
        ("notifications", "priority", "VARCHAR(20) DEFAULT 'normal'"),
        ("notifications", "category", "VARCHAR(50)"),
        # User profiles (Sprint 1)
        ("user_profiles", "fitzpatrick_type", "VARCHAR(10)"),
        ("user_profiles", "pregnancy_status", "VARCHAR(20)"),
        ("user_profiles", "avatar_storage_key", "VARCHAR(500)"),
        # Products (Sprint 1)
        ("products", "description", "TEXT"),
        ("products", "ingredients_text", "TEXT"),
        ("products", "country_of_origin", "VARCHAR(100)"),
        ("products", "discontinued", "BOOLEAN DEFAULT FALSE"),
        # Content / Blog (Sprint 1)
        ("blogs", "category", "VARCHAR(100)"),
        ("blogs", "tags", "JSONB"),
        ("blogs", "view_count", "INTEGER DEFAULT 0"),
    ]
    try:
        with eng.connect() as conn:
            for table, col, col_type in _cols:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                except Exception:
                    pass
            conn.commit()
        logger.info("✅ Missing columns check complete (%d columns checked)", len(_cols))
    except Exception as exc:
        logger.warning("Column migration skipped: %s", exc)


def _seed_blog_articles(eng) -> None:
    """Seed initial blog articles if the blogs table is empty."""
    _articles = [
        {
            "title": "Building a Simple Morning Skincare Routine",
            "slug": "morning-skincare-routine",
            "excerpt": "A step-by-step guide to creating an effective AM routine with cleansing, vitamin C, moisturizer, and SPF.",
            "content": "<h2>Why Morning Routines Matter</h2><p>Your morning skincare routine sets the foundation for how your skin performs throughout the day. A consistent AM routine protects against UV damage, environmental pollutants, and helps maintain hydration levels.</p><h2>The 4-Step Morning Routine</h2><h3>1. Gentle Cleanser</h3><p>Start with a gentle, pH-balanced cleanser to remove overnight oil and product residue without stripping your barrier. Look for ingredients like glycerin or ceramides.</p><h3>2. Vitamin C Serum</h3><p>Apply a 10-20% L-ascorbic acid serum to brighten skin, fade dark spots, and provide antioxidant protection against free radicals.</p><h3>3. Moisturizer</h3><p>Lock in hydration with a lightweight moisturizer containing hyaluronic acid or niacinamide. Even oily skin types benefit from moisturizing.</p><h3>4. Broad-Spectrum SPF 30+</h3><p>Non-negotiable. Apply SPF as the last step of your routine, reapplying every 2 hours if exposed to direct sunlight.</p>",
            "category": "Routines",
            "tags": ["morning routine", "SPF", "vitamin C", "beginner"],
            "read_time_min": 5,
        },
        {
            "title": "Understanding Ingredient Interactions",
            "slug": "ingredient-interactions",
            "excerpt": "Learn which skincare ingredients work together and which combinations to avoid for healthier skin.",
            "content": "<h2>Why Ingredient Pairing Matters</h2><p>Using the wrong combination of active ingredients can cause irritation, reduce effectiveness, or even damage your skin barrier. Understanding these interactions helps you build a safer, more effective routine.</p><h2>Combinations to Avoid</h2><h3>Retinol + AHA/BHA Acids</h3><p>Both are potent exfoliants. Using them together can cause excessive irritation, redness, and peeling. Use retinol at night and acids in the morning, or alternate nights.</p><h3>Vitamin C + Niacinamide (Myth!)</h3><p>Despite old advice, modern formulations of vitamin C and niacinamide work well together. This combination is actually complementary for brightening.</p><h3>Benzoyl Peroxide + Retinol</h3><p>Benzoyl peroxide can oxidize and deactivate retinol. If you use both, apply them at different times of day.</p><h2>Power Combinations</h2><ul><li><strong>Vitamin C + Vitamin E + Ferulic Acid</strong> — Enhanced antioxidant protection</li><li><strong>Hyaluronic Acid + Ceramides</strong> — Maximum hydration and barrier repair</li><li><strong>Niacinamide + Zinc</strong> — Oil control and anti-inflammatory benefits</li></ul>",
            "category": "Ingredients",
            "tags": ["ingredients", "retinol", "vitamin C", "acids"],
            "read_time_min": 7,
        },
        {
            "title": "How to Track Your Skin Progress with AI Scans",
            "slug": "tracking-progress-scans",
            "excerpt": "Consistent scanning reveals patterns your mirror can't. Learn how to get the most accurate results.",
            "content": "<h2>Why Track Your Skin?</h2><p>Small daily changes are invisible to the naked eye. AI-powered skin analysis detects subtle shifts in hydration, texture, and pigmentation that accumulate over weeks. Tracking these changes helps you know what's working.</p><h2>Best Practices for Accurate Scans</h2><h3>Lighting</h3><p>Use consistent, diffused natural light. Avoid direct sunlight or harsh overhead lighting that creates shadows. A north-facing window provides ideal conditions.</p><h3>Timing</h3><p>Scan at the same time each session — ideally morning before applying products. Your skin's condition varies throughout the day.</p><h3>Positioning</h3><p>Keep your face centered, front-facing, at arm's length. Remove glasses, hair from face, and any makeup or sunscreen.</p><h2>How Often Should You Scan?</h2><p>Weekly scans provide the best balance of data density and meaningful change detection. Bi-weekly scans work for maintenance phases. Daily scanning adds noise without much signal.</p>",
            "category": "Tips",
            "tags": ["scanning", "progress", "AI", "tips"],
            "read_time_min": 6,
        },
        {
            "title": "Decoding Your Skin Type: A Complete Guide",
            "slug": "skin-type-guide",
            "excerpt": "Understanding whether you have oily, dry, combination, or sensitive skin is the foundation of effective skincare.",
            "content": "<h2>The Four Main Skin Types</h2><h3>Oily Skin</h3><p>Characterized by excess sebum production, visible pores, and a shiny appearance. Oily skin is prone to breakouts but ages more slowly due to natural moisture. <strong>Key ingredients:</strong> Niacinamide, salicylic acid, lightweight moisturizers.</p><h3>Dry Skin</h3><p>Feels tight, may show flaking or rough patches. Dry skin lacks natural oils and needs rich, emollient products. <strong>Key ingredients:</strong> Ceramides, squalane, hyaluronic acid, heavy creams.</p><h3>Combination Skin</h3><p>Oily T-zone (forehead, nose, chin) with dry or normal cheeks. The most common skin type. <strong>Key ingredients:</strong> Balanced moisturizers, zone-specific treatments.</p><h3>Sensitive Skin</h3><p>Reacts easily to products, weather, and stress with redness, stinging, or irritation. <strong>Key ingredients:</strong> Centella asiatica, aloe vera, fragrance-free formulations.</p><h2>Take Our Quiz</h2><p>Not sure about your skin type? Take our <a href='/skin-quiz'>Skin Type Quiz</a> to get personalized results and product recommendations.</p>",
            "category": "Education",
            "tags": ["skin type", "oily", "dry", "combination", "sensitive"],
            "read_time_min": 8,
        },
        {
            "title": "The Science Behind Retinol: What You Need to Know",
            "slug": "retinol-science",
            "excerpt": "Retinol is the gold standard of anti-aging. Here's how it works, how to start, and what to expect.",
            "content": "<h2>What Is Retinol?</h2><p>Retinol is a form of vitamin A that accelerates cell turnover, stimulates collagen production, and helps unclog pores. It's one of the most well-researched ingredients in dermatology with decades of clinical evidence.</p><h2>Benefits</h2><ul><li>Reduces fine lines and wrinkles</li><li>Fades hyperpigmentation and dark spots</li><li>Improves skin texture and tone</li><li>Helps prevent and treat acne</li><li>Increases collagen production</li></ul><h2>How to Start</h2><p>Begin with a low concentration (0.025-0.03%) applied 2-3 nights per week. Gradually increase frequency over 4-6 weeks as your skin builds tolerance. Always use SPF during the day when using retinol.</p><h2>Common Side Effects</h2><p>Initial purging (2-6 weeks), dryness, flaking, and sensitivity are normal. These typically resolve as your skin adjusts. If irritation persists beyond 6 weeks, reduce frequency or switch to a lower concentration.</p>",
            "category": "Ingredients",
            "tags": ["retinol", "anti-aging", "vitamin A", "science"],
            "read_time_min": 6,
        },
    ]
    try:
        with eng.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM blogs"))
            count = result.scalar() or 0
            if count > 0:
                return  # Already seeded
            for article in _articles:
                conn.execute(
                    text(
                        "INSERT INTO blogs (title, slug, excerpt, content, category, tags, read_time_min, published) "
                        "VALUES (:title, :slug, :excerpt, :content, :category, :tags, :read_time_min, true)"
                    ),
                    {
                        "title": article["title"],
                        "slug": article["slug"],
                        "excerpt": article["excerpt"],
                        "content": article["content"],
                        "category": article["category"],
                        "tags": str(article["tags"]).replace("'", '"'),  # JSON format
                        "read_time_min": article["read_time_min"],
                    },
                )
            conn.commit()
            logger.info("✅ Seeded %d blog articles", len(_articles))
    except Exception as exc:
        logger.warning("Blog seeding skipped: %s", exc)


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
        _seed_blog_articles(engine)
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
