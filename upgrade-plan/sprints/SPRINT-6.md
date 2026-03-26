# Sprint 6 — Testing, i18n, Security, Performance, Polish

**Weeks:** 11-12
**Dependencies:** Sprint 5 (all features built)
**Goal:** Production-ready quality — test coverage, internationalization, security hardening, performance optimization.

---

## Track A: Backend Testing (Target: 80% Coverage)

### A1. Test Infrastructure
- Upgrade `conftest.py` with comprehensive fixtures:
  - `test_db` — fresh SQLite database per test
  - `test_user` — pre-created user with profile
  - `admin_user` — admin user
  - `auth_client` — authenticated FastAPI TestClient
  - `admin_client` — admin-authenticated client
  - `mock_openai` — mock OpenAI responses
  - `mock_redis` — mock Redis cache
- **File**: `backend/tests/conftest.py`

### A2. Auth Tests
- Register (happy path, duplicate email, weak password)
- Login (success, wrong password, locked account, unverified)
- Refresh token (valid, expired, blacklisted)
- Logout (token blacklisted)
- Password reset (send, confirm, expired token)
- Google OAuth (success, invalid token)
- Account delete (soft delete, grace period)
- **File**: `backend/tests/test_auth.py`

### A3. Scan Tests
- Init session (auth, guest)
- Upload image (valid, too large, wrong type, bad magic bytes)
- Get status, get results
- History (pagination, filters)
- Delete scan
- Rate limiting (6th scan in hour blocked)
- **File**: `backend/tests/test_scan.py`

### A4. AI Tests
- Recommendations (with profile, without, caching)
- Routine generation
- Ingredient analysis
- Chat: create session, send message, list sessions, delete
- Daily brief
- Ingredient conflicts
- All with mocked OpenAI
- **Files**: `backend/tests/test_ai.py`, `backend/tests/test_ai_chat.py`

### A5. Product/Catalog/Shelf/Favorites/Goals Tests
- Full CRUD per entity
- Pagination, filtering, sorting
- Authorization (own data only)
- **Files**: `backend/tests/test_products.py`, `test_catalog.py`, `test_shelf.py`, `test_favorites.py`, `test_goals.py`

### A6. Clinical Tests
- Derm report generation
- Shareable link (create, access, expired)
- Trends endpoint
- Alerts (create, dismiss)
- Ingredient interaction checker
- Longitudinal analysis
- Benchmark
- **File**: `backend/tests/test_clinical.py`

### A7. Notification Tests
- CRUD, read/read-all, settings
- WebSocket connection (mock)
- Push subscription
- **File**: `backend/tests/test_notifications.py`

### A8. Admin Tests
- Summary, users, products, content CRUD
- Analytics endpoints
- Authorization (non-admin blocked)
- **File**: `backend/tests/test_admin.py`

### A9. Middleware Tests
- Rate limiting (10/60s)
- CORS headers
- Request tracing (correlation ID)
- Performance logging
- Request timeout
- **File**: `backend/tests/test_middleware.py`

### A10. Service Tests
- `test_openai_vision.py` — mock API, validate schema
- `test_ai_intelligence.py` — mock GPT, validate responses
- `test_ingredient_safety.py` — safety DB coverage
- `test_clinical_insights.py` — mock data, validate outputs
- **Directory**: `backend/tests/test_services/`

---

## Track B: Frontend Testing (Target: 60% Component, 80% Hooks)

### B1. UI Component Tests
- Test all 24 `src/ui/` components
- Use Vitest + React Testing Library
- Test: rendering, variants, accessibility, keyboard interaction
- **Directory**: `frontend/src/ui/__tests__/`

### B2. Hook Tests
- `useViewport`, `useDebounce`, `useKeyboardVisible`, `usePullToRefresh`
- Test with mock window/resize events
- **Directory**: `frontend/src/hooks/__tests__/`

### B3. Integration Tests
- Auth flow: login form → submit → dashboard redirect
- Scan flow: upload → processing → results
- Shelf: add → edit → delete
- AI Chat: send message → streaming response
- **Directory**: `frontend/src/__tests__/integration/`

