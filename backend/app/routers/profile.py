import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.audit import log_profile_event
from app.core.security import (
    decrypt_sensitive_data,
    encrypt_sensitive_data,
    get_current_user,
)
from app.dependencies import get_db
from app.models.scan import ScanSession
from app.models.user import User, UserProfile
from pydantic import BaseModel

from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a profile photo. Returns URL to use in profile_photo_url. Any authenticated user."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, detail="Allowed types: JPEG, PNG, WebP, GIF")
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(400, detail="Max file size 5MB")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ext = "jpg" if file.content_type == "image/jpeg" else "png" if file.content_type == "image/png" else "webp" if file.content_type == "image/webp" else "gif"
    name = f"profile_{current_user.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{ext}"
    path = UPLOADS_DIR / name
    path.write_bytes(contents)
    return {"url": f"/uploads/{name}"}


def _build_profile_response(profile: UserProfile) -> ProfileResponse:
    """Build a full profile response with decrypted fields."""
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        location=profile.location,
        timezone=profile.timezone,
        phone_number=profile.phone_number,
        profile_photo_url=profile.profile_photo_url,
        skin_type=decrypt_sensitive_data(profile.skin_type),
        skin_tone=profile.skin_tone,
        skin_texture=profile.skin_texture,
        pore_size=profile.pore_size,
        moisture_level=profile.moisture_level,
        oil_production=profile.oil_production,
        sensitivity_level=profile.sensitivity_level,
        primary_concern=profile.primary_concern,
        secondary_concerns=decrypt_sensitive_data(profile.secondary_concerns),
        sun_exposure=profile.sun_exposure,
        outdoor_activity_level=profile.outdoor_activity_level,
        water_intake=profile.water_intake,
        sleep_hours=profile.sleep_hours,
        diet_type=profile.diet_type,
        stress_level=profile.stress_level,
        exercise_frequency=profile.exercise_frequency,
        smoking_status=profile.smoking_status,
        alcohol_consumption=profile.alcohol_consumption,
        climate=profile.climate,
        known_allergies=profile.known_allergies,
        current_medications=profile.current_medications,
        skin_conditions=profile.skin_conditions,
        previous_treatments=profile.previous_treatments,
        preferred_ingredients=profile.preferred_ingredients,
        ingredients_to_avoid=profile.ingredients_to_avoid,
        product_texture_preference=profile.product_texture_preference,
        fragrance_preference=profile.fragrance_preference,
        budget_range=profile.budget_range,
        brand_preferences=profile.brand_preferences,
        routine_frequency=profile.routine_frequency,
        current_routine_products=profile.current_routine_products,
        goals=decrypt_sensitive_data(profile.goals),
        concerns=decrypt_sensitive_data(profile.secondary_concerns),
        email_notifications=profile.email_notifications,
        push_notifications=profile.push_notifications,
        sms_notifications=profile.sms_notifications,
        marketing_emails=profile.marketing_emails,
        profile_visibility=profile.profile_visibility,
        share_progress=profile.share_progress,
        allow_data_analysis=profile.allow_data_analysis,
        profile_complete=profile.profile_complete,
        completion_percentage=profile.completion_percentage,
        last_profile_update=profile.last_profile_update,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.post("/baseline", response_model=ProfileResponse)
