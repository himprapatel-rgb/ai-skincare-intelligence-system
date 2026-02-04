import logging

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.schemas.user import UserCreate
from app.services.auth_service import AuthService, get_current_user_test_token
from app.services.email_service import (
    _build_verification_link,
    _ensure_smtp_configured,
    send_verification_email,
)
from app.services.gpt_service import GPTService


def test_auth_service_create_user_and_lookup(test_db):
    service = AuthService()
    user_data = UserCreate(
        email="newuser@example.com",
        password="SecurePass123!",
        full_name="New User",
    )
    created = service.create_user(test_db, user_data)
    assert created.email == "newuser@example.com"
    assert service.verify_password(created.hashed_password, "SecurePass123!") is True
    assert service.verify_password(created.hashed_password, "BadPass123!") is False

    fetched = service.get_user_by_email(test_db, "newuser@example.com")
    assert fetched.id == created.id


def test_auth_service_get_current_user_with_token(test_db):
    service = AuthService()
    user_data = UserCreate(
        email="tokenuser@example.com",
        password="SecurePass123!",
        full_name="Token User",
    )
    created = service.create_user(test_db, user_data)
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=f"test_token_{created.email}",
    )

    current_user = get_current_user_test_token(credentials=credentials, db=test_db)
    assert current_user.id == created.id

    with pytest.raises(HTTPException):
        get_current_user_test_token(credentials=None, db=test_db)

    invalid_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="bad_token_value",
    )
    with pytest.raises(HTTPException):
        get_current_user_test_token(credentials=invalid_credentials, db=test_db)


def test_build_verification_link(monkeypatch):
    from app.services import email_service

    monkeypatch.setattr(email_service.settings, "FRONTEND_URL", "https://example.com/")
    link = _build_verification_link("user@example.com", "token 123")
    assert link.startswith("https://example.com/verify-email")
    assert "token=token+123" in link
    assert "email=user%40example.com" in link


def test_send_verification_email_without_credentials(monkeypatch, caplog):
    from app.services import email_service

    monkeypatch.setattr(email_service.settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(email_service.settings, "SMTP_PORT", 587)
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", "no-reply@example.com")
    monkeypatch.setattr(email_service.settings, "SMTP_USERNAME", None)
    monkeypatch.setattr(email_service.settings, "SMTP_PASSWORD", None)
    monkeypatch.setattr(email_service.settings, "SMTP_USE_TLS", True)

    class DummySMTP:
        def __init__(self, host, port):
            self.host = host
            self.port = port
            self.starttls_called = False

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            self.starttls_called = True

        def login(self, _username, _password):
            raise AssertionError("login should not be called without credentials")

        def send_message(self, _message):
            raise AssertionError("send_message should not be called without credentials")

    monkeypatch.setattr(email_service.smtplib, "SMTP", DummySMTP)

    caplog.set_level(logging.WARNING, logger=email_service.logger.name)
    send_verification_email("user@example.com", "token")
    assert any("SMTP credentials missing" in record.message for record in caplog.records)


def test_ensure_smtp_configured_raises(monkeypatch):
    from app.services import email_service

    monkeypatch.setattr(email_service.settings, "SMTP_HOST", None)
    monkeypatch.setattr(email_service.settings, "SMTP_FROM_EMAIL", None)
    with pytest.raises(RuntimeError):
        _ensure_smtp_configured()


def test_gpt_service_chat_parses_text_response(monkeypatch):
    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout

        class DummyResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"text": "hello"}

        return DummyResponse()

    monkeypatch.setattr("app.services.gpt_service.requests.post", fake_post)
    service = GPTService(api_key="test-key", base_url="https://example.com", timeout=10)
    result = service.chat("Hi")

    assert result == "hello"
    assert captured["url"] == "https://example.com/chat"
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["json"]["prompt"] == "Hi"


def test_gpt_service_chat_parses_message_response(monkeypatch):
    def fake_post(_url, _headers=None, _json=None, _timeout=None, **_kwargs):
        class DummyResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": "hi there"}}]}

        return DummyResponse()

    monkeypatch.setattr("app.services.gpt_service.requests.post", fake_post)
    service = GPTService(api_key="test-key", base_url="https://example.com")
    result = service.chat("Hello")

    assert result == "hi there"
