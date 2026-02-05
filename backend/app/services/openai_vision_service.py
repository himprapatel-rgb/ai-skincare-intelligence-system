"""
OpenAI Vision API client for skin analysis.
"""

from __future__ import annotations

import base64
import json
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_SIGNALS = [
    "acne",
    "redness",
    "pigmentation",
    "dehydration",
    "sensitivity",
    "wrinkles",
    "pores",
    "dark_circles",
    "texture",
    "oiliness",
]


class OpenAIVisionError(Exception):
    """Raised when OpenAI Vision API returns an error."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


class OpenAIVisionClient:
    """Thin async client for OpenAI vision analysis."""

    def __init__(self, base_url: str, api_key: str, timeout_seconds: int, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds
        self.model = model

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _schema(self) -> Dict[str, Any]:
        return {
            "name": "SkinAnalysis",
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "summary": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "overall_score": {"type": "number", "minimum": 0, "maximum": 100},
                            "scores": {
                                "type": "object",
                                "additionalProperties": False,
                                "properties": {signal: {"type": "number", "minimum": 0, "maximum": 100} for signal in DEFAULT_SIGNALS},
                                "required": DEFAULT_SIGNALS,
                            },
                            "concerns": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["overall_score", "scores", "concerns"],
                    },
                    "skin_type": {
                        "type": "string",
                        "enum": ["normal", "dry", "oily", "combination", "sensitive"],
                    },
                    "fitzpatrick_scale": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 6,
                    },
                    "confidence_score": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 1,
                    },
                    "concerns_detail": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "concern_type": {"type": "string"},
                                "severity": {"type": "string", "enum": ["mild", "moderate", "severe"]},
                                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                                "affected_areas": {"type": "array", "items": {"type": "string"}},
                            },
                            "required": ["concern_type", "severity", "confidence", "affected_areas"],
                        },
                    },
                    "recommendations": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "notes": {"type": "string"},
                },
                "required": [
                    "summary",
                    "skin_type",
                    "fitzpatrick_scale",
                    "confidence_score",
                    "concerns_detail",
                    "recommendations",
                    "notes",
                ],
            },
            "strict": True,
        }

    async def analyze_skin(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Dict[str, Any]:
        image_b64 = base64.b64encode(image_bytes).decode("ascii")
        data_url = f"data:{content_type};base64,{image_b64}"
        timeout = httpx.Timeout(self.timeout_seconds)

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert cosmetic skin analysis assistant. Your goal is to give the user the most accurate, "
                        "consistent, and actionable analysis possible. Return ONLY valid JSON that matches the provided schema. "
                        "Do not provide medical diagnosis. "
                        "For each signal (acne, redness, pigmentation, dehydration, sensitivity, wrinkles, pores, "
                        "dark_circles, texture, oiliness): assign a score 0-100 that reflects visible severity (0 = none, 100 = very pronounced). "
                        "Be consistent: similar appearance should yield similar scores. "
                        "In concerns_detail: list each detected concern with severity (mild/moderate/severe), confidence (0-1), "
                        "and specific affected_areas (e.g. forehead, cheeks, nose, under_eyes, chin). "
                        "Recommendations should be 2-5 short, actionable skincare tips (ingredients or habits), not generic advice. "
                        "Notes: one sentence on image quality or limitation if relevant, otherwise brief summary."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this face photo for cosmetic skin signals. Return structured JSON only. "
                                "Scores 0-100 per signal; overall_score 0-100 (weighted average, emphasis on concerns the user may want to address). "
                                "Confidence 0-1: how reliable is this analysis given lighting, angle, and clarity. "
                                "Use realistic, differentiated values so the report is useful. "
                                "Include affected facial areas for each concern. Give specific, actionable recommendations."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                    ],
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": self._schema(),
            },
        }

        start = time.monotonic()
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
        elapsed_ms = int((time.monotonic() - start) * 1000)

        if response.status_code >= 400:
            raise OpenAIVisionError(
                f"OpenAI API HTTP error ({response.status_code}).",
                status_code=response.status_code,
                payload=self._safe_json(response),
            )

        payload = self._safe_json(response)
        content = (
            (payload.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            raise OpenAIVisionError("OpenAI API returned empty content.", payload=payload)

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise OpenAIVisionError("OpenAI response is not valid JSON.", payload={"error": str(exc)})

        parsed["processing_time_ms"] = elapsed_ms
        return parsed

    @staticmethod
    def _safe_json(response: httpx.Response) -> Dict[str, Any]:
        try:
            return response.json()
        except ValueError:
            return {}


_openai_client: Optional[OpenAIVisionClient] = None


def get_openai_client() -> OpenAIVisionClient:
    global _openai_client
    if _openai_client is None:
        if not settings.OPENAI_API_KEY:
            raise OpenAIVisionError("OPENAI_API_KEY is not configured.")
        _openai_client = OpenAIVisionClient(
            base_url=settings.OPENAI_API_BASE,
            api_key=settings.OPENAI_API_KEY,
            timeout_seconds=settings.OPENAI_TIMEOUT_SECONDS,
            model=settings.OPENAI_MODEL,
        )
        logger.info("OpenAI vision client initialized")
    return _openai_client


def get_supported_signals() -> List[str]:
    return DEFAULT_SIGNALS.copy()
