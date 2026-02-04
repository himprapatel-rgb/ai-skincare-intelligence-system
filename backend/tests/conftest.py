# Test configuration and fixtures for Sprint 2 Phase 3
import os

# Use a single file-based SQLite so app.database and app.product_database
# share the same DB (catalog tests need catalog_products table).
_backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
_shared_db_path = os.path.join(_backend_dir, "test_shared.db").replace("\\", "/")
_SHARED_SQLITE = f"sqlite:///{_shared_db_path}"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", _SHARED_SQLITE)
if not os.environ.get("TEST_DATABASE_URL"):
    os.environ["TEST_DATABASE_URL"] = os.environ.get("DATABASE_URL", _SHARED_SQLITE)
if not os.environ.get("PRODUCT_DATABASE_URL"):
    os.environ["PRODUCT_DATABASE_URL"] = _SHARED_SQLITE

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.database import get_db as app_db_get_db
from app.dependencies import get_db
from app.main import app

# Use same URL as app so main + product tables live in one DB for catalog tests.
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", _SHARED_SQLITE)
if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    allow_test_db = os.getenv("ALLOW_TEST_DB", "").lower() in {"1", "true", "yes"}
    if not allow_test_db:
        raise RuntimeError(
            "Refusing to run tests against a non-SQLite database. "
            "Set TEST_DATABASE_URL and ALLOW_TEST_DB=true to override."
        )


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(_type, _compiler, **_kwargs):
    return "JSON"


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(_type, _compiler, **_kwargs):
    return "JSON"


@compiles(UUID, "sqlite")
def _compile_uuid_sqlite(_type, _compiler, **_kwargs):
    return "CHAR(36)"

# Ensure main + product tables exist so tests using raw TestClient(app) (e.g. catalog, products_api) see them.
# Must run after @compiles so SQLite can render JSONB/ARRAY/UUID.
@pytest.fixture(scope="session", autouse=True)
def _ensure_all_tables():
    """Create main and product catalog tables once per test session (on app's engine)."""
    import app.models  # noqa: F401 - register all Base models
    from app.database import engine as app_engine
    from app.product_database import create_product_tables
    Base.metadata.create_all(bind=app_engine)
    create_product_tables()
    yield


# Configure engine based on database type
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
    )

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def test_db():
    """Create test database and tables"""
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        # Recreate main tables so other tests (e.g. test_products_api) using raw TestClient(app) still see them
        Base.metadata.create_all(bind=engine)


@pytest.fixture
def client(test_db):
    """Create test client with database dependency override"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[app_db_get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(test_db):
    """Create a test user in the database"""
    from app.core.security import hash_password
    from app.models.user import User
    
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("testpassword123"),
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    """Create auth headers with real JWT token"""
    from datetime import timedelta

    from app.core.security import create_access_token

    # Create a real JWT token for the test user
    access_token = create_access_token(
        data={"sub": test_user.email},
        expires_delta=timedelta(minutes=30)
    )
    return {"Authorization": f"Bearer {access_token}"}
