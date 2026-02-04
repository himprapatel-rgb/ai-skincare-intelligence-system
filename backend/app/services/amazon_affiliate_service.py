"""
Amazon Product Advertising API (PA-API 5.0) integration for affiliate product recommendations.

Uses python-amazon-paapi to search for skincare/beauty products and return them
in the same shape as RecommendationItem (id=ASIN, purchase_url=affiliate link).

Requires: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG in env.
If any are missing, search_products returns [] and no exception is raised.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy client so we don't fail at import if credentials missing
_client: Any = None


def _get_client() -> Any:
    global _client
    if _client is not None:
        return _client
    if not settings.AMAZON_ACCESS_KEY or not settings.AMAZON_SECRET_KEY or not settings.AMAZON_PARTNER_TAG:
        return None
    try:
        try:
            from amazon_paapi.api import AmazonApi
            from amazon_paapi.models import Country
        except ImportError:
            from python_amazon_paapi import AmazonApi
            from python_amazon_paapi.config import Country

        country_map = {
            "US": Country.US,
            "UK": Country.UK,
            "DE": Country.DE,
            "FR": Country.FR,
            "IT": Country.IT,
            "ES": Country.ES,
            "JP": Country.JP,
            "IN": Country.IN,
            "CA": Country.CA,
        }
        country = country_map.get((settings.AMAZON_COUNTRY or "US").upper(), Country.US)
        # Support both keyword and positional args across package versions
        try:
            _client = AmazonApi(
                key=settings.AMAZON_ACCESS_KEY,
                secret=settings.AMAZON_SECRET_KEY,
                tag=settings.AMAZON_PARTNER_TAG,
                country=country,
                throttling=1,
            )
        except TypeError:
            _client = AmazonApi(
                settings.AMAZON_ACCESS_KEY,
                settings.AMAZON_SECRET_KEY,
                settings.AMAZON_PARTNER_TAG,
                country,
                throttling=1,
            )
        return _client
    except Exception as e:
        logger.warning("Amazon PA-API client init failed: %s", e)
        return None


def _get_attr(obj: Any, path: str, default: Any = None) -> Any:
    """Get nested attribute, e.g. item_info.title.display_value."""
    for part in path.split("."):
        if obj is None:
            return default
        obj = getattr(obj, part, None) if not isinstance(obj, dict) else obj.get(part)
    return obj if obj is not None else default


def _item_to_recommendation(item: Any, search_index: str) -> Optional[Dict[str, Any]]:
    """Map a PA-API item (object with item_info, images, offers) to our RecommendationItem-like dict."""
    try:
        asin = getattr(item, "asin", None) or (item.get("asin") if isinstance(item, dict) else None)
        if not asin:
            return None

        # Title: item_info.title.display_value
        title = _get_attr(item, "item_info.title.display_value")
        if not title and hasattr(item, "item_info"):
            ti = getattr(item, "item_info", None)
            title = getattr(getattr(ti, "title", None), "display_value", None) if ti else None
        title = (title or "Product")[:300]

        # Brand: item_info.by_line_info.contributors[0].name or item_info.brand
        brand = "Amazon"
        if hasattr(item, "item_info") and item.item_info:
            by_line = getattr(item.item_info, "by_line_info", None)
            if by_line and getattr(by_line, "contributors", None):
                contribs = by_line.contributors
                if contribs and len(contribs) > 0:
                    brand = getattr(contribs[0], "name", None) or brand
            if brand == "Amazon" and hasattr(item.item_info, "brand") and item.item_info.brand:
                brand = getattr(item.item_info.brand, "display_value", None) or str(item.item_info.brand)
        brand = (brand or "Amazon")[:200]

        # DetailPageURL (affiliate link)
        url = getattr(item, "detail_page_url", None) or (item.get("detail_page_url") if isinstance(item, dict) else None) or ""

        # Images: images.primary.large.url (or medium/small)
        image_url = None
        if hasattr(item, "images") and item.images and getattr(item.images, "primary", None):
            prim = item.images.primary
            for size in ("large", "medium", "small"):
                part = getattr(prim, size, None)
                if part and getattr(part, "url", None):
                    image_url = part.url
                    break
        if not image_url and isinstance(getattr(item, "images", None), dict):
            primary = (item.images or {}).get("primary") or {}
            for k in ("large", "medium", "small"):
                image_url = (primary.get(k) or {}).get("url") if isinstance(primary.get(k), dict) else None
                if image_url:
                    break

        # Price: offers.listings[0].price.amount or offers_v2.listings[0].price.amount
        price_val = None
        for attr in ("offers", "offers_v2"):
            offers = getattr(item, attr, None)
            if not offers:
                continue
            listings = getattr(offers, "listings", None) or (offers.get("listings") if isinstance(offers, dict) else None) or []
            if listings:
                listing = listings[0]
                p = getattr(listing, "price", None) or (listing.get("price") if isinstance(listing, dict) else None)
                if p is not None:
                    amt = getattr(p, "amount", None) if not isinstance(p, dict) else p.get("amount")
                    if amt is not None:
                        try:
                            price_val = float(amt)
                            break
                        except (TypeError, ValueError):
                            pass

        # Rating if present
        rating = None
        if hasattr(item, "ratings") and item.ratings:
            r = getattr(item.ratings, "reviews", None)
            if r and getattr(r, "rating", None) is not None:
                try:
                    rating = float(r.rating)
                except (TypeError, ValueError):
                    pass

        return {
            "id": asin,
            "name": title,
            "brand": brand,
            "category": (search_index or "beauty").lower(),
            "price": price_val,
            "rating": rating,
            "ingredients": [],
            "concerns": [],
            "image_url": image_url,
            "purchase_url": url or None,
        }
    except Exception as e:
        logger.debug("Skip Amazon item parse: %s", e)
        return None


def search_products(
    keywords: str,
    search_index: Optional[str] = None,
    item_count: int = 10,
) -> List[Dict[str, Any]]:
    """
    Search Amazon for products and return RecommendationItem-like dicts.

    :param keywords: Search query (e.g. "niacinamide serum" or "skincare for dry skin").
    :param search_index: PA-API SearchIndex (default from settings, e.g. Beauty).
    :param item_count: Max items to return (1–10 for PA-API).
    :return: List of dicts with id, name, brand, category, price, rating, image_url, purchase_url.
    """
    api = _get_client()
    if not api:
        return []

    index = (search_index or getattr(settings, "AMAZON_SEARCH_INDEX", None)) or "Beauty"
    count = max(1, min(10, item_count))

    try:
        # python-amazon-paapi: search_items(keywords=..., search_index=..., item_count=...)
        kw = keywords.strip() or "skincare"
        if hasattr(api, "search_items"):
            result = api.search_items(keywords=kw, search_index=index, item_count=count)
        else:
            result = api.search(keywords=kw, search_index=index, item_count=count)
    except Exception as e:
        logger.warning("Amazon PA-API search failed: %s", e)
        return []

    items: List[Dict[str, Any]] = []
    raw_items: List[Any] = []
    if hasattr(result, "items"):
        raw_items = list(result.items) if result.items else []
    elif hasattr(result, "search_result") and hasattr(result.search_result, "items"):
        raw_items = list(result.search_result.items) if result.search_result.items else []
    elif isinstance(result, dict):
        raw_items = result.get("search_result", {}).get("items") or result.get("items") or []

    for item in raw_items[:count]:
        rec = _item_to_recommendation(item, index)
        if rec:
            items.append(rec)

    return items
