#!/usr/bin/env python3
"""
Verify that all tables used by the web app exist and are reachable.

Usage:
  # With DATABASE_URL set (from Railway):
  cd backend
  set DATABASE_URL=postgresql://...
  python scripts/verify_database_tables.py

  # Or via Railway CLI / direct connection
"""

import os
import sys


def main() -> int:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: Set DATABASE_URL (e.g. from Railway PostgreSQL Variables)")
        return 1

    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        print("ERROR: Install sqlalchemy: pip install sqlalchemy psycopg2-binary")
        return 1

    engine = create_engine(db_url)
    product_url = os.environ.get("PRODUCT_DATABASE_URL") or db_url
    product_engine = create_engine(product_url) if product_url else None

    main_tables = [
        ("users", "User accounts"),
        ("user_profiles", "Profile data (onboarding, baseline)"),
        ("user_consents", "GDPR consent records"),
        ("policy_versions", "Terms/privacy versions"),
        ("scan_sessions", "Skin scan sessions"),
        ("skin_analyses", "Scan analysis results"),
        ("shelf_products", "User product shelf"),
        ("user_favorites", "Favorite products"),
        ("skin_goals", "Skin goals"),
        ("saved_routines", "Saved skincare routines"),
        ("routine_products", "Products in routines"),
        ("notifications", "User notifications"),
        ("blogs", "Blog posts (admin)"),
        ("videos", "Video tutorials (admin)"),
        ("news_items", "News items (admin)"),
    ]

    product_tables = [
        ("products", "Products (legacy)"),
        ("product_reviews", "Product reviews"),
        ("ingredients", "Ingredients"),
    ]
    catalog_tables = [
        ("catalog_products", "Catalog products"),
        ("catalog_ingredients", "Catalog ingredients"),
    ]

    ok = True
    with engine.connect() as conn:
        for table, desc in main_tables:
            try:
                r = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = r.scalar()
                print(f"[OK] {table}: {count} rows - {desc}")
            except Exception as e:
                print(f"[FAIL] {table}: {e}")
                ok = False

    print("\n--- Product / catalog tables ---")
    engines = [("main", engine)]
    if product_engine and product_url != db_url:
        engines.append(("product", product_engine))
    for table, desc in product_tables + catalog_tables:
        found = False
        for label, eng in engines:
            try:
                with eng.connect() as c:
                    r = c.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = r.scalar()
                    print(f"[OK] {table}: {count} rows ({label}) - {desc}")
                    found = True
                    break
            except Exception:
                pass
        if not found:
            print(f"[SKIP] {table}: not found or error - {desc}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
