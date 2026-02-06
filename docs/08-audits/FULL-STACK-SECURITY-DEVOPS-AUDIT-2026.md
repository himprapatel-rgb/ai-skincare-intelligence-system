# Full-Stack + Security + DevOps Audit

**Reviewer role:** Senior Full-Stack Engineer + DevOps + Security  
**Scope:** AI Skincare Intelligence System (PolyCure.com / pellicura.com)  
**Date:** February 2026  
**Stance:** Review as if going live to paying customers next week; responsible for security and reliability.

---

## 1) Understanding & Assumptions

### App purpose
- **SkinCareAI / PolyCure:** AI-powered skincare platform: face scan (upload/camera) → analysis (ML/OpenAI/Skinive) → personalized results; product scan (barcode); Digital Twin timeline; routines (AM/PM); recommendations; shelf/favorites. Target: consumers (mobile web + desktop), admins (desktop).

### Main user flows
1. **Auth:** Register → verify email → login (or Google OAuth); password reset.
2. **Today:** Greeting, skin summary, routine, recommendations (mobile: bottom nav).
3. **Scan (face):** Init → upload/camera → analyze → results/history.
4. **Scan (product):** Barcode/search → product details / shelf.
5. **Me:** Profile, Digital Twin, settings, sign out.
6. **Admin:** Users, catalog, content (blogs/videos/news), allowlist.

### Current architecture (high level)
- **Frontend:** React (Vite, TypeScript), single SPA; responsive (768 / 1024 / 1280 breakpoints); PWA (manifest, icons). API client: axios, JWT in `localStorage`, retries, 401 → “Session expired” + redirect to `/auth`.
- **Backend:** FastAPI on Railway; JWT (HS256), Argon2 passwords; main DB (PostgreSQL) + product catalog DB; routers under `/api/v1` (auth, scan, profile, digital-twin, routines, admin, etc.). Migrations via `run_migrations.py` (RUN_MIGRATIONS + ALLOW_PROD_MIGRATIONS).
- **DB:** Railway PostgreSQL; SQLAlchemy ORM; pool_size=20, max_overflow=30; performance indexes migration exists; PII in users, user_profiles, scan_sessions, etc.
- **External APIs:** OpenAI Vision (skin analysis), Skinive (optional), Open Beauty Facts, SMTP (verification/reset), Google OAuth.

### Assumptions (missing or inferred)
- **Railway:** Frontend and backend are separate services; DB is Railway Postgres; env vars (SECRET_KEY, DATABASE_URL, OPENAI_API_KEY, etc.) are set in Railway dashboard. No explicit health check URL configured in Railway (health endpoints exist in code).
- **PolyCure.com:** Treated as production frontend URL (same app as pellicura.com in CORS).
- **No Redis:** Rate limits and caches are in-process only (multi-worker will not share rate-limit state).
- **No Sentry/APM** in repo; observability is logs + Railway metrics.

---

## 2) Executive Summary

### Top 10 highest-impact issues
1. **Production seeds test users with known passwords** (`main.py`) – Backdoor in prod.
2. **Scan endpoints not rate limited** – `RateLimiterMiddleware` never added to app; abuse/cost risk.
3. **Debug auth endpoint exposes user existence** – `GET /api/v1/auth/test-user-status` in production.
4. **SECRET_KEY default** – Weak default; production check exists but deploy without env = crash, not safe default.
5. **Image upload validation by Content-Type only** – Spoofable; no magic-bytes check; malware/type confusion risk.
6. **Test user credentials in auth module** – `TEST_USER_PASSWORD` in code; same passwords in startup seed.
7. **ENCRYPTION_KEY/ENCRYPTION_SALT** – Dev fallbacks; production requires env (good) but placeholder in code.
8. **JWT in localStorage** – XSS can steal token; no HttpOnly cookie option.
9. **No health check in Railway deploy** – readiness/liveness not wired; slow or broken DB can still receive traffic.
10. **Verification token logged** – `verification_token[:8]` and emails in logs; PII in log streams.

### Biggest risks
- **Security:** Test users in production; debug endpoint; weak image validation; token in localStorage; log PII.
- **Cost / reliability:** Unrate-limited scan → OpenAI/Skinive abuse; no circuit breaker on external APIs; multi-worker rate limit not shared.
- **Reliability:** No Railway health check; migrations require ALLOW_PROD_MIGRATIONS (correct) but startup runs schema + seed unconditionally.

