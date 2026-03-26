# Tests for AI Chat endpoints (Sprint 2)
from unittest.mock import MagicMock, patch

import pytest
from fastapi import status


class TestAIChatSessions:
    """Test AI Chat session CRUD endpoints."""

    def test_create_session(self, client, auth_headers):
        """POST /api/v1/ai/chat/sessions creates a new chat session."""
        from datetime import datetime

        with patch("app.services.ai_chat_service.ai_chat_service.create_session") as mock_create:
            mock_session = MagicMock()
            mock_session.id = 1
            mock_session.user_id = 1
            mock_session.title = "Skincare chat"
            mock_session.context_snapshot = {}
            mock_session.created_at = datetime(2026, 3, 26)
            mock_session.updated_at = datetime(2026, 3, 26)
            mock_session.last_message_at = None
            mock_session.deleted_at = None
            mock_session.message_count = 0
            mock_create.return_value = mock_session

            response = client.post(
                "/api/v1/ai/chat/sessions",
                json={"title": "Skincare chat"},
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["title"] == "Skincare chat"

    def test_list_sessions(self, client, auth_headers):
        """GET /api/v1/ai/chat/sessions returns paginated list."""
        with patch("app.services.ai_chat_service.ai_chat_service.get_sessions") as mock_list:
            mock_list.return_value = ([], 0)

            response = client.get(
                "/api/v1/ai/chat/sessions",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "data" in data
            assert isinstance(data["data"], list)
            assert data["total"] == 0

    def test_get_messages(self, client, auth_headers):
        """GET /api/v1/ai/chat/sessions/{id}/messages returns messages."""
        with patch("app.services.ai_chat_service.ai_chat_service.get_messages") as mock_msgs:
            with patch("app.services.ai_chat_service.ai_chat_service.get_session") as mock_get:
                mock_msgs.return_value = ([], 0)
                mock_get.return_value = MagicMock(id=1)

                response = client.get(
                    "/api/v1/ai/chat/sessions/1/messages",
                    headers=auth_headers,
                )
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert "data" in data
                assert data["session_id"] == 1

    def test_delete_session(self, client, auth_headers):
        """DELETE /api/v1/ai/chat/sessions/{id} returns 204."""
        with patch("app.services.ai_chat_service.ai_chat_service.delete_session") as mock_del:
            mock_del.return_value = True

            response = client.delete(
                "/api/v1/ai/chat/sessions/1",
                headers=auth_headers,
            )
            assert response.status_code == status.HTTP_204_NO_CONTENT


class TestAIChatUnauthorized:
    """All AI Chat endpoints require authentication."""

    def test_create_session_unauthorized(self, client):
        response = client.post(
            "/api/v1/ai/chat/sessions",
            json={"title": "test"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_sessions_unauthorized(self, client):
        response = client.get("/api/v1/ai/chat/sessions")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_messages_unauthorized(self, client):
        response = client.get("/api/v1/ai/chat/sessions/1/messages")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_delete_session_unauthorized(self, client):
        response = client.delete("/api/v1/ai/chat/sessions/1")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
