# Cloud Infrastructure Architecture

**Last Updated:** January 26, 2026  
**Version:** 2.0

---

## Overview

The Pellicura (AI Skincare Intelligence System) uses a modern cloud-native architecture with the following providers:

| Component | Provider | Service |
|-----------|----------|---------|
| Frontend | Railway | Node/React (pellicura.com) |
| Backend | Railway | FastAPI Docker |
| Database (main) | Railway | PostgreSQL |
| Database (catalog) | Railway | PostgreSQL (separate) |
| DNS | Cloudflare | pellicura.com → Railway |
| CI/CD | GitHub | Actions |

**Production only.** Frontend, backend, and two databases on Railway. Cloudflare for DNS. See [Railway-All-Cloudflare-DNS.md](../05-deployment/Railway-All-Cloudflare-DNS.md).

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PELLICURA INFRASTRUCTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                              [Users]                                     │
│                                 │                                        │
│                                 ▼                                        │
│                    pellicura.com (Cloudflare DNS → Railway)              │
│                                 │                                        │
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

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://pellicura.com | Railway (Cloudflare DNS) |
| Backend | https://ai-skincare-intelligence-system-production.up.railway.app | Railway |
| Database (main) | PostgreSQL | Railway |
| Database (catalog) | PostgreSQL | Railway |

**Production only.** No staging. Frontend and backend deploy from GitHub.

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Developer] → git push to main                                 │
│       │                                                          │
│       ▼                                                          │
│   Railway auto-deploys (frontend + backend)                      │
│       │                                                          │
│       ▼                                                          │
│   PRODUCTION: pellicura.com (Railway)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Git Branching Strategy

```
main (production) – push deploys to Railway
  │
  ├── feature/feature-1
  ├── feature/feature-2
  └── hotfix/critical-fix
```

### Branch Rules

| Branch | Deploys To | Protection |
|--------|------------|------------|
| `main` | Production | Protected |
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
