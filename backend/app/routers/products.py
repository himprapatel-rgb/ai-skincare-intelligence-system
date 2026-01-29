"""Products Router - Product Recommendations API

FastAPI router for product search, recommendations, and ingredient analysis.
Created: December 13, 2025
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.product_models import Ingredient, Product, ProductReview
from app.models.user import User
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

router = APIRouter(
    prefix="/api/v1/products",
    tags=["products"]
)


@router.get("", response_model=List[ProductResponse])
async def search_products(
    search: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Search and filter products"""
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
    
    products = query.offset(offset).limit(limit).all()
    return products


@router.get("/{barcode}", response_model=ProductResponse)
async def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):
    """Lookup product by barcode (EAN-8 to EAN-14)"""
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
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get similar product recommendations using content-based filtering"""
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


@router.post("/analyze", response_model=SafetyAnalysis)
async def analyze_ingredients(
    request: IngredientAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze ingredient safety and compatibility"""
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
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get reviews for a product with ratings distribution.
    
    SRS: FR-REVIEWS - Product reviews and ratings
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews with pagination
    reviews_query = db.query(ProductReview).filter(
        ProductReview.product_id == product_id
    ).order_by(ProductReview.created_at.desc())
    
    total = reviews_query.count()
    reviews = reviews_query.offset(offset).limit(limit).all()
    
    # Calculate rating distribution
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    all_reviews = db.query(ProductReview).filter(
        ProductReview.product_id == product_id
    ).all()
    
    total_rating = 0
    for r in all_reviews:
        rating_dist[r.rating] = rating_dist.get(r.rating, 0) + 1
        total_rating += r.rating
    
    avg_rating = (total_rating / len(all_reviews)) if all_reviews else 0.0
    
    # Build response with user display names
    review_responses = []
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        display_name = user.email.split('@')[0] if user else "Anonymous"
        
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
        verified_purchase=0  # TODO: Check if product is in user's shelf
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Update product average rating
    all_reviews = db.query(ProductReview).filter(
        ProductReview.product_id == product_id
    ).all()
    if all_reviews:
        avg = sum(r.rating for r in all_reviews) / len(all_reviews)
        product.average_rating = round(avg, 2)
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


# ===== Barcode Scanning Endpoint (FR28) =====
from pydantic import BaseModel
import httpx
import logging

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
    warnings: Optional[List[str]] = None
    source: str = "database"


@router.post("/scan-barcode", response_model=BarcodeScanResponse)
async def scan_barcode(
    request: BarcodeScanRequest,
    db: Session = Depends(get_db)
):
    """
    Scan a product barcode and return product information with safety analysis.
    
    SRS: FR28 - Barcode Scanning
    Sprint: GUI-2
    
    First checks local database, then falls back to OpenBeautyFacts API.
    """
    barcode = request.barcode.strip()
    
    # 1. Check local database first
    product = db.query(Product).filter(Product.upc == barcode).first()
    
    if product:
        # Analyze ingredients
        ingredients = []
        warnings = []
        safety_score = 85  # Default good score
        
        if product.ingredients:
            ingredients = [ing.strip() for ing in product.ingredients.split(",")[:10]]
            
            # Check for common allergens/irritants
            irritants = ["fragrance", "alcohol denat", "sodium lauryl sulfate", "parabens"]
            for ing in ingredients:
                for irritant in irritants:
                    if irritant.lower() in ing.lower():
                        warnings.append(f"Contains {irritant}")
                        safety_score -= 10
        
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
            safety_rating=max(0, safety_score),
            suitability_score=78,  # TODO: Calculate based on user profile
            ingredients=ingredients,
            warnings=list(set(warnings)),
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
                            for ing in obf_product["ingredients_text"].split(",")[:10]
                        ]
                    
                    # Basic safety analysis
                    warnings = []
                    safety_score = 80
                    
                    irritants = ["fragrance", "parfum", "alcohol denat", "sls"]
                    for ing in ingredients:
                        for irritant in irritants:
                            if irritant.lower() in ing.lower():
                                warnings.append(f"Contains {irritant}")
                                safety_score -= 10
                    
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
                        safety_rating=max(0, safety_score),
                        suitability_score=70,
                        ingredients=ingredients,
                        warnings=list(set(warnings)),
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
        warnings=None,
        source="not_found",
    )