### B4. E2E Tests (Playwright)
- `auth.spec.ts` — register, login, logout
- `scan.spec.ts` — upload, view results
- `products.spec.ts` — search, detail, shelf
- `ai-chat.spec.ts` — open, send, receive
- `clinical.spec.ts` — derm report, alerts
- `responsive.spec.ts` — all pages at 375/768/1440px
- `a11y.spec.ts` — axe audit every page
- `dark-mode.spec.ts` — all pages in dark mode
- **Directory**: `frontend/e2e/`

### B5. Visual Regression
- Playwright screenshots for key pages (3 breakpoints × 2 themes)
- Baseline: capture after all redesigns complete
- CI: compare against baseline on each PR
- **Files**: `frontend/e2e/visual/`

---

## Track C: i18n (Internationalization)

### C1. Install react-i18next
- `npm install react-i18next i18next`
- **File**: `frontend/package.json`

### C2. Configure i18n
- **File**: `frontend/src/i18n/config.ts`
- Namespace-based lazy loading
- Fallback: English
- Detection: user profile `language` → browser → default

### C3. Extract English Strings
- Create translation files per namespace:
  - `common.json` — nav, buttons, labels, errors
  - `auth.json` — login, register, password reset
  - `scan.json` — camera, upload, results
  - `dashboard.json` — widgets, greeting
  - `products.json` — search, detail, shelf
  - `clinical.json` — alerts, report, trends
  - `chat.json` — AI chat strings
  - `settings.json` — profile, notifications, privacy
- **Directory**: `frontend/src/i18n/locales/en/`

### C4. Add I18nextProvider
- Wrap app in provider
- **File**: `frontend/src/App.tsx`

### C5. Language Selector
- Add to ProfileSettingsPage → Preferences tab
- Save to user profile (`language` column)
- **File**: `frontend/src/pages/ProfileSettingsPage.tsx`

### C6. Extract Strings from Core Pages
- Replace hardcoded strings in:
  - AuthPage, DashboardPage, ScanPage, AnalysisResults, MePage
  - AIChatPage, ClinicalDashboardPage
  - AppLayout (nav items)
- Use `const { t } = useTranslation('namespace')`
- **Files**: 15+ page files

---

## Track D: Security Hardening

### D1. Per-endpoint Rate Limiting
- Granular rate limits:
  - `/auth/login` — 5/minute
  - `/auth/register` — 3/minute
  - `/scan/*/upload` — 5/hour
  - `/ai/chat/*/messages` — 50/hour
  - `/admin/*` — 30/minute
- **File**: `backend/middleware/rate_limiter.py`

### D2. Input Validation Audit
- Add `max_length` on all Pydantic string fields
- Verify no raw SQL injection risks
- Audit all `ILIKE` / `text()` queries
- **Files**: `backend/app/schemas/*.py`

### D3. Dependency Audit
- Run `pip-audit` on Python deps
- Run `npm audit` on frontend deps
- Fix all critical/high vulnerabilities
- Add to CI pipeline
- **Files**: CI workflow

### D4. CSRF Protection
- Add CSRF token for state-changing endpoints (POST/PATCH/DELETE)
- Or verify SameSite cookie policy is sufficient for JWT-based auth
- **File**: `backend/app/main.py`

### D5. Content Security Policy
- Tighten CSP header:
  - `script-src 'self'`
  - `style-src 'self' 'unsafe-inline'` (needed for CSS-in-JS/modules)
  - `img-src 'self' data: https://images.unsplash.com https://cdn.pellicura.com`
  - `connect-src 'self' https://api.openai.com wss://api.pellicura.com`
- **File**: `backend/app/main.py`

---

## Track E: Performance Optimization

### E1. Bundle Size Audit
- Run `npx vite-bundle-visualizer`
- Identify largest chunks
- Target: <200KB initial JS
- Actions:
  - Verify TensorFlow.js only loads on ScanPage
  - Verify Three.js only loads on DigitalTwin
  - Verify jsPDF only loads on export
