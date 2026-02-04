#!/usr/bin/env python3
"""
Diagnose login: check backend health, database, and test login.
Run from repo root. Set API_URL for remote backend; set DATABASE_URL for local DB check.

  # Check production backend + test login
  set API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
  python backend/scripts/diagnose_login.py

  # Check local DB (backend .env must have DATABASE_URL)
  cd backend && set DATABASE_URL=... && python scripts/diagnose_login.py
"""
import json
import os
import sys

# Default to production API if nothing set
API_BASE = os.getenv("API_URL", "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1")
TEST_EMAIL = "himanshu@test.com"
TEST_PASSWORD = "Test1234!"


def check_health():
    """GET /api/health and print status."""
    try:
        import urllib.request
        from urllib.parse import urlparse, urlunparse
        parsed = list(urlparse(API_BASE))
        # Replace path with /api/health (same host/port)
        parsed[2] = "/api/health"
        health_url = urlunparse(parsed)
        req = urllib.request.Request(
            health_url,
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"[FAIL] Backend health check failed: {e}")
        return False
    status = data.get("status", "unknown")
    checks = data.get("checks", {})
    main_db = checks.get("main_database", {})
    print(f"Backend health: {status}")
    print(f"  Main DB: {main_db.get('status', '?')} (latency: {main_db.get('latency_ms', 0)}ms)")
    if main_db.get("error"):
        print(f"  DB error: {main_db['error']}")
    if status != "healthy" and status != "degraded":
        print(f"  Full: {json.dumps(data, indent=2)[:500]}")
    return main_db.get("status") == "ok"


def test_login():
    """POST /auth/login with test user."""
    try:
        import urllib.request
        payload = json.dumps({"email": TEST_EMAIL, "password": TEST_PASSWORD}).encode()
        req = urllib.request.Request(
            API_BASE.rstrip("/") + "/auth/login",
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            err = json.loads(body)
            detail = err.get("detail", body)
        except Exception:
            detail = body or str(e)
        print(f"[FAIL] Login failed: HTTP {e.code} - {detail}")
        return False
    except Exception as e:
        print(f"[FAIL] Login request failed: {e}")
        return False
    if data.get("token") and data.get("user"):
        print(f"[OK] Login OK: {data['user'].get('email')}")
        return True
    print(f"[FAIL] Unexpected response: {data}")
    return False


def check_local_db():
    """If DATABASE_URL is set, check DB and test user locally."""
    if not os.getenv("DATABASE_URL"):
        return
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    os.chdir(backend_dir)
    try:
        from app.database import SessionLocal
        from app.models.user import User
        from app.services.auth_service import auth_service
    except Exception as e:
        print(f"[FAIL] Local DB: could not load app: {e}")
        print("   Set DATABASE_URL (e.g. from Railway → PostgreSQL → Variables)")
        return
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == TEST_EMAIL).first()
        if not user:
            print(f"[FAIL] Local DB: user '{TEST_EMAIL}' not found. Run: python scripts/verify_test_user.py")
            return
        pw_ok = auth_service.verify_password(user.hashed_password, TEST_PASSWORD)
        print(f"Local DB: user {TEST_EMAIL} found, is_verified={user.is_verified}, is_active={user.is_active}, password_ok={pw_ok}")
        if not user.is_verified or not user.is_active or not pw_ok:
            print("   Fix: python scripts/verify_test_user.py")
    finally:
        db.close()


def main():
    print("=== Login diagnostic ===\n")
    print(f"API base: {API_BASE}\n")
    check_local_db()
    print()
    if check_health():
        test_login()
    print("\nDone.")


if __name__ == "__main__":
    main()
