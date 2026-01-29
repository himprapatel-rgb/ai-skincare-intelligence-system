# AI Skincare Intelligence System - Deployment URLs

**Last Updated**: January 26, 2026  
**Current Status:** Production ✅ | Staging ✅ | Database ✅

---

## Production Environment

| Component | URL | Platform | Status |
|-----------|-----|----------|--------|
| **Frontend** | https://pellicura.com | Cloudflare Pages | ✅ Live |
| **Backend API** | https://pellicura-api.fly.dev | Fly.io | ✅ Live |
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
| **Backend API** | https://pellicura-api-staging.fly.dev | Fly.io | ✅ Live |
| **Database** | Railway PostgreSQL (shared) | Railway | ✅ Operational |

### Staging API Endpoints
- Health Check: `https://pellicura-api-staging.fly.dev/api/health`
- API Docs: `https://pellicura-api-staging.fly.dev/docs`
- API v1: `https://pellicura-api-staging.fly.dev/api/v1/`

---

## Git Branches & Auto-Deploy

| Branch | Deploys To | Trigger |
|--------|------------|---------|
| `main` | Production | Auto on push |
| `develop` | Staging | Auto on push |

---

## Infrastructure Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PELLICURA INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STAGING                           PRODUCTION                   │
│   ───────                           ──────────                   │
│                                                                  │
│   staging.pellicura.pages.dev       pellicura.com               │
│           │                              │                       │
│           ▼                              ▼                       │
│   Cloudflare Pages                 Cloudflare Pages             │
│           │                              │                       │
│           ▼                              ▼                       │
│   pellicura-api-staging            pellicura-api                │
│   (Fly.io London)                  (Fly.io London)              │
│           │                              │                       │
│           └──────────┬───────────────────┘                       │
│                      ▼                                           │
│              Railway PostgreSQL                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

## Required Secrets (GitHub)

| Secret | Description |
|--------|-------------|
| `FLY_API_TOKEN` | Fly.io deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |

---

## Mobile Apps (Planned)

| Platform | Status | Distribution |
|----------|--------|--------------|
| iOS | 🔄 Development | TestFlight (future) |
| Android | 🔄 Development | Play Store (future) |

---

## Support & Documentation

- **Deployment Guide**: [docs/05-deployment/Deployment-Guide.md](docs/05-deployment/Deployment-Guide.md)
- **Architecture**: [docs/02-architecture/](docs/02-architecture/)
- **Quick Start**: [docs/00-index/Quick-Start.md](docs/00-index/Quick-Start.md)

**Last Reviewed**: January 26, 2026