- **File**: `frontend/vite.config.ts`

### E2. Backend Query Optimization
- Add `joinedload` / `selectinload` for N+1 queries
- Especially: scan history (eager load analysis), shelf (eager load product)
- Run `EXPLAIN ANALYZE` on key queries
- **Files**: `backend/app/routers/scan.py`, `shelf.py`, `products.py`

### E3. Image Optimization
- Ensure all product images go through `LazyImage` component
- Add blur-up placeholder (low-res base64)
- Verify `loading="lazy"` on all images
- **File**: `frontend/src/components/LazyImage.tsx`

### E4. Web Vitals Tracking
- Install `web-vitals` package
- Report CLS, LCP, FID to analytics
- **Files**: `frontend/src/utils/webVitals.ts`, `frontend/src/main.tsx`

### E5. API Response Compression
- Verify GZip middleware is working (already exists)
- Add Brotli if supported by Railway
- Add `Cache-Control` headers on GET responses
- **File**: `backend/app/main.py`

---

## Track F: CI/CD Pipeline

### F1. PR Validation Pipeline
```yaml
# .github/workflows/ci.yml
on: pull_request
jobs:
  backend-lint: ruff check + mypy
  backend-test: pytest --cov --cov-fail-under=80
  frontend-lint: biome check + tsc --noEmit
  frontend-test: vitest run --coverage
  frontend-build: npm run build
```
- **File**: `.github/workflows/ci.yml`

### F2. Staging Deploy
```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]
jobs:
  deploy-backend: alembic upgrade head + deploy to Railway staging
  deploy-frontend: npm run build + deploy to Cloudflare preview
  e2e: playwright test against staging
```
- **File**: `.github/workflows/deploy-staging.yml`

### F3. Production Deploy
```yaml
# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
jobs:
  deploy: alembic upgrade head + deploy + smoke test
```
- **File**: `.github/workflows/deploy-production.yml`

### F4. Branch Protection
- Require CI pass on PRs to main
- Require 1 review
- No force push to main/develop
- **Configure**: GitHub repo settings

---

## Track G: Final Polish

### G1. Accessibility Sweep
- Run axe-core on every page
- Fix all critical/serious violations
- Verify keyboard navigation on all interactive elements
- **Tool**: `@axe-core/playwright` in E2E tests

### G2. Dark Mode Sweep
- Visual check every page in dark mode
- Fix contrast issues
- Fix chart/graph colors
- Fix image borders on dark backgrounds

### G3. Responsive Sweep
- Check every page at 375px, 768px, 1024px, 1440px
- Fix overflow issues
- Verify touch targets ≥ 44px on mobile

### G4. Error State Sweep
- Every page has: loading skeleton, error card with retry, empty state
- Verify error boundaries catch unexpected crashes

### G5. Performance Audit
- Run Lighthouse on all core pages
- Target: Performance > 90, Accessibility > 95, Best Practices > 95
- Fix any flagged issues

---

## Verification Checklist (Final)

```bash
# Full test suite
cd backend && python -m pytest tests/ --cov --cov-fail-under=80
cd frontend && npx vitest run --coverage
cd frontend && npx playwright test

# Build
cd frontend && npm run build

# Audits
cd frontend && npx lighthouse http://localhost:5173 --output html
```

- [ ] Backend: ≥80% test coverage
- [ ] Frontend: ≥60% component coverage
- [ ] E2E: all core flows pass
- [ ] Accessibility: zero critical/serious axe violations
- [ ] i18n: English strings extracted, framework working
- [ ] Security: per-endpoint rate limits, input validation, CSP
- [ ] Performance: <200KB initial JS, Lighthouse > 90
- [ ] Dark mode: verified on all pages
- [ ] Responsive: verified at 4 breakpoints
- [ ] CI/CD: PR pipeline, staging deploy, production deploy working
- [ ] All 234 features functional
- [ ] Production-ready
