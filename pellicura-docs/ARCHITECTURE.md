# System Architecture

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                      │
│   React 18 + TypeScript + Vite (50+ pages, 80+ components) │
│   MediaPipe Face Mesh | TensorFlow.js | Service Worker   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS (REST API)
┌──────────────────────────▼──────────────────────────────┐
│                     RAILWAY                              │
│   FastAPI + Python 3.11 (15 routers, 113 endpoints)      │
│                                                          │
│   Middleware: CORS → GZip → RateLimit → Tracing          │
│              → GeoIP → PerfLog → Security → Timeout      │
│                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │
│   │  21 Services │  │  22 Models  │  │  Core Security │ │
│   │  (AI, auth,  │  │  (SQLAlchemy│  │  (JWT, AES-256 │ │
│   │   products)  │  │   ORM)      │  │   rate limit)  │ │
│   └──────┬───────┘  └──────┬──────┘  └────────────────┘ │
└──────────┼─────────────────┼────────────────────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────────────┐
    │ PostgreSQL  │   │ PostgreSQL  │   │  OpenAI API  │
    │ Main DB     │   │ Product DB  │   │  GPT-4V      │
    │ (users,     │   │ (catalog,   │   │  GPT-4o-mini │
    │  scans,     │   │  ingredients│   └──────────────┘
    │  profiles)  │   │  brands)    │
    └─────────────┘   └─────────────┘
```

## Authentication Flow

```
Registration:
  Client → POST /auth/register → Argon2id hash → save User → send verification email
  Client → GET /verify-email?token=xxx → verify → mark is_verified=true

Login:
  Client → POST /auth/login → verify Argon2id → generate JWT (HS256, 30min) → log IP/geo → return token

Google OAuth:
  Client → Google consent screen → auth code → POST /auth/google-oauth → exchange → find/create user → JWT

Authenticated Request:
  Client → Authorization: Bearer <jwt> → decode → get_current_user → inject User into route handler
```

## Scan Analysis Pipeline

```
1. Camera → MediaPipe face mesh → quality validation (lighting, angle, distance)
2. Compress image (JPEG ≤5MB, max 4096px)
3. POST /scan/init → ScanSession(status=PENDING)
4. POST /scan/{id}/upload → validate magic bytes + dimensions → save
5. POST /scan/{id}/analyze → OpenAI GPT-4V structured output:
   {
     summary: { overall_score, scores: {acne, redness, ...}, concerns },
     skin_type: "combination",
     fitzpatrick_scale: 3,
     confidence_score: 0.92,
     concerns_detail: [{ concern_type, severity, confidence, affected_areas }],
     zone_analysis: [{ zone: "forehead", concerns: [...] }],
     recommendations: [...]
   }
6. Save: SkinAnalysis + ScanOutput + ScanConditions + ScanRecommendations
7. Auto-generate notifications
8. Return → AnalysisResults page
```

## Data Flow

```
User Profile ─────────┐
                       │
Scan History ──────────┼──→ AI Intelligence Engine (GPT-4o-mini)
                       │         │
Product Shelf ─────────┤         ├──→ Recommendations
                       │         ├──→ Routines
Skin Goals ────────────┘         ├──→ Predictions
                                 ├──→ Trends
                                 ├──→ Alerts
                                 └──→ Chat Responses

Product Catalog ──→ Ingredient Safety DB (200+ harmful ingredients)
                         │
                         ├──→ Safety Analysis
                         ├──→ Drug Interaction Warnings
                         └──→ Pregnancy Safety Flags
```

## Security Layers

| Layer | Protection |
|-------|-----------|
| Transport | HTTPS, HSTS, TLS 1.2+ |
| Authentication | JWT (HS256, 30-min expiry), Argon2id (password), OAuth 2.0 |
| Encryption | AES-256 (Fernet) for skin_type, concerns, goals in DB |
| API Protection | Rate limiting (10/60s), request timeout (30s), body limit (5MB) |
| Headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP, CORP, COOP |
| Input Validation | Pydantic schemas, image magic bytes, dimension limits (4096px) |
| Database | SQLAlchemy ORM (parameterized), connection pooling |
| Admin | is_admin boolean + ADMIN_EMAIL_ALLOWLIST |
| Audit | IP/geolocation logging, user access logs, correlation IDs |

## Middleware Stack (Execution Order)

```
Request → CORSMiddleware
        → GZipMiddleware (min 500 bytes)
        → RateLimiterMiddleware (10 req/60s per IP)
        → RequestTracingMiddleware (X-Correlation-ID)
        → IPGeoLoggingMiddleware (update user last_ip, last_seen_at)
        → PerformanceLoggingMiddleware (X-Response-Time, warn >1s)
        → Security Headers (custom middleware)
        → Request Timeout (30s, skip health endpoints)
        → Request Size Limit (5MB POST/PUT/PATCH)
        → FastAPI Router
        → Response
```

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Cloudflare Pages | pellicura.com |
| Backend | Railway | api.pellicura.com |
| Main DB | Railway PostgreSQL | Internal connection |
| Product DB | Railway PostgreSQL | Internal connection |
| Redis | Railway Redis (optional) | Internal connection |
| Images | Cloudflare R2 (planned) | cdn.pellicura.com |

## Environment Variables (Key)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Main PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing key |
| `OPENAI_API_KEY` | Yes | OpenAI API for GPT-4V + GPT-4o-mini |
| `PRODUCT_DATABASE_URL` | No | Separate product catalog DB |
| `REDIS_URL` | No | Cache + rate limit store |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `SMTP_HOST/PORT/USER/PASS` | No | Email sending |
| `ANTHROPIC_API_KEY` | No | Fallback AI provider |
