#!/usr/bin/env python3
"""
Verify that collected user data is actually stored in the database.

Usage (from backend directory):
  # Use app's DATABASE_URL (from .env or env)
  python scripts/verify_data_storage.py

  # Read-only: show current row counts and sample data
  python scripts/verify_data_storage.py

  # Write then read: insert sample rows, print what was stored, then remove them
  python scripts/verify_data_storage.py --write-test

Requires: DATABASE_URL set (or .env in backend/).
"""

import os
import sys
import uuid

# Run from backend so app is importable
_backend = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _backend not in sys.path:
    sys.path.insert(0, _backend)
os.chdir(_backend)


def _register_sqlite_compilers():
    """So SQLite can create tables that use JSONB/UUID (e.g. scan_metadata)."""
    from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
    from sqlalchemy.ext.compiler import compiles

    @compiles(JSONB, "sqlite")
    def _compile_jsonb_sqlite(_type, _compiler, **_kwargs):
        return "JSON"

    @compiles(ARRAY, "sqlite")
    def _compile_array_sqlite(_type, _compiler, **_kwargs):
        return "JSON"

    @compiles(UUID, "sqlite")
    def _compile_uuid_sqlite(_type, _compiler, **_kwargs):
        return "CHAR(36)"


def get_engine():
    from sqlalchemy import create_engine

    from app.config import settings
    url = settings.DATABASE_URL
    if not url:
        raise SystemExit("DATABASE_URL is not set. Set it or use a .env file in backend/.")
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def run_read_check(engine):
    """Query tables and print counts + samples to confirm data is stored."""
    from sqlalchemy import text
    from sqlalchemy.orm import Session

    print("=== Database storage check (read-only) ===\n")
    print(f"Database: {engine.url}\n")

    with Session(engine) as db:
        # Main tables we care about
        tables = [
            ("users", "User accounts (email, last_ip, last_geolocation)"),
            ("user_profiles", "Profile (skin type, concerns, etc.)"),
            ("user_consents", "Consent (terms/privacy accepted, IP)"),
            ("user_access_logs", "Access log (IP, geolocation per request)"),
            ("scan_sessions", "Scan sessions (scan_metadata = device_context + result)"),
            ("shelf_products", "Shelf products"),
            ("user_favorites", "Favorites"),
        ]
        for table, desc in tables:
            try:
                r = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = r.scalar()
                print(f"  {table}: {count} rows  -- {desc}")
            except Exception as e:
                print(f"  {table}: ERROR -- {e}")

        # Sample scan_metadata to show device_context / result are stored
        print("\n--- Scan sessions: scan_metadata sample ---")
        try:
            r = db.execute(text(
                "SELECT id, scan_metadata FROM scan_sessions ORDER BY created_at DESC LIMIT 1"
            ))
            row = r.fetchone()
            if row:
                sid, meta = row[0], row[1]
                print(f"  Latest scan id: {sid}")
                if meta:
                    if isinstance(meta, dict):
                        has_dc = "device_context" in meta
                        has_summary = "summary" in meta
                        has_recs = "recommendations" in meta
                        print(f"  device_context stored: {has_dc}")
                        print(f"  summary/result stored: {has_summary or has_recs}")
                        if has_dc and isinstance(meta.get("device_context"), dict):
                            dc = meta["device_context"]
                            print(f"  device_context keys: {list(dc.keys())}")
                    else:
                        print(f"  scan_metadata type: {type(meta).__name__}")
                else:
                    print("  scan_metadata: (empty)")
            else:
                print("  No scan_sessions rows yet.")
        except Exception as e:
            print(f"  Error: {e}")

        # Sample user last_* to show IP/geo stored
        print("\n--- Users: IP / geolocation sample ---")
        try:
            r = db.execute(text(
                "SELECT id, email, last_ip_address, last_geolocation FROM users LIMIT 1"
            ))
            row = r.fetchone()
            if row:
                uid, email, ip, geo = row[0], row[1], row[2], row[3]
                print(f"  User: {email}")
                print(f"  last_ip_address stored: {bool(ip)} ({ip or 'null'})")
                print(f"  last_geolocation stored: {bool(geo)}")
            else:
                print("  No users yet.")
        except Exception as e:
            print(f"  Error: {e}")

    print("\n=== End of storage check ===")


