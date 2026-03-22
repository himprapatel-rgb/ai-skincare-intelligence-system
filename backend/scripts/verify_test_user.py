#!/usr/bin/env python3
"""
Quick script to verify the test user account.
Run this to fix authentication issues with the test account.
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import auth_service

TEST_ACCOUNTS = [
    ("himanshu@test.com", "Test1234!", "Himanshu Patel"),
    ("himprapatel@gmail.com", "Test1234!", "Himanshu Patel"),
]


def verify_test_user():
    """Verify and update test user accounts."""
    db = SessionLocal()
    try:
        for email, password, full_name in TEST_ACCOUNTS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"Creating test user: {email}")
                hashed_password = auth_service.hash_password(password)
                user = User(
                    email=email,
                    hashed_password=hashed_password,
                    full_name=full_name,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  Created and verified: {email}")
            else:
                needs_update = False
                if not user.is_verified:
                    user.is_verified = True
                    needs_update = True
                if not user.is_active:
                    user.is_active = True
                    needs_update = True
                if not auth_service.verify_password(user.hashed_password, password):
                    user.hashed_password = auth_service.hash_password(password)
                    needs_update = True
                if needs_update:
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    print(f"  Updated: {email}")
                else:
                    print(f"  OK: {email}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    verify_test_user()
