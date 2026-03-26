"""
Unified Search Router.

Provides cross-entity search across products, ingredients, and blogs.
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user_optional
from app.dependencies import get_db
from app.models.content import Blog
from app.models.product_models import Ingredient, Product
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])
logger = logging.getLogger(__name__)


# ===== Schemas =====

class SearchResultItem(BaseModel):
    type: str  # "product", "ingredient", "blog"
    id: str
    title: str
    subtitle: Optional[str] = None
    url: Optional[str] = None


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    total: int


class SuggestionItem(BaseModel):
    text: str
    type: str


class SuggestionsResponse(BaseModel):
    suggestions: list[SuggestionItem]


# ===== Endpoints =====

@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    type: str = Query("all", regex="^(all|products|ingredients|blogs)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Search across products, ingredients, and blogs.

    - **q**: search query string
    - **type**: filter by entity type (all, products, ingredients, blogs)
    """
    pattern = f"%{q.strip()}%"
    results: list[SearchResultItem] = []

    if type in ("all", "products"):
        products = (
            db.query(Product)
            .filter(Product.name.ilike(pattern) | Product.brand.ilike(pattern))
            .order_by(Product.name)
            .limit(limit)
            .all()
        )
        for p in products:
            results.append(SearchResultItem(
                type="product",
                id=str(p.id),
                title=p.name,
                subtitle=p.brand,
                url=f"/products/{p.id}",
            ))

    if type in ("all", "ingredients"):
        ingredients = (
            db.query(Ingredient)
            .filter(Ingredient.name_inci.ilike(pattern))
            .order_by(Ingredient.name_inci)
            .limit(limit)
            .all()
        )
        for ing in ingredients:
            results.append(SearchResultItem(
                type="ingredient",
                id=str(ing.id),
                title=ing.name_inci,
                subtitle=ing.category,
                url=f"/ingredients/{ing.id}",
            ))

    if type in ("all", "blogs"):
        blogs = (
            db.query(Blog)
            .filter(Blog.title.ilike(pattern) & (Blog.published == True))
            .order_by(Blog.created_at.desc())
            .limit(limit)
            .all()
        )
        for b in blogs:
            results.append(SearchResultItem(
                type="blog",
                id=str(b.id),
                title=b.title,
                subtitle=b.excerpt[:80] if b.excerpt else None,
                url=f"/blog/{b.slug}",
            ))

    # Log search query (best-effort, non-blocking)
    try:
        from sqlalchemy import text as sa_text
        db.execute(
            sa_text(
                "INSERT INTO search_queries (user_id, query, result_count, created_at) "
                "VALUES (:uid, :q, :cnt, :now)"
            ),
            {
                "uid": current_user.id if current_user else None,
                "q": q.strip()[:200],
                "cnt": len(results),
                "now": datetime.utcnow(),
            },
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.debug("search_queries table not available; skipping log")

    total = len(results)
    return SearchResponse(results=results[offset : offset + limit], total=total)


@router.get("/suggestions", response_model=SuggestionsResponse)
async def search_suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    """
    Typeahead suggestions (top 5 matches from products and ingredients).
    """
    pattern = f"%{q.strip()}%"
    suggestions: list[SuggestionItem] = []

    # Product name matches
    products = (
        db.query(Product.name)
        .filter(Product.name.ilike(pattern))
        .order_by(Product.name)
        .limit(5)
        .all()
    )
    for (name,) in products:
        suggestions.append(SuggestionItem(text=name, type="product"))

    # Ingredient name matches
    ingredients = (
        db.query(Ingredient.name_inci)
        .filter(Ingredient.name_inci.ilike(pattern))
        .order_by(Ingredient.name_inci)
        .limit(5)
        .all()
    )
    for (name,) in ingredients:
        suggestions.append(SuggestionItem(text=name, type="ingredient"))

    # Return at most 5 combined
    return SuggestionsResponse(suggestions=suggestions[:5])