async def create_baseline_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create baseline user profile from onboarding flow.

    SRS Traceability:
    - UR1: Create an account, define goals, and specify primary concerns
    - FR46: Tag analyses with model version and provide human-readable explanation factors
    - NFR4: Use AES-256 encryption for sensitive data at rest and TLS in transit
    - NFR6: Data stored regionally where required (GDPR and equivalent compliance)

    Sprint: 1.2 - Story 1.2
    """
    try:
        # Check if profile already exists
        existing_profile = (
            db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        )

        if existing_profile:
            raise HTTPException(
                status_code=400,
                detail="Profile already exists. Use PATCH /profile to update.",
            )

        # Validate profile data
        if len(profile_data.goals) < 1 or len(profile_data.goals) > 3:
            raise HTTPException(status_code=400, detail="Goals must be 1-3 selections")

        if len(profile_data.concerns) < 1 or len(profile_data.concerns) > 5:
            raise HTTPException(
                status_code=400, detail="Concerns must be 1-5 selections"
            )

        # Encrypt sensitive fields (NFR4: AES-256)
        encrypted_goals = encrypt_sensitive_data(profile_data.goals)
        encrypted_concerns = encrypt_sensitive_data(profile_data.concerns)
        encrypted_skin_type = encrypt_sensitive_data(profile_data.skin_type)

        # Create profile record
        user_profile = UserProfile(
            user_id=current_user.id,
            goals=encrypted_goals,
            primary_concern=profile_data.concerns[0],
            secondary_concerns=encrypted_concerns,
            skin_type=encrypted_skin_type,
            routine_frequency=profile_data.routine_frequency,
            climate=profile_data.climate,
            profile_complete=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)

        # Audit log (immutable record)
        await log_profile_event(
            db=db,
            user_id=current_user.id,
            event_type="profile_created",
            new_value=profile_data.model_dump(),
            ip_address=None,  # TODO: Extract from request
        )

        logger.info(
            f"Profile created for user {current_user.id}",
            extra={
                "user_id": str(current_user.id),
                "event": "profile_created",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        return _build_profile_response(user_profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile creation failed")


@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Get current user's profile.

    SRS: FR46, UR1
    Sprint: 1.2 - Story 1.6
    """
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )

    if not profile:
        raise HTTPException(
            status_code=404, detail="Profile not found. Complete onboarding first."
        )

    # Decrypt sensitive fields
    return _build_profile_response(profile)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update user profile.

    SRS: FR46, UR1, NFR4
    Sprint: 1.2 - Story 1.6
    """
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Store old values for audit log
    old_values = {
        "goals": decrypt_sensitive_data(profile.goals),
        "concerns": decrypt_sensitive_data(profile.secondary_concerns),
        "skin_type": decrypt_sensitive_data(profile.skin_type),
        "routine_frequency": profile.routine_frequency,
        "climate": profile.climate,
    }

    # Update fields if provided
    update_data = profile_update.model_dump(exclude_unset=True)

    if "goals" in update_data:
        if len(update_data["goals"]) < 1 or len(update_data["goals"]) > 3:
            raise HTTPException(status_code=400, detail="Goals must be 1-3 selections")
        profile.goals = encrypt_sensitive_data(update_data["goals"])

    if "concerns" in update_data:
        if len(update_data["concerns"]) < 1 or len(update_data["concerns"]) > 5:
            raise HTTPException(
                status_code=400, detail="Concerns must be 1-5 selections"
            )
        profile.secondary_concerns = encrypt_sensitive_data(update_data["concerns"])
        profile.primary_concern = update_data["concerns"][0]

    if "skin_type" in update_data:
        profile.skin_type = encrypt_sensitive_data(update_data["skin_type"])

    if "routine_frequency" in update_data:
        profile.routine_frequency = update_data["routine_frequency"]

    if "climate" in update_data:
        profile.climate = update_data["climate"]

    # Personal information
    if "first_name" in update_data:
        profile.first_name = update_data["first_name"]
    if "last_name" in update_data:
        profile.last_name = update_data["last_name"]
    if "first_name" in update_data or "last_name" in update_data:
        fn = (profile.first_name or "").strip()
        ln = (profile.last_name or "").strip()
        if not fn and not ln:
            raise HTTPException(
                status_code=400,
                detail="Full name is required. Provide at least first or last name.",
            )
    if "date_of_birth" in update_data:
        profile.date_of_birth = update_data["date_of_birth"]
    if "gender" in update_data:
        profile.gender = update_data["gender"]
    if "location" in update_data:
        profile.location = update_data["location"]
    if "timezone" in update_data:
        profile.timezone = update_data["timezone"]
    if "phone_number" in update_data:
        profile.phone_number = update_data["phone_number"]
    if "profile_photo_url" in update_data:
        profile.profile_photo_url = update_data["profile_photo_url"]

    # Skin profile
    if "skin_tone" in update_data:
        profile.skin_tone = update_data["skin_tone"]
    if "skin_texture" in update_data:
        profile.skin_texture = update_data["skin_texture"]
    if "pore_size" in update_data:
        profile.pore_size = update_data["pore_size"]
    if "moisture_level" in update_data:
        profile.moisture_level = update_data["moisture_level"]
    if "oil_production" in update_data:
        profile.oil_production = update_data["oil_production"]
    if "sensitivity_level" in update_data:
        profile.sensitivity_level = update_data["sensitivity_level"]
    if "primary_concern" in update_data:
        profile.primary_concern = update_data["primary_concern"]
    if "secondary_concerns" in update_data:
        profile.secondary_concerns = update_data["secondary_concerns"]

    # Lifestyle & environmental
    if "sun_exposure" in update_data:
        profile.sun_exposure = update_data["sun_exposure"]
    if "outdoor_activity_level" in update_data:
        profile.outdoor_activity_level = update_data["outdoor_activity_level"]
    if "water_intake" in update_data:
        profile.water_intake = update_data["water_intake"]
    if "sleep_hours" in update_data:
        profile.sleep_hours = update_data["sleep_hours"]
    if "diet_type" in update_data:
        profile.diet_type = update_data["diet_type"]
    if "stress_level" in update_data:
        profile.stress_level = update_data["stress_level"]
    if "exercise_frequency" in update_data:
        profile.exercise_frequency = update_data["exercise_frequency"]
    if "smoking_status" in update_data:
        profile.smoking_status = update_data["smoking_status"]
    if "alcohol_consumption" in update_data:
        profile.alcohol_consumption = update_data["alcohol_consumption"]

    # Medical & history
    if "known_allergies" in update_data:
        profile.known_allergies = update_data["known_allergies"]
    if "current_medications" in update_data:
        profile.current_medications = update_data["current_medications"]
    if "skin_conditions" in update_data:
        profile.skin_conditions = update_data["skin_conditions"]
    if "previous_treatments" in update_data:
        profile.previous_treatments = update_data["previous_treatments"]

    # Preferences
    if "preferred_ingredients" in update_data:
        profile.preferred_ingredients = update_data["preferred_ingredients"]
    if "ingredients_to_avoid" in update_data:
        profile.ingredients_to_avoid = update_data["ingredients_to_avoid"]
    if "product_texture_preference" in update_data:
        profile.product_texture_preference = update_data["product_texture_preference"]
    if "fragrance_preference" in update_data:
        profile.fragrance_preference = update_data["fragrance_preference"]
    if "budget_range" in update_data:
        profile.budget_range = update_data["budget_range"]
    if "brand_preferences" in update_data:
        profile.brand_preferences = update_data["brand_preferences"]

    # Skincare routine
    if "current_routine_products" in update_data:
        profile.current_routine_products = update_data["current_routine_products"]

    # Notification preferences
    if "email_notifications" in update_data:
        profile.email_notifications = update_data["email_notifications"]
    if "push_notifications" in update_data:
        profile.push_notifications = update_data["push_notifications"]
    if "sms_notifications" in update_data:
        profile.sms_notifications = update_data["sms_notifications"]
    if "marketing_emails" in update_data:
        profile.marketing_emails = update_data["marketing_emails"]

    # Privacy settings
    if "profile_visibility" in update_data:
        profile.profile_visibility = update_data["profile_visibility"]
    if "share_progress" in update_data:
        profile.share_progress = update_data["share_progress"]
    if "allow_data_analysis" in update_data:
        profile.allow_data_analysis = update_data["allow_data_analysis"]

    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    # Audit log
    await log_profile_event(
        db=db,
        user_id=current_user.id,
        event_type="profile_updated",
        old_value=old_values,
        new_value=update_data,
        ip_address=None,
    )

    # Return decrypted profile
    return _build_profile_response(profile)


@router.get("/export")
async def export_profile_data(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    GDPR data export - download all user profile data.

    SRS: FR44, NFR6
    Sprint: 1.2 - Story 1.6
    """
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )

    if not profile:
        return {"message": "No profile data found"}

    scans = (
        db.query(ScanSession)
        .filter(ScanSession.user_id == current_user.id)
        .order_by(ScanSession.created_at.desc())
        .all()
    )

    scan_export = []
    for scan in scans:
        metadata = scan.scan_metadata or {}
        scan_export.append(
            {
                "scan_id": str(scan.id),
                "status": scan.status.value if scan.status else None,
                "image_url": scan.image_url,
                "image_content_type": scan.image_content_type,
                "image_filename": scan.image_filename,
                "created_at": scan.created_at.isoformat() if scan.created_at else None,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
                "summary": metadata.get("summary"),
                "recommendations": metadata.get("recommendations"),
                "result": metadata,
            }
        )

    export_data = {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
        },
        "profile": {
            "goals": decrypt_sensitive_data(profile.goals),
            "concerns": decrypt_sensitive_data(profile.secondary_concerns),
            "skin_type": decrypt_sensitive_data(profile.skin_type),
            "routine_frequency": profile.routine_frequency,
            "climate": profile.climate,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
        },
        "scans": scan_export,
        "export_timestamp": datetime.utcnow().isoformat(),
    }

    logger.info(f"Profile data exported for user {current_user.id}")

    return export_data


