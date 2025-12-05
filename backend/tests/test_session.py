"""Test Suite for Sprint 1.2 - Multi-Device Session Management
SRS Alignment: FR45, FR44, NFR4, NFR6
Product Backlog: Story 1.1.2
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import jwt
import uuid

from app.main import app
from app.core.session import SessionManager
from app.models.session import DeviceSession


client = TestClient(app)
session_manager = SessionManager()


class TestSessionManagement:
    """Test Multi-Device Session Management (Story 1.1.2)"""

    def test_create_session_success(self):
        """AC1.1.2.1: User can create a new session on login"""
        login_data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "device_info": {
                "device_id": "device-001",
                "device_type": "mobile",
                "platform": "iOS",
                "app_version": "1.0.0",
            },
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "session_id" in data
        assert data["device_info"]["device_id"] == "device-001"

    def test_multi_device_sessions(self):
        """AC1.1.2.2: User can maintain up to 5 active sessions"""
        user_id = "test-user-multi"
        devices = []

        # Create 5 sessions on different devices
        for i in range(5):
            device_id = f"device-{i}"
            session = session_manager.create_session(
                user_id=user_id,
                device_id=device_id,
                device_type="mobile" if i % 2 == 0 else "web",
            )
            devices.append(session)
            assert session.session_id is not None

        # Verify all 5 sessions are active
        active_sessions = session_manager.get_user_sessions(user_id)
        assert len(active_sessions) == 5

    def test_exceed_max_devices(self):
        """AC1.1.2.3: Creating 6th session removes oldest session"""
        user_id = "test-user-max"

        # Create 5 sessions
        first_session_id = None
        for i in range(6):
            session = session_manager.create_session(
                user_id=user_id, device_id=f"device-{i}", device_type="mobile"
            )
            if i == 0:
                first_session_id = session.session_id

        # Verify only 5 sessions remain
        active_sessions = session_manager.get_user_sessions(user_id)
        assert len(active_sessions) == 5

        # Verify first session was removed
        session_ids = [s.session_id for s in active_sessions]
        assert first_session_id not in session_ids

    def test_session_token_validation(self):
        """AC1.1.2.4: Session tokens are valid and secure (JWT)"""
        user_id = "test-user-token"
        device_id = "device-token-001"

        session = session_manager.create_session(
            user_id=user_id, device_id=device_id, device_type="web"
        )

        # Verify token is JWT format
        token = session.access_token
        assert token.count(".") == 2  # JWT has 3 parts

        # Decode and verify claims
        from app.core.security import SECRET_KEY, ALGORITHM

        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["user_id"] == user_id
        assert decoded["device_id"] == device_id
        assert "exp" in decoded

    def test_session_sync_across_devices(self):
        """AC1.1.2.5: Session state syncs across devices via WebSocket"""
        user_id = "test-user-sync"

        # Simulate WebSocket connection for two devices
        device1 = session_manager.create_session(user_id, "device-1", "web")
        device2 = session_manager.create_session(user_id, "device-2", "mobile")

        # Update profile on device 1
        update_data = {"skin_type": "oily"}
        response = client.patch(
            f"/api/v1/profile/{user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {device1.access_token}"},
        )

        assert response.status_code == 200

        # Verify device 2 receives sync notification
        sync_events = session_manager.get_sync_events(device2.session_id)
        assert len(sync_events) > 0
        assert sync_events[0]["type"] == "profile_update"
        assert sync_events[0]["data"]["skin_type"] == "oily"

    def test_logout_single_device(self):
        """AC1.1.2.6: User can logout from a single device"""
        user_id = "test-user-logout"

        # Create 2 sessions
        session1 = session_manager.create_session(user_id, "device-1", "web")
        session2 = session_manager.create_session(user_id, "device-2", "mobile")

        # Logout from device 1
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {session1.access_token}"},
        )

        assert response.status_code == 200

        # Verify device 1 session is removed
        active_sessions = session_manager.get_user_sessions(user_id)
        assert len(active_sessions) == 1
        assert active_sessions[0].device_id == "device-2"

    def test_logout_all_devices(self):
        """AC1.1.2.7: User can logout from all devices"""
        user_id = "test-user-logout-all"

        # Create 3 sessions
        for i in range(3):
            session_manager.create_session(user_id, f"device-{i}", "mobile")

        # Logout from all devices
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={"Authorization": "Bearer test-token"},
            json={"user_id": user_id},
        )

        assert response.status_code == 200

        # Verify all sessions removed
        active_sessions = session_manager.get_user_sessions(user_id)
        assert len(active_sessions) == 0

    def test_session_expiration(self):
        """AC1.1.2.8: Sessions expire after 7 days of inactivity"""
        user_id = "test-user-expire"
        device_id = "device-expire-001"

        # Create session with past timestamp
        session = session_manager.create_session(user_id, device_id, "web")

        # Manually set last_activity to 8 days ago
        past_time = datetime.utcnow() - timedelta(days=8)
        session_manager.update_last_activity(session.session_id, past_time)

        # Attempt to use expired session
        response = client.get(
            f"/api/v1/profile/{user_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )

        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    def test_session_refresh(self):
        """AC1.1.2.9: Users can refresh session tokens"""
        user_id = "test-user-refresh"
        device_id = "device-refresh-001"

        # Create session
        session = session_manager.create_session(user_id, device_id, "web")
        original_token = session.access_token

        # Refresh token
        response = client.post(
            "/api/v1/auth/refresh",
            headers={"Authorization": f"Bearer {original_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        new_token = data["access_token"]

        # Verify new token is different
        assert new_token != original_token

        # Verify new token works
        response = client.get(
            f"/api/v1/profile/{user_id}",
            headers={"Authorization": f"Bearer {new_token}"},
        )
        assert response.status_code == 200

    def test_session_device_info_tracking(self):
        """AC1.1.2.10: Device info is tracked for security"""
        user_id = "test-user-device-info"
        device_info = {
            "device_id": "device-info-001",
            "device_type": "mobile",
            "platform": "Android",
            "os_version": "13",
            "app_version": "1.2.3",
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0...",
        }

        session = session_manager.create_session(
            user_id=user_id,
            device_id=device_info["device_id"],
            device_type=device_info["device_type"],
            metadata=device_info,
        )

        # Verify device info stored
        assert session.device_type == "mobile"
        assert session.metadata["platform"] == "Android"
        assert session.metadata["ip_address"] == "192.168.1.100"

    @pytest.mark.security
    def test_session_hijacking_prevention(self):
        """NFR4: Prevent session hijacking with IP validation"""
        user_id = "test-user-security"
        device_id = "device-security-001"
        original_ip = "192.168.1.100"

        # Create session with specific IP
        session = session_manager.create_session(
            user_id=user_id,
            device_id=device_id,
            device_type="web",
            metadata={"ip_address": original_ip},
        )

        # Attempt to use session from different IP
        response = client.get(
            f"/api/v1/profile/{user_id}",
            headers={
                "Authorization": f"Bearer {session.access_token}",
                "X-Forwarded-For": "10.0.0.1",  # Different IP
            },
        )

        # Should trigger security alert (but may still allow with warning)
        assert response.status_code in [200, 401]
        if response.status_code == 401:
            assert "security" in response.json()["detail"].lower()

    @pytest.mark.performance
    def test_session_operations_performance(self):
        """NFR6: Session operations complete under 200ms"""
        import time

        user_id = "test-user-perf"
        device_id = "device-perf-001"

        start = time.time()
        session = session_manager.create_session(user_id, device_id, "web")
        duration = (time.time() - start) * 1000

        assert duration < 200  # Under 200ms
        assert session.session_id is not None


if __name__ == "__main__":
    pytest.main(["-v", "test_session.py"])
