"""Products Router - Product Recommendations API

FastAPI router for product search, recommendations, and ingredient analysis.
Created: December 13, 2025
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.schemas.product_schemas import (
    ProductResponse,
    ProductSearch,
    ProductRecommendation,
    IngredientAnalysisRequest,
    SafetyAnalysis
)
from app.models.product_models import Product, Ingredient

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
