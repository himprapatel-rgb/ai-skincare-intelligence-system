import logging

import pytest
from fastapi import HTTPException
from jose import jwt

from app.core import security
from app.core.audit import log_profile_event


def test_password_hashing_and_verification():
    hashed = security.hash_password("StrongPass123!")
    assert security.verify_password("StrongPass123!", hashed) is True
    assert security.verify_password("WrongPass123!", hashed) is False


def test_access_token_contains_subject():
    token = security.create_access_token({"sub": "user@example.com"})
    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == "user@example.com"


def test_encrypt_decrypt_sensitive_data_roundtrip(monkeypatch):
    monkeypatch.setenv("ENCRYPTION_KEY", "test-key-123")
    monkeypatch.setenv("ENCRYPTION_SALT", "test-salt")
    security._FERNET_INSTANCE = None

    payload = {"items": [1, 2, 3]}
    encrypted = security.encrypt_sensitive_data(payload)
    assert isinstance(encrypted, str)
    assert security.decrypt_sensitive_data(encrypted) == payload
    assert security.decrypt_sensitive_data(None) is None
    assert security.decrypt_sensitive_data(["keep"]) == ["keep"]


@pytest.mark.asyncio
async def test_get_current_user_optional_invalid_token_returns_none(test_db):
    result = await security.get_current_user_optional(token="invalid", db=test_db)
    assert result is None


@pytest.mark.asyncio
async def test_get_current_user_optional_unverified_raises(test_db, test_user):
    test_user.is_verified = False
    test_db.commit()
    token = security.create_access_token({"sub": test_user.email})

    with pytest.raises(HTTPException) as exc:
        await security.get_current_user_optional(token=token, db=test_db)

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_get_current_user_and_admin(test_db, test_user, monkeypatch):
    token = security.create_access_token({"sub": test_user.email})
    user = await security.get_current_user(token=token, db=test_db)
    assert user.id == test_user.id

    test_user.is_admin = True
    test_db.commit()
    test_db.refresh(test_user)
    monkeypatch.setattr(security.settings, "ADMIN_EMAIL_ALLOWLIST", test_user.email)

    admin = await security.get_current_admin(current_user=user)
    assert admin.id == test_user.id


@pytest.mark.asyncio
async def test_log_profile_event_writes_audit_log(caplog):
    caplog.set_level(logging.INFO, logger="audit")

    await log_profile_event(
        db=None,
        user_id=1,
        event_type="profile_updated",
        old_value=None,
        new_value=None,
        ip_address="127.0.0.1",
    )

    assert any("profile_updated" in record.message for record in caplog.records)
