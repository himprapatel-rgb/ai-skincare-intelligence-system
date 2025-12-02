"""Test Suite for Sprint 1.2 - Profile Management
SRS Alignment: FR46, UR1, NFR4, NFR6, NFR8
Product Backlog: Story 1.6
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json

from app.main import app
from app.models.profile import UserProfile
from app.core.security import encrypt_field, decrypt_field


client = TestClient(app)


class TestProfileManagement:
    """Test Profile Management Functionality (Story 1.6)"""

    def test_create_profile_success(self):
        """AC1.6.1: User can create profile with required fields"""
        profile_data = {
            "user_id": "test-user-123",
            "skin_type": "combination",
            "skin_concerns": ["acne", "dark_spots"],
            "goals": ["clear_skin", "even_tone"],
            "current_routine": "basic",
            "climate": "humid",
            "budget_range": "mid"
        }
        
        response = client.post(
            "/api/v1/profile",
            json=profile_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == "test-user-123"
        assert data["skin_type"] == "combination"
        assert "acne" in data["skin_concerns"]
        assert data["created_at"] is not None

    def test_create_profile_missing_required_fields(self):
        """AC1.6.2: Profile creation fails with missing required fields"""
        incomplete_data = {
            "user_id": "test-user-123",
            "skin_type": "combination"
            # Missing required fields
        }
        
        response = client.post(
            "/api/v1/profile",
            json=incomplete_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422
        assert "validation" in response.json()["detail"].lower()

    def test_get_profile_success(self):
        """AC1.6.3: User can retrieve their profile"""
        user_id = "test-user-456"
        
        response = client.get(
            f"/api/v1/profile/{user_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert "skin_type" in data
        assert "created_at" in data

    def test_update_profile_success(self):
        """AC1.6.4: User can update profile fields"""
        user_id = "test-user-789"
        update_data = {
            "skin_concerns": ["acne", "wrinkles", "dryness"],
            "goals": ["anti_aging"],
            "budget_range": "high"
        }
        
        response = client.patch(
            f"/api/v1/profile/{user_id}",
            json=update_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "wrinkles" in data["skin_concerns"]
        assert data["goals"] == ["anti_aging"]
        assert data["budget_range"] == "high"
        assert data["updated_at"] is not None

    def test_profile_encryption(self):
        """NFR4: Profile data encrypted at rest (AES-256)"""
        sensitive_data = "combination|acne,dark_spots"
        encrypted = encrypt_field(sensitive_data)
        
        assert encrypted != sensitive_data
        assert len(encrypted) > len(sensitive_data)
        
        decrypted = decrypt_field(encrypted)
        assert decrypted == sensitive_data

    def test_profile_gdpr_compliance(self):
        """BR12: GDPR compliance - data minimization"""
        profile_data = {
            "user_id": "test-user-gdpr",
            "skin_type": "dry",
            "skin_concerns": ["sensitivity"],
            "goals": ["hydration"]
        }
        
        response = client.post(
            "/api/v1/profile",
            json=profile_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        data = response.json()
        # Verify only necessary fields stored
        assert "password" not in data
        assert "credit_card" not in data
        assert "ssn" not in data

    def test_delete_profile_success(self):
        """AC1.6.5: User can delete their profile (GDPR right to erasure)"""
        user_id = "test-user-delete"
        
        response = client.delete(
            f"/api/v1/profile/{user_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 204
        
        # Verify deletion
        get_response = client.get(
            f"/api/v1/profile/{user_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        assert get_response.status_code == 404

    def test_profile_audit_logging(self):
        """NFR8: Audit logging for profile changes"""
        user_id = "test-user-audit"
        update_data = {"skin_type": "oily"}
        
        response = client.patch(
            f"/api/v1/profile/{user_id}",
            json=update_data,
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        
        # Verify audit log created
        audit_response = client.get(
            f"/api/v1/audit/profile/{user_id}",
            headers={"Authorization": "Bearer admin-token"}
        )
        
        assert audit_response.status_code == 200
        audit_data = audit_response.json()
        assert len(audit_data) > 0
        assert audit_data[0]["action"] == "UPDATE"
        assert audit_data[0]["field"] == "skin_type"

    def test_profile_validation_skin_type(self):
        """AC1.6.6: Validate skin type values"""
        invalid_profile = {
            "user_id": "test-user-val",
            "skin_type": "invalid_type",
            "skin_concerns": ["acne"],
            "goals": ["clear_skin"]
        }
        
        response = client.post(
            "/api/v1/profile",
            json=invalid_profile,
            headers={"Authorization": "Bearer test-token"}
        }
        )
        
        assert response.status_code == 422
        assert "skin_type" in response.json()["detail"].lower()

    @pytest.mark.performance
    def test_profile_response_time(self):
        """NFR6: Profile operations under 500ms"""
        import time
        
        start = time.time()
        response = client.get(
            "/api/v1/profile/test-user-perf",
            headers={"Authorization": "Bearer test-token"}
        )
        duration = (time.time() - start) * 1000
        
        assert duration < 500  # Under 500ms
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main(["-v", "test_profile.py"])
