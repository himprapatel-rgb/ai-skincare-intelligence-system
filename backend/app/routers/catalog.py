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
from app.models.user import User
from app.product_database import get_product_db
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


# =========================================
# ADMIN ENDPOINTS (Tasks 376-400)
# =========================================

class ProductCreateRequest(BaseModel):
    """Request to add a new product to catalog."""
    barcode: Optional[str] = None
    name: str
    brand: str
    category: str
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    key_ingredients: Optional[List[dict]] = None
    image_url: Optional[str] = None
    price_usd: Optional[float] = None
    is_vegan: Optional[bool] = False
    is_cruelty_free: Optional[bool] = False
    is_fragrance_free: Optional[bool] = False


class ProductUpdateRequest(BaseModel):
    """Request to update a product."""
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price_usd: Optional[float] = None
    is_verified: Optional[bool] = None


class BrandResponse(BaseModel):
    """Response for brand info."""
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    product_count: int = 0
    is_cruelty_free: Optional[bool] = None
    is_vegan: Optional[bool] = None


class IngredientResponse(BaseModel):
    """Response for ingredient info."""
    id: str
    inci_name: str
    common_names: Optional[List[str]] = None
    category: Optional[str] = None
    function: Optional[str] = None
    ewg_score: Optional[int] = None
    is_harmful: bool = False
    harm_severity: Optional[str] = None


@router.post("/products", response_model=CatalogProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: ProductCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Add a new product to the catalog (Task 376).
    
    Requires authentication. Computes safety score automatically.
    """
    catalog = ProductCatalogService(db)
    
    # Check if product already exists
    if request.barcode:
        existing = catalog.lookup_barcode(request.barcode)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with barcode {request.barcode} already exists"
            )
    
    # Add to catalog
    product = catalog.add_from_scan(
        name=request.name,
        brand=request.brand,
        category=request.category,
        barcode=request.barcode,
        ingredients=request.ingredients,
        key_ingredients=request.key_ingredients,
        image_url=request.image_url,
        source="manual"
    )
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create product"
        )
    
    return CatalogProductResponse(**product)


@router.put("/product/{product_id}", response_model=CatalogProductResponse)
async def update_product(
    product_id: str,
    request: ProductUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Update a product in the catalog (Task 377).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    product = catalog.update_product(
        product_id,
        name=request.name,
        brand=request.brand,
        category=request.category,
        description=request.description,
        price_usd=request.price_usd,
        is_verified=request.is_verified
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return CatalogProductResponse(**product)


@router.delete("/product/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Delete a product from the catalog (Task 378).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    if not catalog.delete_product(product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )


@router.post("/product/{product_id}/verify", response_model=CatalogProductResponse)
async def verify_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Mark a product as verified (Task 380).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    product = catalog.verify_product(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return CatalogProductResponse(**product)


@router.get("/duplicates")
async def get_duplicates(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Find potential duplicate products (Task 391).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    return {"duplicates": catalog.get_duplicates(limit=limit)}


@router.get("/data-quality")
async def get_data_quality(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Get data quality report for the catalog (Task 390).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    return catalog.get_data_quality_report()


@router.get("/export")
async def export_catalog(
    format: str = Query("json", pattern="^(json|csv)$"),
    limit: int = Query(10000, ge=1, le=50000),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    Export catalog as JSON or CSV (Task 394).
    Requires authentication.
    """
    from datetime import datetime

    from fastapi.responses import JSONResponse, Response
    catalog = ProductCatalogService(db)
    data, content_type = catalog.export_products(format=format, limit=limit, offset=offset, category=category)
    if format == "csv":
        filename = f"catalog_export_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
        return Response(
            content=data,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    return JSONResponse(content=data)


@router.get("/import/jobs")
async def list_import_jobs(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_product_db)
):
    """
    List recent import jobs (Task 388).
    Requires authentication.
    """
    catalog = ProductCatalogService(db)
    return {"jobs": catalog.list_import_jobs(limit=limit)}


@router.get("/brands", response_model=List[BrandResponse])
async def list_brands(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_product_db)
):
    """
    List all brands in the catalog (Task 385).
    """
    from sqlalchemy import func

    from app.models.catalog_models import CatalogBrand
    
    brands = db.query(CatalogBrand).order_by(
        CatalogBrand.product_count.desc().nullslast()
    ).offset(offset).limit(limit).all()
    
    return [
        BrandResponse(
            id=str(b.id),
            name=b.name,
            slug=b.slug,
            logo_url=b.logo_url,
            product_count=b.product_count or 0,
            is_cruelty_free=b.is_cruelty_free,
            is_vegan=b.is_vegan
        )
        for b in brands
    ]


