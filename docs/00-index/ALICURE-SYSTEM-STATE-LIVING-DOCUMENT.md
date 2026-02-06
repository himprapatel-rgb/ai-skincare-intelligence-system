# Alicure (Pellicura) — Current System State

**Living Document · Agile Mode**  
**Brand:** Pellicura (pellicura.com) / SkinCareAI  
**Last synced with code:** February 6, 2026  
**Status:** Production operational; continuous iteration

> This document describes **what exists today** in the system. It is designed to evolve with the product. Sections marked *[Evolving]*, *[Partial]*, *[TBD]*, or *[Future]* indicate areas subject to change.

---

## 1. System identity

### What we call it

- **Production brand:** Pellicura (domain: pellicura.com, also pellicura.pages.dev)
- **Code / internal:** SkinCareAI, AI Skincare Intelligence System
- **Repo:** ai-skincare-intelligence-system
- **User-facing:** "SkinCareAI" in UI; "Pellicura" in branding and domain

*[Note: Alicure / B-E-L-L-I-C-U-R-E mentioned in brief; currently not reflected in production URLs or code. May be a future rebrand or phonetic reference.]*

### Purpose (one sentence)

Clinical-grade, AI-powered skincare platform: scan skin (face) or product → personalized analysis → recommendations, routines, Digital Twin tracking, all on web (desktop, tablet, mobile).

---

## 2. What exists today (implemented features)

| Feature | Status | Notes |
|---------|--------|-------|
| **Auth** (email/password, Google OAuth, email verification, password reset) | ✅ Operational | JWT in localStorage; test user seed disabled in prod; admin allowlist |
| **Face scan** (upload/camera → validation → analysis) | ✅ Operational | Magic bytes + dimension checks; mock or OpenAI/Skinive analysis; history persisted |
| **Product scan** (barcode/search → product details) | ✅ Operational | Open Beauty Facts integration; add to shelf |
| **Digital Twin** (timeline, snapshots, before/after) | ✅ Operational | Uses real API data; insights from scan history |
| **Routine builder** (AM/PM, steps, reminders) | ✅ Operational | Load/save via API; check-off tracked |
| **Recommendations** (by concern, product details) | ✅ Operational | DB products + optional Amazon affiliate (when configured) |
| **My Shelf** (track products, ratings, expiry, scan history) | ✅ Operational | CRUD via API; shelf_products table |
| **Favorites** | ✅ Operational | Save products/routines |
| **Profile & settings** (profile data, skin goals, notifications, device context) | ✅ Operational | UserProfile model; onboarding enforced when baseline missing |
| **Progress tracking** (before/after, charts) | ✅ Operational | Uses backend summary metrics |
| **Data export** (GDPR-style export and account deletion) | ✅ Operational | Export as JSON + PDF (jsPDF + html2canvas) |
| **Admin** (dashboard, users, products, catalog, content) | ✅ Operational | Allowlist + is_admin; manage blogs/videos/news |
| **Content** (blog, videos, news, ingredient dictionary, skin-type guide, tutorials, about, contact, privacy, terms) | ✅ Operational | Public routes; cached (5 min) |
| **Notifications** | ✅ Operational | In-app; backend notifications table; bell in header |
| **Today** (daily hub, mobile home) | ✅ Operational | Greeting, skin summary, routine, recommendations |
| **PWA** (install from browser, manifest, icons, service worker) | ✅ Operational | Add to Home Screen; offline hint |
| **Responsive layout** (768 / 1024 / 1280 breakpoints; mobile bottom nav) | ✅ Operational | Three viewports; mobile: Today \| Scan \| Me |

---

## 3. How it works (current architecture)

### Technology stack

#### Frontend
- **Framework:** React 18 (TypeScript, Vite)
- **Routing:** React Router 6
- **HTTP:** Axios (retries, interceptors, JWT)
- **UI:** Lucide icons, CSS (design tokens in index.css), Recharts (charts)
- **ML (optional):** TensorFlow.js (BlazeFace for face validation on upload), MediaPipe (face landmarks), Three.js (3D mesh visualization)

#### Backend
- **Framework:** FastAPI (Python 3.11)
- **Server:** Uvicorn (default 16 workers on Railway)
- **ORM:** SQLAlchemy
- **Auth:** JWT (python-jose), Argon2 (password hashing)
- **Validation:** Pydantic
- **External:** OpenAI API (vision analysis), Skinive (optional), Open Beauty Facts, Google OAuth, SMTP (email verification)
- **Image:** Pillow (validation: magic bytes, dimensions, verify)
- **Rate limit:** In-memory per process (or Redis when REDIS_URL set)

