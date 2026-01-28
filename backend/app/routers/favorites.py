"""
Favorites API Router.
Sprint: GUI-2 - Story: Favorites API (US-304)

Provides endpoints for managing user's favorite products.
"""
import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import Base, engine
from app.dependencies import get_db
from app.models.favorites import UserFavorite
from app.models.user import User

router = APIRouter(prefix="/favorites", tags=["favorites"])
logger = logging.getLogger(__name__)


# ===== Pydantic Schemas =====

class FavoriteCreate(BaseModel):
    """Schema for adding a product to favorites."""
    # Internal products use UUID IDs (products.id)
    product_id: Optional[str] = None
    external_product_id: Optional[str] = None
    product_name: str
    product_brand: Optional[str] = None
    product_price: Optional[float] = None
    product_image: Optional[str] = None
    product_rating: Optional[float] = None
    match_score: Optional[float] = None


class FavoriteResponse(BaseModel):
    """Schema for favorite product response."""
    id: int
    product_id: Optional[str] = None
    external_product_id: Optional[str] = None
    product_name: str
    product_brand: Optional[str] = None
    product_price: Optional[float] = None
    product_image: Optional[str] = None
    product_rating: Optional[float] = None
    match_score: Optional[float] = None
    created_at: str

    class Config:
        from_attributes = True


class FavoritesListResponse(BaseModel):
    """Schema for favorites list response."""
    favorites: List[FavoriteResponse]
    total: int


# ===== Endpoints =====

@router.get("", response_model=FavoritesListResponse)
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's favorite products.
    
    SRS: US-304 - Favorites List
    """
    favorites = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == current_user.id)
        .order_by(UserFavorite.created_at.desc())
        .all()
    )
    
    return FavoritesListResponse(
        favorites=[
            FavoriteResponse(
                id=f.id,
                product_id=f.product_id,
                external_product_id=f.external_product_id,
                product_name=f.product_name,
                product_brand=f.product_brand,
                product_price=f.product_price,
                product_image=f.product_image,
                product_rating=f.product_rating,
                match_score=f.match_score,
                created_at=f.created_at.isoformat() if f.created_at else "",
            )
            for f in favorites
        ],
        total=len(favorites),
    )


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a product to favorites.
    
    SRS: US-304 - Add to favorites
    """
    product_uuid: Optional[uuid.UUID] = None
    if favorite_data.product_id:
        try:
            product_uuid = uuid.UUID(str(favorite_data.product_id))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid product_id (must be a UUID)",
            )

    # Check if already favorited
    conditions = []
    if product_uuid:
        conditions.append(UserFavorite.product_id == product_uuid)
    if favorite_data.external_product_id:
        conditions.append(UserFavorite.external_product_id == favorite_data.external_product_id)
    if not conditions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either product_id or external_product_id is required",
        )

    existing = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == current_user.id)
        .filter(or_(*conditions))
        .first()
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product already in favorites"
        )
    
    favorite = UserFavorite(
        user_id=current_user.id,
        product_id=product_uuid,
        external_product_id=favorite_data.external_product_id,
        product_name=favorite_data.product_name,
        product_brand=favorite_data.product_brand,
        product_price=favorite_data.product_price,
        product_image=favorite_data.product_image,
        product_rating=favorite_data.product_rating,
        match_score=favorite_data.match_score,
    )
    
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    logger.info(f"User {current_user.id} added product '{favorite_data.product_name}' to favorites")
    
    return FavoriteResponse(
        id=favorite.id,
        product_id=str(favorite.product_id) if favorite.product_id else None,
        external_product_id=favorite.external_product_id,
        product_name=favorite.product_name,
        product_brand=favorite.product_brand,
        product_price=favorite.product_price,
        product_image=favorite.product_image,
        product_rating=favorite.product_rating,
        match_score=favorite.match_score,
        created_at=favorite.created_at.isoformat() if favorite.created_at else "",
    )


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a product from favorites.
    
    SRS: US-304 - Remove from favorites
    """
    favorite = db.query(UserFavorite).filter(
        UserFavorite.id == favorite_id,
        UserFavorite.user_id == current_user.id,
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    logger.info(f"User {current_user.id} removed favorite {favorite_id}")
    return None


@router.delete("/product/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite_by_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a product from favorites by product ID.
    """
    product_uuid: Optional[uuid.UUID] = None
    try:
        product_uuid = uuid.UUID(product_id)
    except (ValueError, TypeError):
        product_uuid = None

    conditions = [UserFavorite.external_product_id == product_id]
    if product_uuid:
        conditions.append(UserFavorite.product_id == product_uuid)

    favorite = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == current_user.id)
        .filter(or_(*conditions))
        .first()
    )
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    logger.info(f"User {current_user.id} removed favorite for product {product_id}")
    return None


@router.get("/check/{product_id}")
async def check_favorite(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if a product is in favorites.
    """
    product_uuid: Optional[uuid.UUID] = None
    try:
        product_uuid = uuid.UUID(product_id)
    except (ValueError, TypeError):
        product_uuid = None

    conditions = [UserFavorite.external_product_id == product_id]
    if product_uuid:
        conditions.append(UserFavorite.product_id == product_uuid)

    favorite = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == current_user.id)
        .filter(or_(*conditions))
        .first()
    )
    
    return {"is_favorite": favorite is not None, "favorite_id": favorite.id if favorite else None}
