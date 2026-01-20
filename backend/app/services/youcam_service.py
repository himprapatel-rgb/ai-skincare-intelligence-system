"""
YouCam API client for asynchronous AI tasks.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SD_ACTIONS = [
    "wrinkle",
    "pore",
    "texture",
    "acne",
    "oiliness",
    "radiance",
    "age_spot",
    "dark_circle_v2",
    "droopy_upper_eyelid",
    "droopy_lower_eyelid",
    "firmness",
    "moisture",
    "redness",
]
HD_ACTIONS = [
    "hd_wrinkle",
    "hd_pore",
    "hd_texture",
    "hd_acne",
    "hd_oiliness",
    "hd_radiance",
    "hd_age_spot",
    "hd_dark_circle",
    "hd_eye_bag",
    "hd_droopy_upper_eyelid",
    "hd_droopy_lower_eyelid",
    "hd_firmness",
    "hd_moisture",
    "hd_redness",
]
ALL_ACTIONS = set(SD_ACTIONS + HD_ACTIONS)


class YouCamError(Exception):
    """Raised when YouCam API returns an error."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.payload = payload


class YouCamClient:
    """Thin async client for YouCam v2 APIs."""

    def __init__(self, base_url: str, api_key: str, timeout_seconds: int) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    def _ensure_success(self, payload: Dict[str, Any], context: str) -> None:
        status_value = payload.get("status")
        if status_value != 200:
            error_code = payload.get("error_code") or payload.get("error")
            logger.warning(
                "YouCam API error in %s: status=%s error_code=%s payload=%s",
                context,
                status_value,
                error_code,
                payload,
            )
            raise YouCamError(
                f"YouCam API {context} failed with status={status_value}.",
                error_code=error_code,
                payload=payload,
            )

    async def _request(
        self,
        method: str,
        path: str,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        timeout = httpx.Timeout(self.timeout_seconds)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=self._headers(),
                json=json_body,
            )

        if response.status_code >= 400:
            raise YouCamError(
                f"YouCam API HTTP error ({response.status_code}).",
                status_code=response.status_code,
                payload=self._safe_json(response),
            )

        payload = self._safe_json(response)
        self._ensure_success(payload, context=f"{method} {path}")
        return payload

    async def create_file(
        self,
        task: str,
        filename: str,
        content_type: str,
        file_size: int,
    ) -> Dict[str, Any]:
        return await self._request(
            method="POST",
            path=f"/s2s/v2.0/file/{task}",
            json_body={
                "files": [
                    {
                        "content_type": content_type,
                        "file_name": filename,
                        "file_size": file_size,
                    }
                ]
            },
        )

    async def upload_file(self, request_info: Dict[str, Any], image_bytes: bytes) -> None:
        url = request_info.get("url")
        headers = request_info.get("headers") or {}
        method = (request_info.get("method") or "PUT").upper()
        if not url:
            raise YouCamError("YouCam API upload URL missing.")

        timeout = httpx.Timeout(self.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=image_bytes,
            )

        if response.status_code >= 400:
            raise YouCamError(
                f"YouCam upload failed ({response.status_code}).",
                status_code=response.status_code,
                payload=self._safe_json(response),
            )

    async def create_task(self, task: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return await self._request(
            method="POST",
            path=f"/s2s/v2.0/task/{task}",
            json_body=payload,
        )

    async def get_task(self, task: str, task_id: str) -> Dict[str, Any]:
        return await self._request(
            method="GET",
            path=f"/s2s/v2.0/task/{task}/{task_id}",
        )

    async def poll_task(
        self,
        task: str,
        task_id: str,
        interval_seconds: int,
        max_wait_seconds: int,
    ) -> Dict[str, Any]:
        start = time.monotonic()
        while True:
            payload = await self.get_task(task=task, task_id=task_id)
            data = payload.get("data") or {}
            status_value = data.get("task_status")

            if status_value == "success":
                return payload
            if status_value == "error":
                raise YouCamError(
                    "YouCam task failed.",
                    error_code=data.get("error"),
                    payload=payload,
                )

            elapsed = time.monotonic() - start
            if elapsed >= max_wait_seconds:
                raise YouCamError("YouCam task polling timed out.", payload=payload)

            await asyncio.sleep(interval_seconds)

    async def run_skin_analysis(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
        dst_actions: List[str],
        response_format: str,
        poll_interval_seconds: int,
        max_wait_seconds: int,
    ) -> Dict[str, Any]:
        file_payload = await self.create_file(
            task="skin-analysis",
            filename=filename,
            content_type=content_type,
            file_size=len(image_bytes),
        )
        files = (file_payload.get("data") or {}).get("files") or []
        if not files:
            raise YouCamError("YouCam API did not return file metadata.", payload=file_payload)

        file_info = files[0]
        requests = file_info.get("requests") or []
        if not requests:
            raise YouCamError("YouCam API did not return upload request.", payload=file_payload)

        await self.upload_file(requests[0], image_bytes)

        task_payload = await self.create_task(
            task="skin-analysis",
            payload={
                "src_file_id": file_info.get("file_id"),
                "dst_actions": dst_actions,
                "format": response_format,
            },
        )
        task_id = (task_payload.get("data") or {}).get("task_id")
        if not task_id:
            raise YouCamError("YouCam API did not return task_id.", payload=task_payload)

        return await self.poll_task(
            task="skin-analysis",
            task_id=task_id,
            interval_seconds=poll_interval_seconds,
            max_wait_seconds=max_wait_seconds,
        )

    @staticmethod
    def _safe_json(response: httpx.Response) -> Dict[str, Any]:
        try:
            return response.json()
        except ValueError:
            return {}


_youcam_client: Optional[YouCamClient] = None


def _parse_actions(actions_value: Optional[str]) -> List[str]:
    if not actions_value:
        return ["wrinkle", "pore", "texture", "acne"]
    parts = [item.strip() for item in actions_value.split(",")]
    actions = [item for item in parts if item]
    _validate_actions(actions)
    return actions


def _validate_actions(actions: List[str]) -> None:
    if not actions:
        return
    invalid = [action for action in actions if action not in ALL_ACTIONS]
    if invalid:
        raise YouCamError(f"Unsupported YouCam dst_actions: {', '.join(invalid)}")
    has_hd = any(action.startswith("hd_") for action in actions)
    has_sd = any(not action.startswith("hd_") for action in actions)
    if has_hd and has_sd:
        raise YouCamError("YouCam dst_actions cannot mix HD and SD in one request.")


def get_youcam_client() -> YouCamClient:
    """Get or create singleton YouCam client."""
    global _youcam_client
    if _youcam_client is None:
        if not settings.YOUCAM_API_KEY:
            raise YouCamError("YOUCAM_API_KEY is not configured.")
        _youcam_client = YouCamClient(
            base_url=settings.YOUCAM_API_BASE,
            api_key=settings.YOUCAM_API_KEY,
            timeout_seconds=settings.YOUCAM_TIMEOUT_SECONDS,
        )
        logger.info("YouCam client initialized")
    return _youcam_client


def get_default_skin_analysis_actions() -> List[str]:
    return _parse_actions(settings.YOUCAM_SKIN_ANALYSIS_ACTIONS)


def get_supported_skin_actions() -> Dict[str, List[str]]:
    return {"sd": SD_ACTIONS, "hd": HD_ACTIONS}