#### Database
- **Main DB:** PostgreSQL (Railway) – users, scans, routines, shelf, digital twin, admin, etc.
- **Product catalog DB (optional):** Separate PostgreSQL (PRODUCT_DATABASE_URL)
- **Connection:** Pool size 20, max overflow 30; indexes via performance_indexes migration

### Hosting (current)

| What | Where | URL / note |
|------|--------|------------|
| **Frontend** | Railway and/or Cloudflare Pages | pellicura.com (production), pellicura.pages.dev |
| **Backend** | Railway | ai-skincare-intelligence-system-production.up.railway.app |
| **Database** | Railway PostgreSQL | Private; backend connects via DATABASE_URL |
| **Optional Redis** | Railway Redis (if set) | For shared rate limiting (REDIS_URL) |

*[Evolving: README mentions Fly.io and staging; current deploy is primarily Railway. Staging setup is documented but may vary.]*

### API structure

- **Base:** `/api/v1`
- **Routers:** auth, scan, profile, digital-twin, routines, shelf, favorites, notifications, goals, products, recommendations, admin, catalog, content, progress
- **Auth:** Bearer JWT; optional guest access for some scan endpoints
- **Health:** `/api/health`, `/api/health/ready`, `/api/health/live`
- **Docs:** `/api/docs` (Swagger UI)

### Middleware (backend)

1. **CORS** – Explicit origins (pellicura.com, Railway, localhost); credentials allowed
2. **GZip** – Compress responses >500 bytes
3. **RateLimiterMiddleware** – 10 req / 60s on `/api/v1/scan` (per IP or Redis)
4. **RequestTracingMiddleware** – Correlation IDs
5. **IPGeoLoggingMiddleware** – Update User.last_ip_address, last_geolocation on auth requests
6. **PerformanceLoggingMiddleware** – Log slow requests (>1s), add X-Response-Time header
7. **Security headers** – X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS (prod), Permissions-Policy, COOP, CORP

### Database migrations

- **Scripts:** `backend/scripts/run_migrations.py`, `backend/migrations/` (Alembic-style and raw SQL)
- **Runs on deploy:** Railway startCommand runs migrations before uvicorn
- **Guards:** Requires `RUN_MIGRATIONS=true` and (for prod) `ALLOW_PROD_MIGRATIONS=true`

---

## 4. What's partial or evolving

| Area | Current state | Notes |
|------|---------------|--------|
| **ML analysis** | Mock results or OpenAI/Skinive | TensorFlow/BlazeFace used for face validation (client-side); backend analysis can be mock (for demo) or external API |
| **Product data** | Open Beauty Facts + optional catalog DB | Some mock products; catalog import scripts exist but not all run in prod |
| **Recommendation engine** | DB query + optional Amazon affiliate | No advanced personalization algorithm yet; uses skin type and concerns |
| **Routine reminders** | Model has reminder_enabled and reminder_time | Push/email notifications not yet sent automatically |
| **What-If simulation** | Model and service exist | UI for simulation not prominent or fully wired |
| **Premium features** | Not implemented | Planned but no paywall or premium tier in code |
| **Offline-first** | PWA with service worker (basic) | No full offline sync; service worker caches assets but not API data |

*[Evolving: These areas are functional for MVP but expected to expand.]*

---

## 5. Known limitations (as of Feb 2026)

1. **Rate limiting:** In-memory per process unless REDIS_URL is set; multi-worker (16) means effective limit is 16 × 10 = 160 scan requests/min without Redis.
2. **JWT in localStorage:** XSS can steal token; no HttpOnly cookie option (documented in audit).
3. **Auth `/me` on mount:** 4s timeout; can delay perceived load if backend is slow (measured via X-Response-Time).
4. **Large ML chunks:** TensorFlow 1.8 MB, three 487 KB; lazy-loaded but still heavy when user visits scan or 3D pages.
5. **No APM:** Logging only; no Sentry or real-time error tracking (audit recommends).
6. **Guest scans:** Allowed by scan_sessions.user_id nullable; no session-based ownership (any guest can view any scan by ID).
7. **Admin:** Allowlist + is_admin flag; no granular roles (e.g. editor, viewer).

*[Open: These are acceptable for current scale; may be addressed in future phases.]*

---

## 6. Likely evolution paths

Based on backlog, audit, and app plan:

### Near-term (Phase 2: Web mobile & polish)
- Harden PWA (precache vendor.js, index.css)
- Split mobile/desktop CSS
- Add response caching (Redis) for shelf/routines
- Self-host Inter font (faster than Google Fonts)
- Stricter image validation (already added magic bytes + dimensions; can add ClamAV later)