@router.get("/ingredients", response_model=List[IngredientResponse])
async def list_ingredients(
    search: Optional[str] = Query(None, description="Search by name"),
    harmful_only: bool = Query(False, description="Only show harmful ingredients"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_product_db)
):
    """
    List ingredients in the catalog (Task 366).
    """
    from sqlalchemy import func

    from app.models.catalog_models import CatalogIngredient
    
    query = db.query(CatalogIngredient)
    
    if search:
        query = query.filter(
            CatalogIngredient.inci_name.ilike(f"%{search}%")
        )
    
    if harmful_only:
        query = query.filter(CatalogIngredient.is_harmful == True)
    
    ingredients = query.order_by(
        CatalogIngredient.inci_name
    ).offset(offset).limit(limit).all()
    
    return [
        IngredientResponse(
            id=str(i.id),
            inci_name=i.inci_name,
            common_names=i.common_names or [],
            category=i.category,
            function=i.function,
            ewg_score=i.ewg_score,
            is_harmful=i.is_harmful or False,
            harm_severity=i.harm_severity
        )
        for i in ingredients
    ]


@router.get("/products/by-ingredient/{ingredient_name}")
async def get_products_by_ingredient(
    ingredient_name: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Find products containing a specific ingredient (Task 367).
    """
    from app.models.catalog_models import CatalogProduct
    
    products = db.query(CatalogProduct).filter(
        CatalogProduct.ingredients_text.ilike(f"%{ingredient_name}%")
    ).limit(limit).all()
    
    return {
        "ingredient": ingredient_name,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/safe-for/{skin_type}")
async def get_safe_products(
    skin_type: str,
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Find products safe for a specific skin type (Task 369).
    """
    from app.models.catalog_models import CatalogProduct
    
    query = db.query(CatalogProduct).filter(
        CatalogProduct.suitable_skin_types.contains([skin_type])
    )
    
    if category:
        query = query.filter(CatalogProduct.category == category)
    
    # Prioritize high safety scores
    products = query.order_by(
        CatalogProduct.safety_score.desc().nullslast()
    ).limit(limit).all()
    
    return {
        "skin_type": skin_type,
        "category": category,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "safety_score": p.safety_score,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/pregnancy-safe")
async def get_pregnancy_safe_products(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Find pregnancy-safe products (Task 370).
    """
    from app.models.catalog_models import CatalogProduct
    
    query = db.query(CatalogProduct).filter(
        CatalogProduct.pregnancy_safe == True
    )
    
    if category:
        query = query.filter(CatalogProduct.category == category)
    
    products = query.order_by(
        CatalogProduct.safety_score.desc().nullslast()
    ).limit(limit).all()
    
    return {
        "filter": "pregnancy_safe",
        "category": category,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "safety_score": p.safety_score,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/vegan")
async def get_vegan_products(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Find vegan products (Task 371).
    """
    from app.models.catalog_models import CatalogProduct
    
    query = db.query(CatalogProduct).filter(
        CatalogProduct.is_vegan == True
    )
    
    if category:
        query = query.filter(CatalogProduct.category == category)
    
    products = query.order_by(
        CatalogProduct.scan_count.desc().nullslast()
    ).limit(limit).all()
    
    return {
        "filter": "vegan",
        "category": category,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/fragrance-free")
async def get_fragrance_free_products(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Find fragrance-free products (Task 373).
    """
    from app.models.catalog_models import CatalogProduct
    
    query = db.query(CatalogProduct).filter(
        CatalogProduct.is_fragrance_free == True
    )
    
    if category:
        query = query.filter(CatalogProduct.category == category)
    
    products = query.order_by(
        CatalogProduct.scan_count.desc().nullslast()
    ).limit(limit).all()
    
    return {
        "filter": "fragrance_free",
        "category": category,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/popular")
async def get_popular_products(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Get most scanned/popular products (Task 363).
    """
    from app.models.catalog_models import CatalogProduct
    
    query = db.query(CatalogProduct)
    
    if category:
        query = query.filter(CatalogProduct.category == category)
    
    products = query.order_by(
        CatalogProduct.scan_count.desc().nullslast()
    ).limit(limit).all()
    
    return {
        "filter": "popular",
        "category": category,
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "scan_count": p.scan_count or 0,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/products/recent")
async def get_recent_products(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_product_db)
):
    """
    Get recently added products (Task 362).
    """
    from app.models.catalog_models import CatalogProduct
    
    products = db.query(CatalogProduct).order_by(
        CatalogProduct.created_at.desc()
    ).limit(limit).all()
    
    return {
        "filter": "recent",
        "count": len(products),
        "products": [
            {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "image_url": p.image_front_url
            }
            for p in products
        ]
    }


@router.get("/health")
async def catalog_health(
    db: Session = Depends(get_product_db)
):
    """
    Product catalog health check (Task 398).
    """
    import time

    from sqlalchemy import func

    from app.models.catalog_models import (
        CatalogBrand,
        CatalogIngredient,
        CatalogProduct,
    )
    
    start = time.time()
    
    try:
        product_count = db.query(func.count(CatalogProduct.id)).scalar()
        ingredient_count = db.query(func.count(CatalogIngredient.id)).scalar()
        brand_count = db.query(func.count(CatalogBrand.id)).scalar()
        
        latency = int((time.time() - start) * 1000)
        
        return {
            "status": "healthy",
            "latency_ms": latency,
            "counts": {
                "products": product_count,
                "ingredients": ingredient_count,
                "brands": brand_count
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)[:100]
        }