@router.delete("")
async def delete_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Initiate account deletion (14-day grace period).

    SRS: FR44, NFR6
    Sprint: 1.2 - Story 1.6
    """
    # TODO: Implement 14-day grace period logic
    # For now, immediate deletion

    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )

    if profile:
        db.delete(profile)

    db.delete(current_user)
    db.commit()

    logger.info(f"Account deletion initiated for user {current_user.id}")

    return {
        "message": "Account deletion initiated. Data will be removed within 14 days."
    }


# ===== Sprint 3 Endpoints =====


class CompletionFieldItem(BaseModel):
    field: str
    label: str
    hint: str
    completed: bool


PROFILE_FIELD_HINTS = {
    "skin_type": {"label": "Skin Type", "hint": "Knowing your skin type helps us tailor every recommendation."},
    "skin_tone": {"label": "Skin Tone", "hint": "Helps calibrate scan analysis for more accurate results."},
    "primary_concern": {"label": "Primary Concern", "hint": "Tell us your top skin concern so we can prioritise it."},
    "date_of_birth": {"label": "Date of Birth", "hint": "Age affects skin behaviour — this helps us personalise anti-aging advice."},
    "location": {"label": "Location", "hint": "Local climate and UV index influence your skin health."},
    "gender": {"label": "Gender", "hint": "Hormonal differences can affect skin — share if you're comfortable."},
    "sun_exposure": {"label": "Sun Exposure", "hint": "UV is the #1 cause of premature aging."},
    "water_intake": {"label": "Daily Water Intake", "hint": "Hydration from within matters just as much as topical products."},
    "sleep_hours": {"label": "Average Sleep Hours", "hint": "Sleep is when your skin repairs itself."},
    "routine_frequency": {"label": "Routine Frequency", "hint": "Lets us build a routine that fits your lifestyle."},
    "goals": {"label": "Skincare Goals", "hint": "Define 1-3 goals so we can track your progress."},
    "climate": {"label": "Climate", "hint": "Your environment shapes which products work best for you."},
}


@router.get("/completion-guide")
async def get_completion_guide(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a list of profile fields with completion status and helpful hints.

    Sprint: 3 — Profile completion guide
    """
    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    )

    items = []
    for field, meta in PROFILE_FIELD_HINTS.items():
        completed = False
        if profile:
            value = getattr(profile, field, None)
            completed = value is not None and value != "" and value != []
        items.append(
            CompletionFieldItem(
                field=field,
                label=meta["label"],
                hint=meta["hint"],
                completed=completed,
            )
        )

    total = len(items)
    filled = sum(1 for i in items if i.completed)

    return {
        "fields": [i.model_dump() for i in items],
        "total_fields": total,
        "completed_fields": filled,
        "completion_percentage": int((filled / total) * 100) if total else 0,
    }


