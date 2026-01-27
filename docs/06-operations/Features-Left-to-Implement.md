# Features Left to Implement

**Generated:** January 27, 2026  
**Source:** Implementation Status, Feature Traceability, Product Backlog, What We Need Now  
**Status:** Living document — update as items are completed

---

## Summary

| Category | Count | Notes |
|----------|-------|--------|
| High priority | 6 | Product reviews, Consent wiring, Password reset E2E, etc. |
| Medium priority | 7 | Social login, 2FA, email notifications, etc. |
| Low priority / Backlog | 8 | ML cost tracking, Cloudinary, advanced admin, etc. |

---

## 1. High priority (next sprint)

### 1.1 Product reviews system — ✅ DONE (Jan 27, 2026)
- **What:** Backend + frontend for product reviews (ratings, comments).
- **Where:** `ProductDetailsPage`, `backend/app/routers/products.py`.
- **Status:** Complete. Backend has `GET/POST /api/v1/products/{id}/reviews`; frontend shows reviews list, rating distribution, and review submission form.

### 1.2 ConsentPage frontend wiring — ✅ DONE (Jan 27, 2026)
- **What:** Use existing Consent API from ConsentPage instead of localStorage.
- **Where:** `frontend/src/pages/ConsentPage.tsx`.
- **Status:** Complete. Frontend now calls `GET /consent/policies/current`, `GET /consent/status`, and `POST /consent/accept`.

### 1.3 Password reset end-to-end — ✅ DONE (Jan 27, 2026)
- **What:** Ensure request → email → reset link → new password works in production.
- **Where:** `PasswordResetPage.tsx`, `PasswordResetConfirmPage.tsx`, `auth.py`.
- **Status:** Complete. Frontend has request page and confirm page; backend has both endpoints; email sends reset link to `/password-reset/confirm?token=xxx`.

### 1.4 ProductDetailsPage full details API
- **What:** Single product endpoint that returns full details (description, ingredients, reviews placeholder, etc.) for product detail view.
- **Where:** `frontend/src/pages/ProductDetailsPage.tsx`.
- **Backend TODO:** `GET /api/v1/products/{id}/full` or extend existing product endpoint with all fields needed by the detail page.
- **Frontend TODO:** Consume full-details API (and later reviews when 1.1 is done).

### 1.5 E2E test stabilization
- **What:** E2E tests no longer “continue-on-error”; fix or remove flaky tests.
- **Where:** Frontend E2E (e.g. Playwright); `.github/workflows` if CI is involved.
- **TODO:** Fix failing E2E, add/update test credentials (e.g. login), make E2E block or gating where appropriate.

### 1.6 Routine reminder delivery
- **What:** Actually send routine reminders (email or in-app) when user has reminders enabled.
- **Where:** RoutineBuilderPage reminder UI exists; backend notification/email delivery pending.
- **Backend TODO:** Background job or cron to evaluate reminder times and send emails/notifications.
- **Note:** “Email notifications” (section 2.3) covers broader notification types.

---

## 2. Medium priority

### 2.1 Social login (Google / Apple)
- **What:** Sign in with Google (and optionally Apple).
- **Backlog:** US-104 (Product Backlog); P1.
- **TODO:** OAuth integration, account linking, profile auto-fill; frontend “Sign in with Google” etc.

### 2.2 Two-factor authentication (2FA)
- **What:** Optional 2FA for account security.
- **TODO:** Backend (TOTP/backup codes), frontend (setup + challenge), storage of 2FA state.

### 2.3 Email notifications (beyond verification)
- **What:** Routine reminders, progress milestones, product recommendation emails.
- **Where:** SMTP used for verification only today.
- **TODO:** Templates, queue/job for sending, preferences (opt-in/out) and wiring from backend logic.

### 2.4 Push notifications (mobile)
- **What:** Push for mobile when we have native/hybrid apps.
- **TODO:** Backend push provider (FCM/APNs), token storage, send path; mobile client integration.

