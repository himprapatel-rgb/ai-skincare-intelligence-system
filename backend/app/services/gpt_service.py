"""
Simple wrapper for an external GPTGPT HTTP API.

This module reads `GPTGPT_API_KEY` from `app.config.settings` and provides
`GPTService.chat(prompt)` for synchronous use in the backend or scripts.

Replace `BASE_URL` with the provider's real base URL.
"""

from __future__ import annotations

import requests
from typing import Any

from app.config import settings

# Set to the provided project URL (treated as API base for workflow and wrapper)
BASE_URL = "https://chatgpt.com/g/g-p-692c8d9ea8b081919bd35079970719fc-ai-skin-care-app/project"


class GPTService:
    def __init__(
        self, api_key: str | None = None, base_url: str = BASE_URL, timeout: int = 30
    ):
        self.api_key = api_key or settings.GPTGPT_API_KEY
        self.base_url = base_url
        self.timeout = timeout
        if not self.api_key:
            raise RuntimeError(
                "GPTGPT_API_KEY is not configured. Set it in environment or .env"
            )

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat(self, prompt: str, model: str = "gpt-1", max_tokens: int = 512) -> Any:
        """Send a chat/completion request to the GPTGPT API and return parsed JSON/text.

        This is intentionally minimal — adapt request/response handling to the real
        provider schema.
        """
        url = f"{self.base_url}/chat"
        payload = {"model": model, "prompt": prompt, "max_tokens": max_tokens}

        resp = requests.post(
            url, headers=self._headers(), json=payload, timeout=self.timeout
        )
        resp.raise_for_status()
        data = resp.json()

        # Normalize common response shapes to a string summary:
        # - { text: "..." }
        # - { choices: [{ text: "..." }, ...] }
        # - OpenAI Chat-like: { choices: [ { message: { content: "..." } } ] }
        if isinstance(data, dict):
            if "text" in data and isinstance(data["text"], str):
                return data["text"]

            if (
                "choices" in data
                and isinstance(data["choices"], list)
                and data["choices"]
            ):
                first = data["choices"][0]
                # choice.text
                if (
                    isinstance(first, dict)
                    and "text" in first
                    and isinstance(first["text"], str)
                ):
                    return first["text"]
                # choice.message.content (chat-style)
                if (
                    isinstance(first, dict)
                    and "message" in first
                    and isinstance(first["message"], dict)
                ):
                    if "content" in first["message"] and isinstance(
                        first["message"]["content"], str
                    ):
                        return first["message"]["content"]

        # Fallback: return the whole JSON payload
        return data


# Default instance for simple imports
def get_default_service() -> GPTService:
    return GPTService()


gpt_service = None
try:
    gpt_service = get_default_service()
except RuntimeError:
    # Allow import-time use in environments that don't have the key configured.
    gpt_service = None
