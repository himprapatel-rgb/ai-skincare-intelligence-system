from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel
from typing import Any
import os

from app.config import settings
from app.services.gpt_service import get_default_service, GPTService

router = APIRouter()


class SummaryRequest(BaseModel):
    prompt: str | None = None


@router.post("/summary")
def generate_summary(
    request: SummaryRequest, x_summary_token: str | None = Header(None)
) -> Any:
    """Generate a project summary using the GPT service.

    This endpoint is intended for internal automation. It requires the
    `X-SUMMARY-TOKEN` header to match `settings.SUMMARY_TOKEN`.
    """
    if not settings.SUMMARY_TOKEN or x_summary_token != settings.SUMMARY_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    # Build a prompt from repository docs (best-effort, truncate to keep size reasonable)
    def read_safe(path: str) -> str:
        try:
            with open(path, "r", encoding="utf8") as f:
                return f.read()
        except Exception:
            return ""

    ai_workflow = read_safe("docs/AI_AGILE_WORKFLOW.md")[:4000]
    progress = read_safe("docs/PROJECT_PROGRESS_TRACKER.md")[:4000]
    sprint = read_safe("docs/SPRINT-1.1-CODE-FILES.md")[:4000]
    readme = read_safe("README.md")[:2000]

    prompt = request.prompt or (
        "You are an assistant asked to produce a short, actionable daily project summary for the AI Skincare Intelligence System repo. "
        "Produce two sections in Markdown: 1) Where we are, 2) Next steps (3-6 items). Use these files as context: \n"
        f"AI_AGILE_WORKFLOW:{ai_workflow}PROJECT_PROGRESS_TRACKER:{progress}SPRINT_FILES:{sprint}README:{readme}"
    )

    # Initialize service
    svc: GPTService | None = None
    try:
        svc = get_default_service()
    except Exception:
        # Try constructing from settings if available
        if settings.GPTGPT_API_KEY:
            svc = GPTService(api_key=settings.GPTGPT_API_KEY, base_url=settings.GPTGPT_API_BASE)  # type: ignore[arg-type]

    if svc is None:
        raise HTTPException(status_code=500, detail="GPT service not configured")

    try:
        out = svc.chat(prompt)
        return {"summary": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