---

## 3) Findings Table

| ID | Area | Severity | Description | Where | Fix | Effort |
|----|------|----------|-------------|-------|-----|--------|
| F01 | Backend | Critical | Production startup seeds test users (known emails + password) | `backend/app/main.py` `ensure_test_user()` | Only seed when `ENV != "production"` or explicit `SEED_TEST_USERS=true` | S |
| F02 | Backend | Critical | Scan endpoints not rate limited | `main.py` (middleware order) | Add `RateLimiterMiddleware` for `/api/v1/scan` (or use core/rate_limit per-route) | S |
| F03 | Backend | High | Debug endpoint exposes which test users exist / verified | `app/api/v1/endpoints/auth.py` `test_user_status` | Disable in production: `if settings.ENV == "production": raise 404` or remove | S |
| F04 | Backend | High | Image upload validated by Content-Type only | `routers/scan.py` `_validate_and_save_image` | Validate magic bytes (JPEG/PNG/WEBP) after read; reject mismatch | M |
| F05 | Backend | High | Test user password in source | `auth.py` `TEST_USER_PASSWORD`, `main.py` test_users | Remove from code; use env or skip seed in prod (F01) | S |
| F06 | Backend | Medium | SECRET_KEY default weak | `app/config.py` | Keep current “must set in prod” check; document in deployment guide | S |
| F07 | Backend | Medium | Encryption dev fallback | `core/security.py` `get_fernet` | Already raises in prod if missing; remove placeholder from comments | S |
| F08 | Backend | Medium | Verification token (first 8 chars) + email in logs | `auth.py` register/verify-email/request | Log request_id only; never log token (even prefix) or email in production | S |
| F09 | Backend | Medium | Login rate limit is in-memory; not shared across workers | `core/rate_limit.py` | For multi-worker: use Redis or external store; or document “per-worker” limit | M |
| F10 | Frontend | Medium | JWT in localStorage (XSS can steal) | `api.ts`, `AuthContext` | Consider HttpOnly cookie + same-site (requires backend change) or document risk | L |
| F11 | Frontend | Low | BreadcrumbJsonLd uses dangerouslySetInnerHTML | `BreadcrumbJsonLd.tsx` | Content is app-controlled JSON-LD; keep but ensure data never user-controlled | S |
| F12 | DevOps | High | No health check in Railway deploy | `railway.toml` / Railway UI | Add readiness probe to `GET /api/health/ready` (and optional liveness `/api/health/live`) | S |
| F13 | Backend | Medium | CORS allows multiple origins; ensure no wildcard in prod | `config.py` `ALLOWED_ORIGINS` | Verify Railway `ALLOWED_ORIGINS` is explicit list (no `*`) | S |
| F14 | DB | Medium | Pool size vs workers | `database.py` pool_size=20, max_overflow=30 | Ensure pool_size + max_overflow >= workers; document for 16 workers | S |
| F15 | Backend | Low | Permissions-Policy disables camera | `main.py` security headers | App needs camera for scan; set `camera=(self)` or appropriate origin | S |
| F16 | Testing | Medium | E2E/API coverage for auth and scan | `backend/tests`, `frontend/tests` | Add integration test: login → init scan → upload → result; E2E for upload flow | M |

---

## 4) Frontend Audit (Summary)

### A. Responsiveness & UI
- Breakpoints: 768px (mobile), 1024px (tablet), 1280px (desktop) in `index.css` and `mobile-redesign.css`. Consistent.
- Touch: 44px min touch targets in `index.css` and `mobile-redesign.css`. Good.
- **Issues:** None critical. Optional: audit very small viewports (<320px) and tablet 769–1024 for overflow.

### B. UX flow & product clarity
- Upload/photo flow present; permission prompts are browser-native. Error handling in api interceptor (retries, 401, 429).
- Loading/skeletons: LoadingScreen and per-page states exist. Offline: PWA has offline hint; no full offline-first.
- **Recommendation:** Add short disclaimer near AI results (e.g. “Not a medical diagnosis; consult a professional”).

