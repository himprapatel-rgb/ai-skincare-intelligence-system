"""Product Schemas for API Validation

Pydantic models for product-related API requests/responses.
Created: December 13, 2025
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class IngredientBase(BaseModel):
    """Base ingredient schema"""
    inci_name: str = Field(..., description="INCI standardized name")
    common_names: Optional[List[str]] = Field(default=[], description="Common names")
    category: Optional[str] = None
    function: Optional[str] = None
    safety_rating: Optional[int] = Field(None, ge=0, le=10)
    comedogenic_rating: Optional[int] = Field(None, ge=0, le=5)


class IngredientResponse(IngredientBase):
    """Ingredient response model"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base product schema"""
    brand: str = Field(..., min_length=1, max_length=200)
    name: str = Field(..., min_length=1, max_length=300)
    category: str = Field(..., description="Product category")
    upc: Optional[str] = Field(None, description="Barcode/UPC")
    

class ProductCreate(ProductBase):
    """Product creation schema"""
    ingredients_text: Optional[str] = None
    primary_concerns: Optional[List[str]] = None
    skin_types: Optional[List[str]] = None


class ProductResponse(ProductBase):
    """Product response with ingredients"""
    id: UUID
    average_rating: Optional[float] = None
    price_usd: Optional[float] = None
    ingredients: List[IngredientResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductSearch(BaseModel):
    """Product search parameters"""
    search: Optional[str] = Field(None, description="Search query")
    brand: Optional[str] = None
    category: Optional[str] = None
    skin_type: Optional[str] = None
    limit: int = Field(10, ge=1, le=100)
    offset: int = Field(0, ge=0)


class ProductRecommendation(BaseModel):
    """Product recommendation response"""
    product: ProductResponse
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(..., description="Why recommended")


class RecommendationItem(BaseModel):
    """Simplified product payload for recommendations UI."""
    id: UUID
    name: str
    brand: str
    category: str
    price: Optional[float] = None
    rating: Optional[float] = None
    ingredients: List[str] = []
    concerns: List[str] = []
    image_url: Optional[str] = None
    purchase_url: Optional[str] = None


class RecommendationsResponse(BaseModel):
    """Recommendations list response."""
    recommendations: List[RecommendationItem]


class IngredientAnalysisRequest(BaseModel):
    """Ingredient analysis request"""
    ingredients: List[str] = Field(..., min_items=1)
    skin_type: Optional[str] = None


class SafetyAnalysis(BaseModel):
    """Safety analysis result"""
    overall_safety_score: float = Field(..., ge=0.0, le=10.0)
    allergen_warnings: List[str] = []
    comedogenic_score: Optional[float] = None
    pregnancy_safe: bool = True
    sensitive_skin_safe: bool = True
    flagged_ingredients: List[Dict[str, Any]] = []


# ===== Product Reviews Schemas =====

class ReviewCreate(BaseModel):
    """Schema for creating a product review."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5 stars")
    title: Optional[str] = Field(None, max_length=200, description="Review title")
    comment: Optional[str] = Field(None, max_length=2000, description="Review text")
    skin_type: Optional[str] = Field(None, max_length=50, description="User's skin type")
    would_recommend: bool = Field(True, description="Would recommend this product")

    class Config:
        json_schema_extra = {
            "example": {
                "rating": 4,
                "title": "Great moisturizer!",
                "comment": "This serum really helped with my dry skin.",
                "skin_type": "Dry",
                "would_recommend": True
            }
        }


class ReviewResponse(BaseModel):
    """Schema for review response."""
    id: UUID
    product_id: UUID
    user_id: int
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    skin_type: Optional[str] = None
    would_recommend: bool = True
    verified_purchase: bool = False
    helpful_count: int = 0
    created_at: datetime
    # User display name (populated separately)
    user_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewsListResponse(BaseModel):
    """Schema for paginated reviews list."""
    reviews: List[ReviewResponse]
    total: int
    average_rating: float
    rating_distribution: Dict[int, int] = Field(
        default_factory=lambda: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    )
