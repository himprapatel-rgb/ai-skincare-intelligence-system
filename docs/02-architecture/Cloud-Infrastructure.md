# Cloud Infrastructure Architecture

**Last Updated:** January 26, 2026  
**Version:** 2.0

---

## Overview

The Pellicura (AI Skincare Intelligence System) uses a modern cloud-native architecture with the following providers:

| Component | Provider | Service |
|-----------|----------|---------|
| Frontend (production) | Railway | Node/React (pellicura.com) |
| Frontend (staging) | Cloudflare | Pages (staging.pellicura.pages.dev) |
| Backend | Railway | FastAPI Docker |
| Database (main) | Railway | PostgreSQL |
| Database (catalog) | Railway | PostgreSQL (separate) |
| DNS | Cloudflare | pellicura.com → Railway |
| CI/CD | GitHub | Actions |

**All production on Railway.** Domain pellicura.com uses Cloudflare for DNS only. See [Railway-All-Cloudflare-DNS.md](../05-deployment/Railway-All-Cloudflare-DNS.md).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PELLICURA INFRASTRUCTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                              [Users]                                     │
│                                 │                                        │
│                    ┌────────────┴────────────┐                          │
│                    │                         │                          │
│                    ▼                         ▼                          │
│         ┌─────────────────┐       ┌─────────────────┐                   │
│         │  pellicura.com  │       │ staging.pellicura│                  │
│         │   (Production)  │       │   .pages.dev     │                  │
│         └────────┬────────┘       └────────┬────────┘                   │
│                  │                         │                            │
│                  ▼                         ▼                            │
│         │  pellicura.com → Cloudflare DNS → Railway                    │
│         │  staging → Cloudflare Pages                                  │
│         └────────────────────┬────────────────────────┘                 │
│                              │                                          │
│                              ▼                                          │
│         ┌─────────────────────────────────────────────┐                 │
│         │              RAILWAY                        │                 │
│         │  ┌─────────────────┐ ┌─────────────────┐  │                 │
│         │  │ Main PostgreSQL │ │ Product Catalog  │  │                 │
│         │  │ (DATABASE_URL)  │ │ (PRODUCT_DB_URL) │  │                 │
│         │  │ users, scans,   │ │ products,         │  │                 │
│         │  │ shelf, routines │ │ ingredients, etc. │  │                 │
│         │  └─────────────────┘ └─────────────────┘  │                 │
│         └─────────────────────────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Details

### Production

| Service | URL | Region |
|---------|-----|--------|
| Frontend | https://pellicura.com | Global (Cloudflare CDN) |
| Backend | https://ai-skincare-intelligence-system-production.up.railway.app | Railway |
| Database | Railway PostgreSQL | US East |

### Staging

| Service | URL | Region |
|---------|-----|--------|
| Frontend | https://staging.pellicura.pages.dev | Global (Cloudflare CDN) |
| Backend | https://ai-skincare-intelligence-system-production.up.railway.app | Railway (shared) |
| Database | Railway PostgreSQL (shared) | US East |

**Railway:** Backend stays warm; no cold starts. Frontend and backend both deploy from GitHub.

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Developer]                                                    │
│       │                                                          │
│       ▼                                                          │
│   git push                                                       │
│       │                                                          │
│       ▼                                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    GitHub Actions                        │   │
│   │  ┌─────────────────┐     ┌─────────────────┐            │   │
│   │  │ Push to develop │     │  Push to main   │            │   │
│   │  │                 │     │                 │            │   │
│   │  │ → Staging       │     │ → Production    │            │   │
│   │  │   deployment    │     │   deployment    │            │   │
│   │  └────────┬────────┘     └────────┬────────┘            │   │
│   └───────────┼──────────────────────┼──────────────────────┘   │
│               │                      │                          │
│               ▼                      ▼                          │
│   ┌───────────────────┐  ┌───────────────────┐                  │
│   │ deploy-staging.yml│  │deploy-cloudflare  │                  │
│   │                   │  │deploy-fly.yml     │                  │
│   └─────────┬─────────┘  └─────────┬─────────┘                  │
│             │                      │                            │
│             ▼                      ▼                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  STAGING                      PRODUCTION                │   │
│   │  staging.pellicura.pages.dev  pellicura.com             │   │
│   │  Staging (CF Pages)           Production (Railway)      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Git Branching Strategy

```
main (production)
  │
  ├── develop (staging)
  │     │
  │     ├── feature/feature-1
  │     ├── feature/feature-2
  │     └── bugfix/bug-1
  │
  └── hotfix/critical-fix (emergency production fixes)
```

### Branch Rules

| Branch | Deploys To | Protection |
|--------|------------|------------|
| `main` | Production | Protected, requires PR |
| `develop` | Staging | Default branch |
| `feature/*` | None (local only) | None |
| `bugfix/*` | None (local only) | None |
| `hotfix/*` | Production (after merge) | None |

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Internet]                                                      │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────────────────────────────┐                   │
│  │  CLOUDFLARE                              │                   │
│  │  • DDoS Protection                       │                   │
│  │  • WAF (Web Application Firewall)        │                   │
│  │  • SSL/TLS Encryption                    │                   │
│  │  • Bot Protection                        │                   │
│  └──────────────────────────────────────────┘                   │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────────────────────────────┐                   │
│  │  FLY.IO                                  │                   │
│  │  • HTTPS Only                            │                   │
│  │  • Private Networking                    │                   │
│  │  • Secrets Management                    │                   │
│  └──────────────────────────────────────────┘                   │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────────────────────────────┐                   │
│  │  APPLICATION                             │                   │
│  │  • JWT Authentication                    │                   │
│  │  • CORS Validation                       │                   │
│  │  • Rate Limiting                         │                   │
│  │  • Input Validation                      │                   │
│  └──────────────────────────────────────────┘                   │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────────────────────────────┐                   │
│  │  DATABASE                                │                   │
│  │  • Encrypted Connections (SSL)           │                   │
│  │  • Private Networking                    │                   │
│  │  • Automated Backups                     │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis

### Current Monthly Costs (Estimated)

| Service | Plan | Cost |
|---------|------|------|
| Cloudflare Pages | Free | $0 |
| Fly.io | Free Tier | $0 |
| Railway | Hobby ($5 credit) | ~$0-5 |
| **Total** | | **~$0-5/month** |

### Scaling Costs

| Growth Level | Users | Est. Monthly Cost |
|--------------|-------|-------------------|
| Startup | < 1,000 | $0-10 |
| Growth | 1,000-10,000 | $20-50 |
| Scale | 10,000-100,000 | $100-500 |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `backend/fly.toml` | Production backend config |
| `backend/fly.staging.toml` | Staging backend config |
| `backend/Dockerfile` | Docker image definition |
| `frontend/wrangler.toml` | Cloudflare Pages config |
| `.github/workflows/deploy-*.yml` | CI/CD workflows |

---

## Related Documentation

- [Deployment Guide](../05-deployment/Deployment-Guide.md)
- [Required Secrets](../05-deployment/Required-Secrets.md)
- [Database Design](./Database-Design-Extensible.md)

---

**End of Document**