# ===== Product Image Recognition Endpoint (FR28 Enhanced) =====
import openai
import base64
import os

class ProductImageRequest(BaseModel):
    """Request schema for product image recognition."""
    image_data: str  # Base64 encoded image


class KeyIngredient(BaseModel):
    """Key ingredient with concentration percentage."""
    name: str
    percentage: Optional[str] = None  # e.g., "10%", "2%"
    
    
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
    product_image_url: Optional[str] = None  # Clean product image URL
    image_source: Optional[str] = None  # Where the image came from


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
                        except:
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
                        except:
                            continue
                        
    except Exception as e:
        logger.warning(f"Failed to fetch product image: {e}")
    
    return (None, None)


@router.post("/identify-from-image", response_model=ProductImageResponse)
async def identify_product_from_image(
    request: ProductImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Identify a beauty/skincare product from an image using AI vision.
    
    SRS: FR28 - Product Scanner (Enhanced with Image Recognition)
    
    Uses OpenAI GPT-4 Vision to:
    1. Identify product name, brand, and category
    2. Extract visible ingredients if shown
    3. Match against local database
    4. Provide safety analysis
    """
    try:
        # Get OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise HTTPException(
                status_code=503,
                detail="AI image recognition service not configured"
            )
        
        # Prepare image data
        image_data = request.image_data
        if image_data.startswith("data:"):
            # Extract base64 part from data URL
            image_data = image_data.split(",")[1]
        
        # Call OpenAI Vision API
        client = openai.OpenAI(api_key=openai_key)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a beauty and skincare product identification expert.
                    
When shown an image of a product, extract:
1. Product name (exact name from packaging)
2. Brand name
3. Category (cleanser, moisturizer, serum, sunscreen, toner, mask, exfoliant, eye cream, lip care, body care, hair care, other)
4. Key active ingredients WITH percentages if shown (e.g., "Niacinamide 10%", "Vitamin C 15%", "Hyaluronic Acid 2%")
5. Full ingredient list if visible
6. Product size/volume if visible

IMPORTANT: For ingredients, always include the percentage/concentration if it's displayed on the packaging.
Many products highlight key actives like "10% Niacinamide" or "2% Salicylic Acid" - capture these percentages.

Respond in JSON format:
{
    "product_name": "string",
    "brand": "string", 
    "category": "string",
    "key_ingredients": [
        {"name": "Niacinamide", "percentage": "10%"},
        {"name": "Hyaluronic Acid", "percentage": "2%"}
    ] or null if not visible,
    "ingredients": ["Water", "Glycerin", ...] or null if not visible,
    "size": "string or null",
    "description": "brief description of the product",
    "confidence": 0.0-1.0
}

If you cannot identify the product, return:
{"product_name": null, "brand": null, "confidence": 0}"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify this beauty/skincare product. Extract all visible information from the packaging."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.1
        )
        
        # Parse AI response
        ai_text = response.choices[0].message.content
        
        # Extract JSON from response
        import json
        import re
        
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
            # First check our local database
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
            except Exception as e:
                logger.warning(f"Failed to auto-save product: {e}")
                db.rollback()
        
        # Calculate safety rating based on ingredients
        warnings = []
        safety_score = 85
        
        irritants = ["fragrance", "parfum", "alcohol denat", "sodium lauryl sulfate", "parabens", "formaldehyde"]
        for ing in ingredients:
            for irritant in irritants:
                if irritant.lower() in ing.lower():
                    warnings.append(f"Contains {irritant}")
                    safety_score -= 10
        
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
            safety_rating=max(0, safety_score),
            suitability_score=75,  # TODO: Calculate based on user skin profile
            warnings=list(set(warnings)) if warnings else None,
            product_image_url=product_image_url,
            image_source=image_source
        )
        
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable"
        )
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        return ProductImageResponse(found=False)
    except Exception as e:
        logger.error(f"Product identification error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to identify product: {str(e)}"
        )
