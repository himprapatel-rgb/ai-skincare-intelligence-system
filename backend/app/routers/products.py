"""Products Router - Product Recommendations API

FastAPI router for product search, recommendations, and ingredient analysis.
Created: December 13, 2025
"""
import json
import re
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user
from app.database import get_db
from app.models.product_models import Ingredient, Product, ProductReview
from app.models.shelf import ShelfProduct
from app.models.user import User
from app.product_database import ProductSessionLocal, get_product_db
from app.schemas.product_schemas import (
    IngredientAnalysisRequest,
    ProductRecommendation,
    ProductResponse,
    ProductSearch,
    ReviewCreate,
    ReviewResponse,
    ReviewsListResponse,
    SafetyAnalysis,
)
from app.services.ingredient_safety import analyze_ingredients_list
from app.services.ingredient_service import (
    build_ingredients_snapshot,
    save_product_ingredients,
)
from app.services.product_catalog import ProductCatalogService

router = APIRouter(
    prefix="/api/v1/products",
    tags=["products"]
)


@router.get("")
async def search_products(
    response: Response,
    search: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None, description="Sort by: price, rating, name, newest"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search and filter products with pagination envelope."""
    response.headers["Cache-Control"] = "public, max-age=60"
    query = db.query(Product)

    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.brand.ilike(f"%{search}%"))
        )
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None and hasattr(Product, "price_usd"):
        query = query.filter(Product.price_usd >= min_price)
    if max_price is not None and hasattr(Product, "price_usd"):
        query = query.filter(Product.price_usd <= max_price)

    # Sorting
    if sort_by == "name":
        query = query.order_by(Product.name.asc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "rating" and hasattr(Product, "average_rating"):
        query = query.order_by(Product.average_rating.desc())
    elif sort_by == "price" and hasattr(Product, "price_usd"):
        query = query.order_by(Product.price_usd.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    offset = (page - 1) * per_page
    products = query.offset(offset).limit(per_page).all()

    return {
        "data": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_more": (page * per_page) < total,
    }


@router.get("/{barcode}", response_model=ProductResponse)
async def get_product_by_barcode(
    barcode: str,
    response: Response,
    db: Session = Depends(get_db)
):
    """Lookup product by barcode (EAN-8 to EAN-14)"""
    response.headers["Cache-Control"] = "public, max-age=300"
    if not re.fullmatch(r"\d{8,14}", barcode.strip()):
        raise HTTPException(
            status_code=400,
            detail="Invalid barcode format. Use 8–14 digits.",
        )
    product = db.query(Product).filter(Product.upc == barcode).first()
    
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Product with barcode {barcode} not found"
        )
    
    return product


@router.get("/{product_id}/recommendations", response_model=List[ProductRecommendation])
async def get_recommendations(
    product_id: UUID,
    response: Response,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get similar product recommendations using content-based filtering"""
    response.headers["Cache-Control"] = "public, max-age=120"
    # Get target product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Product {product_id} not found"
        )
    
    # For now, return similar products in same category
    # TODO: Implement full cosine similarity algorithm
    similar_products = db.query(Product).filter(
        Product.category == product.category,
        Product.id != product_id
    ).limit(limit).all()
    
    recommendations = [
        ProductRecommendation(
            product=p,
            similarity_score=0.85,  # Placeholder
            reason=f"Similar {product.category} product"
        )
        for p in similar_products
    ]
    
    return recommendations


