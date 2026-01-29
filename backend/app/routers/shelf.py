"""
Product Shelf API Router.
Sprint: GUI-2 - Story: Product Shelf API

Provides endpoints for managing user's product inventory.
"""
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import Base, engine
from app.dependencies import get_db
from app.models.shelf import ShelfProduct
from app.models.user import User

router = APIRouter(prefix="/shelf", tags=["shelf"])
logger = logging.getLogger(__name__)


# ===== Pydantic Schemas =====

class ShelfProductCreate(BaseModel):
    """Schema for adding a product to shelf."""
    # Internal products use UUID IDs (products.id)
    product_id: Optional[str] = None
    external_product_id: Optional[str] = None
    product_name: str
    product_brand: Optional[str] = None
    product_category: Optional[str] = None
    product_image: Optional[str] = None
    status: str = "active"
    rating: Optional[float] = None
    notes: Optional[str] = None
    routine_type: Optional[str] = None
    routine_order: Optional[int] = None
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    purchase_price: Optional[float] = None


class ShelfProductUpdate(BaseModel):
    """Schema for updating a shelf product."""
    status: Optional[str] = None
    rating: Optional[float] = None
    notes: Optional[str] = None
    routine_type: Optional[str] = None
    routine_order: Optional[int] = None
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    would_repurchase: Optional[bool] = None
    product_image: Optional[str] = None  # Allow updating product image
    product_name: Optional[str] = None   # Allow updating product name
    product_brand: Optional[str] = None  # Allow updating brand
    product_category: Optional[str] = None  # Allow updating category


class ShelfProductResponse(BaseModel):
    """Schema for shelf product response."""
    id: int
    product_id: Optional[str] = None
    external_product_id: Optional[str] = None
    product_name: str
    product_brand: Optional[str] = None
    product_category: Optional[str] = None
    product_image: Optional[str] = None
    status: str
    rating: Optional[float] = None
    notes: Optional[str] = None
    routine_type: Optional[str] = None
    routine_order: Optional[int] = None
    purchase_date: Optional[str] = None
    expiry_date: Optional[str] = None
    purchase_price: Optional[float] = None
    would_repurchase: Optional[bool] = None
    times_repurchased: int
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class ShelfListResponse(BaseModel):
    """Schema for shelf list response."""
    products: List[ShelfProductResponse]
    total: int
    by_status: dict


# ===== Endpoints =====