### 2.5 Digital Twin “simulate” (what-if)
- **What:** Run what-if scenarios (e.g. “if I use product X for 4 weeks”).
- **Where:** `POST /api/v1/digital-twin/simulate` currently returns 501.
- **TODO:** Define semantics, implement simulation logic, expose via API and (if needed) UI.

### 2.6 OpenAI Vision integration for skin analysis
- **What:** Use OpenAI Vision (or similar) for richer skin analysis where applicable.
- **Where:** External ML / inference layer; optional path alongside current ML.
- **TODO:** Call OpenAI Vision from analysis pipeline, map results into existing response shape; feature-flag or env toggle.

### 2.7 Product recommendations algorithm upgrade
- **What:** Move from simplified scoring to full cosine-similarity (or similar) for recommendations.
- **Where:** Recommendations service/endpoint.
- **TODO:** Implement and tune similarity model; keep API contract stable.

---

## 3. Low priority / Backlog

### 3.1 Skinive API integration
- **What:** Use Skinive as another skin-analysis provider.
- **Where:** Service stub exists.
- **TODO:** Implement real Skinive client, error handling, and wiring into scan/analysis flow.

### 3.2 Cloudinary (or similar) for images
- **What:** Use CDN for user/scan images instead of (or in addition to) current storage.
- **TODO:** Cloudinary (or alternative) integration, upload flow, URL usage in scan/results/profile.

### 3.3 ML cost and usage tracking (NFR-ML-4)
- **What:** Track cost per inference / per model for budgeting and alerts.
- **Where:** Inference and external ML paths.
- **TODO:** Logging, metrics, and (optional) admin view for cost/usage.

### 3.4 Advanced admin features
- **What:** User analytics, bulk actions, export, more dashboards.
- **Where:** Admin routes and Admin* pages.
- **TODO:** New endpoints and admin UI for analytics, bulk operations, reports.

### 3.5 API rate limiting (per-user)
- **What:** Per-user or per-API-key rate limits to protect backend and ensure fairness.
- **TODO:** Rate-limit middleware, config (limits per endpoint or per user), and clear error responses.

### 3.6 Mobile quality gating (optional)
- **What:** Optional stricter quality checks for camera captures on mobile.
- **Where:** Scan/face validation flow.
- **TODO:** Define mobile-quality rules and integrate into existing validation.

### 3.7 Contact form backend
- **What:** Persist and/or email contact form submissions.
- **Where:** ContactPage is frontend-only today.
- **TODO:** `POST /api/v1/contact` (or similar), store and/or send email; wire ContactPage.

### 3.8 Data export enhancements
- **What:** Broader export formats, scheduling, or filters (if needed beyond current GDPR export).
- **Where:** `GET /profile/export` and DataExportPage.
- **TODO:** Only if product requests additional export options.

---

## 4. Reference: what’s already done

- Auth (register, login, JWT, email verification).
- Profile (baseline, encryption, onboarding).
- Scan (init, upload, results, history, image).
- Digital Twin (snapshot, query, timeline; simulate still 501).
- Products (catalog, search, analyze, recommendations, scan-product, barcode scan API).
- Routines (CRUD, AM/PM).
- Progress (summary, photos).
- Favorites, Notifications, Shelf, Goals, Password-reset and Barcode-scan APIs (Sprint GUI-2).
- Consent API; Data export; Admin (users, products, summary).
- GDPR (consent, export, delete, audit).

---

## 5. Where this is maintained

- **Implementation status:** `docs/06-operations/Implementation-Status-2026-01-26.md`
- **What we need now:** Section 16 in that document
- **Traceability:** `docs/01-requirements/Feature-Implementation-Traceability-2026-01-26.md`
- **Backlog:** `docs/03-product/Product-Backlog-V5.md`

When a feature is shipped, update this list and the relevant row/section in the above docs.

---

**Last Updated:** January 27, 2026