@router.post("/analyze-ingredients", response_model=SafetyAnalysis)
async def analyze_ingredients(
    request: IngredientAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze ingredient safety and compatibility.

    Exposed at ``/api/v1/products/analyze-ingredients`` because the ML product
    suitability endpoint (``app/api/v1/endpoints/products.py``) already owns
    ``POST /api/v1/products/analyze``; sharing the path made this public
    ingredient-safety endpoint unreachable (it was shadowed by the auth-gated
    ML route).
    """
    flagged = []
    total_safety = 0
    count = 0
    
    for ing_name in request.ingredients:
        ingredient = db.query(Ingredient).filter(
            Ingredient.name_inci.ilike(f"%{ing_name}%")
        ).first()
        
        if ingredient:
            if ingredient.safety_rating:
                total_safety += ingredient.safety_rating
                count += 1
            
            # Flag potentially harmful ingredients
            if ingredient.safety_rating and ingredient.safety_rating > 7:
                flagged.append({
                    "name": ingredient.name_inci,
                    "safety_rating": ingredient.safety_rating,
                    "reason": "High safety concern"
                })
    
    avg_safety = (total_safety / count) if count > 0 else 5.0
    
    return SafetyAnalysis(
        overall_safety_score=avg_safety,
        allergen_warnings=[],
        flagged_ingredients=flagged,
        pregnancy_safe=len(flagged) == 0,
        sensitive_skin_safe=avg_safety < 6.0
    )


# ===== Product Reviews Endpoints =====

@router.get("/{product_id}/reviews", response_model=ReviewsListResponse)
async def get_product_reviews(
    product_id: UUID,
    response: Response,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get reviews for a product with ratings distribution.
    
    SRS: FR-REVIEWS - Product reviews and ratings
    """
    response.headers["Cache-Control"] = "public, max-age=60"
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews with pagination
    reviews_query = (
        db.query(ProductReview)
        .options(joinedload(ProductReview.user))
        .filter(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc())
    )
    total = reviews_query.count()
    reviews = reviews_query.offset(offset).limit(limit).all()

    # Calculate rating distribution and average rating in SQL
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    ratings_summary = (
        db.query(ProductReview.rating, func.count(ProductReview.id))
        .filter(ProductReview.product_id == product_id)
        .group_by(ProductReview.rating)
        .all()
    )
    total_rating = 0
    total_count = 0
    for rating_value, rating_count in ratings_summary:
        rating_dist[int(rating_value)] = rating_count
        total_rating += int(rating_value) * rating_count
        total_count += rating_count
    avg_rating = (total_rating / total_count) if total_count else 0.0
    
    # Build response with user display names (user already loaded via joinedload)
    review_responses = []
    for review in reviews:
        display_name = review.user.email.split('@')[0] if review.user else "Anonymous"
        
        review_responses.append(ReviewResponse(
            id=review.id,
            product_id=review.product_id,
            user_id=review.user_id,
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            skin_type=review.skin_type,
            would_recommend=bool(review.would_recommend),
            verified_purchase=bool(review.verified_purchase),
            helpful_count=review.helpful_count or 0,
            created_at=review.created_at,
            user_display_name=display_name
        ))
    
    return ReviewsListResponse(
        reviews=review_responses,
        total=total,
        average_rating=round(avg_rating, 1),
        rating_distribution=rating_dist
    )


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=201)
async def create_product_review(
    product_id: UUID,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a review for a product. One review per user per product.
    
    SRS: FR-REVIEWS - Product reviews and ratings
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed this product
    existing = db.query(ProductReview).filter(
        ProductReview.product_id == product_id,
        ProductReview.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this product. Use PUT to update."
        )
    
    # Create review
    review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
        skin_type=review_data.skin_type,
        would_recommend=1 if review_data.would_recommend else 0,
        verified_purchase=1 if db.query(ShelfProduct).filter(
            ShelfProduct.user_id == current_user.id,
            ShelfProduct.product_id == product_uuid,
        ).first() else 0
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Update product average rating
    avg_rating = (
        db.query(func.avg(ProductReview.rating))
        .filter(ProductReview.product_id == product_id)
        .scalar()
    )
    if avg_rating is not None:
        product.average_rating = round(float(avg_rating), 2)
        db.commit()
    
    display_name = current_user.email.split('@')[0]
    
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        skin_type=review.skin_type,
        would_recommend=bool(review.would_recommend),
        verified_purchase=bool(review.verified_purchase),
        helpful_count=0,
        created_at=review.created_at,
        user_display_name=display_name
    )


import logging

import httpx

# ===== Barcode Scanning Endpoint (FR28) =====
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class BarcodeScanRequest(BaseModel):
    """Request schema for barcode scan."""
    barcode: str
    image_data: Optional[str] = None  # Base64 image (optional)


class BarcodeScanResponse(BaseModel):
    """Response schema for barcode scan."""
    found: bool
    product: Optional[dict] = None
    safety_rating: Optional[int] = None
    suitability_score: Optional[int] = None
    ingredients: Optional[List[str]] = None
    key_ingredients: Optional[List[dict]] = None
    warnings: Optional[List[str]] = None
    safety_report: Optional[dict] = None
    source: str = "database"


