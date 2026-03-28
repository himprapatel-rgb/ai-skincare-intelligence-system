"""AI Intelligence Router — All AI-powered endpoints.

Exposes the AI Intelligence Service features via REST API:
- /recommendations — AI-ranked product recommendations
- /routine — AI-generated AM/PM routine
- /ingredients — AI ingredient analysis
- /notifications/smart — AI-generated smart notifications
- /content/curated — AI content curation
- /predict — AI skin prediction (smarter digital twin)
- /compare — Before/after scan comparison
- /trends — Seasonal trend detection
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_current_user_optional
from app.database import get_db
from app.models.scan import ScanSession
from app.models.shelf import ShelfProduct
from app.models.user import User, UserProfile
from app.services.ai_intelligence_service import (
    ai_analyze_ingredients,
    ai_compare_scans,
    ai_curate_content,
    ai_detect_seasonal_trends,
    ai_generate_notifications,
    ai_generate_routine,
    ai_predict_skin_future,
    ai_recommend_products,
    ai_rerank_search,
    AIServiceError,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["ai-intelligence"],
)


# =============================================================================
# SCHEMAS
# =============================================================================

class RecommendationRequest(BaseModel):
    budget: Optional[str] = Field(None, description="budget, mid-range, or premium")
    max_results: int = Field(10, ge=1, le=30)

class RoutineRequest(BaseModel):
    goals: Optional[List[str]] = None

class IngredientRequest(BaseModel):
    ingredients: List[str] = Field(..., min_length=1, max_length=50)

class CompareRequest(BaseModel):
    scan_id_before: str
    scan_id_after: str

class PredictRequest(BaseModel):
    weeks_ahead: int = Field(4, ge=1, le=12)
    products_in_use: Optional[List[str]] = None

class TrendsRequest(BaseModel):
    location: Optional[str] = None


# =============================================================================
# HELPER: Get user profile data
# =============================================================================

def _get_user_profile_data(db: Session, user: User) -> dict:
    """Extract skin type, concerns, and other profile data for AI context."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        return {"skin_type": "unknown", "concerns": []}

    from app.services.auth_service import decrypt_sensitive_data
    skin_type = "unknown"
    concerns = []
    try:
        raw = decrypt_sensitive_data(profile.skin_type)
        if raw:
            skin_type = raw
    except Exception:
        pass
    try:
        raw = decrypt_sensitive_data(profile.secondary_concerns)
        if raw:
            import json
            concerns = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        pass

    return {
        "skin_type": skin_type,
        "concerns": concerns if isinstance(concerns, list) else [],
        "age": getattr(profile, "age", None),
        "climate": getattr(profile, "climate", None),
        "water_intake": getattr(profile, "water_intake", None),
        "sleep_hours": getattr(profile, "sleep_hours", None),
    }


def _get_shelf_products(db: Session, user: User) -> list:
    """Get user's shelf products as dicts."""
    products = db.query(ShelfProduct).filter(
        ShelfProduct.user_id == user.id,
        ShelfProduct.status == "active",
    ).all()
    return [
        {
            "product_name": p.product_name,
            "product_brand": p.product_brand,
            "product_category": p.product_category,
            "status": p.status,
            "expiry_date": str(p.expiry_date) if p.expiry_date else None,
        }
        for p in products
    ]


