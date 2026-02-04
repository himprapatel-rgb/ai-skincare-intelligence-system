from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import decrypt_sensitive_data, get_current_user
from app.database import get_db
from app.models.product_models import Product
from app.models.user import User, UserProfile
from app.schemas.product_schemas import (
    RecommendationItem,
    RecommendationsResponse,
)
from app.services.amazon_affiliate_service import search_products as amazon_search_products

router = APIRouter()


def _safe_list(value: Optional[object]) -> List[str]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    return []


def _build_recommendation_item(product: Product) -> RecommendationItem:
    ingredients = [
        pi.ingredient.name_inci
        for pi in (product.product_ingredients or [])
        if getattr(pi, "ingredient", None) and pi.ingredient.name_inci
    ]
    concerns = _safe_list(product.targets) or _safe_list(product.primary_concerns)

    return RecommendationItem(
        id=product.id,
        name=product.name,
        brand=product.brand,
        category=product.category,
        price=product.price_usd,
        rating=product.average_rating,
        ingredients=ingredients,
        concerns=concerns,
        image_url=product.product_image_url,
        purchase_url=None,
    )


def _keywords_from_profile(skin_type: Optional[str], concerns: List[str]) -> str:
    """Build Amazon search keywords from profile (e.g. 'dry skin moisturizer acne')."""
    parts = []
    if skin_type:
        parts.append(f"{skin_type} skin")
    if concerns:
        parts.extend(concerns[:3])  # cap to avoid long query
    if not parts:
        return "skincare"
    return " ".join(parts) + " skincare"


# Map browser/ISO country codes to Amazon marketplace code (e.g. GB -> UK)
_COUNTRY_ALIASES = {"GB": "UK"}


def _amazon_matches_location(request_country: Optional[str]) -> bool:
    """True if we should show Amazon affiliate results for this request (location-based)."""
    from app.config import settings
    configured = (settings.AMAZON_COUNTRY or "US").strip().upper()
    if not request_country:
        return True  # no location hint: use default (show Amazon for configured marketplace)
    req = request_country.strip().upper()
    req = _COUNTRY_ALIASES.get(req, req)
    configured = _COUNTRY_ALIASES.get(configured, configured)
    return req == configured


@router.get("", response_model=RecommendationsResponse)
async def get_recommendations(
    limit: int = Query(12, ge=1, le=50),
    country: Optional[str] = Query(None, description="User country code (e.g. US, UK) for location-based affiliate links"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationsResponse:
    """Return personalized product recommendations (DB + optional Amazon affiliate results). Amazon results only when country matches AMAZON_COUNTRY."""
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    skin_type: Optional[str] = None
    concerns: List[str] = []

    if profile:
        try:
            decrypted_skin_type = decrypt_sensitive_data(profile.skin_type)
            skin_type = decrypted_skin_type if isinstance(decrypted_skin_type, str) else None
        except Exception:
            skin_type = None
        try:
            concerns = _safe_list(decrypt_sensitive_data(profile.secondary_concerns))
        except Exception:
            concerns = []

    query = db.query(Product)
    if skin_type:
        query = query.filter(Product.suitable_for.contains([skin_type]))
    if concerns:
        query = query.filter(Product.targets.overlap(concerns))

    products = query.order_by(Product.average_rating.desc().nullslast()).limit(limit).all()
    recommendations: List[RecommendationItem] = [_build_recommendation_item(p) for p in products]

    # If we have fewer than limit, supplement with Amazon affiliate results (when configured and location matches)
    if len(recommendations) < limit and _amazon_matches_location(country):
        try:
            keywords = _keywords_from_profile(skin_type, concerns)
            amazon_count = min(limit - len(recommendations), 10)
            amazon_items = amazon_search_products(
                keywords=keywords,
                item_count=amazon_count,
            )
            existing_ids = {str(r.id) for r in recommendations}
            for raw in amazon_items:
                if len(recommendations) >= limit:
                    break
                aid = raw.get("id")
                if not aid or str(aid) in existing_ids:
                    continue
                existing_ids.add(str(aid))
                recommendations.append(
                    RecommendationItem(
                        id=raw["id"],
                        name=raw["name"],
                        brand=raw["brand"],
                        category=raw["category"],
                        price=raw.get("price"),
                        rating=raw.get("rating"),
                        ingredients=raw.get("ingredients") or [],
                        concerns=raw.get("concerns") or [],
                        image_url=raw.get("image_url"),
                        purchase_url=raw.get("purchase_url"),
                    )
                )
        except Exception:
            pass  # keep DB-only results if Amazon fails

    return RecommendationsResponse(recommendations=recommendations)