@router.get("", response_model=ShelfListResponse)
async def get_shelf(
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    routine_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get user's product shelf.
    
    Query params:
    - status_filter: active, finished, discontinued, wishlist
    - category: cleanser, serum, moisturizer, etc.
    - routine_type: am, pm, both
    """
    query = db.query(ShelfProduct).filter(ShelfProduct.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(ShelfProduct.status == status_filter)
    if category:
        query = query.filter(ShelfProduct.product_category == category)
    if routine_type:
        query = query.filter(ShelfProduct.routine_type == routine_type)
    
    products = query.order_by(
        ShelfProduct.routine_order.asc().nullslast(),
        ShelfProduct.created_at.desc()
    ).all()
    
    # Count by status
    status_counts = {}
    all_products = db.query(ShelfProduct).filter(ShelfProduct.user_id == current_user.id).all()
    for p in all_products:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1
    
    return ShelfListResponse(
        products=[
            ShelfProductResponse(
                id=p.id,
                product_id=str(p.product_id) if p.product_id else None,
                external_product_id=p.external_product_id,
                product_name=p.product_name,
                product_brand=p.product_brand,
                product_category=p.product_category,
                product_image=p.product_image,
                status=p.status,
                rating=p.rating,
                notes=p.notes,
                routine_type=p.routine_type,
                routine_order=p.routine_order,
                purchase_date=p.purchase_date.isoformat() if p.purchase_date else None,
                expiry_date=p.expiry_date.isoformat() if p.expiry_date else None,
                purchase_price=p.purchase_price,
                would_repurchase=p.would_repurchase,
                times_repurchased=p.times_repurchased or 0,
                created_at=p.created_at.isoformat() if p.created_at else "",
                updated_at=p.updated_at.isoformat() if p.updated_at else None,
            )
            for p in products
        ],
        total=len(products),
        by_status=status_counts,
    )


@router.post("", response_model=ShelfProductResponse, status_code=status.HTTP_201_CREATED)
async def add_to_shelf(
    product_data: ShelfProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a product to user's shelf.
    """
    product_uuid: Optional[uuid.UUID] = None
    if product_data.product_id:
        try:
            product_uuid = uuid.UUID(str(product_data.product_id))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid product_id (must be a UUID)",
            )

    # Check if already on shelf (by product_id or external_product_id)
    existing_query = db.query(ShelfProduct).filter(ShelfProduct.user_id == current_user.id)

    conditions = []
    if product_uuid:
        conditions.append(ShelfProduct.product_id == product_uuid)
    if product_data.external_product_id:
        conditions.append(ShelfProduct.external_product_id == product_data.external_product_id)
    if not conditions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either product_id or external_product_id is required",
        )

    existing = existing_query.filter(or_(*conditions)).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product already on shelf"
        )
    
    product = ShelfProduct(
        user_id=current_user.id,
        product_id=product_uuid,
        external_product_id=product_data.external_product_id,
        product_name=product_data.product_name,
        product_brand=product_data.product_brand,
        product_category=product_data.product_category,
        product_image=product_data.product_image,
        status=product_data.status,
        rating=product_data.rating,
        notes=product_data.notes,
        routine_type=product_data.routine_type,
        routine_order=product_data.routine_order,
        purchase_date=product_data.purchase_date,
        expiry_date=product_data.expiry_date,
        purchase_price=product_data.purchase_price,
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    logger.info(f"User {current_user.id} added '{product_data.product_name}' to shelf")
    
    return ShelfProductResponse(
        id=product.id,
        product_id=str(product.product_id) if product.product_id else None,
        external_product_id=product.external_product_id,
        product_name=product.product_name,
        product_brand=product.product_brand,
        product_category=product.product_category,
        product_image=product.product_image,
        status=product.status,
        rating=product.rating,
        notes=product.notes,
        routine_type=product.routine_type,
        routine_order=product.routine_order,
        purchase_date=product.purchase_date.isoformat() if product.purchase_date else None,
        expiry_date=product.expiry_date.isoformat() if product.expiry_date else None,
        purchase_price=product.purchase_price,
        would_repurchase=product.would_repurchase,
        times_repurchased=product.times_repurchased or 0,
        created_at=product.created_at.isoformat() if product.created_at else "",
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )


@router.patch("/{shelf_id}", response_model=ShelfProductResponse)
async def update_shelf_product(
    shelf_id: int,
    product_update: ShelfProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a product on user's shelf.
    """
    product = db.query(ShelfProduct).filter(
        ShelfProduct.id == shelf_id,
        ShelfProduct.user_id == current_user.id,
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found on shelf"
        )
    
    update_data = product_update.dict(exclude_unset=True)
    
    # Track repurchase
    if "status" in update_data and update_data["status"] == "active" and product.status == "finished":
        product.times_repurchased = (product.times_repurchased or 0) + 1
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    logger.info(f"User {current_user.id} updated shelf product {shelf_id}")
    
    return ShelfProductResponse(
        id=product.id,
        product_id=str(product.product_id) if product.product_id else None,
        external_product_id=product.external_product_id,
        product_name=product.product_name,
        product_brand=product.product_brand,
        product_category=product.product_category,
        product_image=product.product_image,
        status=product.status,
        rating=product.rating,
        notes=product.notes,
        routine_type=product.routine_type,
        routine_order=product.routine_order,
        purchase_date=product.purchase_date.isoformat() if product.purchase_date else None,
        expiry_date=product.expiry_date.isoformat() if product.expiry_date else None,
        purchase_price=product.purchase_price,
        would_repurchase=product.would_repurchase,
        times_repurchased=product.times_repurchased or 0,
        created_at=product.created_at.isoformat() if product.created_at else "",
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )


@router.delete("/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_shelf(
    shelf_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a product from user's shelf.
    """
    product = db.query(ShelfProduct).filter(
        ShelfProduct.id == shelf_id,
        ShelfProduct.user_id == current_user.id,
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found on shelf"
        )
    
    db.delete(product)
    db.commit()
    
    logger.info(f"User {current_user.id} removed shelf product {shelf_id}")
    return None


@router.get("/routine/{routine_type}")
async def get_routine_products(
    routine_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get products for a specific routine (am/pm).
    """
    if routine_type not in ["am", "pm", "both"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="routine_type must be 'am', 'pm', or 'both'"
        )
    
    query = db.query(ShelfProduct).filter(
        ShelfProduct.user_id == current_user.id,
        ShelfProduct.status == "active",
    )
    
    if routine_type == "both":
        query = query.filter(ShelfProduct.routine_type.in_(["am", "pm", "both"]))
    else:
        query = query.filter(ShelfProduct.routine_type.in_([routine_type, "both"]))
    
    products = query.order_by(ShelfProduct.routine_order.asc().nullslast()).all()
    
    return {
        "routine_type": routine_type,
        "products": [
            {
                "id": p.id,
                "name": p.product_name,
                "brand": p.product_brand,
                "category": p.product_category,
                "order": p.routine_order,
                "image": p.product_image,
            }
            for p in products
        ],
        "count": len(products),
    }
