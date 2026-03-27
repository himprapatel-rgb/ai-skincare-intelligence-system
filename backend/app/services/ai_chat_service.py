"""AI Chat Assistant service.

Provides context-aware, clinically-focused AI chat via GPT-4o-mini streaming.
Each session carries a context snapshot: user profile, last 5 scans, shelf products, and skin goals.
SSE streaming is returned as an async generator that yields JSON-encoded server-sent events.
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_chat import AIChatMessage, AIChatSession, AIUsageLog
from app.models.goals import SkinGoal
from app.models.notifications import Notification
from app.models.scan import ScanSession
from app.models.shelf import ShelfProduct
from app.models.user import User, UserProfile

logger = logging.getLogger(__name__)

CHAT_MODEL = "gpt-4o-mini"
MAX_HISTORY_MESSAGES = 20  # messages sent to model
SYSTEM_PROMPT_TEMPLATE = """\
You are a Pellicura Skin Expert — a knowledgeable, warm, and clinically-informed skincare consultant.

## Your role
You are a skincare specialist with deep knowledge of cosmetic dermatology, ingredient science, and personalized skincare. You speak with authority and care, like a trusted advisor in a premium skin clinic.

## Your expertise
- Clinical understanding of skin physiology, barrier function, and aging
- Cosmetic ingredient science: actives, interactions, formulation principles
- Personalized routine design based on skin type, Fitzpatrick scale, concerns, climate
- Product analysis: ingredient lists, safety profiles, efficacy evaluation
- Progress interpretation: scan score trends, concern evolution, routine effectiveness

## User context
{context}

## Communication style
- Professional but approachable — like a dermatology-trained skin consultant
- Use confident language: "I'd recommend...", "Based on your skin profile..."
- Structure responses with clear sections when explaining routines or comparisons
- Use bullet points for actionable steps
- Reference the user's specific data (scan scores, shelf products, concerns) when available
- Be specific: name ingredients, explain mechanisms briefly

