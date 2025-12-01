# SPRINT 1.1 - USER REGISTRATION
## Complete Implementation Guide
### AI Skincare Intelligence System

**Date:** December 1, 2025  
**Status:** ✅ Ready for Implementation  
**Platforms:** Backend (FastAPI) | Web (Next.js 14) | Mobile (Expo)

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Web Frontend Implementation](#web-frontend-implementation)
4. [Mobile App Implementation](#mobile-app-implementation)
5. [Test Environments Setup](#test-environments-setup)
6. [Testing Guide](#testing-guide)
7. [Deployment Instructions](#deployment-instructions)

---

## 🎯 OVERVIEW

### Sprint 1.1 Scope

**Story:** User Registration - Secure Email Signup

**User Story:**  
As a new user, I want to create an account with email and password, so that I can securely access my personalized skincare insights.

### Acceptance Criteria Summary

✅ **Endpoint:** `POST /api/v1/auth/register`  
✅ **Email Validation:** RFC 5322 format, unique  
✅ **Password Rules:** Min 8 chars, 1 uppercase, 1 digit, 1 special char  
✅ **Security:** Argon2id hashing, never store plaintext  
✅ **Responses:** 201 (success), 400 (invalid), 409 (duplicate)  
✅ **Test Coverage:** Backend ≥80%, Frontend ≥60%

### Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, Argon2, Alembic
- **Web:** Next.js 14 (App Router), React Hook Form, Zod, Tailwind CSS
- **Mobile:** Expo (React Native), TypeScript
- **Testing:** Pytest, Jest, React Testing Library

---

## 🔧 BACKEND IMPLEMENTATION

### File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── user.py
│   ├── schemas/
│   │   └── auth.py
│   ├── services/
│   │   └── auth_service.py
│   ├── api/
│   │   └── v1/
│   │       └── auth.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   └── main.py
├── alembic/
│   └── versions/
│       └── 001_create_users_and_verification_tokens.py
├── tests/
│   └── test_registration.py
├── .env.staging.example
└── requirements.txt
```

### 1. Database Models

**File:** `backend/app/models/user.py`

```python
"""
User and verification token models for authentication
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    
    # Relationships
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"


class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    token_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="verification_tokens")
    
    def __repr__(self):
        return f"<VerificationToken {self.token_id}>"
```

### 2. Pydantic Schemas

**File:** `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\/;`~]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class RegisterResponse(BaseModel):
    user_id: str
    email: EmailStr
    message: str = "Registration successful"
```

### 3. Security Module

**File:** `backend/app/core/security.py`

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        ph.verify(hashed, password)
        return True
    except VerifyMismatchError:
        return False
```

### 4. Auth Service

**File:** `backend/app/services/auth_service.py`

```python
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password

class DuplicateEmailError(Exception):
    pass

class AuthService:
    @staticmethod
    def register_user(db: Session, data: RegisterRequest) -> User:
        normalized_email = data.email.lower().strip()
        
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user:
            raise DuplicateEmailError(f"Email {normalized_email} is already registered")
        
        password_hash = hash_password(data.password)
        new_user = User(
            email=normalized_email,
            password_hash=password_hash,
            status="active"
        )
        
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        except IntegrityError:
            db.rollback()
            raise DuplicateEmailError(f"Email {normalized_email} is already registered")
```

### 5. API Endpoint

**File:** `backend/app/api/v1/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import RegisterRequest, RegisterResponse
from app.services.auth_service import AuthService, DuplicateEmailError
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = AuthService.register_user(db, data)
        return RegisterResponse(
            user_id=str(user.user_id),
            email=user.email,
            message="Registration successful"
        )
    except DuplicateEmailError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

---

## 🌐 WEB FRONTEND IMPLEMENTATION

### File Structure

```
web-frontend/
├── lib/
│   └── api.ts
├── app/
│   └── register/
│       └── page.tsx
├── __tests__/
│   └── register.test.tsx
└── .env.staging.example
```

### 1. API Helper

**File:** `web-frontend/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function apiPost(path: string, body: any) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, detail: data.detail || 'An error occurred' };
  }

  return data;
}
```

### 2. Register Page

**File:** `web-frontend/app/register/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setIsLoading(true);

    try {
      await apiPost('/auth/register', {
        email: data.email,
        password: data.password,
      });
      router.push('/onboarding');
    } catch (err: any) {
      if (err.status === 409) {
        setError('Email already registered');
      } else {
        setError(err.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 📱 MOBILE APP IMPLEMENTATION

### File Structure

```
mobile-app/
├── api/
│   └── register.ts
├── screens/
│   └── RegisterScreen.tsx
├── eas.json
└── .env.staging.example
```

### 1. API Helper

**File:** `mobile-app/api/register.ts`

```typescript
import { EXPO_PUBLIC_API_URL } from '@env';

interface RegisterData {
  email: string;
  password: string;
}

export async function register(email: string, password: string) {
  const response = await fetch(`${EXPO_PUBLIC_API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, detail: data.detail || 'Registration failed' };
  }

  return data;
}
```

### 2. Register Screen

**File:** `mobile-app/screens/RegisterScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { register } from '../api/register';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Onboarding');
    } catch (err: any) {
      if (err.status === 409) {
        Alert.alert('Error', 'Email already registered');
      } else {
        Alert.alert('Error', err.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
```

---

## ⚙️ TEST ENVIRONMENTS SETUP

### Backend Staging Environment

**File:** `backend/.env.staging.example`

```bash
# Database
DATABASE_URL=postgresql://user:password@staging-db.myapp.com:5432/skincare_staging

# CORS - Allow staging web and mobile
ALLOWED_ORIGINS=["https://web-stg.myapp.com", "http://localhost:3000", "exp://"]

# API
API_V1_PREFIX=/api/v1

# Environment
ENVIRONMENT=staging
```

### Web Staging Environment

**File:** `web-frontend/.env.staging.example`

```bash
NEXT_PUBLIC_API_BASE_URL=https://api-stg.myapp.com/api/v1
NEXT_PUBLIC_ENVIRONMENT=staging
```

### Mobile Staging Environment

**File:** `mobile-app/.env.staging.example`

```bash
EXPO_PUBLIC_API_URL=https://api-stg.myapp.com/api/v1
EXPO_PUBLIC_ENVIRONMENT=staging
```

### EAS Build Configuration

**File:** `mobile-app/eas.json`

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-stg.myapp.com/api/v1",
        "EXPO_PUBLIC_ENVIRONMENT": "staging"
      },
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.myapp.com/api/v1",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🧪 TESTING GUIDE

### Backend Tests

**Run tests:**
```bash
cd backend
pytest tests/test_registration.py -v
```

**Expected results:**
✅ test_register_success
✅ test_register_duplicate_email
✅ test_register_invalid_email
✅ test_register_weak_password

### Web Frontend Tests

**Run tests:**
```bash
cd web-frontend
npm test __tests__/register.test.tsx
```

### End-to-End Testing (Staging)

#### 1. Web Staging Test

```bash
# Navigate to staging site
https://web-stg.myapp.com/register

# Test credentials
Email: test@example.com
Password: Test1234!

# Expected: Success → redirect to /onboarding
```

#### 2. iOS TestFlight Test

```bash
# Build staging version
eas build --platform ios --profile staging

# Upload to TestFlight
eas submit --platform ios --latest

# Testers install from TestFlight
# Test registration flow
# Verify API call to https://api-stg.myapp.com
```

#### 3. Android Internal Testing

```bash
# Build staging version
eas build --platform android --profile staging

# Upload to Play Console Internal Testing
eas submit --platform android --latest

# Testers install from Play Console
# Test registration flow
```

### Database Verification

```sql
-- Connect to staging database
psql $DATABASE_URL

-- Check new user
SELECT user_id, email, status, created_at 
FROM users 
WHERE email = 'test@example.com';

-- Verify password is hashed (starts with $argon2id$)
SELECT substring(password_hash, 1, 20) 
FROM users 
WHERE email = 'test@example.com';
```

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### 1. Backend Deployment (Render)

```bash
# Push to staging branch
git checkout -b staging
git push origin staging

# Render auto-deploys from staging branch
# URL: https://api-stg.myapp.com
```

### 2. Web Deployment (Vercel)

```bash
# Deploy staging
vercel --env staging

# Or use GitHub integration
# Push to staging branch → auto-deploy
# URL: https://web-stg.myapp.com
```

### 3. Mobile Builds

**iOS Staging:**
```bash
cd mobile-app
eas build --platform ios --profile staging
eas submit --platform ios --latest
```

**Android Staging:**
```bash
eas build --platform android --profile staging
eas submit --platform android --latest --track internal
```

---

## ✅ COMPLETION CHECKLIST

### Backend
- [ ] Database models created
- [ ] Alembic migration applied
- [ ] Security module implemented
- [ ] Auth service implemented
- [ ] API endpoint created
- [ ] Tests passing (≥80% coverage)
- [ ] Deployed to staging

### Web Frontend
- [ ] API helper created
- [ ] Register page implemented
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Tests passing (≥60% coverage)
- [ ] Deployed to staging

### Mobile App
- [ ] API helper created
- [ ] Register screen implemented
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Staging build created
- [ ] TestFlight/Internal track uploaded

### Test Environments
- [ ] Backend staging URL configured
- [ ] Web staging URL configured
- [ ] Mobile staging builds configured
- [ ] CORS configured for all platforms
- [ ] End-to-end tests passing

---

## 📝 NEXT STEPS

After Sprint 1.1 completion:

1. **Sprint 1.2 - User Login** (Story ID: 1.2)
2. **Sprint 1.3 - Password Reset** (Story ID: 1.3)
3. **Sprint 1.4 - Token Management & Logout** (Story ID: 1.4)
4. **Sprint 1.5 - Skin Profile Onboarding** (Story ID: 1.5)

---

## 📚 REFERENCES

- [Sprint 1 - Core MVP Development](../Sprint-1-Core-MVP-Development.md)
- [Product Backlog V5](../Product-Backlog-V5.md)
- [SRS V5 Enhanced](../SRS-V5-Enhanced.md)
- [Sprint 0 - Foundation Setup](../Sprint-0-Foundation-Setup.md)

---

**Document Status:** ✅ Complete  
**Last Updated:** December 1, 2025  
**Version:** 1.0  
**Author:** AI Engineering Team
