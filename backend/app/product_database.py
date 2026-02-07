"""
Product Catalog Database Configuration

Separate database connection for the product catalog.
This creates a two-database architecture:
- Main Database: Users, scans, shelf, routines (DATABASE_URL)
- Product Database: Products, ingredients, brands (PRODUCT_DATABASE_URL)

Benefits:
- Scalability: Product data can scale independently
- Performance: Product lookups don't compete with user operations
- Caching: Product data is read-heavy, can be cached differently
- Sharing: Product catalog could be shared across multiple apps
"""

import logging
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import QueuePool

from app.config import settings

logger = logging.getLogger(__name__)


# =========================================
# PRODUCT DATABASE ENGINE
# =========================================

# Use product database URL if available, otherwise fall back to main database
# This allows gradual migration - start with same DB, then split later
_product_db_url = settings.PRODUCT_DATABASE_URL or settings.DATABASE_URL

if not _product_db_url:
    logger.warning("No database URL configured for product catalog")
    product_engine = None
    ProductSessionLocal = None
else:
    if _product_db_url.startswith("sqlite"):
        product_engine = create_engine(
            _product_db_url,
            connect_args={"check_same_thread": False},
        )
    else:
        product_engine = create_engine(
            _product_db_url,
            poolclass=QueuePool,
            pool_pre_ping=True,
            pool_size=settings.PRODUCT_DB_POOL_SIZE,
            max_overflow=settings.PRODUCT_DB_MAX_OVERFLOW,
            pool_timeout=settings.PRODUCT_DB_POOL_TIMEOUT,
            pool_recycle=settings.PRODUCT_DB_POOL_RECYCLE,
        )
    
    # Session factory for product database
    ProductSessionLocal = sessionmaker(
        autocommit=False, 
        autoflush=False, 
        bind=product_engine
    )
    
    # Log which database we're using
    if settings.PRODUCT_DATABASE_URL:
        logger.info("Product catalog using SEPARATE database")
    else:
        logger.info("Product catalog using MAIN database (PRODUCT_DATABASE_URL not set)")


# =========================================
# PRODUCT DATABASE BASE CLASS
# =========================================

class ProductBase(DeclarativeBase):
    """
    Base class for all product catalog models.
    
    Use this instead of Base for models that belong in the product database:
    - CatalogProduct
    - CatalogIngredient
    - CatalogBrand
    - CatalogProductIngredient
    - CatalogProductImage
    - CatalogImportJob
    """
    pass


# =========================================
# DEPENDENCY INJECTION
# =========================================

def get_product_db() -> Generator[Session, None, None]:
    """
    Database session dependency for product catalog endpoints.
    
    Usage in FastAPI endpoints:
        @router.get("/products")
        def get_products(db: Session = Depends(get_product_db)):
            ...
    """
    if ProductSessionLocal is None:
        raise RuntimeError("Product database not configured")
    
    db = ProductSessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================
# HEALTH CHECK
# =========================================

async def check_product_database_health() -> dict:
    """
    Check product database connectivity and return status.
    
    Returns:
        dict with status, latency_ms, and error (if any)
    """
    import time
    
    if product_engine is None:
        return {
            "status": "not_configured",
            "latency_ms": 0,
            "error": "PRODUCT_DATABASE_URL not set"
        }
    
    try:
        start = time.time()
        with product_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency = int((time.time() - start) * 1000)
        
        return {
            "status": "ok" if latency < 500 else "slow",
            "latency_ms": latency,
            "is_separate_db": bool(settings.PRODUCT_DATABASE_URL)
        }
    except Exception as e:
        return {
            "status": "error",
            "latency_ms": 0,
            "error": str(e)[:100]
        }


# =========================================
# TABLE CREATION
# =========================================

def create_product_tables():
    """
    Create all product catalog tables in the product database.
    
    Called during application startup.
    """
    if product_engine is None:
        logger.warning("Cannot create product tables: database not configured")
        return
    
    logger.info("Creating product catalog tables...")
    ProductBase.metadata.create_all(bind=product_engine)
    logger.info("✅ Product catalog tables created")


def drop_product_tables():
    """
    Drop all product catalog tables. USE WITH CAUTION.
    
    Only for testing/development.
    """
    if product_engine is None:
        return
    
    logger.warning("⚠️ Dropping all product catalog tables!")
    ProductBase.metadata.drop_all(bind=product_engine)
