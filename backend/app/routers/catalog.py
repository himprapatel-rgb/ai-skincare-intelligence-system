"""Product Catalog API Router

API endpoints for the in-house product catalog database.
Provides fast lookups without AI API calls for known products.

Uses the SEPARATE PRODUCT DATABASE (PRODUCT_DATABASE_URL).

Part of the Product Catalog Database Strategy.
Created: January 29, 2026
Updated: January 27, 2026 - Uses separate product database
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.dependencies import get_db
from app.product_database import get_product_db
from app.models.user import User
from app.services.product_catalog import ProductCatalogService

router = APIRouter(prefix="/catalog", tags=["catalog"])
logger = logging.getLogger(__name__)


# =========================================
# SCHEMAS
# =========================================

class CatalogProductResponse(BaseModel):
    """Response schema for catalog product."""
    id: str
    barcode: Optional[str] = None
    name: str
    brand: str
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    size_ml: Optional[float] = None
    price_usd: Optional[float] = None
    price_range: Optional[str] = None
    # Images
    image_url: Optional[str] = None
    image_front_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    # Pre-computed safety (instant, no AI needed!)
    safety_score: Optional[int] = None
    safety_summary: Optional[str] = None
    flagged_ingredients: Optional[list] = None
    pregnancy_safe: Optional[bool] = None
    sensitive_skin_safe: Optional[bool] = None
    # Ingredients
    ingredients: Optional[List[str]] = None
    ingredients_text: Optional[str] = None
    key_ingredients: Optional[list] = None
    # Attributes
    is_fragrance_free: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_cruelty_free: Optional[bool] = None
    # Skin compatibility
    suitable_skin_types: Optional[List[str]] = None
    targets_concerns: Optional[List[str]] = None
    # Meta
    is_verified: Optional[bool] = None
    data_quality_score: Optional[int] = None
    source: Optional[str] = None
    scan_count: Optional[int] = None

    class Config:
        from_attributes = True


class CatalogLookupResponse(BaseModel):
    """Response for barcode/name lookup."""
    found: bool
    product: Optional[CatalogProductResponse] = None
    source: str = "catalog"  # 'catalog' or 'external'


class CatalogSearchResponse(BaseModel):
    """Response for search results."""
    products: List[CatalogProductResponse]
    total: int
    query: str


class CatalogStatsResponse(BaseModel):
    """Response for catalog statistics."""
    total_products: int
    verified_products: int
    total_ingredients: int
    by_source: dict
    by_category: dict


# =========================================
# ENDPOINTS
# =========================================

@router.get("/barcode/{barcode}", response_model=CatalogLookupResponse)
async def lookup_by_barcode(
    barcode: str,
    db: Session = Depends(get_product_db)
):
    """
    Look up a product by barcode in the catalog.
    
    This is the primary use case - instant lookup without AI API calls.
    Returns pre-computed safety data, ingredients, and images.
    
    Response times:
    - Catalog hit: ~50ms
    - Cache miss (AI required): 2-5 seconds
    """
    catalog = ProductCatalogService(db)
    product = catalog.lookup_barcode(barcode)
    
    if product:
        logger.info(f"Catalog hit for barcode: {barcode}")
        return CatalogLookupResponse(
            found=True,
            product=CatalogProductResponse(**product),
            source="catalog"
        )
    
    logger.info(f"Catalog miss for barcode: {barcode}")
    return CatalogLookupResponse(
        found=False,
        product=None,
        source="not_found"
    )


@router.get("/lookup", response_model=CatalogLookupResponse)
async def lookup_by_name_brand(
    name: str = Query(..., description="Product name"),
    brand: str = Query(..., description="Brand name"),
    db: Session = Depends(get_product_db)
):
    """
    Look up a product by name and brand.
    
    Used when AI identifies a product but no barcode is available.
    Performs fuzzy matching.
    """
    catalog = ProductCatalogService(db)
    product = catalog.lookup_by_name_brand(name, brand)
    
    if product:
        logger.info(f"Catalog hit for: {brand} - {name}")
        return CatalogLookupResponse(
            found=True,
            product=CatalogProductResponse(**product),
            source="catalog"
        )
    
    return CatalogLookupResponse(
        found=False,
        product=None,
        source="not_found"
    )


@router.get("/search", response_model=CatalogSearchResponse)
async def search_products(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_product_db)
):
    """
    Search products in the catalog.
    
    Uses PostgreSQL full-text search for performance.
    Returns products sorted by popularity (scan count).
    """
    catalog = ProductCatalogService(db)
    products = catalog.search(
        query=q,
        category=category,
        brand=brand,
        limit=limit,
        offset=offset
    )
    
    return CatalogSearchResponse(
        products=[CatalogProductResponse(**p) for p in products],
        total=len(products),
        query=q
    )


@router.get("/product/{product_id}", response_model=CatalogProductResponse)
async def get_product(
    product_id: str,
    db: Session = Depends(get_product_db)
):
    """
    Get a product by ID.
    
    Returns full product details with pre-computed safety data.
    """
    catalog = ProductCatalogService(db)
    product = catalog.get_by_id(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return CatalogProductResponse(**product)


@router.get("/stats", response_model=CatalogStatsResponse)
async def get_catalog_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Get catalog statistics.
    
    Requires authentication (admin use case).
    """
    catalog = ProductCatalogService(db)
    stats = catalog.get_stats()
    
    return CatalogStatsResponse(**stats)


@router.get("/categories")
async def get_categories(
    db: Session = Depends(get_product_db)
):
    """
    Get list of available product categories.
    """
    return {
        "categories": [
            {"id": "cleanser", "name": "Cleanser", "icon": "droplet"},
            {"id": "moisturizer", "name": "Moisturizer", "icon": "heart"},
            {"id": "serum", "name": "Serum", "icon": "flask"},
            {"id": "sunscreen", "name": "Sunscreen", "icon": "sun"},
            {"id": "toner", "name": "Toner", "icon": "spray"},
            {"id": "mask", "name": "Mask", "icon": "mask"},
            {"id": "exfoliant", "name": "Exfoliant", "icon": "sparkles"},
            {"id": "eye_cream", "name": "Eye Cream", "icon": "eye"},
            {"id": "lip_care", "name": "Lip Care", "icon": "smile"},
            {"id": "body_care", "name": "Body Care", "icon": "user"},
            {"id": "other", "name": "Other", "icon": "package"},
        ]
    }
