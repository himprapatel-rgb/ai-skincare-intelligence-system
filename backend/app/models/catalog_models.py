"""Product Catalog Database Models

In-house product catalog for reducing API dependency and improving response times.
Part of the Product Catalog Database Strategy (Tasks 540-560).

Created: January 29, 2026
"""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CatalogProduct(Base):
    """
    Master product catalog - stores all known products with pre-computed data.
    
    This is the core table for the in-house product database.
    Products are imported from Open Beauty Facts, AI scans, and manual entry.
    """
    __tablename__ = "catalog_products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identifiers
    barcode = Column(String(50), unique=True, index=True)  # EAN-13, UPC-A, etc.
    barcode_type = Column(String(20))  # 'ean13', 'upc', 'qr'
    
    # Basic info
    name = Column(String(300), nullable=False, index=True)
    brand = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # cleanser, serum, etc.
    subcategory = Column(String(100))  # hydrating, anti-aging, etc.
    
    # Product details
    description = Column(Text)
    size_ml = Column(Float)
    size_unit = Column(String(20))  # ml, oz, g
    price_usd = Column(Float)
    price_range = Column(String(20))  # budget, mid, luxury
    
    # Images (hosted on Cloudinary)
    image_front_url = Column(String(500))
    image_back_url = Column(String(500))
    image_ingredients_url = Column(String(500))
    thumbnail_url = Column(String(500))
    images_source = Column(String(50))  # 'cloudinary', 'obf', 'brand'
    
    # Pre-computed safety analysis (no need to re-analyze!)
    safety_score = Column(Integer)  # 0-100
    safety_summary = Column(Text)
    flagged_ingredients = Column(JSONB)  # Pre-analyzed harmful ingredients
    pregnancy_safe = Column(Boolean)
    sensitive_skin_safe = Column(Boolean)
    
    # Skin compatibility (pre-computed)
    suitable_skin_types = Column(ARRAY(String))  # ['oily', 'dry', 'combination']
    targets_concerns = Column(ARRAY(String))  # ['acne', 'aging', 'hydration']
    
    # Product attributes
    is_fragrance_free = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    is_cruelty_free = Column(Boolean, default=False)
    is_organic = Column(Boolean, default=False)
    is_clean_beauty = Column(Boolean, default=False)
    
    # Ingredient list (stored as text for quick display)
    ingredients_text = Column(Text)  # Full ingredient list as comma-separated
    key_ingredients = Column(JSONB)  # [{"name": "Niacinamide", "percentage": "10%"}]
    
    # Data quality
    is_verified = Column(Boolean, default=False)  # Manually verified
    data_quality_score = Column(Integer)  # 0-100
    source = Column(String(50), nullable=False)  # 'obf', 'ai_scan', 'manual', 'brand'
    source_id = Column(String(255))  # Original ID in source system
    
    # Usage stats
    view_count = Column(Integer, default=0)
    scan_count = Column(Integer, default=0)
    last_scanned_at = Column(DateTime(timezone=True))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ingredients = relationship("CatalogProductIngredient", back_populates="product", cascade="all, delete-orphan")
    images = relationship("CatalogProductImage", back_populates="product", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_catalog_products_brand_name', 'brand', 'name'),
        Index('idx_catalog_products_source', 'source'),
        Index('idx_catalog_products_category', 'category'),
    )
    
    def __repr__(self):
        return f"<CatalogProduct {self.brand} - {self.name}>"