@router.post("/scan-barcode", response_model=BarcodeScanResponse)
async def scan_barcode(
    request: BarcodeScanRequest,
    db: Session = Depends(get_db),
    product_db: Session = Depends(get_product_db)
):
    """
    Scan a product barcode and return product information with safety analysis.
    
    SRS: FR28 - Barcode Scanning
    Sprint: GUI-2
    
    Priority order:
    1. Check Product Catalog (pre-computed data, instant response) - SEPARATE DB
    2. Check local products table
    3. Fall back to OpenBeautyFacts API
    """
    barcode = request.barcode.strip()
    
    # 0. Check Product Catalog FIRST (instant, pre-computed data!)
    # Uses SEPARATE product database for scalability
    try:
        catalog = ProductCatalogService(product_db)
        catalog_product = catalog.lookup_barcode(barcode)
        
        if catalog_product:
            logger.info(f"Catalog HIT for barcode: {barcode}")
            flagged = catalog_product.get("flagged_ingredients") or []
            warnings = [f["name"] for f in flagged[:5]] if flagged else []
            safety_report = None
            if flagged:
                safety_report = {
                    "flagged_ingredients": [
                        {
                            "name": f.get("name", "Unknown"),
                            "severity": f.get("severity", "moderate"),
                            "reason": f.get("reason", "Flagged ingredient"),
                            "categories": f.get("categories", []),
                            "alternatives": f.get("alternatives", []),
                            "avoid_if": f.get("avoid_if", []),
                        }
                        for f in flagged
                    ],
                    "total_flagged": len(flagged),
                    "recommendations": [],
                    "is_pregnancy_safe": catalog_product.get("pregnancy_safe", True),
                    "is_sensitive_skin_safe": catalog_product.get("sensitive_skin_safe", True),
                }
            return BarcodeScanResponse(
                found=True,
                product={
                    "id": catalog_product["id"],
                    "name": catalog_product["name"],
                    "brand": catalog_product["brand"],
                    "barcode": barcode,
                    "category": catalog_product["category"],
                    "image_url": catalog_product.get("image_url"),
                },
                safety_rating=catalog_product.get("safety_score", 80),
                suitability_score=75,
                ingredients=catalog_product.get("ingredients", []),
                key_ingredients=catalog_product.get("key_ingredients"),
                warnings=warnings,
                safety_report=safety_report,
                source="catalog",
            )
    except Exception as e:
        logger.warning(f"Catalog lookup failed: {e}")
    
    # 1. Check local database (legacy products table)
    product = db.query(Product).filter(Product.upc == barcode).first()
    
    if product:
        # Analyze ingredients
        ingredients = []
        ingredients_text = getattr(product, "ingredients", None) or ""
        if ingredients_text:
            ingredients = [ing.strip() for ing in str(ingredients_text).split(",")[:15] if ing.strip()]

        # Full safety analysis for shelf storage
        safety_report = None
        warnings = []
        if ingredients:
            safety_analysis = analyze_ingredients_list(ingredients)
            safety_report = {
                "flagged_ingredients": [
                    {
                        "name": f["name"],
                        "matched_term": f["matched_term"],
                        "severity": f["severity"],
                        "categories": f["categories"],
                        "reason": f["reason"],
                        "alternatives": f.get("alternatives", []),
                        "avoid_if": f.get("avoid_if", []),
                    }
                    for f in safety_analysis["flagged_ingredients"]
                ],
                "total_flagged": safety_analysis["total_flagged"],
                "high_severity_count": safety_analysis["high_severity_count"],
                "moderate_severity_count": safety_analysis["moderate_severity_count"],
                "low_severity_count": safety_analysis["low_severity_count"],
                "safety_score": safety_analysis["safety_score"],
                "recommendations": safety_analysis["recommendations"],
                "is_pregnancy_safe": safety_analysis["is_pregnancy_safe"],
                "is_sensitive_skin_safe": safety_analysis["is_sensitive_skin_safe"],
            }
            for flagged in safety_analysis["flagged_ingredients"]:
                if flagged["severity"] == "high":
                    warnings.append(f"Contains {flagged['name']}: {flagged['reason']}")
                elif flagged["severity"] == "moderate":
                    warnings.append(f"Contains {flagged['name']}")

        return BarcodeScanResponse(
            found=True,
            product={
                "id": str(product.id),
                "name": product.name,
                "brand": product.brand,
                "barcode": barcode,
                "category": product.category,
                "image_url": product.image_url,
            },
            safety_rating=safety_report["safety_score"] if safety_report else 85,
            suitability_score=78,
            ingredients=ingredients,
            key_ingredients=None,
            warnings=list(set(warnings)) if warnings else [],
            safety_report=safety_report,
            source="database",
        )
    
    # 2. Try OpenBeautyFacts API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == 1 and data.get("product"):
                    obf_product = data["product"]
                    
                    ingredients = []
                    if obf_product.get("ingredients_text"):
                        ingredients = [
                            ing.strip()
                            for ing in obf_product["ingredients_text"].split(",")[:15]
                            if ing.strip()
                        ]

                    # Full safety analysis for shelf storage (same as photo scan)
                    safety_report = None
                    warnings = []
                    if ingredients:
                        safety_analysis = analyze_ingredients_list(ingredients)
                        safety_report = {
                            "flagged_ingredients": [
                                {
                                    "name": f["name"],
                                    "matched_term": f["matched_term"],
                                    "severity": f["severity"],
                                    "categories": f["categories"],
                                    "reason": f["reason"],
                                    "alternatives": f.get("alternatives", []),
                                    "avoid_if": f.get("avoid_if", []),
                                }
                                for f in safety_analysis["flagged_ingredients"]
                            ],
                            "total_flagged": safety_analysis["total_flagged"],
                            "high_severity_count": safety_analysis["high_severity_count"],
                            "moderate_severity_count": safety_analysis["moderate_severity_count"],
                            "low_severity_count": safety_analysis["low_severity_count"],
                            "safety_score": safety_analysis["safety_score"],
                            "recommendations": safety_analysis["recommendations"],
                            "is_pregnancy_safe": safety_analysis["is_pregnancy_safe"],
                            "is_sensitive_skin_safe": safety_analysis["is_sensitive_skin_safe"],
                        }
                        for flagged in safety_analysis["flagged_ingredients"]:
                            if flagged["severity"] == "high":
                                warnings.append(f"Contains {flagged['name']}: {flagged['reason']}")
                            elif flagged["severity"] == "moderate":
                                warnings.append(f"Contains {flagged['name']}")

                    # Extract product data
                    product_name = obf_product.get("product_name", "Unknown Product")
                    brand_name = obf_product.get("brands", "Unknown Brand")
                    category_name = obf_product.get("categories", "").split(",")[0] if obf_product.get("categories") else "other"
                    image_url = obf_product.get("image_front_url") or obf_product.get("image_url")

                    # AUTO-SAVE: Save to local database for future lookups
                    saved_product_id = barcode
                    try:
                        new_product = Product(
                            brand=brand_name,
                            name=product_name,
                            category=category_name or "other",
                            upc=barcode,
                            product_image_url=image_url,
                            primary_concerns=[],
                            skin_types=[],
                        )
                        db.add(new_product)
                        db.commit()
                        db.refresh(new_product)
                        saved_product_id = str(new_product.id)
                        logger.info(f"Auto-saved product from barcode: {barcode} - {brand_name} {product_name}")

                        # SAVE INGREDIENTS: Persist ingredients to database
                        if ingredients:
                            saved_count = save_product_ingredients(
                                db=db,
                                product_id=new_product.id,
                                ingredients=ingredients,
                                key_ingredients=None  # Barcode scan doesn't get percentages
                            )
                            logger.info(f"Saved {saved_count} ingredients for barcode product {barcode}")
                    except Exception as e:
                        logger.warning(f"Failed to auto-save barcode product: {e}")
                        db.rollback()

                    return BarcodeScanResponse(
                        found=True,
                        product={
                            "id": saved_product_id,
                            "name": product_name,
                            "brand": brand_name,
                            "barcode": barcode,
                            "category": category_name,
                            "image_url": image_url,
                        },
                        safety_rating=safety_report["safety_score"] if safety_report else 80,
                        suitability_score=70,
                        ingredients=ingredients,
                        key_ingredients=None,
                        warnings=list(set(warnings)) if warnings else [],
                        safety_report=safety_report,
                        source="openbeautyfacts",
                    )
    except Exception as e:
        logger.warning(f"OpenBeautyFacts API error: {e}")
    
    # 3. Product not found
    return BarcodeScanResponse(
        found=False,
        product=None,
        safety_rating=None,
        suitability_score=None,
        ingredients=None,
        key_ingredients=None,
        warnings=None,
        safety_report=None,
        source="not_found",
    )


