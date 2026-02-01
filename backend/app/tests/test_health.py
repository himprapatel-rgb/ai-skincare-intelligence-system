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

    # Check response structure (uses checks.main_database / checks.product_database)
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "checks" in data
    checks = data["checks"]
    assert "main_database" in checks

    # Check service name
    assert data["service"] == "ai-skincare-intelligence-system"

    # If main DB is ok, status should be healthy or degraded
    main_db = checks.get("main_database", {})
    if main_db.get("status") == "ok":
        assert data["status"] in ["healthy", "degraded"]


def test_health_check_response_structure():
    """Test health check returns correct JSON structure."""
    response = client.get("/api/health")

    data = response.json()

    # Verify all required fields are present
    assert "status" in data
    assert "service" in data
    assert "checks" in data
    checks = data["checks"]
    assert "main_database" in checks

    # Verify field types
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)
    assert isinstance(checks["main_database"], dict)

    # Status should be either healthy or degraded
    assert data["status"] in ["healthy", "degraded"]

    # Main database status should be ok, error, or slow
    main_db = checks["main_database"]
    assert main_db.get("status") in ["ok", "error", "slow"]
