"""Product Schemas for API Validation

Pydantic models for product-related API requests/responses.
Created: December 13, 2025
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime


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
