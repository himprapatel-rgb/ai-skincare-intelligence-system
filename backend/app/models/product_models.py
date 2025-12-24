"""Sprint 3: Product Intelligence - Database Models

Product and ingredient models for intelligent recommendations.
Created: December 8, 2025
"""

from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
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
