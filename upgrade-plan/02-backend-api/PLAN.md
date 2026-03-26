# Backend API Upgrades

**Sprint:** 2-4 (Weeks 3-8)
**Team Size:** 40 engineers
**Dependencies:** Database schema (Sprint 1)

---

## Upgrade Summary by Router

### Auth Router — `/api/v1/auth`
**Current:** register, login, OAuth Google, password reset, email verify (7 endpoints)
**File:** `app/api/v1/endpoints/auth.py`

| Change | Type | Sprint |
|--------|------|--------|
| Add `POST /auth/refresh` — refresh token rotation | New endpoint | 2 |
| Add `POST /auth/logout` — server-side token blacklist (Redis) | New endpoint | 2 |
| Add `POST /auth/magic-link` — passwordless email login | New endpoint | 3 |
| Add `DELETE /auth/account` — GDPR soft delete + 30-day grace | New endpoint | 2 |
| Add account lockout after 5 failed attempts | Improvement | 2 |
| Add device fingerprint + "new device" email alert | Improvement | 4 |
| Standardize all error responses to `{detail, code, status}` | Fix | 2 |
| Fix duplicate scan router registration (api_router + main.py both mount) | Bug fix | 2 |

### Scan Router — `/api/v1/scan`
**Current:** init, upload, status, results, history, delete (7 endpoints)
**File:** `app/routers/scan.py` (664 lines) + `app/api/v1/endpoints/scan.py` (duplicate)

| Change | Type | Sprint |
|--------|------|--------|
| **Deduplicate** two scan routers into one | Refactor | 2 |
| Add cursor-based pagination to `/scan/history` | Improvement | 2 |
| Add `GET /scan/{id}/image` — serve from R2 | New endpoint | 2 |
| Add `POST /scan/{id}/feedback` — user rates accuracy | New endpoint | 3 |
| Add `GET /scan/stats` — counts, averages, trend | New endpoint | 3 |
| Add `WS /scan/{id}/progress` — WebSocket real-time progress | New endpoint | 4 |
| Add `POST /scan/validate-image` — pre-upload quality check | New endpoint | 3 |
| Move image storage from BYTEA to R2 | Improvement | 2 |
| Move analysis to background task queue (arq) | Improvement | 3 |
| Add rate limit: 5 scans/hour per user | Improvement | 2 |

