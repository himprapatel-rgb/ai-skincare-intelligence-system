"""
Client IP and geolocation resolution.
Used to record IP and geo for each request and persist in the database.
"""
import logging
from typing import Any

import httpx
from fastapi import Request

logger = logging.getLogger(__name__)

# Free tier: 45 requests/minute. No API key. https://ip-api.com/docs
GEO_API_URL = "http://ip-api.com/json/{ip}?fields=status,country,regionName,city,lat,lon"
GEO_TIMEOUT = 2.0  # Don't block request for long


def get_client_ip(request: Request) -> str:
    """Prefer X-Forwarded-For when behind a proxy (e.g. Railway), else client host."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host or "unknown"
    return "unknown"


def fetch_geolocation(ip: str) -> dict[str, Any] | None:
    """
    Resolve geolocation from IP using ip-api.com (no key required).
    Returns dict with country, regionName, city, lat, lon or None on failure.
    Skips lookup for localhost/private IPs.
    """
    if not ip or ip in ("unknown", "127.0.0.1", "::1"):
        return None
    if ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
        return None
    try:
        url = GEO_API_URL.format(ip=ip)
        with httpx.Client(timeout=GEO_TIMEOUT) as client:
            r = client.get(url)
            if r.status_code != 200:
                return None
            data = r.json()
            if data.get("status") != "success":
                return None
            return {
                "country": data.get("country"),
                "region": data.get("regionName"),
                "city": data.get("city"),
                "lat": data.get("lat"),
                "lon": data.get("lon"),
            }
    except Exception as e:
        logger.debug("Geolocation lookup failed for %s: %s", ip, e)
        return None
