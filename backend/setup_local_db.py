"""
Setup Local SQLite Database with Test Data
Quick setup for local development
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.database_sqlite import engine, Base
from app.models.user import User, UserProfile
from app.core.security import hash_password
from sqlalchemy.orm import Session
from app.database_sqlite import SessionLocal

print("=" * 80)
print("  Setting Up Local SQLite Database")
print("=" * 80)
print()

# Create all tables
print("[*] Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created successfully!")
except Exception as e:
    print(f"[ERROR] Error creating tables: {e}")
    sys.exit(1)

print()

# Create test user
print("[*] Creating test user...")
db: Session = SessionLocal()

try:
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == "himanshu@test.com").first()
    
    if existing_user:
        print("[INFO] User himanshu@test.com already exists")
        print(f"   ID: {existing_user.id}")
        print(f"   Name: {existing_user.full_name}")
        print(f"   Verified: {existing_user.is_verified}")
    else:
        # Create new user
        test_user = User(
            email="himanshu@test.com",
            full_name="Himanshu Patel",
            hashed_password=hash_password("Test1234!"),
            is_active=True,
            is_verified=True,  # Auto-verify for testing
            is_admin=False
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("[OK] Test user created successfully!")
        print(f"   Email: {test_user.email}")
        print(f"   Password: Test1234!")
        print(f"   ID: {test_user.id}")
        
        # Create user profile
        profile = UserProfile(
            user_id=test_user.id,
            skin_type="combination",
            skin_concerns=["acne", "dark_spots"]
        )
        db.add(profile)
        db.commit()
        print("[OK] User profile created!")
    
    # Count total users
    total_users = db.query(User).count()
    print()
    print(f"[INFO] Total users in database: {total_users}")
    
except Exception as e:
    print(f"[ERROR] Error creating user: {e}")
    db.rollback()
finally:
    db.close()

print()
print("=" * 80)
print("  Setup Complete!")
print("=" * 80)
print()
print("[OK] Local database ready!")
print()
print("[INFO] Test Credentials:")
print("   Email: himanshu@test.com")
print("   Password: Test1234!")
print()
print("[INFO] Start backend with:")
print("   cd backend")
print("   .\\venv\\Scripts\\Activate.ps1")
print("   python run_local.py")
print()
