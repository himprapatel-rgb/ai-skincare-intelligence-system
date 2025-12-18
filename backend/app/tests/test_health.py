"""Tests for the /api/health endpoint."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_success():
    """Test health check returns 200 when DB is available."""
    response = client.get("/api/health")
    
    # Should return 200 OK
    assert response.status_code == 200
    
    # Check response structure
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "database" in data
    
    # Check service name
    assert data["service"] == "ai-skincare-intelligence-system"
    
    # If DB is healthy, status should be healthy
    if data["database"] == "ok":
        assert data["status"] == "healthy"


def test_health_check_response_structure():
    """Test health check returns correct JSON structure."""
    response = client.get("/api/health")
    
    data = response.json()
    
    # Verify all required fields are present
    assert "status" in data
    assert "service" in data
    assert "database" in data
    
    # Verify field types
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)
    assert isinstance(data["database"], str)
    
    # Status should be either healthy or degraded
    assert data["status"] in ["healthy", "degraded"]
    
    # Database should be either ok or error
    assert data["database"] in ["ok", "error"]
