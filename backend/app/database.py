"""
Database configuration and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# Create database engine
if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL is not configured.")

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # Pool sized for many workers (e.g. UVICORN_WORKERS=16); each request may hold a connection
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
class Base(DeclarativeBase):
    pass

# Dependency to get database session
def get_db():
    """
    Database session dependency for FastAPI endpoints.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
