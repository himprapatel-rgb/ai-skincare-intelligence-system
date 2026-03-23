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
    from app.models.content_models import BlogPost
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
