"""Tests for ML Product Suitability Endpoints"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_headers(test_user_token):
    """Get authentication headers for test user."""
    return {"Authorization": f"Bearer {test_user_token}"}


def test_analyze_product_suitability(auth_headers):
    """Test single product suitability analysis."""
    payload = {
        "user_profile": {
            "skin_type": "oily",
            "concerns": ["acne", "large pores"],
            "sensitivities": ["fragrance"]
        },
        "product_data": {
            "name": "Test Moisturizer",
            "ingredients": ["water", "glycerin", "niacinamide"],
            "category": "moisturizer"
        }
    }
    
    response = client.post(
        "/api/v1/products/analyze",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "suitability_score" in data
    assert "confidence" in data
    assert "explanation" in data
    assert "warnings" in data
    assert "model_version" in data
    assert "timestamp" in data
    
    # Check data types and ranges
    assert 0 <= data["suitability_score"] <= 1
    assert 0 <= data["confidence"] <= 1
    assert isinstance(data["explanation"], str)
    assert isinstance(data["warnings"], list)


def test_analyze_product_with_sensitivity_warning(auth_headers):
    """Test that warnings are generated for user sensitivities."""
    payload = {
        "user_profile": {
            "skin_type": "sensitive",
            "concerns": ["redness"],
            "sensitivities": ["fragrance", "alcohol"]
        },
        "product_data": {
            "name": "Scented Cream",
            "ingredients": ["water", "fragrance", "glycerin"],
            "category": "cream"
        }
    }
    
    response = client.post(
        "/api/v1/products/analyze",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should have warnings due to fragrance in sensitive profile
    assert len(data["warnings"]) > 0
    assert any("fragrance" in w.lower() for w in data["warnings"])


def test_get_model_info(auth_headers):
    """Test ML model information endpoint."""
    response = client.get(
        "/api/v1/products/model-info",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check model info structure
    assert "version" in data
    assert "loaded" in data
    assert "type" in data
    assert "ready_for_ml" in data
    assert "description" in data
    
    # Current stub model should be loaded
    assert data["loaded"] is True


def test_batch_analyze_products(auth_headers):
    """Test batch product analysis."""
    payload = [
        {
            "user_profile": {
                "skin_type": "dry",
                "concerns": ["hydration"],
                "sensitivities": []
            },
            "product_data": {
                "name": "Product 1",
                "ingredients": ["water", "hyaluronic acid"],
                "category": "serum"
            }
        },
        {
            "user_profile": {
                "skin_type": "oily",
                "concerns": ["acne"],
                "sensitivities": []
            },
            "product_data": {
                "name": "Product 2",
                "ingredients": ["salicylic acid", "niacinamide"],
                "category": "treatment"
            }
        }
    ]
    
    response = client.post(
        "/api/v1/products/batch-analyze",
        json=payload,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should return list of results
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Each result should have standard structure
    for result in data:
        assert "suitability_score" in result
        assert "confidence" in result
        assert "warnings" in result


def test_analyze_product_requires_auth():
    """Test that ML endpoints require authentication."""
    payload = {
        "user_profile": {"skin_type": "normal", "concerns": [], "sensitivities": []},
        "product_data": {"name": "Test", "ingredients": [], "category": "test"}
    }
    
    response = client.post("/api/v1/products/analyze", json=payload)
    assert response.status_code == 401


def test_model_info_requires_auth():
    """Test that model info endpoint requires authentication."""
    response = client.get("/api/v1/products/model-info")
    assert response.status_code == 401