### AI Router — `/api/v1/ai`
**Current:** recommendations, routine, ingredients, notifications, content, predict, compare, trends (8 endpoints)
**File:** `app/routers/ai.py` (344 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `POST /ai/chat` — SSE streaming chat | New endpoint | 2 |
| Add `POST /ai/chat/sessions` — create session | New endpoint | 2 |
| Add `GET /ai/chat/sessions` — list sessions | New endpoint | 2 |
| Add `GET /ai/chat/sessions/{id}/messages` — get messages | New endpoint | 2 |
| Add `GET /ai/daily-brief` — personalized daily skin brief | New endpoint | 3 |
| Add `POST /ai/ingredient-conflicts` — check two products | New endpoint | 3 |
| Add Redis caching: 1-hour per user, invalidate on new scan | Improvement | 2 |
| Add token usage tracking per AI call | Improvement | 2 |
| Add fallback: return cached response if OpenAI is down | Improvement | 3 |
| Add SSE streaming for long AI responses | Improvement | 2 |

### Products Router — `/api/v1/products`
**Current:** search, barcode, recommendations, analyze, reviews, scan-barcode, identify-from-image (8 endpoints)
**File:** `app/routers/products.py` (1161 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add pagination envelope: `{data, total, page, per_page, has_more}` | Improvement | 2 |
| Add `GET /products/categories` — list categories | New endpoint | 3 |
| Add `GET /products/brands` — list brands with counts | New endpoint | 3 |
| Add `GET /products/{id}/similar` — similar products | New endpoint | 3 |
| Add sorting: `sort_by=price\|rating\|name\|newest` | Improvement | 2 |
| Add price range filter: `min_price`, `max_price` | Improvement | 2 |
| Add multi-select skin type/concern filters | Improvement | 2 |
| Replace `ILIKE` with PostgreSQL full-text search | Improvement | 3 |
| Add ETag caching for product detail pages | Improvement | 3 |

### Catalog Router — `/api/v1/catalog`
**Current:** barcode, lookup, search, CRUD, categories, brands, ingredients, safe-for, pregnancy-safe, vegan (20 endpoints)
**File:** `app/routers/catalog.py` (866 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add pagination to all list endpoints | Improvement | 2 |
| Add `POST /catalog/bulk-import` — CSV/JSON import | New endpoint | 4 |
| Add `GET /catalog/trending` — trending products | New endpoint | 4 |

### Profile Router — `/api/v1/profile`
**Current:** CRUD, photo upload, baseline, export, delete (6 endpoints)
**File:** `app/routers/profile.py` (494 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `GET /profile/completion-guide` — missing fields + hints | New endpoint | 3 |
| Add `GET /profile/skin-type-quiz` — guided determination | New endpoint | 3 |
| Upload profile photo to R2 CDN | Improvement | 2 |
| Add rate limiting: 1 export/hour | Improvement | 2 |

### Shelf Router — `/api/v1/shelf`
**Current:** CRUD, routine by type (5 endpoints)
**File:** `app/routers/shelf.py` (394 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `POST /shelf/batch` — add multiple products | New endpoint | 3 |
| Add `GET /shelf/expiring-soon` — products expiring in 30 days | New endpoint | 3 |
| Add `GET /shelf/stats` — totals by category/status | New endpoint | 3 |
| Add `PATCH /shelf/{id}/reorder` — drag-reorder | New endpoint | 3 |
| Add pagination + filtering | Improvement | 2 |

### Favorites Router — `/api/v1/favorites`
**Current:** CRUD, check (5 endpoints)
**File:** `app/routers/favorites.py` (275 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `GET /favorites/collections` — organize into folders | New endpoint | 4 |
| Add `POST /favorites/collections` — create collection | New endpoint | 4 |
| Add pagination and sorting | Improvement | 3 |

### Notifications Router — `/api/v1/notifications`
**Current:** CRUD, read/read-all, settings, check-reminders (8 endpoints)
**File:** `app/routers/notifications.py` (361 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `WS /notifications/live` — real-time WebSocket push | New endpoint | 4 |
| Add `GET /notifications/unread-count` — lightweight polling | New endpoint | 3 |
| Add `DELETE /notifications/read` — bulk delete read | New endpoint | 3 |
| Add `POST /notifications/subscribe` — Web Push registration | New endpoint | 4 |
| Add cursor-based pagination | Improvement | 3 |
| Add notification grouping by category | Improvement | 4 |

### Goals Router — `/api/v1/goals`
**Current:** types, CRUD, progress (7 endpoints)
**File:** `app/routers/goals.py` (379 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `GET /goals/suggested` — AI-suggested goals from scan | New endpoint | 3 |
| Add `GET /goals/timeline` — visualization data | New endpoint | 3 |
| Add `POST /goals/{id}/milestones` — add milestone | New endpoint | 3 |
| Auto-update progress when new scan completes | Improvement | 3 |

### Digital Twin Router — `/api/v1/digital-twin`
**Current:** snapshot, query, timeline, simulate (4 endpoints)
**File:** `app/routers/digital_twin.py` (555 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `GET /digital-twin/compare/{id1}/{id2}` — side-by-side | New endpoint | 3 |
| Add `GET /digital-twin/heatmap/{snapshot_id}` — region data | New endpoint | 3 |
| Add `POST /digital-twin/what-if` — product impact simulation | New endpoint | 4 |
| Add `GET /digital-twin/insights` — AI insights from history | New endpoint | 4 |
| Add pagination on timeline | Improvement | 3 |

### Content Router — `/api/v1/content`
**Current:** blogs, videos, news (4 endpoints)
**File:** `app/routers/content.py` (83 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add pagination to all lists | Improvement | 3 |
| Add `GET /content/blogs/{slug}` — get by slug | New endpoint | 3 |
| Add `POST /content/blogs/{id}/like` — like/unlike | New endpoint | 4 |
| Add `GET /content/search` — full-text search | New endpoint | 4 |
| Add view count tracking | Improvement | 3 |

### Consent Router — `/api/v1/consent`
**Current:** policies, accept, status, withdraw (4 endpoints)
**File:** `app/routers/consent.py` (207 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `POST /consent/export-data` — GDPR data portability | New endpoint | 3 |
| Add `POST /consent/delete-data` — right to be forgotten | New endpoint | 3 |
| Add consent audit trail endpoint | New endpoint | 4 |

### Admin Router — `/api/v1/admin`
**Current:** seed, health, users CRUD, products CRUD, content CRUD, upload-image (20+ endpoints)
**File:** `app/routers/admin.py` (811 lines)

| Change | Type | Sprint |
|--------|------|--------|
| Add `GET /admin/analytics/dashboard` — DAU, MAU, retention | New endpoint | 5 |
| Add `GET /admin/analytics/scans` — scan volume + success rate | New endpoint | 5 |
| Add `GET /admin/analytics/users` — growth, churn, engagement | New endpoint | 5 |
| Add `GET /admin/audit-log` — admin action audit trail | New endpoint | 4 |
| Add `POST /admin/feature-flags` — feature flag management | New endpoint | 5 |
| Add `GET /admin/system/health` — detailed system health | New endpoint | 4 |
| Add proper RBAC: super_admin, content_admin, support | Improvement | 4 |

---

## New Routers

### Search Router — `/api/v1/search` (Sprint 4)
```
GET  /search              — unified search (products, ingredients, blogs)
GET  /search/suggestions  — typeahead autocomplete
```
Backed by PostgreSQL full-text search + pg_trgm. Track queries in `search_queries` table.

### Clinical Router — `/api/v1/clinical` (Sprint 5)
```
GET  /clinical/report/{scan_id}       — generate dermatologist PDF report
POST /clinical/share-report           — create secure shareable link
GET  /clinical/trends                 — skin health trend analysis over time
GET  /clinical/alerts                 — active skin health alerts
POST /clinical/alerts/{id}/dismiss    — dismiss an alert
GET  /clinical/correlations           — environmental factor correlations
POST /clinical/ingredient-check       — full safety check with drug interactions + pregnancy
GET  /clinical/benchmark              — anonymized comparative benchmarking (opt-in)
POST /clinical/longitudinal-analysis  — AI analysis across multiple scans over time
```

### AI Chat Router — `/api/v1/ai/chat` (Sprint 2)
```
POST   /ai/chat/sessions                    — create session
GET    /ai/chat/sessions                    — list sessions
GET    /ai/chat/sessions/{id}/messages      — get messages
POST   /ai/chat/sessions/{id}/messages      — send message (SSE streaming)
DELETE /ai/chat/sessions/{id}               — delete session
```

---

## Infrastructure Upgrades

### Background Task Queue (Sprint 2)
- Install `arq` (async Redis queue)
- Tasks: scan processing, email sending, skin alert monitoring, notification scheduling, data exports, nightly analytics
- File: `backend/app/tasks/` — new directory

### WebSocket Manager (Sprint 4)
- FastAPI WebSocket endpoints for: scan progress, live notifications, chat streaming
- Redis Pub/Sub for multi-worker coordination
- File: `backend/app/core/websocket.py` — new

### Caching Strategy (Sprint 2)
- Redis caching with TTL:
  - Product catalog: 1 hour
  - AI recommendations: 1 hour per user (invalidate on new scan)
  - User profile: 5 minutes
  - Blog/content: 10 minutes
  - Search results: 5 minutes
- Add `Cache-Control` + `ETag` headers on GET responses

### Email System (Sprint 3)
- Replace basic SMTP with SendGrid/Postmark
- Templates: welcome, verification, password reset, weekly digest, scan results, expiring products
- Background queue for sending
- File: `backend/app/services/email_service.py` — rewrite

### Error Handling (Sprint 2)
- Standardize all errors: `{detail: str, code: str, status: int, timestamp: str}`
- Custom exceptions: `NotFoundError`, `ValidationError`, `AuthError`, `RateLimitError`, `AIServiceError`
- Sentry integration for error tracking
- Structured JSON logging with correlation IDs

---

## Endpoint Count Summary

| Category | Current | After Upgrade |
|----------|---------|---------------|
| Auth | 7 | 12 |
| Scan | 7 | 13 |
| AI | 8 | 17 |
| Products | 8 | 14 |
| Catalog | 20 | 23 |
| Profile | 6 | 9 |
| Shelf | 5 | 10 |
| Favorites | 5 | 8 |
| Notifications | 8 | 13 |
| Goals | 7 | 11 |
| Digital Twin | 4 | 9 |
| Content | 4 | 9 |
| Consent | 4 | 7 |
| Admin | 20 | 28 |
| Search | 0 | 2 |
| Clinical | 0 | 9 |
| AI Chat | 0 | 5 |
| **Total** | **113** | **~200** |
