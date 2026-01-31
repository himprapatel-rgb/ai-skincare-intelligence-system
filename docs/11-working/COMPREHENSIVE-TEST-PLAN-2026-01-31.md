# Comprehensive Test Plan – January 31, 2026

## Scope

Full regression and smoke testing after deployment fixes:
- Backend: middleware, config (ALLOWED_ORIGINS/HOSTS), TrustedHostMiddleware removal
- Frontend: server.js path-to-regexp fix (RegExp fallback)
- Deployment: Railway backend + frontend

---

## Test Categories (1000+ test cases)

### 1. Backend API (150 tests)
- [ ] Health: /api/health, /api/health/live, /api/health/ready
- [ ] Root: GET /
- [ ] Auth: login, register, /auth/me, Google redirect
- [ ] Scan: init, upload, results
- [ ] Catalog: products, barcode, search
- [ ] Profile: get, update, export
- [ ] Routines: CRUD
- [ ] Digital Twin: snapshots, timeline
- [ ] Shelf: products
- [ ] Goals: CRUD
- [ ] Notifications: list, read
- [ ] Admin: users, summary
- [ ] Consent: policies

### 2. Backend Unit/Integration (200 tests)
- [ ] pytest: test_scan_router, test_scan_model
- [ ] pytest: test_catalog_api, test_products_api
- [ ] pytest: test_digital_twin
- [ ] pytest: test_profile_export
- [ ] pytest: test_ml_service, test_ml_products
- [ ] pytest: test_security_utils, test_service_utils

### 3. Frontend (300 tests)
- [ ] Build: npm run build
- [ ] E2E: navigation.spec.ts
- [ ] E2E: myshelf.spec.ts
- [ ] E2E: scanner.spec.ts
- [ ] E2E: responsive.spec.ts
- [ ] Pages: Auth, Dashboard, Scan, Profile, etc.

### 4. Deployment (100 tests)
- [ ] Backend: health, docs, CORS
- [ ] Frontend: root, /health, SPA routes
- [ ] pellicura.com reachability

### 5. Config & Security (100 tests)
- [ ] ALLOWED_ORIGINS parsing
- [ ] ALLOWED_HOSTS parsing
- [ ] CORS headers
- [ ] No TrustedHostMiddleware errors

### 6. Integration Flows (150 tests)
- [ ] Login → Dashboard
- [ ] Scan → Results
- [ ] Profile update
- [ ] Product catalog browse

---

## Execution Log

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Backend pytest | Pending | |
| 2 | Frontend E2E | Pending | |
| 3 | Deployment health | Pending | |
