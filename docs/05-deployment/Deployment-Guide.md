# Deployment & Operations Guide
## AI Skincare Intelligence System (Pellicura)

**Version:** 2.0  
**Last Updated:** January 26, 2026  
**Status:** Active

---

## 1. Deployment Overview

### 1.1 Architecture
```
                         [Users]
                            │
                     [pellicura.com]
                            │
                     [Cloudflare DNS]
                            │
              ┌──────────────┴──────────────┐
              │                             │
    [Railway Frontend]            [Railway Backend]
              │                             │
              └──────────────┬──────────────┘
                             │
                    [Railway PostgreSQL]
                         (main + product)
```

### 1.2 Environments

| Environment | Frontend | Backend | Branch | Auto-Deploy |
|-------------|----------|---------|--------|-------------|
| Production | pellicura.com (Railway) | Railway | main | Yes |

### 1.3 Infrastructure Providers

| Component | Provider | Purpose |
|-----------|----------|---------|
| Frontend Hosting | Railway | Docker, static serving |
| Backend Hosting | Railway | Docker, FastAPI |
| Database | Railway | PostgreSQL (main + product catalog) |
| Domain/DNS | Cloudflare | DNS only (pellicura.com → Railway) |
| CI/CD | GitHub Actions | Automated deployments |

---

## 2. Prerequisites

### 2.1 Required Tools
```bash
# Check versions
node -v          # v18.x+
npm -v           # v9.x+
python --version # 3.10+
git --version

# CLI Tools
railway version  # Optional: Railway CLI
```

### 2.2 Required Accounts
- **GitHub**: Source control and CI/CD
- **Railway**: Frontend, backend, and databases
- **Cloudflare**: DNS for pellicura.com

---

## 3. Local Development Setup

### 3.1 Clone Repository
```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
```

### 3.2 Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your local settings

# Run development server
uvicorn app.main:app --reload --port 8000
```

### 3.3 Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local

# Run development server
npm run dev
```

### 3.4 Database (Local Development)
```bash
# Option 1: Use Railway database directly (easiest)
# Set DATABASE_URL in backend/.env to Railway connection string

# Option 2: Local PostgreSQL with Docker
docker run -d --name skincare-db \
  -e POSTGRES_DB=skincare \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14

# Run migrations
cd backend
python scripts/run_migrations.py
```

---

## 4. Deployment Workflows

### 4.1 Development Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Create feature branch from develop                           │
│     git checkout develop                                         │
│     git pull origin develop                                      │
│     git checkout -b feature/my-feature                           │
│                                                                  │
│  2. Make changes and test locally                                │
│     - Backend: http://localhost:8000                             │
│     - Frontend: http://localhost:5173                            │
│                                                                  │
│  3. Commit and push to develop                                   │
│     git add .                                                    │
│     git commit -m "feat: add my feature"                         │
│     git push origin develop                                      │
│                                                                  │
│  4. Auto-deploys to STAGING                                      │
│     - https://staging.pellicura.pages.dev                        │
│     - https://pellicura-api-staging.fly.dev                      │
│                                                                  │
│  5. Test thoroughly on Staging                                   │
│                                                                  │
│  6. When ready for PRODUCTION (requires approval):               │
│     - Go to GitHub Actions                                       │
│     - Run "Deploy Backend to Production" manually                │
│     - Run "Deploy Frontend to Production" manually               │
│     - Type "deploy" to confirm                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Production Deployment (Manual Only)

**Production deployments require explicit approval.**

1. Go to: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions
2. Select "Deploy Backend to Production" or "Deploy Frontend to Production"
3. Click "Run workflow"
4. Type `deploy` in the confirmation field
5. Click "Run workflow" button

### 4.2 Manual Deployment

#### Deploy to Railway
Deployment is automated via GitHub Actions when pushing to `main`. Frontend and backend are separate Railway services.

**Manual deploy (Railway CLI):**
```bash
# Install Railway CLI: npm i -g @railway/cli
railway login
railway link  # Link to project

# Deploy backend
cd backend && railway up

# Deploy frontend
cd frontend && railway up
```

---

## 5. Configuration Files

### 5.1 Railway (railway.toml / railway.json)
- See root `railway.toml` and `railway.json` for build/start commands
- Frontend: `frontend/` with Dockerfile
- Backend: `backend/` with Dockerfile