class CatalogIngredient(Base):
    """
    Master ingredient database with safety and efficacy data.
    
    Ingredients are linked to products via CatalogProductIngredient.
    Safety data is pre-computed and stored here.
    """
    __tablename__ = "catalog_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    inci_name = Column(String(255), nullable=False, unique=True, index=True)  # Official INCI name
    common_names = Column(JSONB, default=list)  # ["Vitamin C", "Ascorbic Acid"]
    
    # Classification
    category = Column(String(100))  # humectant, emollient, preservative
    function = Column(Text)  # What it does
    
    # Safety data (pre-computed)
    ewg_score = Column(Integer)  # EWG Skin Deep score 1-10
    comedogenic_rating = Column(Integer)  # 0-5
    irritancy_rating = Column(Integer)  # 0-5
    
    # Safety flags
    is_harmful = Column(Boolean, default=False)
    harm_severity = Column(String(20))  # 'high', 'moderate', 'low'
    harm_categories = Column(ARRAY(String))  # ['irritant', 'allergen', 'carcinogen']
    harm_reason = Column(Text)
    harm_alternatives = Column(ARRAY(String))
    avoid_if = Column(ARRAY(String))  # ['pregnant', 'sensitive_skin']
    
    # Regulatory
    fda_approved = Column(Boolean)
    eu_approved = Column(Boolean)
    banned_countries = Column(ARRAY(String))
    max_concentration_percent = Column(Float)
    
    # Benefits
    benefits = Column(ARRAY(String))
    targets_concerns = Column(ARRAY(String))
    
    # Metadata
    data_sources = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    products = relationship("CatalogProductIngredient", back_populates="ingredient")
    
    def __repr__(self):
        return f"<CatalogIngredient {self.inci_name}>"


class CatalogProductIngredient(Base):
    """
    Junction table linking products to their ingredients.
    
    Stores position (INCI order) and concentration if known.
    """
    __tablename__ = "catalog_product_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("catalog_products.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("catalog_ingredients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    position = Column(Integer, nullable=False)  # Order in ingredient list (1 = highest concentration)
    concentration_percent = Column(Float)  # If known (e.g., "Niacinamide 10%")
    is_key_active = Column(Boolean, default=False)  # Featured active ingredient
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("CatalogProduct", back_populates="ingredients")
    ingredient = relationship("CatalogIngredient", back_populates="products")
    
    __table_args__ = (
        UniqueConstraint('product_id', 'ingredient_id', name='uq_catalog_product_ingredient'),
    )


class CatalogProductImage(Base):
    """
    Multiple images per product (front, back, ingredients, texture).
    
    Images are hosted on Cloudinary for CDN distribution.
    """
    __tablename__ = "catalog_product_images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("catalog_products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    image_type = Column(String(50), nullable=False)  # 'front', 'back', 'ingredients', 'texture'
    is_primary = Column(Boolean, default=False)
    
    # Image quality
    width = Column(Integer)
    height = Column(Integer)
    file_size_kb = Column(Integer)
    quality_score = Column(Integer)  # 0-100
    has_white_background = Column(Boolean)
    
    # Source
    source = Column(String(50))  # 'cloudinary', 'obf', 'user', 'brand'
    source_url = Column(String(500))  # Original URL if downloaded
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    product = relationship("CatalogProduct", back_populates="images")


class CatalogBrand(Base):
    """
    Brand information for grouping and filtering.
    """
    __tablename__ = "catalog_brands"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(200), nullable=False, unique=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    
    logo_url = Column(String(500))
    website_url = Column(String(500))
    
    # Brand attributes
    is_cruelty_free = Column(Boolean)
    is_vegan = Column(Boolean)
    is_clean_beauty = Column(Boolean)
    is_luxury = Column(Boolean)
    country_of_origin = Column(String(100))
    
    # Stats
    product_count = Column(Integer, default=0)
    average_rating = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CatalogImportJob(Base):
    """
    Track import jobs from external sources (OBF, OFF, etc).
    """
    __tablename__ = "catalog_import_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    source = Column(String(50), nullable=False)  # 'obf', 'off', 'manual'
    status = Column(String(20), default='pending')  # pending, running, completed, failed
    
    total_records = Column(Integer)
    processed_records = Column(Integer, default=0)
    imported_records = Column(Integer, default=0)
    skipped_records = Column(Integer, default=0)
    error_records = Column(Integer, default=0)
    
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_log = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
