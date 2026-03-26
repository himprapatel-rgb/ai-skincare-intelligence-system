# Tests for Sprint 2 auth upgrades
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import status


class TestAuthLogin:
    """Test login endpoint with lockout and credential validation."""

    def test_login_success(self, client, test_user):
        """POST /api/v1/auth/login with valid credentials returns 200 + token."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpassword123"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "token" in data
        assert data["token_type"] == "bearer"
        assert "refresh_token" in data
        assert data["user"]["email"] == test_user.email

    def test_login_wrong_password(self, client, test_user):
        """POST /api/v1/auth/login with wrong password returns 401."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "wrongpassword"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_lockout(self, client, test_user, test_db):
        """Account with locked_until in the future returns 423."""
        # Directly set the lockout on the user (avoids tz-naive/aware comparison
        # that SQLite triggers when the app code sets locked_until via login)
        test_user.failed_login_count = 5
        test_user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        test_db.add(test_user)
        test_db.commit()

        # Patch datetime comparison in the auth endpoint to use naive datetime
        with patch(
            "app.api.v1.endpoints.auth.datetime"
        ) as mock_dt:
            mock_dt.now.return_value = datetime.utcnow()
            mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)

            response = client.post(
                "/api/v1/auth/login",
                json={"email": test_user.email, "password": "testpassword123"},
            )
        assert response.status_code == status.HTTP_423_LOCKED
        assert "locked" in response.json()["detail"].lower()


class TestAuthRefresh:
    """Test token refresh endpoint."""

    def _login(self, client, email):
        """Helper: login and return the response JSON."""
        return client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "testpassword123"},
        ).json()

    def test_refresh_token(self, client, test_user):
        """POST /api/v1/auth/refresh with valid refresh token returns new pair."""
        login_data = self._login(client, test_user.email)
        refresh = login_data["refresh_token"]

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_invalid(self, client, test_user):
        """POST /api/v1/auth/refresh with bad token returns 401."""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.value"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAuthLogout:
    """Test logout endpoint."""

    def test_logout(self, client, test_user):
        """POST /api/v1/auth/logout invalidates the access token."""
        login_data = client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpassword123"},
        ).json()
        token = login_data["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Logout
        response = client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Subsequent request with same token should fail
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAccountDeletion:
    """Test GDPR account deletion endpoint."""

    def test_delete_account(self, client, test_user, test_db, auth_headers):
        """DELETE /api/v1/auth/account sets deleted_at on the user."""
        response = client.delete("/api/v1/auth/account", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["grace_period_days"] == 30

        # Verify user has deleted_at set
        test_db.refresh(test_user)
        assert test_user.deleted_at is not None
        assert test_user.is_active is False
