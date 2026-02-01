#!/usr/bin/env python3
"""
Promote a user to admin. Sets is_admin=true in the database.

Admin access requires BOTH:
  1. is_admin=true in the database (this script)
  2. ADMIN_EMAIL_ALLOWLIST env var in Railway (user's email must be listed)

Usage:
  # Set DATABASE_URL from Railway dashboard, then:
  python scripts/promote_admin.py user@example.com

  # Or with explicit URL:
  DATABASE_URL=postgresql://... python scripts/promote_admin.py user@example.com
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def promote_all_users() -> bool:
    """Set is_admin=true for ALL users. For testing only."""
    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("❌ No users found in database.")
            return False

        promoted = 0
        for user in users:
            if not user.is_admin:
                user.is_admin = True
                db.add(user)
                promoted += 1

        db.commit()
        print(f"✅ Promoted all {len(users)} user(s) to admin ({promoted} updated).")
        print("   For testing only. Add their emails to ADMIN_EMAIL_ALLOWLIST in Railway.")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def promote_admin(email: str) -> bool:
    """Set is_admin=true for the user with the given email."""
    if not email or "@" not in email:
        print("❌ Provide a valid email address.")
        return False

    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(email.strip())).first()
        if not user:
            print(f"❌ User not found: {email}")
            print("   Register first by signing in with Google or creating an account.")
            return False

        if user.is_admin:
            print(f"✅ {email} is already an admin.")
            return True

        user.is_admin = True
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Promoted {email} to admin.")
        print("   Remember: also add this email to ADMIN_EMAIL_ALLOWLIST in Railway.")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Promote a user to admin (sets is_admin=true in database)"
    )
    parser.add_argument("email", nargs="?", help="User email address (e.g. you@example.com)")
    parser.add_argument("--all", action="store_true", help="Promote ALL users to admin (for testing)")
    args = parser.parse_args()

    if args.all:
        success = promote_all_users()
    elif args.email:
        success = promote_admin(args.email)
    else:
        parser.print_help()
        sys.exit(1)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