import base64
import binascii
import os

# ===== Product Image Recognition Endpoint (FR28 Enhanced) =====
import openai


class ProductImageRequest(BaseModel):
    """Request schema for product image recognition."""
    image_data: str  # Base64 encoded image


class KeyIngredient(BaseModel):
    """Key ingredient with concentration percentage."""
    name: str
    percentage: Optional[str] = None  # e.g., "10%", "2%"


class FlaggedIngredient(BaseModel):
    """A flagged harmful/concerning ingredient."""
    name: str  # Official name (e.g., "Parabens")
    matched_term: str  # What was matched in the ingredient list
    severity: str  # "high", "moderate", "low"
    categories: List[str]  # ["irritant", "allergen", etc.]
    reason: str  # Why it's flagged
    alternatives: List[str]  # Safer alternatives
    avoid_if: List[str]  # Conditions where extra caution needed


class SafetyReport(BaseModel):
    """Comprehensive safety analysis report for a product."""
    flagged_ingredients: List[FlaggedIngredient]
    total_flagged: int
    high_severity_count: int
    moderate_severity_count: int
    low_severity_count: int
    safety_score: int  # 0-100, higher = safer
    recommendations: List[str]
    is_pregnancy_safe: bool
    is_sensitive_skin_safe: bool
    
    
