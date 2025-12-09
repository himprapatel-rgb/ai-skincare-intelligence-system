# Unit tests for Face Scan Router - Sprint 2 Phase 3
import pytest
from fastapi import status
from io import BytesIO
import base64


class TestScanRouter:
    """Test suite for face scan analysis endpoints"""

    def test_init_scan_session(self, client, auth_headers):
        """Test initializing a new scan session"""
        response = client.post(
            "/api/v1/scan/init",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "scan_id" in data
        assert "status" in data
        assert data["status"] == "pending"

    def test_upload_scan_success(self, client, auth_headers):
        """Test successful face scan upload"""
        # First, initialize a scan session
        init_response = client.post(
            "/api/v1/scan/init",
            headers=auth_headers
        )
        assert init_response.status_code == status.HTTP_201_CREATED
        scan_id = init_response.json()["scan_id"]
        
        # Then upload the image
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        response = client.post(
            f"/api/v1/scan/{scan_id}/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "scan_id" in data
        assert "status" in data

    def test_upload_scan_no_auth(self, client):
        """Test scan upload without authentication"""
        # Try to init without auth
        response = client.post("/api/v1/scan/init")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_scan_invalid_file_type(self, client, auth_headers):
        """Test scan upload with invalid file type"""
        # Initialize scan
        init_response = client.post(
            "/api/v1/scan/init",
            headers=auth_headers
        )
        scan_id = init_response.json()["scan_id"]
        
        # Try to upload invalid file
        test_file = BytesIO(b"not_an_image")
        files = {"file": ("test.txt", test_file, "text/plain")}
        
        response = client.post(
            f"/api/v1/scan/{scan_id}/upload",
            files=files,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_scan_results(self, client, auth_headers):
        """Test retrieving scan results"""
        # Initialize and upload
        init_response = client.post(
            "/api/v1/scan/init",
            headers=auth_headers
        )
        scan_id = init_response.json()["scan_id"]
        
        test_image = BytesIO(b"fake_image_data")
        files = {"file": ("test.jpg", test_image, "image/jpeg")}
        
        upload_response = client.post(
            f"/api/v1/scan/{scan_id}/upload",
            files=files,
            headers=auth_headers
        )
        
        # Get results
        response = client.get(
            f"/api/v1/scan/{scan_id}/results",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "scan_id" in data
        assert "result" in data

    def test_get_scan_not_found(self, client, auth_headers):
        """Test getting non-existent scan"""
        response = client.get(
            "/api/v1/scan/999999/results",
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
        assert "scans" in data
        assert isinstance(data["scans"], list)
