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

def verify_test_user():
    """Verify and update the test user account."""
    db = SessionLocal()
    try:
        email = "himanshu@test.com"
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User {email} not found. Creating...")
            hashed_password = auth_service.hash_password("Test1234!")
            user = User(
                email=email,
                hashed_password=hashed_password,
                full_name="Himanshu Patel",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created and verified test user: {email}")
        else:
            needs_update = False
            if not user.is_verified:
                user.is_verified = True
                needs_update = True
                print(f"✅ Verified user: {email}")
            if not user.is_active:
                user.is_active = True
                needs_update = True
                print(f"✅ Activated user: {email}")
            # Update password if it doesn't match
            if not auth_service.verify_password(user.hashed_password, "Test1234!"):
                user.hashed_password = auth_service.hash_password("Test1234!")
                needs_update = True
                print(f"✅ Reset password for user: {email}")
            if needs_update:
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"✅ Updated test user: {email}")
            else:
                print(f"✅ Test user {email} is already verified and active")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    verify_test_user()
