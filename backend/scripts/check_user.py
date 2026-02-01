#!/usr/bin/env python3
"""
Check if himanshu@test.com exists in the database and report status.
Run with DATABASE_URL set (from Railway dashboard).

Usage:
  set DATABASE_URL=postgresql://...
  python scripts/check_user.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    try:
        from app.database import SessionLocal
        from app.models.user import User
        from app.services.auth_service import auth_service
    except Exception as e:
        print(f"❌ Could not load app: {e}")
        print("   Set DATABASE_URL from Railway (PostgreSQL → Variables)")
        sys.exit(1)

    email = "himanshu@test.com"
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERROR] User '{email}' NOT FOUND in database.")
            print("   Run: python scripts/verify_test_user.py")
            print("   This will create the user with password: Test1234!")
            sys.exit(1)

        pw_ok = auth_service.verify_password(user.hashed_password, "Test1234!")
        print(f"User: {email}")
        print(f"  id: {user.id}")
        print(f"  is_verified: {user.is_verified}")
        print(f"  is_active: {user.is_active}")
        print(f"  is_admin: {getattr(user, 'is_admin', '?')}")
        print(f"  password 'Test1234!' valid: {pw_ok}")

        if not user.is_verified:
            print("\n⚠️  is_verified=false → Login will fail with 'Email not verified'")
            print("   Run: python scripts/verify_test_user.py")
        if not user.is_active:
            print("\n[WARN] is_active=false -> Login will fail")
            print("   Run: python scripts/verify_test_user.py")
        if not pw_ok:
            print("\n⚠️  Password doesn't match Test1234! → Login will fail")
            print("   Run: python scripts/verify_test_user.py")

        if user.is_verified and user.is_active and pw_ok:
            print("\n[OK] User looks OK. Try logging in with password: Test1234!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
