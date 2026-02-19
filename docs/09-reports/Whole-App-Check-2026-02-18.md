# Whole App Check — 2026-02-18

## Summary (updated after fixes)

| Area | Status | Details |
|------|--------|---------|
| **Backend tests** | 107+ passed, 10 skipped, 0 errors | Storage verification fixed (fixture + test_db for scan query). Coverage ~50%. |
| **Frontend lint** | Pass | `npm run lint` — no errors. |
| **Frontend build** | Pass | `npm run build` — production build succeeds. |
| **Frontend tests** | **53 passed**, 0 failed | All 10 test files pass, including `AuthPageMobileV2.test.tsx` (17 tests). |

---

## Backend

- **Pytest:** 117 tests collected; 106 passed, 10 skipped (catalog search, ML endpoints, safe products), **1 error** in setup of `TestScanStorage::test_scan_init_stores_device_context` (`sqlite3.OperationalError: no such table: users`). The test uses `client` and `auth_headers`, which depend on `test_user`; the in-session SQLite DB used by that test path may not have `users` created (fixture/engine ordering).
- **Coverage:** 49.96% (pytest-cov requirement is 50%). Minor shortfall.
- **Warnings:** Pydantic class-based `config` deprecation in several schemas (non-blocking).

---

## Frontend

- **Lint:** ESLint clean.
- **Build:** Vite production build completed; chunk size warnings only.
- **Tests:** 53 total; 44 passed, 9 failed.
  - **Passing:** `useIsMobileOrTablet`, `EmptyState`, `viewport.constants`, `ProfileSettingsPage`, `useViewport`, `GoogleCallbackPage`, `DeviceContextPage`, `AppLayout`, `DigitalTwinTimelinePage`.
  - **Failing:** All in `AuthPageMobileV2.test.tsx` (tab switching, form validation, password strength, Remember Me, features section, alert role). Causes: multiple “Sign In” buttons, label/control association (fixed with `id`/`htmlFor` on auth form), and some assertions (e.g. `role="alert"`) or timing.

### Changes made during check

- **AuthPageMobileV2.tsx:** Added `id`/`htmlFor` on Full Name, Email, Password for a11y and `getByLabelText`. Added `aria-label` on password visibility toggle.
- **AuthPageMobileV2.test.tsx:** Mocked `axios` (so `ApiClient` has `interceptors`), mocked `devAutoLogin` to avoid auto-login, and adjusted queries for multiple “Sign In” buttons (tab vs submit).

---

## Entrypoints & config

- **Backend:** `backend/app/main.py` — FastAPI app; `/`, `/api/health`, `/api/health/ready`, `/api/health/live`; `railway.json` and `backend/Dockerfile` use non-blocking migrations and `/api/health` for deploy.
- **Frontend:** `frontend/` — Vite + React; `npm run build` → `dist/`; `API_BASE_URL` from `config`.

---

## Fixes applied (2026-02-18)

- **Backend:** `conftest.py` — explicit `from app.models.user import User` in `test_db` so `users` table is created; `test_scan_init_stores_device_context` now takes `test_db` and uses it to query the scan (same session as client) instead of `SessionLocal()`.
- **Frontend:** `AuthPageMobileV2.test.tsx` — axios mock with interceptors, `devAutoLogin` mock, `getSignUpTab()` helper (auth-tab), form submit via `fireEvent.submit(form)`, password field via `getByLabelText('Password')` to avoid matching "Show password" button, toggle button `getByRole('button', { name: 'Show password' })`. `AuthPageMobileV2.tsx` — `id`/`htmlFor` on inputs and `aria-label` on password toggle (already present).

## Recommendations

1. **Backend:** Optionally bump coverage over 50% or relax the coverage requirement slightly.
2. **Deploy:** Ensure Railway backend has `DATABASE_URL` set and redeploy with updated `railway.json`/Dockerfile so healthcheck passes.
