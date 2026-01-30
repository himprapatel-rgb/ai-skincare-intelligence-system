"""
Tests for Product Catalog API (Tasks 451-475)
Tests the separate product database functionality.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app


client = TestClient(app)


class TestCatalogHealth:
    """Test catalog health endpoints"""
    
    def test_catalog_health_endpoint(self):
        """Task 451: Catalog health check should work"""
        response = client.get("/api/v1/catalog/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "error"]
    
    def test_catalog_health_returns_counts(self):
        """Task 452: Health check should return counts"""
        response = client.get("/api/v1/catalog/health")
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "healthy":
                assert "counts" in data
                assert "products" in data["counts"]


class TestCatalogLookup:
    """Test catalog lookup endpoints"""
    
    def test_barcode_lookup_returns_response(self):
        """Task 453: Barcode lookup should return proper response"""
        response = client.get("/api/v1/catalog/barcode/0000000000000")
        assert response.status_code == 200
        data = response.json()
        assert "found" in data
        assert "source" in data
    
    def test_barcode_lookup_not_found(self):
        """Task 454: Non-existent barcode returns found=false"""
        response = client.get("/api/v1/catalog/barcode/9999999999999")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] == False
    
    def test_name_brand_lookup(self):
        """Task 455: Name/brand lookup works"""
        response = client.get(
            "/api/v1/catalog/lookup",
            params={"name": "Test Product", "brand": "Test Brand"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "found" in data


class TestCatalogSearch:
    """Test catalog search endpoints"""
    
    def test_search_endpoint(self):
        """Task 456: Search endpoint works"""
        response = client.get(
            "/api/v1/catalog/search",
            params={"q": "moisturizer"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert "query" in data
    
    def test_search_with_category_filter(self):
        """Task 457: Search with category filter"""
        response = client.get(
            "/api/v1/catalog/search",
            params={"q": "cream", "category": "moisturizer"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_search_with_brand_filter(self):
        """Task 458: Search with brand filter"""
        response = client.get(
            "/api/v1/catalog/search",
            params={"q": "serum", "brand": "CeraVe"}
        )
        assert response.status_code == 200


class TestCatalogCategories:
    """Test category endpoints"""
    
    def test_get_categories(self):
        """Task 459: Get categories list"""
        response = client.get("/api/v1/catalog/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
    
    def test_categories_have_required_fields(self):
        """Task 460: Categories have id, name, icon"""
        response = client.get("/api/v1/catalog/categories")
        data = response.json()
        for cat in data["categories"]:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat


class TestCatalogFilters:
    """Test filter endpoints"""
    
    def test_popular_products(self):
        """Task 461: Popular products endpoint"""
        response = client.get("/api/v1/catalog/products/popular")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert data["filter"] == "popular"
    
    def test_recent_products(self):
        """Task 462: Recent products endpoint"""
        response = client.get("/api/v1/catalog/products/recent")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert data["filter"] == "recent"
    
    def test_vegan_products(self):
        """Task 463: Vegan products endpoint"""
        response = client.get("/api/v1/catalog/products/vegan")
        assert response.status_code == 200
        data = response.json()
        assert data["filter"] == "vegan"
    
    def test_pregnancy_safe_products(self):
        """Task 464: Pregnancy-safe products endpoint"""
        response = client.get("/api/v1/catalog/products/pregnancy-safe")
        assert response.status_code == 200
        data = response.json()
        assert data["filter"] == "pregnancy_safe"
    
    def test_fragrance_free_products(self):
        """Task 465: Fragrance-free products endpoint"""
        response = client.get("/api/v1/catalog/products/fragrance-free")
        assert response.status_code == 200
        data = response.json()
        assert data["filter"] == "fragrance_free"


class TestCatalogIngredients:
    """Test ingredient endpoints"""
    
    def test_list_ingredients(self):
        """Task 466: List ingredients endpoint"""
        response = client.get("/api/v1/catalog/ingredients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_ingredients(self):
        """Task 467: Search ingredients"""
        response = client.get(
            "/api/v1/catalog/ingredients",
            params={"search": "niacinamide"}
        )
        assert response.status_code == 200
    
    def test_harmful_ingredients_filter(self):
        """Task 468: Filter harmful ingredients"""
        response = client.get(
            "/api/v1/catalog/ingredients",
            params={"harmful_only": True}
        )
        assert response.status_code == 200


class TestCatalogBrands:
    """Test brand endpoints"""
    
    def test_list_brands(self):
        """Task 469: List brands endpoint"""
        response = client.get("/api/v1/catalog/brands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestProductsByIngredient:
    """Test products by ingredient search"""
    
    def test_products_by_ingredient(self):
        """Task 470: Find products by ingredient"""
        response = client.get("/api/v1/catalog/products/by-ingredient/niacinamide")
        assert response.status_code == 200
        data = response.json()
        assert "ingredient" in data
        assert "products" in data


class TestSafeProducts:
    """Test safe products endpoints"""
    
    def test_products_safe_for_skin_type(self):
        """Task 471: Products safe for skin type"""
        response = client.get("/api/v1/catalog/products/safe-for/oily")
        assert response.status_code == 200
        data = response.json()
        assert data["skin_type"] == "oily"
        assert "products" in data


class TestCatalogStats:
    """Test catalog statistics"""
    
    def test_stats_requires_auth(self):
        """Task 472: Stats endpoint requires authentication"""
        response = client.get("/api/v1/catalog/stats")
        # Should be 401 or 403 without auth
        assert response.status_code in [401, 403, 422]


class TestProductCreation:
    """Test product creation"""
    
    def test_create_product_requires_auth(self):
        """Task 473: Create product requires authentication"""
        response = client.post(
            "/api/v1/catalog/products",
            json={
                "name": "Test Product",
                "brand": "Test Brand",
                "category": "moisturizer"
            }
        )
        # Should be 401 without auth
        assert response.status_code in [401, 403, 422]


class TestDatabaseConnection:
    """Test database connection"""
    
    def test_product_db_health_in_main_health(self):
        """Task 474: Main health check includes product DB"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "checks" in data
        # Should have product_database in checks
        assert "product_database" in data["checks"]


class TestAPIPerformance:
    """Test API performance"""
    
    def test_barcode_lookup_performance(self):
        """Task 475: Barcode lookup should be fast"""
        import time
        start = time.time()
        response = client.get("/api/v1/catalog/barcode/0000000000000")
        duration = time.time() - start
        
        assert response.status_code == 200
        # Should complete within 1 second (ideally <100ms for cache hit)
        assert duration < 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
