# Backend Developer Guide

> Complete guide to the FastAPI backend of the AI Skincare Intelligence System

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Database Models](#database-models)
6. [Services](#services)
7. [Authentication](#authentication)
8. [Adding New Features](#adding-new-features)
9. [Testing](#testing)
10. [Common Tasks](#common-tasks)

---

## Overview

The backend is a **FastAPI** application providing RESTful APIs for:
- User authentication (email/password + Google OAuth)
- Skin photo analysis with AI
- Digital twin data management
- Product and routine recommendations
- Notifications and reminders

### Tech Stack

- **Python 3.11+**
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **PostgreSQL** - Database
- **Argon2** - Password hashing
- **JWT** - Authentication tokens
- **OpenAI API** - Vision analysis

---

## Getting Started

### Prerequisites

```bash
python --version  # 3.11+
pip --version
```

### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Run database migrations
python scripts/run_migrations.py

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Verify Installation

```bash
# Health check
curl http://localhost:8000/api/health

# API documentation
open http://localhost:8000/api/docs
```

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/           # Route handlers
│   │       │   ├── __init__.py
│   │       │   ├── auth.py          # Authentication endpoints
│   │       │   ├── scan.py          # Skin analysis endpoints
│   │       │   ├── recommendations.py
│   │       │   ├── products.py
│   │       │   └── internal.py      # Admin/internal endpoints
│   │       └── router.py            # Router aggregation
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py              # Model exports
│   │   ├── user.py                  # User model
│   │   ├── scan.py                  # Scan models
│   │   ├── digital_twin.py          # Digital twin models
│   │   ├── saved_routine.py         # Routine model
│   │   ├── notifications.py         # Notification model
│   │   ├── product_models.py        # Product models
│   │   └── ...
│   │
│   ├── routers/                     # Additional routers
│   │   ├── digital_twin.py
│   │   ├── notifications.py
│   │   ├── routines.py
│   │   ├── shelf.py
│   │   └── ...
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── user.py
│   │   ├── scan.py
│   │   └── ...
│   │
│   ├── services/                    # Business logic
│   │   ├── auth_service.py
│   │   ├── analysis_service.py
│   │   ├── simulation_service.py
│   │   ├── notification_service.py
│   │   ├── google_auth_service.py
│   │   └── email_service.py
│   │
│   ├── data/                        # Static data
│   │   └── ingredient_effects.py
│   │
│   ├── config.py                    # Settings
│   ├── database.py                  # DB connection
│   └── main.py                      # App entry point
│
├── scripts/
│   ├── run_migrations.py            # Database migrations
│   └── seed_data.py                 # Seed data
│
├── tests/
│   ├── conftest.py                  # Test fixtures
│   ├── test_auth.py
│   └── ...
│
├── requirements.txt
└── pytest.ini
```

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with email/password | No |
| POST | `/google` | Google OAuth login | No |
| GET | `/me` | Get current user | Yes |
| GET | `/verify-email` | Verify email token | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |

### Scan (`/api/v1/scan`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/analyze` | Analyze skin photo | Yes |
| GET | `/history` | Get scan history | Yes |
| GET | `/{scan_id}` | Get scan details | Yes |
| DELETE | `/{scan_id}` | Delete scan | Yes |

### Digital Twin (`/api/v1/digital-twin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/query` | Get timeline snapshots | Yes |
| GET | `/insights` | Get skin insights | Yes |
| POST | `/simulate` | Run what-if simulation | Yes |

### Recommendations (`/api/v1/recommendations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get personalized recommendations | Yes |
| GET | `/routines` | Get routine suggestions | Yes |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all notifications | Yes |
| PUT | `/{id}/read` | Mark as read | Yes |
| DELETE | `/{id}` | Delete notification | Yes |
| GET | `/check-reminders` | Check for due reminders | Yes |

### Routines (`/api/v1/routines`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user routines | Yes |
| POST | `/` | Create routine | Yes |
| PUT | `/{id}` | Update routine | Yes |
| DELETE | `/{id}` | Delete routine | Yes |

---

## Database Models

### User Model

```python
# app/models/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    public_id = Column(String, unique=True, default=uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Scan Model

```python
# app/models/scan.py
class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="scans")
    results = relationship("ScanResult", back_populates="scan")
```

### Digital Twin Snapshot

```python
# app/models/digital_twin.py
class SkinStateSnapshot(Base):
    __tablename__ = "skin_state_snapshots"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hydration_level = Column(Float)
    oil_level = Column(Float)
    acne_severity = Column(Float)
    wrinkle_severity = Column(Float)
    pigmentation_severity = Column(Float)
    redness_severity = Column(Float)
    skin_mood = Column(String)
    overall_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Saved Routine

```python
# app/models/saved_routine.py
class SavedRoutine(Base):
    __tablename__ = "saved_routines"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    time_of_day = Column(String)  # "morning" or "evening"
    products = Column(JSON)  # Array of product objects
    reminder_enabled = Column(Boolean, default=False)
    reminder_time = Column(String)  # "08:00" format
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## Services

### AuthService

```python
# app/services/auth_service.py

class AuthService:
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2."""
        
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        
    def create_access_token(self, data: dict) -> str:
        """Generate JWT token."""
        
    def get_current_user(self, token: str, db: Session) -> User:
        """Decode token and return user."""
```

### SimulationService

```python
# app/services/simulation_service.py

class SimulationService:
    async def run_simulation(
        self,
        user_id: int,
        products: list[str],
        duration_weeks: int,
        db: Session
    ) -> dict:
        """
        Predict skin improvements based on products.
        
        Returns:
            {
                "current_scores": {...},
                "projected_scores": {...},
                "improvements": {...},
                "confidence": float
            }
        """
```

### NotificationService

```python
# app/services/notification_service.py

class NotificationService:
    def create_notification(
        self,
        user_id: int,
        type: str,
        title: str,
        message: str,
        db: Session
    ) -> Notification:
        """Create a new notification."""
        
    def check_and_create_routine_reminders(
        self,
        user_id: int,
        db: Session
    ) -> list[Notification]:
        """Check for due routine reminders."""
```

---

## Authentication

### JWT Token Flow

```python
# Creating a token
from app.services.auth_service import create_access_token

token = create_access_token({"sub": str(user.id)})

# Verifying a token (dependency injection)
from app.api.v1.endpoints.auth import get_current_user

@router.get("/protected")
async def protected_route(
    current_user: User = Depends(get_current_user)
):
    return {"user": current_user.email}
```

### Password Hashing

```python
from app.services.auth_service import auth_service

# Hash password
hashed = auth_service.hash_password("user_password")

# Verify password
is_valid = auth_service.verify_password("user_password", hashed)
```

---

## Adding New Features

### 1. Add a New Model

```python
# app/models/my_feature.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class MyFeature(Base):
    __tablename__ = "my_features"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
```

### 2. Add Migration

```python
# scripts/run_migrations.py
# Add to the migration function:
cur.execute("""
    CREATE TABLE IF NOT EXISTS my_features (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255)
    )
""")
```

### 3. Add Schema

```python
# app/schemas/my_feature.py
from pydantic import BaseModel

class MyFeatureCreate(BaseModel):
    name: str

class MyFeatureResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True
```

### 4. Add Router

```python
# app/routers/my_feature.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/my-feature", tags=["My Feature"])

@router.post("/")
async def create_feature(
    data: MyFeatureCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Implementation
    pass
```

### 5. Register Router

```python
# app/main.py
from app.routers.my_feature import router as my_feature_router

app.include_router(my_feature_router, prefix="/api/v1")
```

---

## Testing

### Run Tests

```bash
# All tests
pytest

# Specific file
pytest tests/test_auth.py

# With coverage
pytest --cov=app tests/

# Verbose output
pytest -v
```

### Writing Tests

```python
# tests/test_my_feature.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_feature():
    response = client.post(
        "/api/v1/my-feature/",
        json={"name": "Test"},
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200
```

---

## Common Tasks

### Add a New Endpoint

1. Create route in appropriate router file
2. Add Pydantic schema if needed
3. Implement business logic
4. Add tests
5. Update API documentation

### Add Database Column

1. Update SQLAlchemy model
2. Add migration in `run_migrations.py`
3. Run migration: `python scripts/run_migrations.py`

### Debug Database Issues

```python
# Check database connection
from app.database import engine
print(engine.url)

# Raw SQL query
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM users LIMIT 5"))
    for row in result:
        print(row)
```

### View Logs in Production

```bash
# Railway CLI
railway logs

# Or view in Railway Dashboard > Deployments > View Logs
```

---

*Last updated: January 27, 2026*