class ProductImageResponse(BaseModel):
    """Response schema for product image recognition."""
    found: bool
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    key_ingredients: Optional[List[KeyIngredient]] = None  # Active ingredients with percentages
    ingredients: Optional[List[str]] = None  # Full ingredient list
    description: Optional[str] = None
    confidence: Optional[float] = None
    matched_product: Optional[dict] = None
    safety_rating: Optional[int] = None
    suitability_score: Optional[int] = None
    warnings: Optional[List[str]] = None
    safety_report: Optional[SafetyReport] = None  # Detailed safety analysis
    product_image_url: Optional[str] = None  # Clean product image URL
    image_source: Optional[str] = None  # Where the image came from


MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB
MIN_PRODUCT_IMAGE_BYTES = 64


async def fetch_clean_product_image(brand: str, product_name: str) -> tuple[Optional[str], Optional[str]]:
    """
    Fetch a clean product image with white background from various sources.
    Priority: 1. Open Beauty Facts (best quality)  2. Open Food Facts  3. None
    
    Returns: (image_url, source) tuple
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            search_query = f"{brand} {product_name}".replace(" ", "+")
            
            # Try Open Beauty Facts search - prefer high-res images
            obf_url = f"https://world.openbeautyfacts.org/cgi/search.pl?search_terms={search_query}&search_simple=1&action=process&json=1&page_size=10"
            response = await client.get(obf_url)
            
            if response.status_code == 200:
                data = response.json()
                products = data.get("products", [])
                
                # Sort by image quality - prefer front images, then large images
                for product in products:
                    # Priority: front_url > selected_images > image_url
                    possible_images = []
                    
                    # Check for high-res front image (best quality, usually white bg)
                    if product.get("image_front_url"):
                        possible_images.append(product["image_front_url"])
                    
                    # Check selected_images for front display
                    selected = product.get("selected_images", {})
                    front_display = selected.get("front", {}).get("display", {})
                    if front_display:
                        # Get highest resolution available
                        for lang in ["en", "fr", "de", ""]:
                            if front_display.get(lang):
                                possible_images.append(front_display[lang])
                                break
                    
                    # Fallback to regular image
                    if product.get("image_url"):
                        possible_images.append(product["image_url"])
                    
                    # Try each image URL
                    for image_url in possible_images:
                        if not image_url:
                            continue
                        try:
                            # Verify image is accessible and get size
                            img_check = await client.head(image_url, timeout=5.0)
                            if img_check.status_code == 200:
                                # Prefer larger images (better quality)
                                content_length = img_check.headers.get("content-length", "0")
                                if int(content_length) > 5000:  # At least 5KB
                                    return (image_url, "open_beauty_facts")
                        except Exception:
                            continue
            
            # Try Open Food Facts as fallback
            off_url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={search_query}&search_simple=1&action=process&json=1&page_size=5"
            response = await client.get(off_url)
            
            if response.status_code == 200:
                data = response.json()
                products = data.get("products", [])
                
                for product in products:
                    # Prefer front images
                    image_url = product.get("image_front_url") or product.get("image_url")
                    if image_url:
                        try:
                            img_check = await client.head(image_url, timeout=5.0)
                            if img_check.status_code == 200:
                                return (image_url, "open_food_facts")
                        except Exception:
                            continue
                        
    except Exception as e:
        logger.warning(f"Failed to fetch product image: {e}")
    
    return (None, None)


@router.post("/identify-from-image", response_model=ProductImageResponse)
async def identify_product_from_image(
    request: ProductImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    product_db: Session = Depends(get_product_db)
):
    """
    Identify a beauty/skincare product from an image using AI vision.
    
    SRS: FR28 - Product Scanner (Enhanced with Image Recognition)
    
    Uses OpenAI GPT-4 Vision to:
    1. Identify product name, brand, and category
    2. Extract visible ingredients if shown
    3. Match against Product Catalog (SEPARATE DATABASE)
    4. Provide safety analysis
    5. Auto-save new products to catalog
    """
    try:
        # Get OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            logger.error("OPENAI_API_KEY environment variable is not set")
            raise HTTPException(
                status_code=503,
                detail="AI image recognition service not configured. Please contact support."
            )
        
        # Validate key format (should start with sk-)
        if not openai_key.startswith("sk-"):
            logger.error("OPENAI_API_KEY appears to be invalid (doesn't start with sk-)")
            raise HTTPException(
                status_code=503,
                detail="AI service configuration error. Please contact support."
            )
        
        # Prepare image data
        image_data = request.image_data
        if image_data.startswith("data:"):
            # Extract base64 part from data URL
            image_data = image_data.split(",")[1]
        
        # Validate base64 image payload
        try:
            decoded_bytes = base64.b64decode(image_data, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Invalid image data. Provide base64-encoded image.",
            )
        if len(decoded_bytes) < MIN_PRODUCT_IMAGE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Image data is too small.",
            )
        if len(decoded_bytes) > MAX_PRODUCT_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Image too large. Maximum size is 4 MB.",
            )

        # Call OpenAI Vision API
        client = openai.OpenAI(api_key=openai_key)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert at identifying beauty and skincare products from photos.

YOUR GOAL: Identify the product even from blurry, angled, or low-quality photos.

IDENTIFICATION STRATEGY:
1. FIRST: Look for any visible text - brand name, product name, even partial words
2. SECOND: Recognize the product by its distinctive packaging - color, shape, design, logo
3. THIRD: Use your extensive knowledge of popular skincare/beauty products to match visual cues
4. FOURTH: If you see a partial brand name or logo, infer the full brand (e.g., "Cera" -> "CeraVe", "Neutro" -> "Neutrogena")

COMMON BRANDS TO RECOGNIZE BY PACKAGING:
- CeraVe: Blue/white packaging, minimalist design
- Neutrogena: Orange/white accents, clean design  
- The Ordinary: White dropper bottles, minimalist black text
- La Roche-Posay: White/blue, pharmacy style
- Olay: Red/white, elegant curves
- Cetaphil: Green/white, gentle branding
- Paula's Choice: Teal/white modern design
- Drunk Elephant: Colorful, playful bottles
- Tatcha: Purple/gold, Japanese aesthetic
- Sunday Riley: Colorful, luxury feel
- Kiehl's: Apothecary brown bottles

BE CONFIDENT: Even if the image is blurry, make your best educated guess based on:
- Partial text you can read
- Package shape and color
- Brand design patterns you recognize
- Common products that match the visual

Extract:
1. Product name (your best guess, even if partially visible)
2. Brand name (infer from logo/colors if text unclear)
3. Category (cleanser, moisturizer, serum, sunscreen, toner, mask, exfoliant, eye cream, lip care, body care, hair care, other)
4. Key ingredients with percentages if shown
5. Full ingredient list if visible
6. Size if visible

Respond in JSON format:
{
    "product_name": "string",
    "brand": "string", 
    "category": "string",
    "key_ingredients": [{"name": "Niacinamide", "percentage": "10%"}] or null,
    "ingredients": ["Water", "Glycerin", ...] or null,
    "size": "string or null",
    "description": "brief description",
    "confidence": 0.0-1.0
}

IMPORTANT: 
- Set confidence 0.5-0.7 if you're guessing based on partial info
- Set confidence 0.8-1.0 if you clearly read the product info
- ONLY return null if you truly cannot identify ANY product (just a random object)
- Always try to provide product_name and brand - guess if needed!"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify this skincare/beauty product. It may be blurry or at an angle - use your knowledge to recognize the brand and product from any visible text, colors, packaging shape, or logo design."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                                "detail": "auto"  # Let AI choose detail level for flexibility
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.3  # Slightly higher to allow educated guessing
        )
        
        # Parse AI response
        ai_text = response.choices[0].message.content
        
        # Extract JSON from response
        # Try to find JSON in the response
        json_match = re.search(r'\{[\s\S]*\}', ai_text)
        if not json_match:
            logger.warning(f"Could not parse AI response: {ai_text}")
            return ProductImageResponse(found=False)
        
        ai_result = json.loads(json_match.group())
        
        if not ai_result.get("product_name"):
            return ProductImageResponse(found=False)
        
        product_name = ai_result.get("product_name")
        brand = ai_result.get("brand")
        category = ai_result.get("category")
        ingredients = ai_result.get("ingredients") or []
        confidence = ai_result.get("confidence", 0.8)
        
        # Extract key ingredients with percentages
        key_ingredients_raw = ai_result.get("key_ingredients") or []
        key_ingredients = []
        for ki in key_ingredients_raw:
            if isinstance(ki, dict):
                key_ingredients.append(KeyIngredient(
                    name=ki.get("name", ""),
                    percentage=ki.get("percentage")
                ))
            elif isinstance(ki, str):
                # Handle simple string format like "Niacinamide 10%"
                key_ingredients.append(KeyIngredient(name=ki))
        
        # Try to find matching product in database
        matched_product = None
        product_image_url = None
        image_source = None
        
        if product_name and brand:
            # CATALOG FIRST: Check Product Catalog for pre-computed data
            # Uses SEPARATE product database for scalability
            try:
                catalog = ProductCatalogService(product_db)
                catalog_product = catalog.lookup_by_name_brand(product_name, brand)
                
                if catalog_product:
                    logger.info(f"Catalog HIT for AI-identified product: {brand} - {product_name}")
                    # Use catalog data with pre-computed safety!
                    return ProductImageResponse(
                        found=True,
                        product_name=catalog_product["name"],
                        brand=catalog_product["brand"],
                        category=catalog_product["category"],
                        key_ingredients=[KeyIngredient(**ki) for ki in (catalog_product.get("key_ingredients") or [])],
                        ingredients=catalog_product.get("ingredients", []),
                        description=catalog_product.get("description"),
                        confidence=confidence,
                        matched_product={
                            "id": catalog_product["id"],
                            "name": catalog_product["name"],
                            "brand": catalog_product["brand"],
                            "category": catalog_product["category"],
                            "image_url": catalog_product.get("image_url"),
                        },
                        safety_rating=catalog_product.get("safety_score", 80),
                        suitability_score=75,
                        warnings=None,
                        safety_report=SafetyReport(
                            flagged_ingredients=[FlaggedIngredient(**f) for f in (catalog_product.get("flagged_ingredients") or [])],
                            total_flagged=len(catalog_product.get("flagged_ingredients") or []),
                            high_severity_count=0,
                            moderate_severity_count=0,
                            low_severity_count=0,
                            safety_score=catalog_product.get("safety_score", 80),
                            recommendations=[],
                            is_pregnancy_safe=catalog_product.get("pregnancy_safe", True),
                            is_sensitive_skin_safe=catalog_product.get("sensitive_skin_safe", True),
                        ) if catalog_product.get("safety_score") else None,
                        product_image_url=catalog_product.get("image_url"),
                        image_source="catalog"
                    )
            except Exception as e:
                logger.warning(f"Catalog lookup failed for AI product: {e}")
            
            # Fall back to local products database
            db_product = db.query(Product).filter(
                Product.name.ilike(f"%{product_name}%"),
                Product.brand.ilike(f"%{brand}%")
            ).first()
            
            if db_product:
                matched_product = {
                    "id": str(db_product.id),
                    "name": db_product.name,
                    "brand": db_product.brand,
                    "category": db_product.category,
                    "image_url": db_product.product_image_url,
                }
                if db_product.product_image_url:
                    product_image_url = db_product.product_image_url
                    image_source = "database"
        
        # If no image found in database, search online for a clean product image
        if not product_image_url and brand and product_name:
            fetched_image, fetched_source = await fetch_clean_product_image(brand, product_name)
            if fetched_image:
                product_image_url = fetched_image
                image_source = fetched_source or "online"
        
        # AUTO-SAVE: If product not in database and confidence is high, save it
        if not matched_product and product_name and brand and confidence >= 0.7:
            try:
                # Save to legacy products table
                new_product = Product(
                    brand=brand,
                    name=product_name,
                    category=category or "other",
                    product_image_url=product_image_url,
                    primary_concerns=[],
                    skin_types=[],
                )
                db.add(new_product)
                db.commit()
                db.refresh(new_product)
                
                matched_product = {
                    "id": str(new_product.id),
                    "name": new_product.name,
                    "brand": new_product.brand,
                    "category": new_product.category,
                    "image_url": new_product.product_image_url,
                }
                logger.info(f"Auto-saved new product: {brand} - {product_name}")
                
                # ALSO ADD TO CATALOG: Save to Product Catalog (SEPARATE DATABASE)
                # This enables fast lookups for future scans
                try:
                    catalog = ProductCatalogService(product_db)
                    key_ing_dicts_for_catalog = [
                        {"name": ki.name, "percentage": ki.percentage}
                        for ki in key_ingredients
                    ] if key_ingredients else None
                    
                    catalog.add_from_scan(
                        name=product_name,
                        brand=brand,
                        category=category or "other",
                        ingredients=ingredients,
                        key_ingredients=key_ing_dicts_for_catalog,
                        image_url=product_image_url,
                        source="ai_scan"
                    )
                    logger.info(f"Added to Product Catalog DB: {brand} - {product_name}")
                except Exception as catalog_err:
                    logger.warning(f"Failed to add to product catalog: {catalog_err}")
                
                # SAVE INGREDIENTS: Persist ingredients to database with percentages
                if ingredients:
                    # Convert key_ingredients to dict format for saving
                    key_ing_dicts = [
                        {"name": ki.name, "percentage": ki.percentage}
                        for ki in key_ingredients
                    ] if key_ingredients else None
                    
                    saved_count = save_product_ingredients(
                        db=db,
                        product_id=new_product.id,
                        ingredients=ingredients,
                        key_ingredients=key_ing_dicts
                    )
                    logger.info(f"Saved {saved_count} ingredients for AI-identified product")
            except Exception as e:
                logger.warning(f"Failed to auto-save product: {e}")
                db.rollback()
        
        # Comprehensive safety analysis using ingredient safety database
        all_ingredients_to_analyze = ingredients.copy()
        # Also analyze key ingredients
        for ki in key_ingredients:
            if ki.name not in all_ingredients_to_analyze:
                all_ingredients_to_analyze.append(ki.name)
        
        safety_analysis = analyze_ingredients_list(all_ingredients_to_analyze)
        
        # Build safety report
        safety_report = SafetyReport(
            flagged_ingredients=[
                FlaggedIngredient(
                    name=f["name"],
                    matched_term=f["matched_term"],
                    severity=f["severity"],
                    categories=f["categories"],
                    reason=f["reason"],
                    alternatives=f["alternatives"],
                    avoid_if=f["avoid_if"]
                )
                for f in safety_analysis["flagged_ingredients"]
            ],
            total_flagged=safety_analysis["total_flagged"],
            high_severity_count=safety_analysis["high_severity_count"],
            moderate_severity_count=safety_analysis["moderate_severity_count"],
            low_severity_count=safety_analysis["low_severity_count"],
            safety_score=safety_analysis["safety_score"],
            recommendations=safety_analysis["recommendations"],
            is_pregnancy_safe=safety_analysis["is_pregnancy_safe"],
            is_sensitive_skin_safe=safety_analysis["is_sensitive_skin_safe"]
        )
        
        # Generate simple warnings from flagged ingredients
        warnings = []
        for flagged in safety_analysis["flagged_ingredients"]:
            if flagged["severity"] == "high":
                warnings.append(f"⚠️ {flagged['name']}: {flagged['reason']}")
            elif flagged["severity"] == "moderate":
                warnings.append(f"⚡ {flagged['name']}: {flagged['reason']}")
        
        return ProductImageResponse(
            found=True,
            product_name=product_name,
            brand=brand,
            category=category,
            key_ingredients=key_ingredients if key_ingredients else None,
            ingredients=ingredients[:15],  # Limit to 15 ingredients
            description=ai_result.get("description"),
            confidence=confidence,
            matched_product=matched_product,
            safety_rating=safety_analysis["safety_score"],
            suitability_score=75,  # TODO: Calculate based on user skin profile
            warnings=warnings if warnings else None,
            safety_report=safety_report,
            product_image_url=product_image_url,
            image_source=image_source
        )
        
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI authentication error: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI service authentication failed. Please check API key configuration."
        )
    except openai.RateLimitError as e:
        logger.error(f"OpenAI rate limit: {e}")
        raise HTTPException(
            status_code=429,
            detail="AI service is busy. Please try again in a moment."
        )
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again later."
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from AI response: {e}")
        return ProductImageResponse(found=False)
    except HTTPException:
        # Re-raise HTTP exceptions without wrapping
        raise
    except Exception as e:
        logger.error(f"Product identification error: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to identify product. Please try again with a clearer image."
        )
