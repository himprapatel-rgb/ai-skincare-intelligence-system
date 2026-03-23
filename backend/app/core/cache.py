"""
Lightweight Redis cache utility for response caching.

Reuses the Redis client from rate_limit_store. Falls back gracefully
to no-op when Redis is unavailable — callers always get None on miss.
"""

import json
import logging
from typing import Any, Optional

from app.core.rate_limit_store import get_redis_client

logger = logging.getLogger(__name__)

CACHE_PREFIX = "cache:"


async def cache_get(key: str) -> Optional[Any]:
    """Get a cached value. Returns deserialized JSON or None on miss/error."""
    redis = get_redis_client()
    if redis is None:
        return None
    try:
        raw = await redis.get(f"{CACHE_PREFIX}{key}")
        if raw is not None:
            return json.loads(raw)
    except Exception as e:
        logger.debug("cache_get(%s) error: %s", key, e)
    return None


async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Set a cached value with TTL. Silently skips on error."""
    redis = get_redis_client()
    if redis is None:
        return
    try:
        await redis.setex(f"{CACHE_PREFIX}{key}", ttl_seconds, json.dumps(value))
    except Exception as e:
        logger.debug("cache_set(%s) error: %s", key, e)


async def cache_delete(key: str) -> None:
    """Delete a cached key. Silently skips on error."""
    redis = get_redis_client()
    if redis is None:
        return
    try:
        await redis.delete(f"{CACHE_PREFIX}{key}")
    except Exception as e:
        logger.debug("cache_delete(%s) error: %s", key, e)


async def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a pattern (e.g. 'products:*'). Use sparingly."""
    redis = get_redis_client()
    if redis is None:
        return
    try:
        keys = []
        async for key in redis.scan_iter(f"{CACHE_PREFIX}{pattern}"):
            keys.append(key)
        if keys:
            await redis.delete(*keys)
    except Exception as e:
        logger.debug("cache_delete_pattern(%s) error: %s", pattern, e)
