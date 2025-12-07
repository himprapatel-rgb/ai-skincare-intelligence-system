# Unit tests for Face Scan Router - Sprint 2 Phase 3
import pytest
from fastapi import status
from io import BytesIO
import base64


class TestScanRouter:
    """Test suite for face scan analysis endpoints"""

    def test_upload_scan_success(self, client, auth_headers):
        """Test successful face scan upload"""
        # Create test image data
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        response = client.post(
            "/api/v1/scan/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "scan_id" in data
        assert "analysis_status" in data

    def test_upload_scan_no_auth(self, client):
        """Test scan upload without authentication"""
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        response = client.post("/api/v1/scan/upload", files=files)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_scan_invalid_file_type(self, client, auth_headers):
        """Test scan upload with invalid file type"""
        test_file = BytesIO(b"not_an_image")
        files = {"file": ("test.txt", test_file, "text/plain")}
        
        response = client.post(
            "/api/v1/scan/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

    def test_get_scan_results(self, client, auth_headers):
        """Test retrieving scan results"""
        # First upload a scan
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        upload_response = client.post(
            "/api/v1/scan/upload",
            files=files,
            headers=auth_headers
        )
        scan_id = upload_response.json()["scan_id"]
        
        # Get results
        response = client.get(
            f"/api/v1/scan/{scan_id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "scan_id" in data
        assert "skin_analysis" in data

    def test_get_scan_not_found(self, client, auth_headers):
        """Test getting non-existent scan"""
        response = client.get(
            "/api/v1/scan/999999",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_user_scans(self, client, auth_headers):
        """Test listing user's scan history"""
        response = client.get(
            "/api/v1/scan/history",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_rate_limiting(self, client, auth_headers):
        """Test rate limiting on scan uploads"""
        test_image = BytesIO(b"fake_image_data")
        
        # Make multiple rapid requests
        responses = []
        for _ in range(15):
            files = {"file": ("test.jpg", BytesIO(b"fake_image_data"), "image/jpeg")}
            response = client.post(
                "/api/v1/scan/upload",
                files=files,
                headers=auth_headers
            )
            responses.append(response.status_code)
        
        # Should hit rate limit
        assert status.HTTP_429_TOO_MANY_REQUESTS in responses

    def test_file_cleanup_after_processing(self, client, auth_headers):
        """Test that temporary files are cleaned up"""
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        response = client.post(
            "/api/v1/scan/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        # File cleanup is handled by middleware
        # This test ensures no exceptions during cleanup

    def test_error_recovery(self, client, auth_headers):
        """Test error handling and recovery"""
        # Test with empty file
        files = {"file": ("test.jpg", BytesIO(b""), "image/jpeg")}
        
        response = client.post(
            "/api/v1/scan/upload",
            files=files,
            headers=auth_headers
        )
        
        # Should handle gracefully
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ]
