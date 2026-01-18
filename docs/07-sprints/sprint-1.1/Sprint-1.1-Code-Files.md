# 🚀 SPRINT 1.1: ONE-COMMAND BUILD SCRIPT

**Build Your Complete Backend in 5 Minutes**

This script creates ALL files for Sprint 1.1 User Registration.

---

## ⚡ QUICK START (Copy & Run)

```bash
# Navigate to your repository
cd ai-skincare-intelligence-system

# Run this ONE command to build everything:
curl -sS https://raw.githubusercontent.com/himprapatel-rgb/ai-skincare-intelligence-system/main/docs/SPRINT-1.1-CODE-FILES.md | bash
```

**OR manually follow the steps below:**

---

## 📦 STEP 1: Create Backend Structure

```bash
# Create all backend directories
mkdir -p backend/app/{models,schemas,services,api/v1/endpoints,tests}
mkdir -p backend/alembic/versions

# Create __init__.py files
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/services/__init__.py  
touch backend/app/api/__init__.py
touch backend/app/api/v1/__init__.py
touch backend/app/api/v1/endpoints/__init__.py
touch backend/app/tests/__init__.py
```

---

## 📝 STEP 2: Create Backend Files

### File: `backend/app/models/user.py`

```bash
cat > backend/app/models/user.py << 'EOF'
"""
User database model.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    """User model for authentication and profile management."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(email='{self.email}', full_name='{self.full_name}')>"
EOF
```

### File: `backend/app/models/__init__.py`

```bash
cat > backend/app/models/__init__.py << 'EOF'
from app.models.user import User

__all__ = ["User"]
EOF
```

### File: `backend/app/schemas/user.py`

```bash
cat > backend/app/schemas/user.py << 'EOF'
"""
Pydantic schemas for user data validation.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re


class UserCreate(BaseModel):
    """Schema for user registration."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., 
        min_length=8,
        description="Password (min 8 chars, 1 uppercase, 1 digit, 1 special)"
    )
    full_name: Optional[str] = Field(None, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "full_name": "John Doe"
            }
        }


class UserResponse(BaseModel):
    """Schema for user response (excluding password)."""
    
    id: int
    public_id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
EOF
```

### File: `backend/app/schemas/__init__.py`

```bash
cat > backend/app/schemas/__init__.py << 'EOF'
from app.schemas.user import UserCreate, UserResponse

__all__ = ["UserCreate", "UserResponse"]
EOF
```

### File: `backend/app/services/auth_service.py`

```bash
cat > backend/app/services/auth_service.py << 'EOF'
"""
Authentication service with password hashing.
"""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self):
        self.ph = PasswordHasher()
    
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2id."""
        return self.ph.hash(password)
    
    def verify_password(self, hashed: str, password: str) -> bool:
        """Verify password against hash."""
        try:
            self.ph.verify(hashed, password)
            return True
        except VerifyMismatchError:
            return False
    
    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = self.hash_password(user_data.password)
        
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    def get_user_by_email(self, db: Session, email: str) -> User | None:
        """Get user by email address."""
        return db.query(User).filter(User.email == email).first()


# Create service instance
auth_service = AuthService()
EOF
```

### File: `backend/app/api/v1/endpoints/auth.py`

```bash
cat > backend/app/api/v1/endpoints/auth.py << 'EOF'
"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service
from sqlalchemy.exc import IntegrityError

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password"
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    
    # Check if user already exists
    existing_user = auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create new user
        new_user = auth_service.create_user(db, user_data)
        return new_user
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration failed"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
EOF
```

### File: `backend/app/api/v1/__init__.py`

```bash
cat > backend/app/api/v1/__init__.py << 'EOF'
from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)
EOF
```

### File: `backend/app/main.py`

```bash
cat > backend/app/main.py << 'EOF'
"""
Main FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered skincare intelligence system",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to AI Skincare Intelligence System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
EOF
```

### File: `backend/requirements.txt`

