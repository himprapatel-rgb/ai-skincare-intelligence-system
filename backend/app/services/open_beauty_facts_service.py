"""
OpenBeautyFacts API Integration
Sprint 4 – Cloud-Only (No CSV file downloads)

Provides:
- search_products(query)
- get_product_by_barcode(barcode)
- fetch_category_products(category)

Includes:
- async HTTP client
- rate limiting
- normalization for DB ingestion
"""

import httpx
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import uuid4
from functools import wraps

BASE_URL = "https://world.openbeautyfacts.org/api/v2"

# ------------------------
# Simple async rate limiter
# ------------------------

RATE_LIMIT = asyncio.Semaphore(5)  # max 5 concurrent OBP calls


def rate_limited(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        async with RATE_LIMIT:
            return await func(*args, **kwargs)
    return wrapper


class OpenBeautyFactsService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)

    # ----------------------------------------------------------
    # Normalizers
    # ----------------------------------------------------------
    def _normalize_product(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize OpenBeautyFacts product -> internal product schema."""
        if not data:
            return {}

        product = data.get("product") or data
        return {
            "id": product.get("id") or str(uuid4()),
            "brand_name": product.get("brands", "").split(",")[0].strip() if product.get("brands") else None,
            "product_name": product.get("product_name") or None,
            "barcode": product.get("code"),
            "category": product.get("categories_tags", [None])[0],
            "image_url": product.get("image_small_url"),
            "ingredients": product.get("ingredients_text"),
        }

    # ----------------------------------------------------------
    # API Calls
    # ----------------------------------------------------------

    @rate_limited
    async def search_products(self, query: str) -> List[Dict[str, Any]]:
        url = f"{BASE_URL}/search?fields=code,product_name,brands,categories_tags,image_small_url&search_terms={query}"
        resp = await self.client.get(url)
        resp.raise_for_status()
        products = resp.json().get("products", [])
        return [self._normalize_product(p) for p in products]

    @rate_limited
    async def get_product_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        url = f"{BASE_URL}/product/{barcode}"
        resp = await self.client.get(url)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return self._normalize_product(resp.json())

    @rate_limited
    async def fetch_category_products(self, category: str) -> List[Dict[str, Any]]:
        url = f"{BASE_URL}/category/{category}.json"
        resp = await self.client.get(url)
        resp.raise_for_status()
        products = resp.json().get("products", [])
        return [self._normalize_product(p) for p in products]


open_beauty_facts_service = OpenBeautyFactsService()
