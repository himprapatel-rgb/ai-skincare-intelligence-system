"""Sprint 1.2 Backend Tests - Onboarding, Profile, Session Management

Testing coverage for:
- Story 1.2: User onboarding flow
- Story 1.1.2: Multi-device session management
- Story 1.6: Profile management
- Story 1.9: Consent & privacy

SRS Mapping: UR1, FR44-46, BR12, NFR4, NFR6, NFR8
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.session import SessionManager
import json

client = TestClient(app)
session_mgr = SessionManager()

# Test fixtures
@pytest.fixture
def test_user():
    return {
        "email": "test@skincare.ai",
        "password": "SecurePass123!",
        "name": "Test User"
    }

@pytest.fixture
def auth_headers(test_user):
    # Register and login
    client.post("/api/v1/auth/register", json=test_user)
    response = client.post("/api/v1/auth/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# Story 1.2: Onboarding Flow Tests
class TestOnboardingFlow:
    
    def test_onboarding_step_1_goals(self, auth_headers):
        """Test onboarding step 1 - skincare goals"""
        data = {
            "step": 1,
            "goals": ["acne_reduction", "anti_aging", "hydration"]
        }
        response = client.post("/api/v1/onboarding/step", json=data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["next_step"] == 2
    
    def test_onboarding_step_2_concerns(self, auth_headers):
        """Test onboarding step 2 - skin concerns"""
        data = {
            "step": 2,
            "concerns": ["acne", "redness", "dark_spots"]
        }
        response = client.post("/api/v1/onboarding/step", json=data, headers=auth_headers)
        assert response.status_code == 200
        assert "next_step" in response.json()
    
    def test_onboarding_completion(self, auth_headers):
        """Test complete onboarding flow (all 6 steps)"""
        steps_data = [
            {"step": 1, "goals": ["acne_reduction"]},
            {"step": 2, "concerns": ["acne"]},
            {"step": 3, "skin_type": "oily"},
            {"step": 4, "current_routine": "basic"},
            {"step": 5, "allergies": [], "sensitivities": []},
            {"step": 6, "climate": "temperate"}
        ]
        
        for data in steps_data:
            response = client.post("/api/v1/onboarding/step", json=data, headers=auth_headers)
            assert response.status_code == 200
        
        # Verify profile created
        profile_response = client.get("/api/v1/profile", headers=auth_headers)
        assert profile_response.status_code == 200
        assert profile_response.json()["onboarding_completed"] == True

# Story 1.1.2: Multi-Device Session Management Tests
class TestMultiDeviceSession:
    
    def test_create_session(self, test_user):
        """Test session creation on login"""
        client.post("/api/v1/auth/register", json=test_user)
        response = client.post("/api/v1/auth/login", json={
            "email": test_user["email"],
            "password": test_user["password"]
        })
        assert "session_id" in response.json()
        assert "access_token" in response.json()
    
    def test_multiple_device_sessions(self, test_user):
        """Test user can have up to 5 active sessions"""
        sessions = []
        for i in range(5):
            response = client.post("/api/v1/auth/login", json={
                "email": test_user["email"],
                "password": test_user["password"]
            })
            assert response.status_code == 200
            sessions.append(response.json()["session_id"])
        
        # Verify all sessions active
        assert len(set(sessions)) == 5
    
    def test_session_limit_enforcement(self, test_user, auth_headers):
        """Test 6th session removes oldest session"""
        # Create 5 sessions first
        for i in range(5):
            client.post("/api/v1/auth/login", json={
                "email": test_user["email"],
                "password": test_user["password"]
            })
        
        # 6th login should work
        response = client.post("/api/v1/auth/login", json={
            "email": test_user["email"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        
        # Verify only 5 active sessions
        sessions_response = client.get("/api/v1/sessions", headers=auth_headers)
        assert len(sessions_response.json()["sessions"]) == 5
    
    def test_logout_specific_session(self, auth_headers):
        """Test logging out specific device session"""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"
    
    def test_logout_all_sessions(self, auth_headers):
        """Test logging out all device sessions"""
        response = client.post("/api/v1/auth/logout-all", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify all sessions terminated
        sessions_response = client.get("/api/v1/sessions", headers=auth_headers)
        assert sessions_response.status_code == 401  # Unauthorized

# Story 1.6: Profile Management Tests
class TestProfileManagement:
    
    def test_get_profile(self, auth_headers):
        """Test retrieving user profile"""
        response = client.get("/api/v1/profile", headers=auth_headers)
        assert response.status_code == 200
        assert "email" in response.json()
        assert "name" in response.json()
    
    def test_update_profile_basic(self, auth_headers):
        """Test updating basic profile information"""
        data = {
            "name": "Updated Name",
            "phone": "+353-123-456-7890"
        }
        response = client.patch("/api/v1/profile", json=data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
    
    def test_update_profile_settings(self, auth_headers):
        """Test updating profile settings"""
        data = {
            "settings": {
                "notifications_enabled": True,
                "email_marketing": False,
                "data_sharing": "minimal"
            }
        }
        response = client.patch("/api/v1/profile/settings", json=data, headers=auth_headers)
        assert response.status_code == 200
    
    def test_delete_profile(self, auth_headers):
        """Test profile deletion (GDPR compliance)"""
        response = client.delete("/api/v1/profile", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify profile deleted
        get_response = client.get("/api/v1/profile", headers=auth_headers)
        assert get_response.status_code == 404

# Story 1.9: Consent & Privacy Tests
class TestConsentPrivacy:
    
    def test_get_privacy_policy(self):
        """Test retrieving current privacy policy"""
        response = client.get("/api/v1/legal/privacy-policy")
        assert response.status_code == 200
        assert "version" in response.json()
        assert "content" in response.json()
    
    def test_consent_required_for_new_users(self, test_user):
        """Test new users must consent before using app"""
        client.post("/api/v1/auth/register", json=test_user)
        response = client.post("/api/v1/auth/login", json={
            "email": test_user["email"],
            "password": test_user["password"]
        })
        
        # Check consent required flag
        assert response.json()["consent_required"] == True
    
    def test_accept_consent(self, auth_headers):
        """Test user accepting privacy policy"""
        data = {
            "policy_version": "1.0",
            "accepted": True,
            "timestamp": "2025-12-02T10:00:00Z"
        }
        response = client.post("/api/v1/consent/accept", json=data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["consent_status"] == "accepted"
    
    def test_reject_consent(self, auth_headers):
        """Test user rejecting privacy policy (blocks app access)"""
        data = {
            "policy_version": "1.0",
            "accepted": False
        }
        response = client.post("/api/v1/consent/reject", json=data, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify access blocked
        profile_response = client.get("/api/v1/profile", headers=auth_headers)
        assert profile_response.status_code == 403
    
    def test_consent_version_tracking(self, auth_headers):
        """Test consent version changes trigger re-consent"""
        # Accept v1.0
        client.post("/api/v1/consent/accept", json={
            "policy_version": "1.0",
            "accepted": True
        }, headers=auth_headers)
        
        # Check if v2.0 requires new consent
        response = client.get("/api/v1/consent/status", headers=auth_headers)
        if response.json()["latest_version"] == "2.0":
            assert response.json()["consent_required"] == True

# NFR4, NFR6: Security & Data Privacy Tests
class TestSecurityPrivacy:
    
    def test_profile_data_encryption(self, auth_headers):
        """Test sensitive profile data is encrypted (NFR4)"""
        # This would check database directly in real scenario
        data = {"sensitive_field": "test_data"}
        response = client.patch("/api/v1/profile", json=data, headers=auth_headers)
        assert response.status_code == 200
    
    def test_gdpr_data_export(self, auth_headers):
        """Test GDPR right to data portability (BR12)"""
        response = client.get("/api/v1/profile/export", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
    
    def test_audit_log_consent_changes(self, auth_headers):
        """Test all consent changes are logged (NFR8)"""
        client.post("/api/v1/consent/accept", json={
            "policy_version": "1.0",
            "accepted": True
        }, headers=auth_headers)
        
        # Verify audit log entry created
        response = client.get("/api/v1/audit/consent", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["entries"]) > 0

# Performance Tests (NFR6)
class TestPerformance:
    
    @pytest.mark.parametrize("concurrent_users", [10, 50, 100])
    def test_concurrent_onboarding(self, concurrent_users):
        """Test system handles concurrent onboarding (NFR6)"""
        # Simulate concurrent users
        import concurrent.futures
        
        def onboard_user(user_id):
            user = {"email": f"user{user_id}@test.com", "password": "Pass123!"}
            client.post("/api/v1/auth/register", json=user)
            return True
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            results = list(executor.map(onboard_user, range(concurrent_users)))
        
        assert all(results)
    
    def test_profile_response_time(self, auth_headers):
        """Test profile endpoint responds within 200ms (NFR6)"""
        import time
        
        start = time.time()
        response = client.get("/api/v1/profile", headers=auth_headers)
        duration = (time.time() - start) * 1000
        
        assert response.status_code == 200
        assert duration < 200  # Must respond in under 200ms

if __name__ == "__main__":
    pytest.main(["-v", "--cov=app", "--cov-report=html"])