### 5.2 Environment Variables
Set in Railway Dashboard per service. See `docs/05-deployment/Required-Secrets.md` for full list.

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflows

| Workflow | File | Trigger | Target |
|----------|------|---------|--------|
| Deploy Frontend | deploy-frontend.yml | Push to main (frontend/) | Railway |
| Deploy Backend | deploy.yml | Push to main (backend/) | Railway |

### 6.2 Required GitHub Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RAILWAY_TOKEN` | Railway deployment token | Railway Dashboard → Account → Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Cloudflare Dashboard → Overview |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Cloudflare Dashboard → API Tokens |

### 6.3 Setting Up Secrets
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret listed above

---

## 7. Database Management

### 7.1 Current Setup
- **Provider**: Railway PostgreSQL
- **Connection**: Via DATABASE_URL environment variable
- **Shared**: Both staging and production use the same database

### 7.2 Running Migrations
```bash
# Migrations run automatically on deploy (see Dockerfile CMD)
# Manual migration:
cd backend
RUN_MIGRATIONS=true ALLOW_PROD_MIGRATIONS=true python scripts/run_migrations.py
```

### 7.3 Adding New Tables
1. Create migration file in `backend/migrations/`
2. Name format: `YYYY_MM_DD_description.py`
3. Push to develop → deploys to staging
4. Test on staging
5. Merge to main → deploys to production

---

## 8. Monitoring & Health Checks

### 8.1 Health Endpoints
```bash
# Production
curl https://pellicura-api.fly.dev/api/health

# Staging
curl https://pellicura-api-staging.fly.dev/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ai-skincare-intelligence-system",
  "database": "ok"
}
```

### 8.2 Railway Monitoring
- Access via Railway Dashboard → Select project → Each service has a Deployments and Logs tab
- View logs, metrics, and deployment history
- Health checks: Backend `/api/v1/health`, Frontend root

---

## 9. Environment Variables

### 9.1 Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | postgresql://... |
| `SECRET_KEY` | JWT signing key | random-secure-string |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | 60 |
| `ALLOWED_ORIGINS` | CORS origins (JSON array) | ["https://pellicura.com"] |
| `FRONTEND_URL` | Frontend URL for emails | https://pellicura.com |
| `ENV` | Environment name | production |
| `DEBUG` | Debug mode | false |
| `RUN_MIGRATIONS` | Run migrations on start | true |
| `ALLOW_PROD_MIGRATIONS` | Allow prod migrations | true |

### 9.2 Setting Railway Variables
- Go to Railway Dashboard → Project → Service → Variables
- Add or edit environment variables (secrets are encrypted)

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Check ALLOWED_ORIGINS includes frontend URL |
| 502 Bad Gateway | Check Railway logs in Dashboard |
| Database connection failed | Verify DATABASE_URL secret is set |
| Frontend shows "API offline" | Check VITE_API_URL at build time |
| Deployment stuck | Check GitHub Actions logs |

### 10.2 Debug Commands
```bash
# Fly.io
flyctl status --app pellicura-api
flyctl logs --app pellicura-api -n 100
flyctl ssh console --app pellicura-api

# Cloudflare
npx wrangler pages deployment list --project-name pellicura

# GitHub Actions
# View at: https://github.com/{repo}/actions
```

### 10.3 Rolling Back
```bash
# Fly.io - list deployments
flyctl releases --app pellicura-api

# Rollback to previous version
flyctl deploy --image <previous-image-id> --app pellicura-api

# Cloudflare - rollback via dashboard
# Pages → pellicura → Deployments → Click older deployment → "Rollback to this deployment"
```

---

## 11. Security Checklist

- [x] SSL/TLS enabled (Railway and Cloudflare automatic)
- [x] Environment variables secured as secrets
- [x] CORS configured correctly
- [x] Rate limiting enabled (middleware)
- [ ] Database credentials rotated quarterly
- [ ] Regular dependency updates
- [ ] Security headers configured

---

## 12. Cost Optimization

### 12.1 Current Setup (Free/Low Cost)
- **Railway**: Hobby plan ($5/month credit), frontend + backend + databases
- **Cloudflare**: DNS only (free)

### 12.2 Scaling Considerations
- Railway: Upgrade plan for higher limits
- Cloudflare: Paid plans for advanced features

---

**End of Document**
