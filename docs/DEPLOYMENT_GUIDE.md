# Deployment Guide

> Complete guide to deploying the AI Skincare Intelligence System

---

## Table of Contents

1. [Overview](#overview)
2. [Railway Deployment](#railway-deployment)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Logs](#monitoring--logs)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

The application is deployed on **Railway** with three services:

| Service | Type | Description |
|---------|------|-------------|
| **Backend** | Web Service | FastAPI application |
| **Frontend** | Web Service | React static build |
| **Database** | PostgreSQL | Managed database |

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://frontend-production-0415.up.railway.app |
| Backend | https://ai-skincare-intelligence-system-production.up.railway.app |
| API Docs | https://ai-skincare-intelligence-system-production.up.railway.app/api/docs |

---

## Railway Deployment

### Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository connected
3. Railway CLI installed (optional)

```bash
npm install -g @railway/cli
railway login
```

### Initial Setup

#### 1. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `ai-skincare-intelligence-system` repository

#### 2. Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Wait for provisioning
4. Database URL will be available as `${{Postgres.DATABASE_URL}}`

#### 3. Create Backend Service

1. Click "New" → "GitHub Repo"
2. Select the repository
3. Set root directory: `backend`
4. Railway will auto-detect Python/FastAPI

**Backend Settings:**
```
Build Command: (auto-detected)
Start Command: (uses start.sh or Procfile)
Port: 8080
```

#### 4. Create Frontend Service

1. Click "New" → "GitHub Repo"
2. Select the repository
3. Set root directory: `frontend`

**Frontend Settings:**
```
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: node server.js
Port: 3000
```

### Environment Variables

#### Backend Variables

Set in Railway → Backend Service → Variables:

```bash
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}
SECRET_KEY=your-secure-secret-key-minimum-32-characters
FRONTEND_URL=https://frontend-production-0415.up.railway.app

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-key

# Production settings
ENV=production
DEBUG=false
```

#### Frontend Variables

Set in Railway → Frontend Service → Variables:

```bash
VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Deploy

Deployment is automatic when you push to `main` branch:

```bash
git push origin main
```

Or manually trigger from Railway Dashboard:
1. Go to service
2. Click "Deploy" → "Deploy Now"

---

## Environment Setup

### Generate Secure Secret Key

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add authorized redirect URI:
   ```
   https://frontend-production-0415.up.railway.app/auth/google/callback
   ```
7. Copy Client ID and Client Secret
8. Set in both Backend and Frontend environment variables

### Gmail SMTP Setup

1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not)
3. App passwords → Generate new
4. Select "Mail" and your device
5. Copy the 16-character password
6. Use as `SMTP_PASSWORD`

---

## Database Setup

### Automatic Migrations

Migrations run automatically on backend startup via `start.sh`:

```bash
#!/bin/bash
python scripts/run_migrations.py
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

### Manual Migration

```bash
# Connect to Railway
railway link

# Run migration script
railway run python scripts/run_migrations.py
```

### Database Access

```bash
# Get connection string
railway variables

# Connect via psql
railway connect postgres
```

### Backup Database

```bash
# Export data
railway run pg_dump $DATABASE_URL > backup.sql

# Import data
railway run psql $DATABASE_URL < backup.sql
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

Located in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `backend-ci.yml` | Push to backend/ | Lint, test backend |
| `frontend-ci.yml` | Push to frontend/ | Lint, build, test frontend |
| `deploy.yml` | Push to main | Deploy to Railway |

### Backend CI

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest
```

### Frontend CI

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci --legacy-peer-deps
      - run: cd frontend && npm run build
      - run: cd frontend && npm test
```

### Railway Auto-Deploy

Railway automatically deploys when:
1. Push to `main` branch
2. CI checks pass (if configured)
3. Railway detects changes in service directory

---

## Monitoring & Logs

### View Logs

**Railway Dashboard:**
1. Go to service
2. Click "Deployments"
3. Click on deployment → "View Logs"

**Railway CLI:**
```bash
railway logs
railway logs -f  # Follow logs
```

### Health Check

```bash
# Backend health
curl https://ai-skincare-intelligence-system-production.up.railway.app/api/health

# Response
{"status": "healthy", "version": "1.0.0"}
```

### Common Log Patterns

```bash
# Successful startup
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080

# Database connection
✓ Migration completed successfully!

# API requests
INFO:     100.64.0.2:12345 - "GET /api/health HTTP/1.1" 200 OK
```

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network I/O
- Request count

View in Railway Dashboard → Service → Metrics

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Frontend build error:**
```
error TS2307: Cannot find module
```
**Solution:** Check imports, run `npm install --legacy-peer-deps`

**Backend build error:**
```
ModuleNotFoundError: No module named 'xxx'
```
**Solution:** Add to requirements.txt, redeploy

#### 2. Database Connection Failed

```
sqlalchemy.exc.OperationalError: connection refused
```
**Solutions:**
- Check DATABASE_URL is set correctly
- Verify PostgreSQL service is running
- Check if using Railway reference: `${{Postgres.DATABASE_URL}}`

#### 3. CORS Errors

```
Access-Control-Allow-Origin error
```
**Solutions:**
- Add frontend URL to `ALLOWED_ORIGINS` in config.py
- Verify FRONTEND_URL environment variable
- Check for trailing slashes

#### 4. OAuth Redirect Mismatch

```
Error 400: redirect_uri_mismatch
```
**Solutions:**
- Verify redirect URI in Google Cloud Console matches exactly:
  `https://frontend-production-0415.up.railway.app/auth/google/callback`
- Check FRONTEND_URL in backend environment variables

#### 5. Environment Variables Not Loading

**Frontend:**
- Variables must be prefixed with `VITE_`
- Requires rebuild after change
- Trigger empty commit: `git commit --allow-empty -m "trigger deploy"`

**Backend:**
- Restart service after variable change
- Check for typos in variable names

### Debug Commands

```bash
# Check environment variables
railway variables

# Connect to service shell
railway shell

# Check database
railway connect postgres
\dt  # List tables
SELECT COUNT(*) FROM users;

# View recent logs
railway logs --lines 100
```

---

## Rollback Procedures

### Rollback Deployment

**Via Railway Dashboard:**
1. Go to service → Deployments
2. Find previous successful deployment
3. Click "..." → "Rollback"

**Via Git:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force  # Careful!
```

### Database Rollback

If migrations caused issues:

```bash
# Connect to database
railway connect postgres

# Drop problematic table/column
ALTER TABLE table_name DROP COLUMN column_name;

# Or restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### Emergency Procedures

1. **Service Down:**
   - Check Railway status: https://status.railway.app
   - View logs for errors
   - Rollback to last working deployment

2. **Database Corrupted:**
   - Restore from Railway automatic backup
   - Or use manual backup if available

3. **Security Breach:**
   - Rotate all secrets immediately
   - Change SECRET_KEY, API keys
   - Review access logs
   - Notify users if data compromised

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Environment variables set in Railway
- [ ] Database migrations tested
- [ ] CORS origins updated if needed
- [ ] OAuth redirect URIs configured
- [ ] HTTPS working correctly
- [ ] Health endpoint responding
- [ ] Monitoring/alerts configured

---

*Last updated: January 27, 2026*
