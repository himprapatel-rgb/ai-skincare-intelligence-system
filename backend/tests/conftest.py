# Test configuration and fixtures for Sprint 2 Phase 3
import os

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

# Use TEST_DATABASE_URL for test runs; default to SQLite to avoid
# accidental use of production DATABASE_URL.
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
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
