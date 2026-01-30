# AI Skincare Intelligence System - Deployment URLs

**Last Updated**: January 26, 2026  
**Current Status:** Production ✅ | Staging ✅ | Database ✅

---

## What is Pellicura?

Pellicura is an **AI-powered skincare intelligence app** that:
- Analyzes skin photos using AI (OpenAI Vision)
- Detects skin conditions (acne, wrinkles, texture, etc.)
- Provides personalized skincare recommendations
- Tracks skin progress over time (Digital Twin)

---

## Production Environment

| Component | URL | Platform | Status |
|-----------|-----|----------|--------|
| **Frontend** | https://pellicura.com (→ Railway) | Railway | ✅ Live |
| **Backend API** | https://ai-skincare-intelligence-system-production.up.railway.app | Railway | ✅ Live |
| **Database** | Railway PostgreSQL | Railway | ✅ Operational |

### Production API Endpoints
- Health Check: `https://pellicura-api.fly.dev/api/health`
- API Docs: `https://pellicura-api.fly.dev/docs`
- API v1: `https://pellicura-api.fly.dev/api/v1/`

---

## Staging Environment

| Component | URL | Platform | Status |
|-----------|-----|----------|--------|
| **Frontend** | https://staging.pellicura.pages.dev | Cloudflare Pages | ✅ Live |
| **Backend API** | https://ai-skincare-intelligence-system-production.up.railway.app | Railway (shared) | ✅ Live |
| **Database** | Railway PostgreSQL (shared) | Railway | ✅ Operational |

### Staging API Endpoints
- Health Check: `https://ai-skincare-intelligence-system-production.up.railway.app/api/health`
- API Docs: `https://ai-skincare-intelligence-system-production.up.railway.app/docs`
- API v1: `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/`

---

## Git Branches & Deployment

| Branch | Deploys To | Trigger |
|--------|------------|---------|
| `develop` | Staging | ✅ Auto on push |
| `main` | Production | 🔒 Manual only (requires approval) |

### Workflow
1. **Development**: Push to `develop` → Auto-deploys to Staging
2. **Testing**: Test on staging.pellicura.pages.dev
3. **Production**: Manual deploy from GitHub Actions (requires typing "deploy")

---

## Infrastructure Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PELLICURA INFRASTRUCTURE                      │
│                    (All on Railway + Cloudflare DNS)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STAGING                           PRODUCTION                   │
│   ───────                           ──────────                   │
│                                                                  │
│   staging.pellicura.pages.dev       pellicura.com               │
│   (Cloudflare Pages)               (Cloudflare DNS → Railway)   │
│           │                              │                       │
│           └──────────────┬───────────────┘                       │
│                          ▼                                       │
│              RAILWAY                                              │
│   ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│   │ Frontend        │  │ Backend (FastAPI)                    │  │
│   │ frontend-*.     │  │ ai-skincare-intelligence-system-     │  │
│   │ railway.app     │  │ production.up.railway.app            │  │
│   └────────┬────────┘  └───────────────┬─────────────────────┘  │
│            │                           │                         │
│            └─────────────┬─────────────┘                         │
│                          ▼                                       │
│              Railway PostgreSQL (main + product catalog)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI/ML Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Skin Analysis | OpenAI Vision API (GPT-4o) | Analyze skin photos |
| Face Detection | MediaPipe | Local face validation |
| Product Matching | Rule-based (ML-ready) | Match products to skin |

---

## Development & CI/CD

### GitHub Repository
- **URL**: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system
- **CI/CD**: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions

### GitHub Actions Workflows
| Workflow | Trigger | Deploys To |
|----------|---------|------------|
| `deploy-cloudflare.yml` | Push to `main` (frontend changes) | Production Frontend |
| `deploy-fly.yml` | Push to `main` (backend changes) | Production Backend |
| `deploy-staging.yml` | Push to `develop` | Staging (both) |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `backend/fly.toml` | Production backend (Fly.io) |
| `backend/fly.staging.toml` | Staging backend (Fly.io) |
| `frontend/wrangler.toml` | Frontend (Cloudflare Pages) |
| `.github/workflows/deploy-*.yml` | CI/CD pipelines |

---

## Required Secrets

### GitHub Actions
| Secret | Description |
|--------|-------------|
| `FLY_API_TOKEN` | Fly.io deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |

### Fly.io Backend
| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key |
| `OPENAI_API_KEY` | OpenAI API for skin analysis |

---

## Documentation

- **Deployment Guide**: [docs/05-deployment/Deployment-Guide.md](docs/05-deployment/Deployment-Guide.md)
- **Skin Analysis AI**: [docs/02-architecture/Skin-Analysis-AI.md](docs/02-architecture/Skin-Analysis-AI.md)
- **Cloud Infrastructure**: [docs/02-architecture/Cloud-Infrastructure.md](docs/02-architecture/Cloud-Infrastructure.md)
- **Quick Start**: [docs/00-index/Quick-Start.md](docs/00-index/Quick-Start.md)

**Last Reviewed**: January 26, 2026