### C. Frontend performance
- Vite code splitting: manualChunks for mediapipe, tensorflow, recharts, three, export-pdf, router, axios, vendor. Good.
- Chunk size warning at 600 kB; some chunks >600 kB (expected for ML). LCP: ensure critical path (e.g. above-the-fold) does not wait on heavy chunks.
- **Recommendation:** Lazy-load Scan/ML-heavy routes where possible; measure LCP on 4G.

### D. Frontend code quality
- Structure: `components`, `pages`, `services`, `context`, `hooks`, `constants` – clear. Storage keys centralized in `storage.ts`.
- State: AuthContext + api client; 401 handling correct. TypeScript used.
- Error boundary and safe-area usage present. No generic “log everything” to console in production.

---

## 5) Backend Audit (Summary)

### A. API design & correctness
- Endpoints under `/api/v1`; Pydantic schemas; 401/403/404/429 used. Auth: JWT Bearer; optional auth for guest scan.
- **Gaps:** Scan not rate limited (F02). File upload: size 5 MB, types JPEG/PNG/WEBP by Content-Type only (F04).

### B. External API integration
- OpenAI: key from settings; timeout 60s. No circuit breaker in code; retries in client possible but not visible in snippet. Cost: no per-user or global cap in code.
- **Recommendations:** Env-only keys (no hardcoding). Add timeout/retry policy; consider circuit breaker for OpenAI/Skinive. Minimize PII sent to AI (only image + minimal metadata).

### C. Performance & scalability
- DB: get_db per request; pool 20+30. N+1 possible in list endpoints (e.g. scan history); recommend review and eager load where needed.
- Scan: sync file write to disk; consider async or queue for very high load. Idempotency: scan init creates new session each time (no idempotency key).

### D. Security (strict)
- **Injection:** ORM/SQLAlchemy; parameterized. No raw SQL with user input in reviewed code.
- **Auth:** JWT + Argon2; admin allowlist. Test users and debug endpoint are the main issues (F01, F03, F05).
- **IDOR:** Scan access checks `scan.user_id == user.id` for authenticated user; guest can access any scan by ID (document if intentional).
- **CORS:** Explicit origins; no wildcard in default list. Verify production env.
- **Secrets:** From env; SECRET_KEY must be set in prod (runtime check). ENCRYPTION_KEY/ENCRYPTION_SALT required in prod.
- **Headers:** X-Content-Type-Options, X-Frame-Options, Referrer-Policy, COOP; CORP for /api. HSTS when not DEBUG. Permissions-Policy currently disables camera (F15).
- **Logging:** Emails and token prefix in logs (F08).

---

## 6) Database Audit (Summary)

- **Schema:** Main DB: users, user_profiles, scan_sessions, skin_analyses, shelf_products, etc. Product catalog (possibly second DB): catalog_products, catalog_ingredients, etc. Migrations in `run_migrations.py` and `migrations/` (Alembic-style and raw SQL).
- **Indexes:** Performance indexes migration adds idx for users, shelf, scan_sessions, notifications, etc. Some indexes reference columns (e.g. `name`) that may not exist on all tables (e.g. `ingredients.name` vs `name_inci`); verify per table.
- **PII:** Stored in users (email, name), user_profiles (many fields), scan_sessions (and image path/data). Encryption: optional for sensitive fields via `encrypt_sensitive_data`; ensure used for high-sensitivity columns and key rotation planned.
- **Backups / envs:** Railway-managed; document backup/restore and dev/stage/prod separation.

**Recommendations:** Add index on `scan_sessions(user_id, created_at DESC)` if not present. Ensure migration rollback or down-migrations for critical changes. Document retention for PII and access logs.

---

## 7) Railway & DevOps Audit (Summary)

- **Services:** Backend built with Dockerfile; startCommand runs migrations then uvicorn (workers from env, default 16).
- **Env:** DATABASE_URL, RUN_MIGRATIONS, ALLOW_PROD_MIGRATIONS, SECRET_KEY, etc. Document required vars and secrets.
- **Health:** `/api/health`, `/api/health/ready`, `/api/health/live` exist but **no health check configured in Railway** (F12). Add readiness probe so Railway does not send traffic until DB is ready.
- **Observability:** Logs only. Consider Sentry (or similar) for errors and optional APM.
- **Rollback:** Railway redeploy; no explicit rollback script. Safe deploy: run migrations separately or with ALLOW_PROD_MIGRATIONS; avoid long-running migrations in same process as app startup if possible.