class QuizOption(BaseModel):
    value: str
    label: str


class QuizQuestion(BaseModel):
    id: str
    text: str
    options: list[QuizOption]


SKIN_TYPE_QUIZ = [
    QuizQuestion(
        id="wash_feel",
        text="How does your skin feel 30 minutes after washing your face with a gentle cleanser?",
        options=[
            QuizOption(value="tight", label="Tight and dry"),
            QuizOption(value="comfortable", label="Comfortable and balanced"),
            QuizOption(value="oily_tzone", label="Oily in the T-zone only"),
            QuizOption(value="oily_all", label="Oily all over"),
        ],
    ),
    QuizQuestion(
        id="pore_visibility",
        text="How visible are your pores?",
        options=[
            QuizOption(value="barely", label="Barely visible"),
            QuizOption(value="small", label="Small, only noticeable up close"),
            QuizOption(value="medium_tzone", label="Medium — mostly in T-zone"),
            QuizOption(value="large", label="Large and visible across cheeks too"),
        ],
    ),
    QuizQuestion(
        id="midday_shine",
        text="By midday, does your face look shiny?",
        options=[
            QuizOption(value="never", label="Never — it actually feels dry"),
            QuizOption(value="rarely", label="Rarely"),
            QuizOption(value="tzone", label="Only on forehead and nose"),
            QuizOption(value="everywhere", label="Yes, almost everywhere"),
        ],
    ),
    QuizQuestion(
        id="reaction",
        text="How does your skin react to new products?",
        options=[
            QuizOption(value="often_irritated", label="Often gets red or irritated"),
            QuizOption(value="sometimes", label="Sometimes sensitive"),
            QuizOption(value="rarely", label="Rarely reacts"),
            QuizOption(value="never", label="Never had a reaction"),
        ],
    ),
    QuizQuestion(
        id="hydration",
        text="How often does your skin feel dehydrated or flaky?",
        options=[
            QuizOption(value="always", label="Almost always"),
            QuizOption(value="winter", label="Mostly in winter or dry weather"),
            QuizOption(value="rarely", label="Rarely"),
            QuizOption(value="never", label="Never — it stays moisturised on its own"),
        ],
    ),
]


@router.get("/skin-type-quiz")
async def get_skin_type_quiz():
    """
    Return a static skin-type quiz with 5 questions.

    Sprint: 3 — Skin type quiz
    """
    return {"questions": [q.model_dump() for q in SKIN_TYPE_QUIZ]}
