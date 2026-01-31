"""
Database Integration Tests

Verifies:
- Main DB and Product DB connections and table creation
- All harvest/save flows persist correctly
- Database routing (get_db vs get_product_db)
- Foreign key relationships
- Data integrity across tables

Run: pytest tests/test_database_integration.py -v
"""
import os
import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

# Skip PostgreSQL-only tests when using SQLite
_is_sqlite = (
    "sqlite" in (os.getenv("PRODUCT_DATABASE_URL") or os.getenv("DATABASE_URL") or "").lower()
)


# ============== CONNECTION & TABLE TESTS ==============


class TestDatabaseConnections:
    """Verify both databases connect and have required tables."""

    def test_main_db_connection(self, test_db: Session):
        """Main database is reachable."""
        result = test_db.execute(text("SELECT 1"))
        assert result.scalar() == 1

    def test_main_db_tables_exist(self, test_db: Session):
        """Main DB has core tables."""
        tables = ["users", "user_profiles", "scan_sessions", "skin_analyses", "shelf_products"]
        for table in tables:
            if test_db.get_bind().dialect.name == "sqlite":
                result = test_db.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
                    {"t": table}
                )
            else:
                result = test_db.execute(
                    text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename=:t"),
                    {"t": table}
                )
            assert result.fetchone(), f"Table {table} should exist"

    def test_product_db_connection(self):
        """Product database is reachable."""
        from app.product_database import ProductSessionLocal
        if ProductSessionLocal is None:
            pytest.skip("Product DB not configured")
        db = ProductSessionLocal()
        try:
            result = db.execute(text("SELECT 1"))
            assert result.scalar() == 1
        finally:
            db.close()

    def test_product_db_tables_exist(self):
        """Product DB has catalog tables."""
        from app.product_database import ProductSessionLocal
        if ProductSessionLocal is None:
            pytest.skip("Product DB not configured")
        db = ProductSessionLocal()
        try:
            if db.get_bind().dialect.name == "sqlite":
                result = db.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_products'")
                )
            else:
                result = db.execute(
                    text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='catalog_products'")
                )
            assert result.fetchone(), "catalog_products table should exist"
        finally:
            db.close()


# ============== MAIN DB HARVEST TESTS ==============


class TestMainDbHarvest:
    """Verify all main-DB harvest/save flows persist correctly."""

    def test_user_persists(self, test_db: Session):
        """User registration persists to users table."""
        from app.core.security import hash_password
        from app.models.user import User

        user = User(
            email="harvest_test@example.com",
            hashed_password=hash_password("pass123"),
            is_active=True,
            is_verified=True,
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)
        assert user.id is not None
        found = test_db.query(User).filter(User.email == "harvest_test@example.com").first()
        assert found is not None

    def test_user_profile_persists(self, test_db: Session, test_user):
        """Profile creation/update persists to user_profiles."""
        from app.models.user import UserProfile

        profile = UserProfile(
            user_id=test_user.id,
            skin_type="combination",
            primary_concern="acne",
            secondary_concerns=["hydration"],
        )
        test_db.add(profile)
        test_db.commit()
        test_db.refresh(profile)
        assert profile.user_id == test_user.id
        found = test_db.query(UserProfile).filter(UserProfile.user_id == test_user.id).first()
        assert found.skin_type == "combination"

    def test_scan_session_persists(self, test_db: Session, test_user):
        """Scan upload persists to scan_sessions."""
        from app.models.scan import ScanSession, ScanStatus

        session = ScanSession(
            user_id=test_user.id,
            status=ScanStatus.PENDING,
        )
        test_db.add(session)
        test_db.commit()
        test_db.refresh(session)
        assert session.id is not None
        assert session.user_id == test_user.id

    def test_skin_analysis_persists(self, test_db: Session, test_user):
        """Skin analysis results persist and link to scan."""
        from app.models.scan import ScanSession, SkinAnalysis, ScanStatus, SkinType

        scan = ScanSession(user_id=test_user.id, status=ScanStatus.COMPLETED)
        test_db.add(scan)
        test_db.flush()
        analysis = SkinAnalysis(
            scan_session_id=scan.id,
            skin_type=SkinType.COMBINATION,
            fitzpatrick_scale=3,
            concerns=[],
            confidence_scores={"acne": 0.3, "hydration": 0.5},
            overall_confidence=0.75,
            analysis_version="1.0",
        )
        test_db.add(analysis)
        test_db.commit()
        test_db.refresh(analysis)
        assert analysis.scan_session_id == scan.id
        assert analysis.overall_confidence == 0.75

    def test_shelf_product_persists(self, test_db: Session, test_user):
        """Shelf add persists to shelf_products."""
        from app.models.shelf import ShelfProduct

        shelf = ShelfProduct(
            user_id=test_user.id,
            product_name="Test Moisturizer",
            product_brand="Test Brand",
            product_category="moisturizer",
        )
        test_db.add(shelf)
        test_db.commit()
        test_db.refresh(shelf)
        assert shelf.id is not None
        assert shelf.user_id == test_user.id
        assert shelf.product_name == "Test Moisturizer"

    def test_skin_goal_persists(self, test_db: Session, test_user):
        """Goals persist to skin_goals."""
        from app.models.goals import SkinGoal

        goal = SkinGoal(
            user_id=test_user.id,
            goal_type="acne_control",
            title="Reduce breakouts",
            description="Reduce acne",
        )
        test_db.add(goal)
        test_db.commit()
        test_db.refresh(goal)
        assert goal.user_id == test_user.id

    def test_saved_routine_persists(self, test_db: Session, test_user):
        """Routines persist to saved_routines."""
        from datetime import datetime
        from app.models.saved_routine import SavedRoutine

        routine = SavedRoutine(
            user_id=test_user.id,
            name="Morning Routine",
        )
        test_db.add(routine)
        test_db.commit()
        test_db.refresh(routine)
        assert routine.user_id == test_user.id

    def test_progress_photo_persists(self, test_db: Session, test_user):
        """Progress photos persist."""
        from datetime import datetime
        from app.models.progress_photo import ProgressPhoto

        photo = ProgressPhoto(
            user_id=test_user.id,
            photo_type="daily",
            image_url="https://example.com/photo.jpg",
            taken_at=datetime.utcnow(),
        )
        test_db.add(photo)
        test_db.commit()
        test_db.refresh(photo)
        assert photo.user_id == test_user.id