---

## 8) Testing & Quality Gates

- **Backend:** pytest; tests for auth, scan, products, digital_twin, security_utils, etc. Coverage not measured in audit.
- **Frontend:** Vitest; some component/viewport tests. E2E: Playwright (responsive, agent, etc.).
- **Gaps:** No integration test for full flow (login → scan upload → result). No explicit rate-limit test. Lint/format/typecheck in CI (frontend-ci.yml).

**Recommendations:** Minimum: integration test for auth + scan upload; E2E for upload → analysis → results. Unit tests for rate_limit and image validation. CI: run typecheck and lint on PR; block merge on failure.

---

## 9) Quick Wins (Do Today)

1. **Disable test user seed in production** – In `main.py`, wrap test user creation in `if settings.ENV != "production":` or `if os.getenv("SEED_TEST_USERS", "").lower() in ("1", "true", "yes"):`.
2. **Add scan rate limiting** – In `main.py`, add `from middleware.rate_limiter import RateLimiterMiddleware` and `app.add_middleware(RateLimiterMiddleware, max_requests=10, window_seconds=60)` **after** CORS (so it runs after CORS, before route handlers).
3. **Disable or restrict test-user-status** – In `auth.py`, at top of `test_user_status`, add: `if settings.ENV == "production": raise HTTPException(404, "Not found")`.
4. **Remove test password from code** – Use env var for test password when seeding (e.g. `SEED_TEST_USER_PASSWORD`) or remove seed in prod (quick win #1) and leave password only in secure env for local dev.
5. **Configure Railway health check** – In Railway service, set Health Check Path to `/api/health/ready` (or `/api/health`), and optionally timeout (e.g. 10s).
6. **Stop logging verification token and email** – In `auth.py`, replace logs that include `verification_token[:8]` or user email with request_id only (e.g. `logger.info("[%s] Verification email sent", request_id)`).
7. **Fix Permissions-Policy for camera** – In `main.py`, change `Permissions-Policy` to allow camera for same origin, e.g. `camera=(self)`.

---

## 10) Medium Refactors (1–3 days)

1. **Image upload: magic-bytes validation** – In `routers/scan.py`, after `contents = await image.read()`, check first bytes (JPEG: `FF D8`; PNG: `89 50 4E`; WEBP: `52 49 46 46 ... 57 45 42 50`). Reject if content_type and magic bytes disagree; reject unknown magic.
2. **Shared rate limit (Redis or per-IP in DB)** – Replace in-memory dict in `RateLimiterMiddleware` and `core/rate_limit` with Redis (or DB table) so all workers share limits. Document if keeping in-memory (per-worker).
3. **OpenAI/Skinive: timeout + circuit breaker** – Wrap external calls in a small helper with timeout and simple circuit (e.g. after N failures, skip call for 60s and return fallback).
4. **Integration test: auth + scan** – pytest: login with test user → get token → POST /api/v1/scan/init → POST upload → GET result (mock ML if needed).
5. **E2E: upload → analysis → results** – Playwright: log in → go to scan → upload image → wait for result screen; assert key elements.

---

## 11) Larger Improvements (1–3 weeks)

1. **JWT in HttpOnly cookie** – Backend: set cookie on login (SameSite=Lax, Secure, HttpOnly), accept cookie or Bearer for API; frontend: stop storing token in localStorage; adjust CORS/credentials.
2. **Stricter scan validation** – Virus/malware scan for uploads (e.g. ClamAV) or at least size + type + magic bytes + filename sanitization; consider storing in object storage (e.g. S3) with signed URLs.
3. **Observability** – Sentry (or similar) for backend and frontend; optional APM; structured logs (JSON) and log level from env.
4. **Cost controls** – Per-user or global cap on OpenAI/Skinive calls; queue for scan jobs if needed.
5. **PII and retention** – Document what is stored where; retention policy; encryption-at-rest and key rotation for ENCRYPTION_KEY; redact PII from logs everywhere.

---

## 12) Proposed Architecture (Improved)

```
[Browser / PWA]
       |
       | HTTPS
       v
[Frontend - Railway/Cloudflare]
       | VITE_API_URL → Backend
       v
[Backend - Railway]
       | CORS: explicit origins only
       | Middleware: GZip → CORS → Security headers → RateLimit (scan) → Tracing → IP/Geo
       | Auth: JWT (cookie optional) + Argon2; admin allowlist
       v
[PostgreSQL - Railway]  (main + optional product DB)
       ^
       |
[External]
  - OpenAI Vision (timeout, circuit breaker, cost cap)
  - Skinive (optional)
  - SMTP, Google OAuth
  - Open Beauty Facts (rate limited)
```

**Data flow (scan):**  
Browser → Frontend (upload) → POST /api/v1/scan/init → POST /api/v1/scan/upload → Backend validates (size, type, magic bytes) → rate limit check → save file → call ML/OpenAI → save result → return to client.

**Security:** No test users in production; no debug endpoints in production; rate limit on scan and login; image validation by magic bytes; secrets from env; health check so Railway only routes when ready.

---

## 13) Patch Examples

### P1. Disable test user seed in production (`backend/app/main.py`)

After the line `db = SessionLocal()` and `try:` that starts the seed block (around line 195), add a guard:

```python
    # Do not seed test users in production
    if settings.ENV == "production":
        db.close()
        return

    db = SessionLocal()
    try:
        test_users = [
```

Or wrap only the test_users loop:

```python
    if settings.ENV != "production":
        test_users = [
            ("himanshu@test.com", "Test1234!", "Himanshu Patel"),
            ...
        ]
        for email, password, full_name in test_users:
            ...
    finally:
        db.close()
```

### P2. Add scan rate limit middleware (`backend/app/main.py`)

After `app.add_middleware(GZipMiddleware, minimum_size=500)` add:

```python
from middleware.rate_limiter import RateLimiterMiddleware
# Rate limit scan endpoints (per IP or user) to prevent abuse
app.add_middleware(RateLimiterMiddleware, max_requests=10, window_seconds=60)
```

Note: `RateLimiterMiddleware` uses `request.state.user` for authenticated users; ensure that the dependency that sets `request.state.user` runs before the middleware (currently it does not set it; the middleware falls back to IP). So rate limit is per-IP unless you set `request.state.user` in a prior middleware. For a quick win, per-IP is acceptable.

### P3. Disable test-user-status in production (`backend/app/api/v1/endpoints/auth.py`)

At the start of `test_user_status`:

```python
def test_user_status(db: Session = Depends(get_db)):
    if settings.ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    result = {}
    ...
```

### P4. Image magic-bytes validation (`backend/app/routers/scan.py`)

After `contents = await image.read()` in `_validate_and_save_image`:

```python
    # Magic bytes check (content-type can be spoofed)
    def _magic_for_type(ct: str) -> bytes:
        if ct == "image/jpeg":
            return b"\xff\xd8\xff"
        if ct == "image/png":
            return b"\x89PNG\r\n\x1a\n"
        if ct == "image/webp":
            return b"RIFF"  # WEBP: RIFF....WEBP
        return b""
    magic = _magic_for_type(image.content_type)
    if magic and not contents.startswith(magic):
        if magic == b"RIFF" and len(contents) >= 12:
            if contents[8:12] != b"WEBP":
                raise HTTPException(status_code=400, detail="Invalid image: not WEBP")
        else:
            raise HTTPException(status_code=400, detail="Invalid image: type mismatch")
    if image.content_type == "image/webp" and (len(contents) < 12 or contents[8:12] != b"WEBP"):
        raise HTTPException(status_code=400, detail="Invalid WEBP image")
```

### P5. Railway health check (Railway UI or `railway.toml`)

In Railway dashboard for the backend service:

- **Health Check Path:** `/api/health/ready`
- **Health Check Timeout:** 10 seconds (or 30 if DB is slow)

If using `railway.toml` and Railway supports it:

```toml
[deploy]
healthcheckPath = "/api/health/ready"
healthcheckTimeout = 10
```

(Exact key names may vary by Railway version; confirm in docs.)

---

*End of audit. Prioritize F01–F05 and quick wins before going live.*