### Mid-term (Phase 3: Growth & depth)
- Fill remaining product/recommendation data (more catalog imports)
- Refine Digital Twin (more insights, comparisons)
- Advanced recommendation algorithm (ML-based personalization)
- Routine reminders (push/email on schedule)
- Premium tier (paywall, paid features)

### Long-term (exploratory)
- Native iOS/Android apps (dropped for now; may revisit)
- Offline-first (full sync when reconnected)
- Widget support (home screen widgets)
- White-label (multi-tenant)

*[TBD: Priorities depend on user feedback and business goals.]*

---

## 7. Open questions / TBD

1. **Rebrand to "Alicure"?** – Current brand is Pellicura/SkinCareAI; user mentioned "Alicure (B-E-L-L-I-C-U-R-E)". Clarify if this is a planned rebrand or phonetic reference.
2. **Multiple frontends?** – Railway vs Cloudflare Pages; README mentions both. Confirm which is canonical for prod.
3. **Staging backend:** README mentions pellicura-api-staging.fly.dev; Railway or Fly.io for prod backend? Docs/deploy config should align.
4. **Redis in prod?** – REDIS_URL optional; if multi-instance or high load, should be set. Document recommended for production.
5. **ML model source:** MODEL_SOURCE env (volume or download); currently set to "volume" with path `/models/...`. Confirm model is present in Railway volume or add to deploy checklist.
6. **Admin vs super-admin:** Single is_admin flag + allowlist. Do we need granular roles in future? Mark as TBD.
7. **Cost caps for OpenAI:** No per-user or global cap in code. Add circuit breaker and cost controls in Phase 2/3? Mark as planned.

*[Open: These questions do not block current work; clarify as they become priorities.]*

---

## 8. How to use this document

- **New developers:** Read "What exists today" and "How it works" to understand current system.
- **Planning work:** Check "What's partial or evolving" and "Likely evolution paths" before proposing changes.
- **Agile standups/retros:** Reference "Known limitations" and "Open questions" when prioritizing.
- **Documentation updates:** When adding features, update this doc's "What exists today" and move items from "Partial" to "Operational" or add new "Partial" entries.

### Update protocol

1. **After each sprint or significant change:** Update §2 (What exists), §4 (What's partial), and §5 (Limitations) to reflect new reality.
2. **When plans shift:** Update §6 (Evolution paths) and §7 (Open questions).
3. **When old docs conflict:** Archive outdated docs in `docs/99-archive/` and link from this doc or remove entirely.

---

## 9. Key documents (related)

| Doc | Use |
|-----|-----|
| [README.md](../../README.md) | Quick start, tech stack, getting started |
| [APP-PLAN.md](../03-product/APP-PLAN.md) | Vision, platforms, flows, roadmap (vision + current snapshot) |
| [APP-OVERVIEW-COMPLETE-GUIDE.md](APP-OVERVIEW-COMPLETE-GUIDE.md) | Tech, hosting, features, all routes (reference) |
| [APP-STRUCTURE-AND-FLOW.md](APP-STRUCTURE-AND-FLOW.md) | Layout and nav by viewport |
| [FULL-STACK-SECURITY-DEVOPS-AUDIT-2026.md](../08-audits/FULL-STACK-SECURITY-DEVOPS-AUDIT-2026.md) | Security/DevOps findings and recommendations |
| [PERFORMANCE-OPTIMIZATION-PLAN.md](../06-operations/PERFORMANCE-OPTIMIZATION-PLAN.md) | Speed improvements and next steps |
| [RATE-LIMITING-AND-HEALTHCHECKS.md](../06-operations/RATE-LIMITING-AND-HEALTHCHECKS.md) | Rate limits and Railway health checks |
| [Product-Backlog-V5.md](../03-product/Product-Backlog-V5.md) | Epics and user stories (some done, some planned) |
| [Current-State.md](../06-operations/Current-State.md) | Detailed implementation status (Dec 2025 – Jan 2026 addenda) |

---

## 10. Agile iteration principles (for this doc)

- **Reality first:** Code and deploys define truth; if docs conflict with code, code wins.
- **No false closure:** If something is unclear, mark it [TBD] or [Open]. Don't guess.
- **Expand, don't rewrite:** When adding features, add sections or update tables. Don't delete history unless it's wrong.
- **Version snapshots:** Include "Last synced" date so readers know when this was accurate.
- **Cross-link freely:** Link to other docs for detail; this doc is the map, not the full spec.

---

*This is the master living document for Alicure/Pellicura's current system state. Update after each sprint or major change.*
