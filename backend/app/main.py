
import logging
from datetime import date, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, ProgrammingError

from app.api.v1 import api_router
from app.api.v1.products import router as external_products_router
from app.api.v1.progress import router as progress_router
from app.api.v1.routines import router as routines_router
from app.config import settings
from app.core.security import encrypt_sensitive_data
from app.database import Base, SessionLocal, engine
from app.models.twin_models import *  # Import Digital Twin models for table creation# Create database tables if needed (safe for local dev)
from app.models.user import PolicyVersion, User, UserConsent, UserProfile
from app.routers import (  # GDPR & User Management
    admin,
    consent,
    digital_twin,
    products,
    profile,
    scan,
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

@app.on_event("startup")
def ensure_test_user() -> None:
    """Create a static test user and full profile if missing."""
    try:
        User.__table__.create(bind=engine, checkfirst=True)
        PolicyVersion.__table__.create(bind=engine, checkfirst=True)
        UserProfile.__table__.create(bind=engine, checkfirst=True)
        UserConsent.__table__.create(bind=engine, checkfirst=True)
        
        # Import ScanSession to ensure table creation
        from app.models.scan import ScanSession
        ScanSession.__table__.create(bind=engine, checkfirst=True)
        
        if engine.dialect.name != "sqlite":
            with engine.begin() as conn:
                conn.execute(
                    text("ALTER TABLE user_profiles ALTER COLUMN skin_type TYPE TEXT")
                )
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
    except ProgrammingError:
        logger.warning("Unable to create auth tables; skipping seed.")
        return

    db = SessionLocal()
    try:
        email = "himanshu@test.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            hashed_password = auth_service.hash_password("Test1234!")
            user = User(
                email=email,
                hashed_password=hashed_password,
                full_name="Himanshu Patel",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("✅ Seeded test user: Himanshu (%s)", email)

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
    """Simple health check endpoint - always returns 200 OK"""
    return {"status": "healthy", "service": "ai-skincare-intelligence-system"}
    
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

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
    }


# Sprint 3 Digital Twin deployment trigger - Force redeploy
# Backend redeploy stamp: 2026-01-19-02
# Watch path test: /backend/** configured
