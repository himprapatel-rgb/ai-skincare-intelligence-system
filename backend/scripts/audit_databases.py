#!/usr/bin/env python3
"""
Audit both main and product databases: list all tables, row counts, and explain empty tables.

Usage:
  # Requires DATABASE_URL and optionally PRODUCT_DATABASE_URL
  cd backend
  python scripts/audit_databases.py

  # Or with env:
  set DATABASE_URL=postgresql://...
  set PRODUCT_DATABASE_URL=postgresql://...
  python scripts/audit_databases.py
"""

import os
import sys
from collections.abc import Generator
from typing import Any

# Defer imports that need DATABASE_URL
def _get_engines():
    from sqlalchemy import create_engine, text
    from app.config import settings
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is not configured.")
    main_engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    product_url = settings.PRODUCT_DATABASE_URL or settings.DATABASE_URL
    product_engine = create_engine(product_url, pool_pre_ping=True)
    return main_engine, product_engine


# Expected empty / low-count tables and why
EXPECTATIONS = {
    # Main DB tables
    "users": ("Has rows", "User accounts. Empty = no sign-ups."),
    "user_profiles": ("May be empty", "Created on onboarding. Empty = users skipped onboarding or use baseline only."),
    "user_consents": ("May be empty", "GDPR consent. Populated when user accepts terms."),
    "policy_versions": ("Has rows", "Terms/Privacy versions. Seeded at startup."),
    "scan_sessions": ("May be empty", "Face scans. Empty = no scans yet."),
    "skin_analyses": ("May be empty", "AI analysis results. Populated per scan."),
    "scan_outputs": ("May be empty", "Detailed scan output. Populated per scan."),
    "skin_conditions": ("May be empty", "Condition labels from analysis."),
    "scan_conditions": ("May be empty", "Per-scan conditions."),
    "scan_recommendations": ("May be empty", "Per-scan recommendations."),
    "product_recommendations": ("May be empty", "Product recs from analysis."),
    "shelf_products": ("May be empty", "My Shelf. Empty = no products saved."),
    "skin_goals": ("May be empty", "User skin goals."),
    "user_favorites": ("May be empty", "Favorited products."),
    "notifications": ("May be empty", "User notifications."),
    "notification_settings": ("May be empty", "Per-user notification prefs."),
    "saved_routines": ("May be empty", "Saved AM/PM routines."),
    "routine_products": ("May be empty", "Products in routines."),
    "progress_photos": ("May be empty", "Progress tracking photos."),
    "skin_state_snapshots": ("May be empty", "Digital Twin snapshots."),
    "skin_region_states": ("May be empty", "Per-region twin data."),
    "environment_snapshots": ("May be empty", "Environmental context."),
    "routine_instances": ("May be empty", "Routine check-ins."),
    "routine_product_usage": ("May be empty", "Product usage in routines."),
    "blogs": ("May be empty", "Admin content. Empty = no blogs added."),
    "videos": ("May be empty", "Admin content. Empty = no videos."),
    "news_items": ("May be empty", "Admin content. Empty = no news."),
    "consent_logs": ("May be empty", "GDPR audit log."),
    "product_scan_sessions": ("May be empty", "Product scanner sessions."),
    "product_scan_items": ("May be empty", "Scanned products."),
    "scin_samples": ("May be empty", "SCIN dataset. For ML training."),
    "ingredients": ("May be empty", "Legacy main-DB ingredients."),
    "products": ("May be empty", "Legacy main-DB products."),
    "product_ingredients": ("May be empty", "Legacy product-ingredient links."),
    "product_reviews": ("May be empty", "Product reviews."),
    # Product DB tables
    "catalog_products": ("May be empty", "Product catalog. Empty = not seeded. Run import_obf_catalog.py."),
    "catalog_ingredients": ("May be empty", "Catalog ingredients. Seeded with products."),
    "catalog_product_ingredients": ("May be empty", "Product-ingredient links."),
    "catalog_product_images": ("May be empty", "Product images."),
    "catalog_brands": ("May be empty", "Brands. Seeded with products."),
    "catalog_import_jobs": ("May be empty", "Import job history."),
}


