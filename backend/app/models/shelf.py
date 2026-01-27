"""
User Product Shelf database model.
Sprint: GUI-2 - Story: Product Shelf API
"""
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ProductStatus(str, enum.Enum):
    """Product usage status."""
    ACTIVE = "active"           # Currently using
    FINISHED = "finished"       # Used up
    DISCONTINUED = "discontinued"  # Stopped using
    WISHLIST = "wishlist"       # Want to buy


class ShelfProduct(Base):
    """User's product shelf - their personal inventory."""
    __tablename__ = "shelf_products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    
    # Product details (for external products)
    external_product_id = Column(String(255), nullable=True, index=True)
    product_name = Column(String(255), nullable=False)
    product_brand = Column(String(255), nullable=True)
    product_category = Column(String(100), nullable=True)  # cleanser, serum, moisturizer, etc.
    product_image = Column(String(500), nullable=True)
    
    # User's interaction
    status = Column(String(20), default="active")
    rating = Column(Float, nullable=True)  # 1-5 stars
    notes = Column(Text, nullable=True)
    
    # Routine assignment
    routine_type = Column(String(20), nullable=True)  # "am", "pm", "both", null
    routine_order = Column(Integer, nullable=True)  # Order in routine
    
    # Purchase tracking
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    purchase_price = Column(Float, nullable=True)
    
    # Repurchase tracking
    would_repurchase = Column(Boolean, nullable=True)
    times_repurchased = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="shelf_products")
    
    def __repr__(self):
        return f"<ShelfProduct user_id={self.user_id} product={self.product_name}>"