```bash
cat > backend/requirements.txt << 'EOF'
# FastAPI and server
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1

# Authentication and security
argon2-cffi==23.1.0
python-jose[cryptography]==3.3.0
python-multipart==0.0.6

# Pydantic
pydantic==2.5.0
pydantic-settings==2.1.0
email-validator==2.1.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2

# Development
python-dotenv==1.0.0
EOF
```

### File: `backend/.env.example`

```bash
cat > backend/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/skincare_db
# For Neon (cloud PostgreSQL):
# DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
APP_NAME=AI Skincare Intelligence System
APP_VERSION=1.0.0
DEBUG=True

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8081
EOF
```

---

## 🧪 STEP 3: Create Test Files

### File: `backend/app/tests/test_auth.py`

```bash
cat > backend/app/tests/test_auth.py << 'EOF'
"""
Tests for authentication endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register_user_success():
    """Test successful user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "TestPass123!",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email():
    """Test registration with duplicate email."""
    # Register first user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "TestPass123!"
        }
    )
    
    # Try to register with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "AnotherPass123!"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_weak_password():
    """Test registration with weak password."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.com",
            "password": "weak"
        }
    )
    assert response.status_code == 422


def test_register_invalid_email():
    """Test registration with invalid email format."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "TestPass123!"
        }
    )
    assert response.status_code == 422
EOF
```

### File: `backend/pytest.ini`

```bash
cat > backend/pytest.ini << 'EOF'
[pytest]
pythonpath = .
testpaths = app/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
EOF
```

---

## ⚙️ STEP 4: Setup & Run

### 4a. Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4b. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Generate secret key
SECRET=$(openssl rand -hex 32)

# Update .env file (macOS/Linux)
sed -i '' "s/your-secret-key-here-change-this-in-production/$SECRET/" .env

# Or manually edit .env and add your database URL
# For Neon: DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 4c. Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest app/tests/test_auth.py::test_register_user_success -v
```

### 4d. Start Development Server

```bash
# Run FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Server will be available at:
# - API: http://localhost:8000
# - Docs: http://localhost:8000/docs
# - Health: http://localhost:8000/health
```

---

## ✅ STEP 5: Verify Implementation

### Test Registration Endpoint

```bash
# Test user registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }'

# Expected response: 201 Created with user data
```

### Check API Documentation

```bash
# Open in browser:
open http://localhost:8000/docs

# You'll see:
# - Interactive API documentation
# - All endpoints with request/response schemas
# - "Try it out" functionality
```

---

## 🚀 SUCCESS CRITERIA

You've successfully built Sprint 1.1 when:

- ✅ All tests pass (`pytest`)
- ✅ Server starts without errors
- ✅ Can register new user via `/api/v1/auth/register`
- ✅ Duplicate email returns 400 error
- ✅ Weak passwords are rejected
- ✅ Password is hashed with Argon2id
- ✅ API docs accessible at `/docs`

---

## 📚 NEXT STEPS

After Sprint 1.1 is working:

1. **Sprint 1.2**: User Login with JWT tokens
2. **Sprint 1.3**: Password Reset flow
3. **Sprint 1.4**: Email verification
4. **Sprint 1.5**: OAuth integration (Google/Apple)

---

## 🔧 TROUBLESHOOTING

### Database Connection Issues

```bash
# If using Neon (recommended):
# 1. Sign up at https://neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Update DATABASE_URL in .env

# If using local PostgreSQL:
# 1. Install PostgreSQL
# 2. Create database: createdb skincare_db
# 3. Update DATABASE_URL in .env
```

### Import Errors

```bash
# Ensure you're in backend directory
cd backend

# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use

```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Or kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

---

## 🎯 QUICK COMMAND SUMMARY

```bash
# ONE-TIME SETUP
cd ai-skincare-intelligence-system
mkdir -p backend/app/{models,schemas,services,api/v1/endpoints,tests}
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL

# RUN TESTS
pytest

# START SERVER
uvicorn app.main:app --reload

# TEST ENDPOINT
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","full_name":"Test User"}'
```

---

**🎉 YOU'RE READY TO BUILD! Copy the commands above and start implementing Sprint 1.1.**