def get_table_counts(engine, schema: str = "public") -> Generator[tuple[str, int], None, None]:
    """Yield (table_name, row_count) for all tables in schema."""
    from sqlalchemy import text
    with engine.connect() as conn:
        if engine.url.get_backend_name() == "postgresql":
            r = conn.execute(text("""
                SELECT tablename FROM pg_tables
                WHERE schemaname = :schema
                ORDER BY tablename
            """), {"schema": schema})
            tables = [row[0] for row in r]
        else:
            r = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            ))
            tables = [row[0] for row in r]
        for t in tables:
            try:
                r2 = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
                count = r2.scalar() or 0
            except Exception:
                count = -1
            yield t, count


def audit_db(engine, label: str, is_product: bool) -> dict[str, Any]:
    """Audit one database. Return summary dict."""
    counts = dict(get_table_counts(engine))
    empty = [t for t, c in counts.items() if c == 0]
    unknown = [t for t, c in counts.items() if c < 0]
    total_rows = sum(c for c in counts.values() if c > 0)
    return {
        "label": label,
        "is_product": is_product,
        "counts": counts,
        "empty": empty,
        "unknown": unknown,
        "total_tables": len(counts),
        "empty_count": len(empty),
        "total_rows": total_rows,
    }


def main() -> int:
    try:
        main_engine, product_engine = _get_engines()
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        print("Set DATABASE_URL (and optionally PRODUCT_DATABASE_URL) from Railway.", file=sys.stderr)
        return 1

    from app.config import settings
    separate_product = bool(settings.PRODUCT_DATABASE_URL)

    print("=" * 60)
    print("DATABASE AUDIT - Main DB & Product Catalog")
    print("=" * 60)

    # Main DB
    main_audit = audit_db(main_engine, "Main Database", False)
    print(f"\n--- {main_audit['label']} ---")
    print(f"Tables: {main_audit['total_tables']}, Empty: {main_audit['empty_count']}, Total rows: {main_audit['total_rows']}")
    for t in sorted(main_audit["counts"].keys()):
        c = main_audit["counts"][t]
        exp = EXPECTATIONS.get(t, ("?", "Unknown"))
        status = "EMPTY" if c == 0 else str(c)
        print(f"  {t}: {status}  ({exp[1]})")
    if main_audit["empty"]:
        print("\nEmpty tables in main DB:")
        for t in sorted(main_audit["empty"]):
            exp = EXPECTATIONS.get(t, ("?", "Unknown"))
            print(f"  - {t}: {exp[1]}")

    # Product DB (if separate)
    if separate_product:
        prod_audit = audit_db(product_engine, "Product Catalog DB", True)
        print(f"\n--- {prod_audit['label']} ---")
        print(f"Tables: {prod_audit['total_tables']}, Empty: {prod_audit['empty_count']}, Total rows: {prod_audit['total_rows']}")
        for t in sorted(prod_audit["counts"].keys()):
            c = prod_audit["counts"][t]
            exp = EXPECTATIONS.get(t, ("?", "Unknown"))
            status = "EMPTY" if c == 0 else str(c)
            print(f"  {t}: {status}  ({exp[1]})")
    else:
        print("\n(Product catalog uses same DB as main - catalog_* tables above)")

    # Profile picture check
    print("\n" + "=" * 60)
    print("PROFILE PICTURE (profile_photo_url) CHECK")
    print("=" * 60)
    from app.database import SessionLocal
    from app.models.user import UserProfile
    db = SessionLocal()
    try:
        with_photo = db.query(UserProfile).filter(UserProfile.profile_photo_url.isnot(None), UserProfile.profile_photo_url != "").count()
        total_profiles = db.query(UserProfile).count()
        print(f"User profiles: {total_profiles}")
        print(f"Profiles with photo URL: {with_photo}")
        if total_profiles > 0 and with_photo == 0:
            print("  -> No profiles have profile_photo_url set. Frontend may not be saving to API.")
    finally:
        db.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