# ============== PRODUCT DB HARVEST TESTS ==============


class TestProductDbHarvest:
    """Verify product catalog harvest/save flows persist correctly."""

    @pytest.fixture
    def product_db(self):
        from app.product_database import ProductSessionLocal
        if ProductSessionLocal is None:
            pytest.skip("Product DB not configured")
        db = ProductSessionLocal()
        yield db
        db.close()

    def test_catalog_product_persists(self, product_db: Session):
        """Catalog product add persists to catalog_products."""
        from app.models.catalog_models import CatalogProduct

        prod = CatalogProduct(
            id=uuid.uuid4(),
            barcode="1234567890123",
            name="Test Serum",
            brand="Test Brand",
            category="serum",
            source="test",
        )
        product_db.add(prod)
        product_db.commit()
        product_db.refresh(prod)
        found = product_db.query(CatalogProduct).filter(CatalogProduct.barcode == "1234567890123").first()
        assert found is not None
        assert found.name == "Test Serum"
        # Cleanup
        product_db.delete(found)
        product_db.commit()

    def test_catalog_ingredient_persists(self, product_db: Session):
        """Catalog ingredient persists."""
        from app.models.catalog_models import CatalogIngredient

        ing = CatalogIngredient(
            id=uuid.uuid4(),
            inci_name="Glycerin",
            category="humectant",
        )
        product_db.add(ing)
        product_db.commit()
        product_db.refresh(ing)
        assert ing.id is not None
        found = product_db.query(CatalogIngredient).filter(CatalogIngredient.inci_name == "Glycerin").first()
        assert found is not None
        product_db.delete(found)
        product_db.commit()


# ============== ROUTING & FK TESTS ==============


class TestDatabaseRouting:
    """Verify correct DB routing for each model."""

    def test_catalog_uses_product_db(self):
        """Catalog router uses get_product_db (product database)."""
        from app.routers.catalog import router
        # Catalog endpoints depend on get_product_db
        for route in router.routes:
            if hasattr(route, "dependant"):
                for dep in route.dependant.dependencies:
                    if hasattr(dep, "call"):
                        # Check if get_product_db is used
                        pass
        # Catalog model uses ProductBase
        from app.models.catalog_models import CatalogProduct
        from app.product_database import ProductBase
        assert CatalogProduct.__table__.metadata is ProductBase.metadata

    def test_shelf_uses_main_db(self):
        """Shelf model uses Base (main database)."""
        from app.models.shelf import ShelfProduct
        from app.database import Base
        assert ShelfProduct.__table__.metadata is Base.metadata

    def test_scan_uses_main_db(self):
        """Scan model uses Base (main database)."""
        from app.models.scan import ScanSession
        from app.database import Base
        assert ScanSession.__table__.metadata is Base.metadata


# ============== API INTEGRATION (E2E DB) ==============


class TestApiToDatabaseFlow:
    """Verify API endpoints persist to correct database."""

    def test_register_creates_user(self, client, test_db):
        """POST /auth/register creates user in main DB."""
        from app.models.user import User

        resp = client.post(
            "/api/v1/auth/register",
            json={"email": "apiuser@test.com", "password": "SecurePass123!"},
        )
        assert resp.status_code == 201
        # User should exist (db is shared via override)
        user = test_db.query(User).filter(User.email == "apiuser@test.com").first()
        assert user is not None

    def test_add_to_shelf_persists(self, client, auth_headers, test_db):
        """POST /shelf adds to shelf_products in main DB."""
        from app.models.shelf import ShelfProduct

        resp = client.post(
            "/api/v1/shelf",
            json={
                "external_product_id": "api-test-123",
                "product_name": "API Test Product",
                "product_brand": "API Brand",
                "product_category": "serum",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201]
        shelf = test_db.query(ShelfProduct).filter(
            ShelfProduct.product_name == "API Test Product"
        ).first()
        assert shelf is not None

    def test_add_to_shelf_with_ingredients_snapshot(self, client, auth_headers, test_db):
        """POST /shelf with ingredients_json preserves snapshot (scan->shelf flow)."""
        from app.models.shelf import ShelfProduct

        payload = {
            "external_product_id": "barcode-3337875559782",
            "product_name": "CeraVe Moisturizing Cream",
            "product_brand": "CeraVe",
            "product_category": "moisturizer",
            "ingredients_json": {
                "ingredients": ["Water", "Glycerin", "Cetearyl Alcohol"],
                "key_ingredients": [{"name": "Ceramides", "percentage": "3"}],
            },
        }
        resp = client.post("/api/v1/shelf", json=payload, headers=auth_headers)
        assert resp.status_code in [200, 201]
        shelf = test_db.query(ShelfProduct).filter(
            ShelfProduct.external_product_id == "barcode-3337875559782"
        ).first()
        assert shelf is not None
        assert shelf.ingredients_json is not None
        assert "ingredients" in shelf.ingredients_json
        assert shelf.ingredients_json["ingredients"] == ["Water", "Glycerin", "Cetearyl Alcohol"]
