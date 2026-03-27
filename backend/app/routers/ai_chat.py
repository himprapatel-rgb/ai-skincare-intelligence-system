"""AI Chat Assistant API router.

Endpoints:
- POST   /ai/chat/sessions            — create a new chat session
- GET    /ai/chat/sessions            — list user's sessions (paginated)
- GET    /ai/chat/sessions/{id}/messages — get messages for a session
- POST   /ai/chat/sessions/{id}/messages — send message (SSE streaming)
- DELETE /ai/chat/sessions/{id}        — soft-delete a session
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.ai_chat_schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessagesResponse,
    ChatSessionCreate,
    ChatSessionListResponse,
    ChatSessionResponse,
)
from app.services.ai_chat_service import ai_chat_service

router = APIRouter(prefix="/ai/chat", tags=["ai_chat"])
logger = logging.getLogger(__name__)


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: ChatSessionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new AI chat session with context snapshot."""
    try:
        session = ai_chat_service.create_session(user, db, title=body.title)
        return session
    except Exception as exc:
        logger.exception("Failed to create chat session: %s", exc)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(exc)}")


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List chat sessions for the current user (newest first)."""
    sessions, total = ai_chat_service.get_sessions(user, db, page=page, per_page=per_page)
    return ChatSessionListResponse(
        data=[ChatSessionResponse.model_validate(s) for s in sessions],
        total=total,
        page=page,
        per_page=per_page,
        has_more=(page * per_page) < total,
    )


@router.get("/sessions/{session_id}/messages", response_model=ChatMessagesResponse)
async def get_messages(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all messages for a chat session."""
    msgs, total = ai_chat_service.get_messages(session_id, user.id, db)
    if not msgs and not ai_chat_service.get_session(session_id, user.id, db):
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatMessagesResponse(
        data=[ChatMessageResponse.model_validate(m) for m in msgs],
        total=total,
        session_id=session_id,
    )


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: int,
    body: ChatMessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message and receive AI response via Server-Sent Events.

    Returns: text/event-stream with JSON data chunks.
    Each line: `data: {"type": "chunk", "content": "..."}\n\n`
    Final line: `data: {"type": "done", "message_id": 123}\n\n`
    """
    try:
        session = ai_chat_service.get_session(session_id, user.id, db)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return StreamingResponse(
            ai_chat_service.stream_message(session_id, user, body.content, db),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to send chat message: %s", exc)
        raise HTTPException(status_code=500, detail=f"Chat error: {str(exc)}")


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a chat session."""
    deleted = ai_chat_service.delete_session(session_id, user.id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
