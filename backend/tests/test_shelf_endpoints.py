# Tests for Product Shelf API endpoints
import uuid

import pytest
from fastapi import status


class TestShelfGet:
    """Test GET /api/v1/shelf."""

    def test_get_shelf(self, client, auth_headers):
        """GET /api/v1/shelf returns empty shelf for new user."""
        response = client.get("/api/v1/shelf", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        assert data["total"] == 0
        assert "by_status" in data


class TestShelfAdd:
    """Test POST /api/v1/shelf."""

    def test_add_to_shelf(self, client, auth_headers):
        """POST /api/v1/shelf adds a product and returns 201."""
        product_uuid = str(uuid.uuid4())
        response = client.post(
            "/api/v1/shelf",
            json={
                "product_id": product_uuid,
                "product_name": "CeraVe Moisturizer",
                "product_brand": "CeraVe",
                "product_category": "moisturizer",
                "status": "active",
            },
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["product_name"] == "CeraVe Moisturizer"
        assert data["product_brand"] == "CeraVe"
        assert data["status"] == "active"

    def test_add_duplicate_rejected(self, client, auth_headers):
        """Adding the same product twice returns 409 CONFLICT."""
        product_uuid = str(uuid.uuid4())
        payload = {
            "product_id": product_uuid,
            "product_name": "Duplicate Test",
            "product_brand": "Brand",
        }
        first = client.post("/api/v1/shelf", json=payload, headers=auth_headers)
        assert first.status_code == status.HTTP_201_CREATED

        second = client.post("/api/v1/shelf", json=payload, headers=auth_headers)
        assert second.status_code == status.HTTP_409_CONFLICT


class TestShelfBatch:
    """Test POST /api/v1/shelf/batch."""

    def test_batch_add(self, client, auth_headers):
        """POST /api/v1/shelf/batch adds multiple products at once."""
        products = [
            {
                "external_product_id": f"ext-batch-{i}",
                "product_name": f"Batch Product {i}",
                "product_brand": "BatchBrand",
            }
            for i in range(3)
        ]
        response = client.post(
            "/api/v1/shelf/batch",
            json={"products": products},
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_batch_add_empty_rejected(self, client, auth_headers):
        """POST /api/v1/shelf/batch with empty list returns 400."""
        response = client.post(
            "/api/v1/shelf/batch",
            json={"products": []},
            headers=auth_headers,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestShelfExpiring:
    """Test GET /api/v1/shelf/expiring-soon."""

    def test_expiring_soon(self, client, auth_headers):
        """GET /api/v1/shelf/expiring-soon returns products expiring within 30 days."""
        response = client.get("/api/v1/shelf/expiring-soon", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)


class TestShelfStats:
    """Test GET /api/v1/shelf/stats."""

    def test_stats(self, client, auth_headers):
        """GET /api/v1/shelf/stats returns aggregated statistics."""
        response = client.get("/api/v1/shelf/stats", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        assert "by_category" in data
        assert "expiring_soon" in data
