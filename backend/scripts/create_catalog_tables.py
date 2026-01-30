#!/usr/bin/env python3
"""
Create product catalog tables in the product database.

Use when the product DB is empty (no tables). The backend also creates these
on startup; run this if the deployed backend is an older build or startup failed.

Usage:
  # Set PRODUCT_DATABASE_URL to your product DB (e.g. Postgres-rvCO on Railway)
  export PRODUCT_DATABASE_URL="postgresql://..."
  cd backend
  python scripts/create_catalog_tables.py

  # Or use main DB for catalog (single-DB setup)
  export DATABASE_URL="postgresql://..."
  python scripts/create_catalog_tables.py
"""
import os
import sys

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Add backend app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Must set env before importing app (app reads settings at import time)
if not os.getenv("PRODUCT_DATABASE_URL") and not os.getenv("DATABASE_URL"):
    print("Error: Set PRODUCT_DATABASE_URL or DATABASE_URL", file=sys.stderr)
    sys.exit(1)


def main():
    # Import catalog models so they register with ProductBase.metadata
    from app.models import catalog_models  # noqa: F401
    from app.product_database import create_product_tables, product_engine

    if product_engine is None:
        print("Error: Product database not configured (PRODUCT_DATABASE_URL or DATABASE_URL)", file=sys.stderr)
        sys.exit(1)

    print("Creating product catalog tables...")
    create_product_tables()
    print("Done. Catalog tables: catalog_products, catalog_ingredients, catalog_product_ingredients,")
    print("  catalog_product_images, catalog_brands, catalog_import_jobs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
