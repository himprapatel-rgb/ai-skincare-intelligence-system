"""
Skinive API client for skin analysis.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class SkiniveError(Exception):
    """Raised when Skinive API returns an error."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class SkiniveClient:
    """Thin async client for Skinive API."""

    def __init__(self, base_url: str, token: str, locale: str, timeout_seconds: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.locale = locale
        self.timeout_seconds = timeout_seconds

    def _headers(self) -> Dict[str, str]:
        headers = {"Authorization": self.token}
        if self.locale:
            headers["Locale"] = self.locale
        return headers

    async def _post_image(self, path: str, image_bytes: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        files = {"img": (filename, image_bytes, content_type)}
        timeout = httpx.Timeout(self.timeout_seconds)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, headers=self._headers(), files=files)

        if response.status_code >= 400:
            raise SkiniveError(
                f"Skinive API error ({response.status_code}).",
                status_code=response.status_code,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise SkiniveError("Skinive API returned invalid JSON.") from exc

        if payload.get("status") is False:
            raise SkiniveError("Skinive API returned status=false.", status_code=response.status_code)

        return payload

    async def validate_image(self, image_bytes: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        return await self._post_image("/validate", image_bytes, filename, content_type)

    async def predict(self, image_bytes: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        return await self._post_image("/predict", image_bytes, filename, content_type)


_skinive_client: Optional[SkiniveClient] = None


def get_skinive_client() -> SkiniveClient:
    """Get or create singleton Skinive client."""
    global _skinive_client
    if _skinive_client is None:
        if not settings.SKINIVE_API_TOKEN:
            raise SkiniveError("SKINIVE_API_TOKEN is not configured.")
        _skinive_client = SkiniveClient(
            base_url=settings.SKINIVE_API_BASE,
            token=settings.SKINIVE_API_TOKEN,
            locale=settings.SKINIVE_LOCALE,
            timeout_seconds=settings.SKINIVE_TIMEOUT_SECONDS,
        )
        logger.info("Skinive client initialized")
    return _skinive_client