## Strict rules
- NEVER diagnose medical conditions — you provide skincare guidance only
- Respond naturally as a skin expert — do not mention being AI
- ALWAYS recommend consulting a dermatologist for: persistent conditions, sudden changes, pain, bleeding, or anything that could be a medical concern
- ALWAYS prioritize skin barrier health and safety
- If unsure, say "I'd suggest having a dermatologist take a look at this"
- Do not prescribe medications or medical treatments
- Do not claim to be a doctor or licensed medical professional
"""


class AIChatService:
    """Core business logic for AI Chat sessions and streaming."""

    # ── Context gathering ────────────────────────────────────────────────────

    def gather_context(self, user: User, db: Session) -> dict:
        """Build a JSON-serialisable context dict for the system prompt."""
        context: dict = {}

        # Profile
        profile: Optional[UserProfile] = (
            db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        )
        if profile:
            context["profile"] = {
                "skin_type": profile.skin_type,
                "skin_tone": profile.skin_tone,
                "skin_concerns": profile.skin_concerns,
                "fitzpatrick_type": getattr(profile, "fitzpatrick_type", None),
                "location": profile.location,
            }

        # Last 5 completed scans
        scans = (
            db.query(ScanSession)
            .filter(
                ScanSession.user_id == user.id,
                ScanSession.status == "COMPLETED",
            )
            .order_by(ScanSession.created_at.desc())
            .limit(5)
            .all()
        )
        if scans:
            context["recent_scans"] = [
                {
                    "date": s.created_at.isoformat() if s.created_at else None,
                    "overall_score": getattr(s, "overall_score", None),
                }
                for s in scans
            ]

        # Active shelf products (max 20)
        shelf = (
            db.query(ShelfProduct)
            .filter(
                ShelfProduct.user_id == user.id,
                ShelfProduct.status == "active",
            )
            .limit(20)
            .all()
        )
        if shelf:
            context["shelf"] = [
                {
                    "name": p.product_name,
                    "brand": p.product_brand,
                    "category": p.product_category,
                    "routine_type": p.routine_type,
                }
                for p in shelf
            ]

        # Active skin goals
        goals = (
            db.query(SkinGoal)
            .filter(SkinGoal.user_id == user.id, SkinGoal.status == "active")
            .limit(5)
            .all()
        )
        if goals:
            context["goals"] = [g.goal_type for g in goals]

        return context

    def _build_system_prompt(self, context: dict) -> str:
        """Render the system prompt with context."""
        lines = []
        if "profile" in context:
            p = context["profile"]
            lines.append(f"Skin type: {p.get('skin_type', 'unknown')}")
            lines.append(f"Skin tone (Fitzpatrick): {p.get('fitzpatrick_type', 'not set')}")
            if p.get("skin_concerns"):
                lines.append(f"Concerns: {', '.join(p['skin_concerns'])}")
            if p.get("location"):
                lines.append(f"Location: {p['location']}")
        if "recent_scans" in context:
            s = context["recent_scans"][0]
            lines.append(f"Latest scan score: {s.get('overall_score', 'N/A')} ({s.get('date', 'unknown date')[:10]})")
        if "shelf" in context:
            shelf_names = [f"{p['brand']} {p['name']}" for p in context["shelf"][:10]]
            lines.append(f"Current shelf ({len(context['shelf'])} products): {', '.join(shelf_names)}")
        if "goals" in context:
            lines.append(f"Skin goals: {', '.join(context['goals'])}")

        context_str = "\n".join(lines) if lines else "No profile data yet."
        return SYSTEM_PROMPT_TEMPLATE.format(context=context_str)

    # ── Session CRUD ─────────────────────────────────────────────────────────

    def create_session(self, user: User, db: Session, title: str = "New Chat") -> AIChatSession:
        context = self.gather_context(user, db)
        session = AIChatSession(
            user_id=user.id,
            title=title,
            context_snapshot=context,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_sessions(
        self, user: User, db: Session, page: int = 1, per_page: int = 20
    ) -> tuple[list[AIChatSession], int]:
        query = (
            db.query(AIChatSession)
            .filter(
                AIChatSession.user_id == user.id,
                AIChatSession.deleted_at.is_(None),
            )
            .order_by(AIChatSession.updated_at.desc())
        )
        total = query.count()
        sessions = query.offset((page - 1) * per_page).limit(per_page).all()
        return sessions, total

    def get_session(self, session_id: int, user_id: int, db: Session) -> Optional[AIChatSession]:
        return (
            db.query(AIChatSession)
            .filter(
                AIChatSession.id == session_id,
                AIChatSession.user_id == user_id,
                AIChatSession.deleted_at.is_(None),
            )
            .first()
        )

    def delete_session(self, session_id: int, user_id: int, db: Session) -> bool:
        session = self.get_session(session_id, user_id, db)
        if not session:
            return False
        session.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True

    def get_messages(
        self, session_id: int, user_id: int, db: Session
    ) -> tuple[list[AIChatMessage], int]:
        session = self.get_session(session_id, user_id, db)
        if not session:
            return [], 0
        msgs = (
            db.query(AIChatMessage)
            .filter(AIChatMessage.session_id == session_id)
            .order_by(AIChatMessage.created_at.asc())
            .all()
        )
        return msgs, len(msgs)

    # ── Streaming send ───────────────────────────────────────────────────────

    async def stream_message(
        self,
        session_id: int,
        user: User,
        user_content: str,
        db: Session,
    ) -> AsyncGenerator[str, None]:
        """Async generator that:
        1. Saves the user message
        2. Calls OpenAI with SSE streaming
        3. Yields SSE data: lines (``data: <json>\n\n``)
        4. Saves the assistant message + usage log on completion
        """
        if not settings.OPENAI_API_KEY:
            yield _sse({"error": "AI service not configured", "code": "AI_SERVICE_ERROR"})
            return

        session = self.get_session(session_id, user.id, db)
        if not session:
            yield _sse({"error": "Session not found", "code": "NOT_FOUND"})
            return

        # Save user message
        user_msg = AIChatMessage(
            session_id=session_id,
            role="user",
            content=user_content,
        )
        db.add(user_msg)
        session.message_count = (session.message_count or 0) + 1
        session.last_message_at = datetime.now(timezone.utc)
        db.commit()

        # Build message history (last MAX_HISTORY_MESSAGES)
        history = (
            db.query(AIChatMessage)
            .filter(AIChatMessage.session_id == session_id)
            .order_by(AIChatMessage.created_at.desc())
            .limit(MAX_HISTORY_MESSAGES)
            .all()
        )
        history.reverse()

        context = session.context_snapshot or self.gather_context(user, db)
        system_prompt = self._build_system_prompt(context)

        messages = [{"role": "system", "content": system_prompt}]
        for m in history:
            if m.role in {"user", "assistant"}:
                messages.append({"role": m.role, "content": m.content})

        # Call OpenAI SSE
        start_ms = int(time.time() * 1000)
        assistant_content = ""
        input_tokens = 0
        output_tokens = 0

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream(
                    "POST",
                    f"{settings.OPENAI_API_BASE}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": CHAT_MODEL,
                        "messages": messages,
                        "stream": True,
                        "max_tokens": 1024,
                        "temperature": 0.7,
                    },
                ) as resp:
                    if resp.status_code != 200:
                        body = await resp.aread()
                        logger.error("OpenAI error %s: %s", resp.status_code, body)
                        yield _sse({"error": "AI service error", "code": "AI_SERVICE_ERROR"})
                        return

                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        raw = line[6:].strip()
                        if raw == "[DONE]":
                            break
                        try:
                            chunk = json.loads(raw)
                        except json.JSONDecodeError:
                            continue

                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        text_chunk = delta.get("content", "")
                        if text_chunk:
                            assistant_content += text_chunk
                            yield _sse({"type": "chunk", "content": text_chunk})

                        # Extract usage if present (last chunk)
                        usage = chunk.get("usage")
                        if usage:
                            input_tokens = usage.get("prompt_tokens", 0)
                            output_tokens = usage.get("completion_tokens", 0)

        except httpx.TimeoutException:
            yield _sse({"error": "AI response timed out", "code": "TIMEOUT"})
            return
        except Exception as exc:
            logger.exception("AI chat stream error: %s", exc)
            yield _sse({"error": "Internal error", "code": "INTERNAL_ERROR"})
            return

        duration_ms = int(time.time() * 1000) - start_ms
        # Estimate cost (gpt-4o-mini: $0.15/1M input, $0.60/1M output)
        cost_usd = round((input_tokens * 0.00000015) + (output_tokens * 0.0000006), 8)

        # Persist assistant message
        assistant_msg = AIChatMessage(
            session_id=session_id,
            role="assistant",
            content=assistant_content,
            model=CHAT_MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
            duration_ms=duration_ms,
        )
        db.add(assistant_msg)
        session.message_count = (session.message_count or 0) + 1
        session.last_message_at = datetime.now(timezone.utc)

        # Usage log
        usage_log = AIUsageLog(
            user_id=user.id,
            endpoint="/ai/chat/stream",
            model=CHAT_MODEL,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
            duration_ms=duration_ms,
        )
        db.add(usage_log)
        db.commit()

        yield _sse({"type": "done", "message_id": assistant_msg.id, "cost_usd": float(cost_usd)})


def _sse(data: dict) -> str:
    """Format a dict as a Server-Sent Event data line."""
    return f"data: {json.dumps(data)}\n\n"


# Singleton
ai_chat_service = AIChatService()
