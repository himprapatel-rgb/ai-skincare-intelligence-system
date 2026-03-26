"""Pydantic schemas for AI Chat endpoints."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Session schemas ──────────────────────────────────────────────────────────

class ChatSessionCreate(BaseModel):
    title: str = Field(default="New Chat", max_length=200)


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    message_count: int
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionListResponse(BaseModel):
    data: list[ChatSessionResponse]
    total: int
    page: int
    per_page: int
    has_more: bool


# ── Message schemas ──────────────────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    model: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: Optional[float] = None
    duration_ms: Optional[int] = None
    metadata: Optional[dict[str, Any]] = Field(None, validation_alias="meta_info")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ChatMessagesResponse(BaseModel):
    data: list[ChatMessageResponse]
    total: int
    session_id: int
