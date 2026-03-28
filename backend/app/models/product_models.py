"""Sprint 3: Product Intelligence - Database Models

Product and ingredient models for intelligent recommendations.
Created: December 8, 2025
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from ..database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name_inci = Column(String(255), nullable=False, unique=True, index=True)
    common_names = Column(JSONB, default=list, nullable=False)
    category = Column(String(100), nullable=True)
    function = Column(Text, nullable=True)
    safety_category = Column(String(50), nullable=True)
    safety_rating = Column(Integer, nullable=True)
    comedogenic_rating = Column(Integer, nullable=True)
    microbiome_impact = Column(String(50), nullable=True)
    is_antimicrobial = Column(Integer, default=0, nullable=False)
    fda_approved = Column(Integer, default=0, nullable=False)
    eu_approved = Column(Integer, default=0, nullable=False)
    data_sources = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    product_ingredients = relationship("ProductIngredient", back_populates="ingredient")
    
class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand = Column(String(200), nullable=False, index=True)
    name = Column(String(300), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    upc = Column(String(50), nullable=True, index=True)
    size_ml = Column(Float, nullable=True)
    primary_concerns = Column(JSONB, nullable=True)
    skin_types = Column(JSONB, nullable=True)
    suitable_for = Column(ARRAY(String))  # e.g., ['Oily', 'Combination']
    targets = Column(ARRAY(String))  # e.g., ['Acne', 'Redness']
    is_fragrance_free = Column(Integer, default=0, nullable=False)
    is_vegan = Column(Integer, default=0, nullable=False)
    is_cruelty_free = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, nullable=True)
    price_usd = Column(Float, nullable=True)
    product_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    ingredients_text = Column(Text, nullable=True)
    country_of_origin = Column(String(100), nullable=True)
    discontinued = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    product_ingredients = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")
    routine_usages = relationship("RoutineProductUsage", back_populates="product")
    
class ProductIngredient(Base):
    __tablename__ = "product_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    concentration_percent = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    product = relationship("Product", back_populates="product_ingredients")
    ingredient = relationship("Ingredient", back_populates="product_ingredients")


class ProductReview(Base):
    """Product reviews submitted by users.
    
    SRS: FR-REVIEWS - User product reviews and ratings
    Sprint: Post-MVP
    """
    __tablename__ = "product_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    skin_type = Column(String(50), nullable=True)  # User's skin type for context
    would_recommend = Column(Integer, default=1)  # 1 = yes, 0 = no
    verified_purchase = Column(Integer, default=0)  # 1 if from shelf
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    product = relationship("Product", backref="reviews")
    user = relationship("User", backref="product_reviews")
    
    # Composite indexes for better query performance
    __table_args__ = (
        Index('ix_product_reviews_product_user', 'product_id', 'user_id', unique=True),
        Index('ix_product_reviews_created_at', 'created_at'),
        Index('ix_product_reviews_product_created', 'product_id', 'created_at'),
    )


class ProductEffectiveness(Base):
    """
    Tracks how products affect skin scores over time.
    Core dataset for building Pellicura's proprietary recommendation intelligence.

    Created automatically when:
    1. User adds a product to shelf
    2. User completes a scan while using the product
    3. System calculates score delta (before → after)

    This data powers:
    - "Users like you improved X% with this product"
    - Effectiveness-weighted recommendation ranking
    - Product comparison with real outcome data
    """

    __tablename__ = "product_effectiveness"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)

    # User context at measurement time
    skin_type = Column(String(50), nullable=True)
    age_group = Column(String(20), nullable=True)  # "20s", "30s", "40s"
    primary_concerns = Column(JSONB, nullable=True)  # ["acne", "oiliness"]
    climate = Column(String(50), nullable=True)

    # Score snapshots
    score_before = Column(JSONB, nullable=True)  # {"overall": 55, "acne": 70, "hydration": 40, ...}
    score_after = Column(JSONB, nullable=True)   # {"overall": 62, "acne": 58, "hydration": 55, ...}
    score_delta = Column(JSONB, nullable=True)   # {"overall": +7, "acne": -12, "hydration": +15, ...}

    # Usage context
    days_used = Column(Integer, nullable=True)  # How long user used the product
    usage_frequency = Column(String(20), nullable=True)  # "daily", "2x_daily", "weekly"
    used_with_products = Column(JSONB, nullable=True)  # Other products used simultaneously

    # Scan references
    scan_before_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=True)
    scan_after_id = Column(UUID(as_uuid=True), ForeignKey("scan_sessions.id"), nullable=True)

    # Outcome signals
    overall_improvement = Column(Float, nullable=True)  # -100 to +100 (negative = worse)
    would_repurchase = Column(Boolean, nullable=True)
    user_rating = Column(Integer, nullable=True)  # 1-5

    # Metadata
    measurement_type = Column(String(20), default="auto")  # "auto" (system) or "manual" (user)
    confidence = Column(Float, default=0.5)  # How reliable is this measurement (0-1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_product_effectiveness_product', 'product_id'),
        Index('ix_product_effectiveness_skin_type', 'skin_type'),
        Index('ix_product_effectiveness_created', 'created_at'),
    )
