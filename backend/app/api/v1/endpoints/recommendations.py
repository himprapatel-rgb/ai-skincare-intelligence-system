from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import decrypt_sensitive_data, get_current_user
from app.database import get_db
from app.models.product_models import Product
from app.models.user import User, UserProfile
from app.schemas.product_schemas import RecommendationItem, RecommendationsResponse

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


@router.get("", response_model=RecommendationsResponse)
async def get_recommendations(
    limit: int = Query(12, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendationsResponse:
    """Return personalized product recommendations for the current user."""
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

    if not products and (skin_type or concerns):
        products = (
            db.query(Product)
            .order_by(Product.created_at.desc())
            .limit(limit)
            .all()
        )

    return RecommendationsResponse(
        recommendations=[_build_recommendation_item(product) for product in products]
    )