def _get_recent_scans(db: Session, user: User, limit: int = 10) -> list:
    """Get user's recent scan results."""
    from sqlalchemy import desc
    from sqlalchemy.orm import defer
    scans = (
        db.query(ScanSession)
        .options(defer(ScanSession.image_data))
        .filter(ScanSession.user_id == user.id, ScanSession.status == "completed")
        .order_by(desc(ScanSession.created_at))
        .limit(limit)
        .all()
    )
    results = []
    for s in scans:
        meta = s.scan_metadata or {}
        result = meta.get("result", {})
        analysis = result.get("analysis", {})
        summary = analysis.get("summary", {})
        results.append({
            "scan_id": str(s.id),
            "created_at": s.created_at.isoformat() if s.created_at else "",
            "overall_score": summary.get("overall_score", 0),
            "scores": summary.get("scores", {}),
            "concerns": [c.get("concern_type", "") for c in analysis.get("concerns_detail", [])],
        })
    return results


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/recommendations")
async def get_ai_recommendations(
    body: RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-ranked product recommendations based on your skin profile."""
    profile = _get_user_profile_data(db, current_user)

    # Get products from DB to rank
    from app.models.product_models import Product
    products = db.query(Product).limit(30).all()
    product_dicts = [
        {
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "key_ingredients": (p.key_ingredients or []) if hasattr(p, "key_ingredients") else [],
            "average_rating": getattr(p, "average_rating", None),
        }
        for p in products
    ]

    result = await ai_recommend_products(
        skin_type=profile["skin_type"],
        concerns=profile["concerns"],
        products=product_dicts,
        budget=body.budget,
        max_results=body.max_results,
    )
    return {"recommendations": result, "skin_type": profile["skin_type"], "concerns": profile["concerns"]}


@router.post("/routine")
async def generate_ai_routine(
    body: RoutineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a personalized AM/PM skincare routine using AI."""
    profile = _get_user_profile_data(db, current_user)
    shelf = _get_shelf_products(db, current_user)

    result = await ai_generate_routine(
        skin_type=profile["skin_type"],
        concerns=profile["concerns"],
        shelf_products=shelf,
        goals=body.goals,
    )
    return result


@router.post("/ingredients")
async def analyze_ingredients(
    body: IngredientRequest,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """AI-powered ingredient analysis — works with any ingredient list."""
    profile_data = {}
    if current_user:
        profile_data = _get_user_profile_data(db, current_user)

    result = await ai_analyze_ingredients(
        ingredients=body.ingredients,
        skin_type=profile_data.get("skin_type"),
        concerns=profile_data.get("concerns"),
    )
    return result


@router.get("/notifications/smart")
async def get_smart_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated personalized notifications."""
    profile = _get_user_profile_data(db, current_user)
    scans = _get_recent_scans(db, current_user, limit=5)
    shelf = _get_shelf_products(db, current_user)

    result = await ai_generate_notifications(
        user_profile=profile,
        recent_scans=scans,
        shelf_products=shelf,
    )
    return {"notifications": result}


@router.get("/content/curated")
async def get_curated_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-curated content recommendations."""
    from app.models.content import Blog as BlogPost
    profile = _get_user_profile_data(db, current_user)

    try:
        posts = db.query(BlogPost).filter(BlogPost.published == True).limit(20).all()
        content = [
            {"title": p.title, "category": getattr(p, "category", ""), "tags": getattr(p, "tags", []), "id": p.id, "slug": getattr(p, "slug", "")}
            for p in posts
        ]
    except Exception:
        content = []

    if not content:
        return {"curated": [], "message": "No content available yet"}

    result = await ai_curate_content(
        skin_type=profile["skin_type"],
        concerns=profile["concerns"],
        available_content=content,
    )
    return {"curated": result}


@router.post("/predict")
async def predict_skin_future(
    body: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered skin condition prediction (smarter digital twin)."""
    scans = _get_recent_scans(db, current_user, limit=1)
    if not scans:
        raise HTTPException(status_code=404, detail="No scan history found. Complete a scan first.")

    profile = _get_user_profile_data(db, current_user)
    current_metrics = scans[0].get("scores", {})

    result = await ai_predict_skin_future(
        current_metrics=current_metrics,
        products_in_use=body.products_in_use or [],
        lifestyle_factors={
            "skin_type": profile["skin_type"],
            "climate": profile.get("climate"),
            "sleep": profile.get("sleep_hours"),
            "hydration": profile.get("water_intake"),
        },
        weeks_ahead=body.weeks_ahead,
    )
    return result


@router.post("/compare")
async def compare_scans(
    body: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare two scan results using AI for before/after analysis."""
    scans = _get_recent_scans(db, current_user, limit=50)
    scan_map = {s["scan_id"]: s for s in scans}

    before = scan_map.get(body.scan_id_before)
    after = scan_map.get(body.scan_id_after)

    if not before or not after:
        raise HTTPException(status_code=404, detail="One or both scan IDs not found")

    result = await ai_compare_scans(
        scan_before={"date": before["created_at"], "scores": before["scores"], "concerns": before["concerns"]},
        scan_after={"date": after["created_at"], "scores": after["scores"], "concerns": after["concerns"]},
    )
    return result


@router.post("/trends")
async def detect_trends(
    body: TrendsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect seasonal and temporal skin trends from scan history."""
    scans = _get_recent_scans(db, current_user, limit=20)
    if len(scans) < 3:
        return {"patterns": [], "insights": "Need at least 3 scans for trend detection", "recommendations": []}

    result = await ai_detect_seasonal_trends(
        scan_history=scans,
        location=body.location,
    )
    return result


# =============================================================================
# SPRINT 3 ENDPOINTS
# =============================================================================


class DailyBriefResponse(BaseModel):
    greeting: str
    skin_status: str
    tips: List[str]
    product_reminder: str


@router.get("/daily-brief", response_model=DailyBriefResponse)
async def get_daily_brief(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return a personalised daily skin brief.

    Gathers user profile, latest scan, and provides contextual tips.

    Sprint: 3 — Daily brief
    """
    from datetime import datetime

    profile = _get_user_profile_data(db, current_user)
    scans = _get_recent_scans(db, current_user, limit=1)
    shelf = _get_shelf_products(db, current_user)

    skin_type = profile.get("skin_type", "unknown")
    concerns = profile.get("concerns", [])

    # Build greeting
    hour = datetime.utcnow().hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    name = current_user.full_name or "there"
    greeting = f"Good {time_of_day}, {name}!"

    # Skin status from latest scan
    if scans:
        latest = scans[0]
        score = latest.get("overall_score", 0)
        if score >= 80:
            skin_status = "Your skin is looking great! Keep up your current routine."
        elif score >= 60:
            skin_status = "Your skin is in good shape with some areas to improve."
        elif score >= 40:
            skin_status = "Your skin needs a little extra attention today."
        else:
            skin_status = "Focus on nourishing and protecting your skin today."
    else:
        skin_status = "Complete your first scan to get personalised skin insights!"

    # Tips based on skin type and concerns
    tips: list[str] = []
    if skin_type == "oily":
        tips.append("Use a lightweight, oil-free moisturiser to keep skin balanced.")
        tips.append("Blotting papers can help manage midday shine without stripping your skin.")
    elif skin_type == "dry":
        tips.append("Layer a hydrating serum under your moisturiser for extra moisture.")
        tips.append("Avoid hot water when washing your face — lukewarm is gentler.")
    elif skin_type == "combination":
        tips.append("Apply richer products on dry areas and lighter formulas on the T-zone.")
    elif skin_type == "sensitive":
        tips.append("Patch-test any new product and introduce one at a time.")

    if any("acne" in c.lower() for c in concerns if isinstance(c, str)):
        tips.append("Keep pillowcases clean and avoid touching your face during the day.")
    if any("aging" in c.lower() or "wrinkle" in c.lower() for c in concerns if isinstance(c, str)):
        tips.append("Sunscreen is your best anti-aging tool — reapply every 2 hours when outdoors.")

    # General tips if we have few so far
    if len(tips) < 2:
        tips.append("Don't forget your SPF today — UV protection is essential year-round.")
        tips.append("Stay hydrated — aim for at least 8 glasses of water.")

    # Product reminder
    expiring = [p for p in shelf if p.get("expiry_date")]
    if expiring:
        product_reminder = f"You have {len(expiring)} product(s) on your shelf with expiry dates set — check them in your shelf."
    elif shelf:
        product_reminder = f"You have {len(shelf)} active product(s) on your shelf. Consistency is key!"
    else:
        product_reminder = "Start building your shelf by adding the products you use daily."

    return DailyBriefResponse(
        greeting=greeting,
        skin_status=skin_status,
        tips=tips,
        product_reminder=product_reminder,
    )


class IngredientConflictRequest(BaseModel):
    ingredients_a: List[str] = Field(..., min_length=1)
    ingredients_b: List[str] = Field(..., min_length=1)


class IngredientConflict(BaseModel):
    ingredient_a: str
    ingredient_b: str
    severity: str  # "high", "moderate", "low"
    explanation: str


class IngredientConflictResponse(BaseModel):
    conflicts: List[IngredientConflict]
    safe_to_combine: bool
    summary: str


# Known ingredient conflict pairs
_KNOWN_CONFLICTS = [
    {
        "a": ["retinol", "retinoid", "tretinoin", "adapalene", "retin-a"],
        "b": ["aha", "alpha hydroxy acid", "glycolic acid", "lactic acid", "mandelic acid"],
        "severity": "high",
        "explanation": "Retinoids and AHAs together can cause excessive irritation, peeling, and compromise the skin barrier. Use on alternate nights.",
    },
    {
        "a": ["retinol", "retinoid", "tretinoin", "adapalene", "retin-a"],
        "b": ["bha", "beta hydroxy acid", "salicylic acid"],
        "severity": "high",
        "explanation": "Combining retinoids with BHAs increases the risk of dryness and irritation. Alternate their usage.",
    },
    {
        "a": ["retinol", "retinoid", "tretinoin", "adapalene", "retin-a"],
        "b": ["benzoyl peroxide"],
        "severity": "high",
        "explanation": "Benzoyl peroxide can deactivate retinol, reducing its effectiveness. Use at different times of day.",
    },
    {
        "a": ["retinol", "retinoid", "tretinoin", "adapalene", "retin-a"],
        "b": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "severity": "moderate",
        "explanation": "Both are potent actives that may cause irritation when layered. Apply vitamin C in the morning and retinol at night.",
    },
    {
        "a": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "b": ["niacinamide", "nicotinamide", "vitamin b3"],
        "severity": "low",
        "explanation": "Older research suggested a conflict, but modern formulations are generally safe together. If flushing occurs, apply at different times.",
    },
    {
        "a": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "b": ["aha", "alpha hydroxy acid", "glycolic acid", "lactic acid"],
        "severity": "moderate",
        "explanation": "Both work best at low pH but layering can irritate. Use at different times if sensitivity occurs.",
    },
    {
        "a": ["aha", "alpha hydroxy acid", "glycolic acid", "lactic acid"],
        "b": ["bha", "beta hydroxy acid", "salicylic acid"],
        "severity": "moderate",
        "explanation": "Using both AHAs and BHAs together can over-exfoliate. Alternate or use a combined product formulated for safety.",
    },
    {
        "a": ["niacinamide", "nicotinamide", "vitamin b3"],
        "b": ["aha", "alpha hydroxy acid", "glycolic acid", "lactic acid"],
        "severity": "low",
        "explanation": "Niacinamide is generally stable with AHAs but very sensitive skin may experience redness.",
    },
    {
        "a": ["benzoyl peroxide"],
        "b": ["vitamin c", "ascorbic acid", "l-ascorbic acid"],
        "severity": "high",
        "explanation": "Benzoyl peroxide oxidises vitamin C, rendering it ineffective. Never layer these together.",
    },
    {
        "a": ["copper peptides"],
        "b": ["vitamin c", "ascorbic acid", "l-ascorbic acid", "aha", "glycolic acid", "bha", "salicylic acid"],
        "severity": "moderate",
        "explanation": "Copper peptides can be destabilised by direct acids and vitamin C. Use at different times.",
    },
]


@router.post("/ingredient-conflicts", response_model=IngredientConflictResponse)
async def check_ingredient_conflicts(
    body: IngredientConflictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Check for known conflicts between two sets of ingredients.

    Sprint: 3 — Ingredient conflict checker
    """
    norm_a = {ing.strip().lower() for ing in body.ingredients_a}
    norm_b = {ing.strip().lower() for ing in body.ingredients_b}

    found_conflicts: list[IngredientConflict] = []

    for rule in _KNOWN_CONFLICTS:
        # Check both directions: a-in-list_a & b-in-list_b, and a-in-list_b & b-in-list_a
        matches_a_in_a = norm_a & set(rule["a"])
        matches_b_in_b = norm_b & set(rule["b"])
        matches_a_in_b = norm_b & set(rule["a"])
        matches_b_in_a = norm_a & set(rule["b"])

        if matches_a_in_a and matches_b_in_b:
            found_conflicts.append(IngredientConflict(
                ingredient_a=next(iter(matches_a_in_a)),
                ingredient_b=next(iter(matches_b_in_b)),
                severity=rule["severity"],
                explanation=rule["explanation"],
            ))
        elif matches_a_in_b and matches_b_in_a:
            found_conflicts.append(IngredientConflict(
                ingredient_a=next(iter(matches_b_in_a)),
                ingredient_b=next(iter(matches_a_in_b)),
                severity=rule["severity"],
                explanation=rule["explanation"],
            ))

    safe = len(found_conflicts) == 0
    high_count = sum(1 for c in found_conflicts if c.severity == "high")

    if safe:
        summary = "No known conflicts detected between these ingredient sets. They should be safe to combine."
    elif high_count > 0:
        summary = f"Found {len(found_conflicts)} conflict(s), including {high_count} high-severity. Avoid layering these products directly."
    else:
        summary = f"Found {len(found_conflicts)} potential conflict(s). Consider using these products at different times of day."

    return IngredientConflictResponse(
        conflicts=found_conflicts,
        safe_to_combine=safe,
        summary=summary,
    )
