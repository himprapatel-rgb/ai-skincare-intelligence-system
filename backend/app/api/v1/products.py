from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.services.open_beauty_facts_service import open_beauty_facts_service
from app.schemas.external_product_schemas import ExternalProduct
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/external/products", tags=["open-beauty-facts"])


@router.get("/search", response_model=List[ExternalProduct])
async def search_products(q: str = Query(...)):
    """Search for skincare products in Open Beauty Facts database."""
    try:
        results = await open_beauty_facts_service.search_products(q)
        return results
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        raise HTTPException(
            status_code=503,
            detail="External product service temporarily unavailable. Please try again later."
        )


@router.get("/barcode/{barcode}", response_model=ExternalProduct)
async def get_product(barcode: str):
    """Get a specific product by barcode."""
    try:
        product = await open_beauty_facts_service.get_product_by_barcode(barcode)
        if not product:
            raise HTTPException(404, "Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {barcode}: {e}")
        raise HTTPException(
            status_code=503,
            detail="External product service temporarily unavailable. Please try again later."
        )


@router.get("/category/{category}", response_model=List[ExternalProduct])
async def get_category(category: str):
    """Get products by category."""
    try:
        return await open_beauty_facts_service.fetch_category_products(category)
    except Exception as e:
        logger.error(f"Error fetching category {category}: {e}")
        raise HTTPException(
            status_code=503,
            detail="External product service temporarily unavailable. Please try again later."
        )
