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
                   ┌────────┴────────┐
                   │                 │
            [pellicura.com]    [staging.pellicura.pages.dev]
                   │                 │
           [Cloudflare Pages]  [Cloudflare Pages]
                   │                 │
                   ▼                 ▼
    [pellicura-api.fly.dev]  [pellicura-api-staging.fly.dev]
                   │                 │
                   └────────┬────────┘
                            │
                   [Railway PostgreSQL]
```

### 1.2 Environments

| Environment | Frontend | Backend | Branch | Auto-Deploy |
|-------------|----------|---------|--------|-------------|
| Production | pellicura.com | pellicura-api.fly.dev | main | Yes |
| Staging | staging.pellicura.pages.dev | pellicura-api-staging.fly.dev | develop | Yes |

### 1.3 Infrastructure Providers

| Component | Provider | Purpose |
|-----------|----------|---------|
| Frontend Hosting | Cloudflare Pages | Static site hosting, CDN, SSL |
| Backend Hosting | Fly.io | Docker containers, auto-scaling |
| Database | Railway | PostgreSQL managed database |
| Domain/DNS | Cloudflare | DNS management, SSL certificates |
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
flyctl version   # Fly.io CLI
npx wrangler -v  # Cloudflare Wrangler CLI
```

### 2.2 Required Accounts
- **GitHub**: Source control and CI/CD
- **Fly.io**: Backend hosting (flyctl auth login)
- **Cloudflare**: Frontend hosting and DNS
- **Railway**: PostgreSQL database

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
│  3. Commit and push                                              │
│     git add .                                                    │
│     git commit -m "feat: add my feature"                         │
│     git push origin feature/my-feature                           │
│                                                                  │
│  4. Create PR to develop → Auto-deploys to Staging               │
│                                                                  │
│  5. Test on Staging environment                                  │
│     - https://staging.pellicura.pages.dev                        │
│     - https://pellicura-api-staging.fly.dev                      │
│                                                                  │
│  6. Create PR from develop → main → Auto-deploys to Production   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Manual Deployment

#### Deploy Backend to Fly.io
```bash
cd backend

# Deploy to staging
flyctl deploy --config fly.staging.toml --app pellicura-api-staging

# Deploy to production
flyctl deploy --config fly.toml --app pellicura-api
```

#### Deploy Frontend to Cloudflare Pages
```bash
cd frontend

# Build with appropriate API URL
VITE_API_URL=https://pellicura-api.fly.dev/api/v1 npm run build

# Deploy to production
npx wrangler pages deploy dist --project-name pellicura

# Deploy to staging (branch deploy)
npx wrangler pages deploy dist --project-name pellicura --branch staging
```

---

## 5. Configuration Files

### 5.1 Backend - Production (fly.toml)
```toml
app = "pellicura-api"
primary_region = "lhr"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"
  ENV = "production"
  DEBUG = "false"
  ALLOWED_ORIGINS = "[\"https://pellicura.com\",\"https://www.pellicura.com\"]"
  FRONTEND_URL = "https://pellicura.com"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

### 5.2 Backend - Staging (fly.staging.toml)
```toml
app = "pellicura-api-staging"
primary_region = "lhr"

[env]
  ENV = "staging"
  DEBUG = "true"
  ALLOWED_ORIGINS = "[\"https://staging.pellicura.pages.dev\"]"
  FRONTEND_URL = "https://staging.pellicura.pages.dev"
```

### 5.3 Frontend (wrangler.toml)
```toml
name = "pellicura"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[vars]
  VITE_API_URL = "https://pellicura-api.fly.dev/api/v1"
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflows

| Workflow | File | Trigger | Target |
|----------|------|---------|--------|
| Deploy Frontend (Prod) | deploy-cloudflare.yml | Push to main (frontend/) | Cloudflare Pages |
| Deploy Backend (Prod) | deploy-fly.yml | Push to main (backend/) | Fly.io |
| Deploy Staging | deploy-staging.yml | Push to develop | Both staging envs |

### 6.2 Required GitHub Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `FLY_API_TOKEN` | Fly.io deployment token | `flyctl tokens create deploy` |
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

### 8.2 Fly.io Monitoring
```bash
# Check app status
flyctl status --app pellicura-api

# View logs
flyctl logs --app pellicura-api

# SSH into container
flyctl ssh console --app pellicura-api
```

### 8.3 Cloudflare Analytics
- Access via Cloudflare Dashboard → Pages → pellicura → Analytics
- View requests, bandwidth, and geographic distribution

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

### 9.2 Setting Fly.io Secrets
```bash
# Set a secret
flyctl secrets set SECRET_KEY="your-secret" --app pellicura-api

# List secrets
flyctl secrets list --app pellicura-api

# Unset a secret
flyctl secrets unset SECRET_KEY --app pellicura-api
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Check ALLOWED_ORIGINS includes frontend URL |
| 502 Bad Gateway | Check Fly.io logs: `flyctl logs --app pellicura-api` |
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

- [x] SSL/TLS enabled (Fly.io and Cloudflare automatic)
- [x] Environment variables secured as secrets
- [x] CORS configured correctly
- [x] Rate limiting enabled (middleware)
- [ ] Database credentials rotated quarterly
- [ ] Regular dependency updates
- [ ] Security headers configured

---

## 12. Cost Optimization

### 12.1 Current Setup (Free/Low Cost)
- **Fly.io**: Free tier includes 3 shared VMs, auto-stop when idle
- **Cloudflare Pages**: Free tier, unlimited requests
- **Railway**: $5/month credit, database only

### 12.2 Scaling Considerations
- Fly.io: Upgrade VM size or add more machines
- Cloudflare: Paid plans for advanced features
- Railway: Upgrade for higher database limits

---

**End of Document**
