"""Products Router - Product Recommendations API

FastAPI router for product search, recommendations, and ingredient analysis.
Created: December 13, 2025
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product_models import Ingredient, Product
from app.schemas.product_schemas import (
    IngredientAnalysisRequest,
    ProductRecommendation,
    ProductResponse,
    ProductSearch,
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
                    
                    return BarcodeScanResponse(
                        found=True,
                        product={
                            "id": barcode,
                            "name": obf_product.get("product_name", "Unknown Product"),
                            "brand": obf_product.get("brands", "Unknown Brand"),
                            "barcode": barcode,
                            "category": obf_product.get("categories", "").split(",")[0] if obf_product.get("categories") else None,
                            "image_url": obf_product.get("image_url"),
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
