# Tests for Unified Search endpoints
import pytest
from fastapi import status


class TestSearch:
    """Test the /api/v1/search endpoints."""

    def test_search_empty_query_rejected(self, client):
        """GET /api/v1/search with empty q param is rejected (min_length=1)."""
        response = client.get("/api/v1/search", params={"q": ""})
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_search_products(self, client, test_db):
        """GET /api/v1/search?q=moisturizer returns matching products."""
        # Seed a product for searching
        from app.models.product_models import Product

        product = Product(
            name="Hydrating Moisturizer",
            brand="TestBrand",
            category="moisturizer",
        )
        test_db.add(product)
        test_db.commit()

        response = client.get("/api/v1/search", params={"q": "Moisturizer", "type": "products"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "results" in data
        assert data["total"] >= 1
        assert any(r["type"] == "product" for r in data["results"])

    def test_search_no_results(self, client):
        """GET /api/v1/search with non-matching query returns empty results."""
        response = client.get("/api/v1/search", params={"q": "zzzznonexistentzzzz"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert data["results"] == []


class TestSearchSuggestions:
    """Test typeahead suggestions endpoint."""

    def test_suggestions(self, client, test_db):
        """GET /api/v1/search/suggestions returns typeahead suggestions."""
        from app.models.product_models import Product

        product = Product(
            name="Niacinamide Serum",
            brand="TestBrand",
            category="serum",
        )
        test_db.add(product)
        test_db.commit()

        response = client.get("/api/v1/search/suggestions", params={"q": "Niacinamide"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)

    def test_suggestions_empty(self, client):
        """GET /api/v1/search/suggestions with non-matching query returns empty."""
        response = client.get("/api/v1/search/suggestions", params={"q": "xyznonexistent"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["suggestions"] == []
