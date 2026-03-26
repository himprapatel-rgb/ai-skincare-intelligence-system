# Testing & DevOps

**Sprint:** Parallel throughout (Weeks 1-12)
**Team Size:** 15 engineers
**Dependencies:** None (starts immediately)

---

## TD1. Backend Testing

### Current State
- ~15 test files with limited coverage
- Tests use `test_token_<email>` pattern for auth
- SQLite test database

### Target: 80% line coverage

#### Test Infrastructure
```
backend/tests/
├── conftest.py              — fixtures: test DB, test user, auth client, mock OpenAI
├── test_auth.py             — login, register, refresh, logout, OAuth, MFA
├── test_scan.py             — init, upload, validate, analyze, results, history
├── test_ai.py               — recommendations, routine, ingredients, chat
├── test_ai_chat.py          — chat sessions, messages, streaming
├── test_products.py         — search, barcode, reviews, similar
├── test_catalog.py          — CRUD, search, filters, bulk import
├── test_profile.py          — CRUD, photo upload, skin quiz, export
├── test_shelf.py            — CRUD, batch, expiring, stats, reorder
├── test_favorites.py        — CRUD, collections, check
├── test_notifications.py    — CRUD, settings, WebSocket, push subscribe
├── test_goals.py            — CRUD, milestones, suggested, auto-progress
├── test_digital_twin.py     — snapshot, timeline, simulate, compare
├── test_content.py          — blogs, videos, news, search, likes
├── test_consent.py          — policies, accept, withdraw, export, delete
├── test_admin.py            — summary, users, products, content, analytics
├── test_community.py        — posts, comments, likes, reports, moderation
├── test_achievements.py     — triggers, progress, streaks, XP
├── test_search.py           — unified search, suggestions, analytics
├── test_middleware.py        — rate limit, CORS, tracing, performance
├── test_services/
│   ├── test_openai_vision.py    — mock OpenAI, validate schema
│   ├── test_ai_intelligence.py  — mock GPT, validate responses
│   ├── test_ai_chat.py          — mock streaming, context injection
│   ├── test_ingredient_safety.py — safety DB coverage
│   ├── test_storage.py          — R2 upload/download mocking
│   └── test_email.py            — SMTP mocking
└── test_models/
    ├── test_user.py             — user model constraints
    ├── test_scan.py             — scan model relationships
    └── test_product.py          — product model indexes
```

#### Key Test Patterns
```python
# conftest.py fixtures
@pytest.fixture
def db():
    """Fresh test database per test."""

@pytest.fixture
def client(db):
    """FastAPI TestClient with test DB."""

@pytest.fixture
def auth_client(client, test_user):
    """Authenticated client with JWT token."""

@pytest.fixture
def admin_client(client, admin_user):
    """Admin-authenticated client."""

@pytest.fixture
def mock_openai(monkeypatch):
    """Mock OpenAI API responses."""
```

#### What to Test per Endpoint
- Happy path (200/201 response, correct data)
- Authentication required (401 without token)
- Authorization (403 for non-admin on admin endpoints)
- Validation (422 for bad input)
- Not found (404 for missing resources)
- Rate limiting (429 after threshold)
- Pagination (correct page/total/has_more)
- Filtering/sorting (correct query behavior)
- Error responses (consistent format)

---

## TD2. Frontend Testing

### Current State
- ~8 test files
- Playwright E2E setup exists

### Target: 60% component coverage, 80% hooks/utils coverage

#### Unit Tests (Vitest)
```
frontend/src/
├── ui/__tests__/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Card.test.tsx
│   ├── Modal.test.tsx
│   ├── Sheet.test.tsx
│   ├── Tabs.test.tsx
│   ├── ... (all 24 ui components)
├── hooks/__tests__/
│   ├── useViewport.test.ts
│   ├── useDebounce.test.ts
│   ├── useKeyboardVisible.test.ts
│   ├── usePullToRefresh.test.ts
│   └── ... (all custom hooks)
├── utils/__tests__/
│   ├── imageCompression.test.ts
│   ├── formatRelativeTime.test.ts
│   ├── faceValidation.test.ts
│   └── ... (all utility functions)
```

#### Integration Tests (Vitest + React Testing Library)
- Auth flow: login form → submit → redirect to dashboard
- Scan flow: upload → processing → results display
- Shelf: add product → appears in list → edit → delete
- Profile: edit fields → save → verify updated

#### E2E Tests (Playwright)
```
frontend/e2e/
├── auth.spec.ts          — register, login, logout, password reset
├── scan.spec.ts          — upload image, view results, view history
├── products.spec.ts      — search, view detail, add to shelf
├── shelf.spec.ts         — add, edit, remove products
├── routine.spec.ts       — create routine, reorder, check-in
├── profile.spec.ts       — edit profile, upload photo
├── ai-chat.spec.ts       — open chat, send message, view response
├── community.spec.ts     — create post, like, comment
├── admin.spec.ts         — user management, content CRUD
├── responsive.spec.ts    — all pages at 375px, 768px, 1440px
├── a11y.spec.ts          — axe accessibility audit on all pages
└── dark-mode.spec.ts     — all pages in dark mode
```