def run_write_test(engine):
    """Insert sample rows, read them back, then delete. Proves write -> DB -> read."""
    from sqlalchemy.orm import Session

    from app.core.security import hash_password
    from app.database import Base
    from app.models.favorites import UserFavorite
    from app.models.scan import ScanSession, ScanStatus
    from app.models.shelf import ShelfProduct
    from app.models.user import User, UserAccessLog, UserConsent, UserProfile

    # Ensure tables exist (e.g. fresh SQLite)
    _register_sqlite_compilers()
    import app.models  # noqa: F401 - register all models
    import app.models.favorites
    import app.models.shelf
    Base.metadata.create_all(bind=engine)

    print("=== Write-then-read test ===\n")
    created = {}

    with Session(engine) as db:
        try:
            # 1. User
            user = User(
                email="verify_storage_test@example.com",
                hashed_password=hash_password("temp"),
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.flush()
            created["user_id"] = user.id
            print(f"  Created user id={user.id}")

            # 2. Profile
            profile = UserProfile(
                user_id=user.id,
                skin_type="combination",
                primary_concern="test",
                secondary_concerns=["acne"],
            )
            db.add(profile)
            db.flush()
            created["profile_id"] = profile.id
            print(f"  Created user_profiles id={profile.id}")

            # 3. Consent
            consent = UserConsent(
                user_id=user.id,
                terms_accepted=True,
                privacy_accepted=True,
                terms_version="1.0",
                privacy_version="1.0",
                ip_address="127.0.0.1",
            )
            db.add(consent)
            db.flush()
            created["consent_id"] = consent.id
            print(f"  Created user_consents id={consent.id}")

            # 4. Access log
            log = UserAccessLog(user_id=user.id, ip_address="127.0.0.1", geolocation={"country": "Test"})
            db.add(log)
            db.flush()
            created["log_id"] = log.id
            user.last_ip_address = "127.0.0.1"
            user.last_geolocation = {"country": "Test"}
            print(f"  Created user_access_logs id={log.id}, updated user last_*")

            # 5. Scan with device_context + result in scan_metadata
            scan = ScanSession(
                user_id=user.id,
                status=ScanStatus.COMPLETED,
                scan_metadata={
                    "device_context": {
                        "screen": {"width": 390, "height": 844},
                        "locale": {"timezone": "UTC"},
                        "collectedAt": "2026-02-04T12:00:00Z",
                    },
                    "summary": {"overall_score": 80},
                    "recommendations": ["Test rec"],
                },
            )
            db.add(scan)
            db.flush()
            created["scan_id"] = str(scan.id)
            print(f"  Created scan_sessions id={scan.id} (device_context + result in scan_metadata)")

            # 6. Shelf
            shelf = ShelfProduct(
                user_id=user.id,
                product_name="Verify Storage Product",
                product_brand="Test",
                product_category="serum",
                status="active",
            )
            db.add(shelf)
            db.flush()
            created["shelf_id"] = shelf.id
            print(f"  Created shelf_products id={shelf.id}")

            # 7. Favorite
            fav = UserFavorite(
                user_id=user.id,
                product_name="Verify Storage Fav",
                product_brand="Test",
            )
            db.add(fav)
            db.flush()
            created["fav_id"] = fav.id
            print(f"  Created user_favorites id={fav.id}")

            db.commit()
            print("\n  Committed. Reading back...")

            # Read back
            db.refresh(profile)
            db.refresh(scan)
            assert profile.skin_type == "combination"
            assert scan.scan_metadata and "device_context" in scan.scan_metadata
            assert scan.scan_metadata.get("summary", {}).get("overall_score") == 80
            print("  Read back: user_profiles.skin_type, scan_sessions.scan_metadata (device_context + summary) OK")

            # Cleanup
            db.delete(fav)
            db.delete(shelf)
            db.delete(scan)
            db.delete(log)
            db.delete(consent)
            db.delete(profile)
            db.delete(user)
            db.commit()
            print("  Cleaned up verification rows.\n=== Write-test passed: data is stored in DB ===")

        except Exception as e:
            db.rollback()
            print(f"\n  FAILED: {e}")
            raise


def main():
    import argparse
    p = argparse.ArgumentParser(description="Verify user data is stored in the database")
    p.add_argument("--write-test", action="store_true", help="Insert sample rows, read back, then delete")
    args = p.parse_args()
    engine = get_engine()
    if args.write_test:
        run_write_test(engine)
    else:
        run_read_check(engine)


if __name__ == "__main__":
    main()
