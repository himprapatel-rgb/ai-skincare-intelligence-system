"""Sprint 3: Product Intelligence - Database Models

Product and ingredient models for intelligent recommendations.
Created: December 8, 2025
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
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
    
    # Composite index for user+product uniqueness (one review per user per product)
    __table_args__ = (
        Index('ix_product_reviews_product_user', 'product_id', 'user_id', unique=True),
    )