#### Visual Regression (Playwright)
- Screenshot comparison for key pages at 3 breakpoints
- Light + dark mode screenshots
- `npx playwright test --update-snapshots` to update baselines

#### Accessibility Tests
```typescript
// a11y.spec.ts
import AxeBuilder from '@axe-core/playwright';

test('dashboard has no a11y violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## TD3. CI/CD Pipeline

### Current State
- 18 GitHub Actions workflows (many daily agent workflows)
- No clear PR validation pipeline

### Target Pipeline

#### On Pull Request: `ci.yml`
```yaml
name: CI
on: pull_request
jobs:
  backend-lint:
    - ruff check backend/
    - mypy backend/app/
  backend-test:
    - pytest tests/ -x --cov --cov-fail-under=80
  frontend-lint:
    - biome check frontend/src/
    - tsc --noEmit
  frontend-test:
    - vitest run --coverage
  frontend-build:
    - npm run build
  api-codegen:
    - orval --check  # verify generated client is up to date
```

#### On Merge to develop: `deploy-staging.yml`
```yaml
name: Deploy Staging
on:
  push:
    branches: [develop]
jobs:
  deploy-backend:
    - alembic upgrade head
    - deploy to Railway staging
  deploy-frontend:
    - npm run build
    - deploy to Cloudflare Pages preview
  e2e-staging:
    - playwright test against staging URL
```

#### On Merge to main: `deploy-production.yml`
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy-backend:
    - alembic upgrade head
    - deploy to Railway production
    - smoke test: curl /api/health
  deploy-frontend:
    - npm run build
    - deploy to Cloudflare Pages production
  smoke-test:
    - playwright test smoke.spec.ts against production
```

### Cleanup
- Remove/consolidate 6+ daily agent workflows
- Add branch protection: require CI pass + 1 review on main
- Add Dependabot for dependency vulnerability scanning

---

## TD4. Monitoring & Observability

### Error Tracking (Sentry)
```python
# Backend
import sentry_sdk
sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)
```
```typescript
// Frontend
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 });
```

### Structured Logging
```python
# Replace print/logger.info with structured JSON
{
  "timestamp": "2026-03-26T10:00:00Z",
  "level": "INFO",
  "message": "Scan completed",
  "trace_id": "abc-123",
  "user_id": 42,
  "scan_id": "uuid",
  "duration_ms": 3500,
  "model": "gpt-4v"
}
```

### Metrics (Prometheus)
Expose at `GET /metrics`:
- `http_requests_total{method, path, status}` — request count
- `http_request_duration_seconds{method, path}` — latency histogram
- `db_pool_size`, `db_pool_checked_out` — pool stats
- `ai_api_requests_total{endpoint, model}` — AI call count
- `ai_api_duration_seconds{endpoint}` — AI latency
- `ai_api_tokens_total{model}` — token usage
- `websocket_connections_active` — WS connections
- `scan_processing_duration_seconds` — scan analysis time
- `cache_hits_total`, `cache_misses_total` — cache effectiveness

### Uptime Monitoring
- External health check every 60s (UptimeRobot or similar)
- Alert on: `/api/health` returns non-200 for 2+ consecutive checks
- Alert on: error rate > 5% over 5 minutes
- Alert on: p95 latency > 2s over 5 minutes

### Dashboard
- Grafana or Railway's built-in metrics
- Key panels: request rate, error rate, latency p50/p95/p99, DB pool, AI cost

---

## TD5. Security Hardening

### Sprint 6

| Item | Current | Target |
|------|---------|--------|
| CSRF | None | Add CSRF tokens for state-changing endpoints |
| Rate limiting | Global 10/60s | Per-endpoint granular limits |
| API keys | None | Add API key support for programmatic access |
| Dependency audit | Manual | Automated Dependabot + `pip-audit` in CI |
| Secrets scanning | None | Add GitHub secret scanning |
| CSP | Basic | Full Content-Security-Policy header |
| Input validation | Pydantic | Add max-length on all string fields |
| SQL injection | Mostly safe | Audit all raw SQL queries |
| File upload | Magic bytes check | Add virus scan for uploaded images |

### OWASP Top 10 Checklist
- [x] A01 Broken Access Control — JWT auth, admin checks
- [x] A02 Cryptographic Failures — Argon2, AES-256, TLS
- [ ] A03 Injection — audit raw SQL, parameterize all queries
- [x] A04 Insecure Design — rate limiting, timeouts
- [ ] A05 Security Misconfiguration — audit all default configs
- [x] A06 Vulnerable Components — add Dependabot
- [x] A07 Auth Failures — account lockout, MFA
- [ ] A08 Software/Data Integrity — add SRI hashes for CDN assets
- [x] A09 Logging — structured logging with trace IDs
- [ ] A10 SSRF — audit all outbound HTTP calls

---

## Deliverables per Sprint

| Sprint | Testing Deliverable |
|--------|-------------------|
| 1 | Test infrastructure setup, conftest.py, CI pipeline |
| 2 | Auth + scan + product endpoint tests (30% coverage) |
| 3 | AI + profile + shelf tests (50% coverage), frontend unit tests |
| 4 | E2E tests for core flows, a11y audits |
| 5 | Community + gamification tests (70% coverage) |
| 6 | Full coverage (80% backend, 60% frontend), security audit, performance testing |
