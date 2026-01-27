# Environment Variables Guide

> Complete reference for all environment variables used in the AI Skincare Intelligence System

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Variables](#backend-variables)
3. [Frontend Variables](#frontend-variables)
4. [Railway Configuration](#railway-configuration)
5. [Local Development Setup](#local-development-setup)
6. [Security Best Practices](#security-best-practices)

---

## Overview

The application uses environment variables for configuration. Variables are loaded at runtime and should never be committed to version control.

### Variable Sources

| Environment | Backend | Frontend |
|-------------|---------|----------|
| **Local Development** | `.env` file in `/backend` | `.env` file in `/frontend` |
| **Railway Production** | Railway service variables | Railway service variables |
| **CI/CD** | GitHub Secrets | GitHub Secrets |

---

## Backend Variables

### Required Variables

These MUST be set for the application to function:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `DATABASE_URL` | string | PostgreSQL connection URL | `postgresql://user:pass@host:5432/dbname` |
| `SECRET_KEY` | string | JWT signing key (32+ chars) | `your-super-secret-jwt-key-min-32-chars` |
| `FRONTEND_URL` | string | Frontend URL for redirects | `https://frontend-production-0415.up.railway.app` |

### Authentication Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | `30` | JWT token expiration time |
| `ALGORITHM` | string | `HS256` | JWT signing algorithm |

### Google OAuth Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GOOGLE_CLIENT_ID` | string | For OAuth | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | string | For OAuth | Google OAuth 2.0 client secret |

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `{FRONTEND_URL}/auth/google/callback`
4. Copy Client ID and Client Secret

### Email (SMTP) Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SMTP_HOST` | string | `None` | SMTP server hostname |
| `SMTP_PORT` | int | `587` | SMTP server port |
| `SMTP_USERNAME` | string | `None` | SMTP authentication username |
| `SMTP_PASSWORD` | string | `None` | SMTP authentication password |
| `SMTP_FROM_EMAIL` | string | `None` | Default sender email address |
| `SMTP_USE_TLS` | bool | `True` | Enable STARTTLS encryption |

**Gmail Setup:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
SMTP_FROM_EMAIL=your-email@gmail.com
```

### AI/ML Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | string | `None` | OpenAI API key for vision analysis |
| `OPENAI_API_BASE` | string | `https://api.openai.com/v1` | OpenAI API base URL |
| `OPENAI_MODEL` | string | `gpt-4o-mini` | Model for vision analysis |
| `OPENAI_TIMEOUT_SECONDS` | int | `60` | API timeout |

**Get OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create new secret key
4. Copy and set as `OPENAI_API_KEY`

### ML Model Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MODEL_SOURCE` | string | `volume` | Model source: `volume` or `download` |
| `MODEL_PATH` | string | `/models/skin_analysis_v1.pth` | Path to model file |
| `MODEL_URL` | string | `None` | URL to download model (if source=download) |
| `MODEL_SHA256` | string | `None` | Checksum for verification |
| `MODEL_VERSION` | string | `1.0.0` | Model version identifier |

### External API Variables

| Variable | Type | Description |
|----------|------|-------------|
| `SKINIVE_API_BASE` | string | Skinive API base URL |
| `SKINIVE_API_TOKEN` | string | Skinive API authentication token |
| `SKINIVE_LOCALE` | string | Response locale (default: `en`) |
| `SKINIVE_TIMEOUT_SECONDS` | int | API timeout (default: 30) |

### Application Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_NAME` | string | `AI Skincare Intelligence System` | Application name |
| `APP_VERSION` | string | `1.0.0` | Application version |
| `DEBUG` | bool | `False` | Enable debug mode |
| `ENV` | string | `development` | Environment name |

### CORS Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ALLOWED_ORIGINS` | list | See config.py | Allowed CORS origins |
| `ALLOWED_HOSTS` | list | `["*"]` | Allowed hostnames |

### Admin Variables

| Variable | Type | Description |
|----------|------|-------------|
| `ADMIN_EMAIL_ALLOWLIST` | string | Comma-separated admin emails |
| `SUMMARY_TOKEN` | string | Token for internal summary endpoint |

---

## Frontend Variables

All frontend variables must be prefixed with `VITE_` to be exposed to the client.

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_API_URL` | string | **Yes** | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | string | For OAuth | Google OAuth client ID |

### Example Frontend .env

```bash
# Backend API URL
VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1

# Google OAuth (same as backend GOOGLE_CLIENT_ID)
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Important:** Frontend variables are bundled at build time, not runtime. Changes require a rebuild and redeploy.

---

## Railway Configuration

### Backend Service Variables

Set these in Railway Dashboard → Backend Service → Variables:

```bash
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway reference
SECRET_KEY=your-production-secret-key-here
FRONTEND_URL=https://frontend-production-0415.up.railway.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Application
ENV=production
DEBUG=false
```

### Frontend Service Variables

Set these in Railway Dashboard → Frontend Service → Variables:

```bash
VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Railway Database Reference

Use Railway's reference syntax to link to the database:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

## Local Development Setup

### Backend .env File

Create `backend/.env`:

```bash
# Database (local PostgreSQL or Railway dev)
DATABASE_URL=postgresql://postgres:password@localhost:5432/skincare_dev

# Security
SECRET_KEY=dev-secret-key-for-local-development-only

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth (optional for local)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (optional - emails won't send without this)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# OpenAI (optional - analysis will use fallback)
OPENAI_API_KEY=sk-your-key

# Development settings
DEBUG=true
ENV=development
```

### Frontend .env File

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Security Best Practices

### DO ✅

1. **Use strong secrets**: Generate random 32+ character strings for `SECRET_KEY`
2. **Rotate secrets**: Change production secrets periodically
3. **Use different values**: Never use the same secrets in dev and production
4. **Use Railway references**: `${{Postgres.DATABASE_URL}}` instead of hardcoded URLs
5. **Limit access**: Only give Railway access to team members who need it

### DON'T ❌

1. **Never commit .env files**: They're in `.gitignore` for a reason
2. **Never log secrets**: Don't print environment variables in logs
3. **Never expose in frontend**: Only `VITE_` prefixed vars are safe for frontend
4. **Never use defaults in production**: Always set explicit production values

### Generating Secure Secrets

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Quick Reference

### Minimum Required for Production

| Service | Variable | Description |
|---------|----------|-------------|
| Backend | `DATABASE_URL` | PostgreSQL connection |
| Backend | `SECRET_KEY` | JWT signing (32+ chars) |
| Backend | `FRONTEND_URL` | Frontend URL for OAuth/emails |
| Frontend | `VITE_API_URL` | Backend API URL |

### Optional but Recommended

| Service | Variable | Feature Enabled |
|---------|----------|-----------------|
| Backend | `OPENAI_API_KEY` | AI-powered skin analysis |
| Backend | `GOOGLE_CLIENT_ID` | Google Sign-In |
| Backend | `SMTP_*` | Email verification |
| Frontend | `VITE_GOOGLE_CLIENT_ID` | Google Sign-In button |

---

*Last updated: January 27, 2026*
