"""OpenBeautyFacts API Integration - Fixed Version
Sprint 4 – Cloud-Only (No CSV file downloads)

Provides:
- search_products(query)
- get_product_by_barcode(barcode)
- fetch_category_products(category)

Includes:
- async HTTP client with proper lifecycle management
- rate limiting
- error handling
- normalization for DB ingestion

Fix: Properly manages httpx.AsyncClient lifecycle to prevent 500 errors
"""

import httpx
import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import uuid4
from functools import wraps

logger = logging.getLogger(__name__)

BASE_URL = "https://world.openbeautyfacts.org/api/v2"

# ------------------------
# Simple async rate limiter
# ------------------------
RATE_LIMIT = asyncio.Semaphore(5)  # max 5 concurrent OBF calls


def rate_limited(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        async with RATE_LIMIT:
            return await func(*args, **kwargs)
    return wrapper


class OpenBeautyFactsService:
    """OpenBeautyFacts API Service with proper async client management"""
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._timeout = httpx.Timeout(30.0, connect=10.0)
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client with proper configuration"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        return self._client
    
    async def close(self):
        """Close the HTTP client - call this on shutdown"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            logger.info("OpenBeautyFacts HTTP client closed")
    
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
    # API Calls with proper error handling
    # ----------------------------------------------------------
    @rate_limited
    async def search_products(self, query: str) -> List[Dict[str, Any]]:
        """Search products with error handling"""
        try:
            client = await self._get_client()
            url = f"{BASE_URL}/search?fields=code,product_name,brands,categories_tags,image_small_url,ingredients_text&search_terms={query}"
            
            logger.info(f"Searching OpenBeautyFacts for: {query}")
            resp = await client.get(url)
            resp.raise_for_status()
            
            data = resp.json()
            products = data.get("products", [])
            logger.info(f"Found {len(products)} products for query: {query}")
            
            return [self._normalize_product(p) for p in products]
        
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error searching products: {e.response.status_code} - {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error searching products: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error searching products: {e}")
            raise
    
    @rate_limited
    async def get_product_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """Get product by barcode with error handling"""
        try:
            client = await self._get_client()
            url = f"{BASE_URL}/product/{barcode}"
            
            logger.info(f"Fetching product by barcode: {barcode}")
            resp = await client.get(url)
            
            if resp.status_code == 404:
                logger.warning(f"Product not found: {barcode}")
                return None
            
            resp.raise_for_status()
            return self._normalize_product(resp.json())
        
        except httpx.HTTPStatusError as e:
            if e.response.status_code != 404:
                logger.error(f"HTTP error fetching product {barcode}: {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching product {barcode}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching product {barcode}: {e}")
            raise
    
    @rate_limited
    async def fetch_category_products(self, category: str) -> List[Dict[str, Any]]:
        """Fetch products by category with error handling"""
        try:
            client = await self._get_client()
            url = f"{BASE_URL}/category/{category}.json"
            
            logger.info(f"Fetching category products: {category}")
            resp = await client.get(url)
            resp.raise_for_status()
            
            data = resp.json()
            products = data.get("products", [])
            logger.info(f"Found {len(products)} products in category: {category}")
            
            return [self._normalize_product(p) for p in products]
        
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching category {category}: {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error fetching category {category}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching category {category}: {e}")
            raise


# Create singleton instance
open_beauty_facts_service = OpenBeautyFactsService()
