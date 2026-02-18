# AI Skincare Intelligence System - Deployment URLs

**Last Updated**: January 31, 2026  
**Current Status:** Production only ✅ | Database ✅

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
- Health Check: `https://ai-skincare-intelligence-system-production.up.railway.app/api/health`
- API Docs: `https://ai-skincare-intelligence-system-production.up.railway.app/docs`
- API v1: `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/`

---

## Deployment

| Branch | Deploys To | Trigger |
|--------|------------|---------|
| `main` | Production (Railway) | Push or manual |

**Production only** – no staging environment.

---

## Infrastructure Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PELLICURA INFRASTRUCTURE                      │
│                    Production only • Railway + Cloudflare DNS    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   pellicura.com (Cloudflare DNS)                                 │
│              │                                                   │
│              ▼                                                   │
│   RAILWAY                                                         │
│   ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│   │ Frontend        │  │ Backend (FastAPI)                    │  │
│   │ frontend-*.     │  │ ai-skincare-intelligence-system-     │  │
│   │ railway.app     │  │ production.up.railway.app            │  │
│   └────────┬────────┘  └───────────────┬─────────────────────┘  │
│            │                           │                         │
│            └─────────────┬─────────────┘                         │
│                          ▼                                       │
│   PostgreSQL: main DB + product catalog (2 databases)            │
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
| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy-cloudflare.yml` | Manual | Cloudflare Pages (optional if using Railway frontend) |
| `deploy-fly.yml` | Disabled | Fly.io deprecated |
| `deploy-staging.yml` | Disabled | Staging removed – production only |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `frontend/wrangler.toml` | Frontend (Cloudflare Pages) |
| `.github/workflows/deploy-*.yml` | CI/CD pipelines |

---

## Required Secrets

### GitHub Actions
| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |

### Railway Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key |
| `FRONTEND_URL` | Frontend origin (e.g. https://pellicura.com) |
| `OPENAI_API_KEY` | OpenAI API for skin analysis |
| `GOOGLE_CLIENT_ID` | Google OAuth (for sign-in) ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (for sign-in) ✅ |

### Railway Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth (for "Continue with Google" button) ✅ |

---

## Documentation

- **Deployment Guide**: [docs/05-deployment/Deployment-Guide.md](docs/05-deployment/Deployment-Guide.md)
- **Google SSO Setup**: [docs/05-deployment/Google-SSO-Setup.md](docs/05-deployment/Google-SSO-Setup.md)
- **Railway + Cloudflare**: [docs/05-deployment/Railway-All-Cloudflare-DNS.md](docs/05-deployment/Railway-All-Cloudflare-DNS.md)
- **Skin Analysis AI**: [docs/02-architecture/Skin-Analysis-AI.md](docs/02-architecture/Skin-Analysis-AI.md)
- **Cloud Infrastructure**: [docs/02-architecture/Cloud-Infrastructure.md](docs/02-architecture/Cloud-Infrastructure.md)
- **Quick Start**: [docs/00-index/Quick-Start.md](docs/00-index/Quick-Start.md)

**Last Reviewed**: January 31, 2026
