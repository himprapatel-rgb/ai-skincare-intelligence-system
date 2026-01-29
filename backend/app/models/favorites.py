"""
User Favorites database model for saved products.
Sprint: GUI-2 - Story: Favorites API
"""
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserFavorite(Base):
    """User's favorite products."""
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # products.id is UUID in our schema
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    
    # For external products not in our database
    external_product_id = Column(String(255), nullable=True, index=True)
    product_name = Column(String(255), nullable=False)
    product_brand = Column(String(255), nullable=True)
    product_price = Column(Float, nullable=True)
    product_image = Column(String(500), nullable=True)
    product_rating = Column(Float, nullable=True)
    match_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="favorites")
    
    def __repr__(self):
        return f"<UserFavorite user_id={self.user_id} product={self.product_name}>"
