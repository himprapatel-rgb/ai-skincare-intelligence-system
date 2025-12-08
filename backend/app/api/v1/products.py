from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.services.open_beauty_facts_service import open_beauty_facts_service
from app.schemas.external_product_schemas import ExternalProduct

router = APIRouter(prefix="/external/products", tags=["open-beauty-facts"])


@router.get("/search", response_model=List[ExternalProduct])
async def search_products(q: str = Query(...)):
    results = await open_beauty_facts_service.search_products(q)
    return results


@router.get("/barcode/{barcode}", response_model=ExternalProduct)
async def get_product(barcode: str):
    product = await open_beauty_facts_service.get_product_by_barcode(barcode)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/category/{category}", response_model=List[ExternalProduct])
async def get_category(category: str):
    return await open_beauty_facts_service.fetch_category_products(category)
