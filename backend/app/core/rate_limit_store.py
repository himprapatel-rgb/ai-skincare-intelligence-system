"""
Rate limit store abstraction for scan (and optionally other) endpoints.

- With REDIS_URL set: uses Redis so limits are shared across workers and instances.
- Without REDIS_URL: uses in-memory dict (per-process; each uvicorn worker has its own limit).

Use this for multi-worker (uvicorn --workers N) or multi-instance deployments so that
rate limits apply globally, not per process.
"""

import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Tuple

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory store: key -> (request_count, window_start)
_memory_store: dict[str, Tuple[int, datetime]] = defaultdict(lambda: (0, datetime.now()))
_memory_lock = asyncio.Lock()


async def _check_and_increment_memory(
    key: str, window_seconds: int, max_requests: int
) -> bool:
    """In-memory sliding window. Returns True if request allowed, False if rate limited."""
    now = datetime.now()
    async with _memory_lock:
        count, window_start = _memory_store[key]
        if now - window_start > timedelta(seconds=window_seconds):
            _memory_store[key] = (1, now)
            return True
        if count >= max_requests:
            return False
        _memory_store[key] = (count + 1, window_start)
        return True


async def _check_and_increment_redis(
    key: str, window_seconds: int, max_requests: int
) -> bool:
    """Redis-backed fixed window. Returns True if request allowed."""
    try:
        redis = get_redis_client()
        if redis is None:
            return await _check_and_increment_memory(key, window_seconds, max_requests)
        rkey = f"ratelimit:scan:{key}"
        count = await redis.incr(rkey)
        if count == 1:
            await redis.expire(rkey, window_seconds)
        if count > max_requests:
            return False
        return True
    except Exception as e:
        logger.warning("Redis rate limit fallback to allow: %s", e)
        return True  # Fail open so Redis issues don't block scans


_redis_client = None


def get_redis_client():
    """Return async Redis client if REDIS_URL is set and redis is installed, else None."""
    global _redis_client
    if not settings.REDIS_URL:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,  # incr returns int with decode_responses=True
        )
        return _redis_client
    except ImportError:
        logger.warning(
            "redis package not installed; rate limit will use in-memory store only. "
            "Install redis and set REDIS_URL for multi-worker shared limits."
        )
        return None
    except Exception as e:
        logger.warning("Redis connection failed; rate limit will use in-memory store: %s", e)
        return None


async def check_and_increment(
    key: str, window_seconds: int, max_requests: int
) -> bool:
    """
    Check if the key is under the rate limit and increment its count.
    Returns True if the request is allowed, False if rate limited.
    Uses Redis when REDIS_URL is set, otherwise in-memory (per process).
    """
    if settings.REDIS_URL and get_redis_client() is not None:
        return await _check_and_increment_redis(key, window_seconds, max_requests)
    return await _check_and_increment_memory(key, window_seconds, max_requests)
