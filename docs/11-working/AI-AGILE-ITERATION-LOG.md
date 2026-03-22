# AI Agile Iteration Log

Purpose: Track what changed, why, how it was tested, and what’s next.  
This log is part of our [traditional agile iteration cycle](../AGILE-ITERATION-GUIDE.md). Use [07-sprints/SPRINT-TEMPLATE.md](../07-sprints/SPRINT-TEMPLATE.md) and [09-reports/RETROSPECTIVE-TEMPLATE.md](../09-reports/RETROSPECTIVE-TEMPLATE.md) for sprint summary and retro.

---

## Iteration 2026-03-22 (CI Postgres, tooling, frontend TS, ops scripts)

### Goal
Restore **CI - Tests** on `main`, keep local tooling documented, clear TypeScript debt, and add safe DB inspection without pasting secrets.

### Scope (Completed)
- **`.github/workflows/ci-tests.yml`**: Set `ALLOW_TEST_DB=true`, align `TEST_DATABASE_URL` / `PRODUCT_DATABASE_URL` with the Actions Postgres service; fix `pip install` indentation in the install step.
- **`.gitignore`**: Ignore `.tools/` (portable Git/Python).
- **`.vscode/settings.json`**: Prepend `PATH` with `backend\.venv\Scripts`, MinGit, portable Python (Cursor terminals).
- **Frontend**: `@types/three`; fix `mobile/index.ts` bogus type re-exports; `AuthPageFixed` remove invalid `clearTimeout`; `faceValidation` / `ScanPage` / `TodayPage` / mobile+perf utils TypeScript fixes; product scan panel `Suspense` without invalid `ErrorCard` props.
- **`backend/scripts/list_db_tables.py`**: List `public` tables using `DATABASE_PUBLIC_URL` when run via `railway run -s Postgres`.
- **`deploy-frontend.yml`**: Comment linking to **Settings → Pages** (Actions source) for 404 deploy failures.
- **Docs**: This log entry; **ACTIVE-TASKS** refreshed (Pages enable + CI verify).

### Key Changes (Code)
- `.github/workflows/ci-tests.yml`, `.github/workflows/deploy-frontend.yml`
- `.gitignore`, `.vscode/settings.json`
- `frontend/package.json`, `frontend/package-lock.json`, multiple `frontend/src/**`
- `backend/scripts/list_db_tables.py`

### Verification / Tests
- Local: `frontend` — `npm run typecheck`, `npm run lint`, `npm run test -- --run` (pass).
- Local: `backend` — `pytest tests/ --no-cov` with venv (pass before this commit).
- **GitHub**: Push required; confirm **CI - Tests** and re-run **Deploy Frontend** after enabling Pages.

### Risks / Follow-ups
- **`backend/.venv` was tracked in git** — remove from index in this iteration (do not commit venv contents).
- **Secrets**: If `DATABASE_URL` was ever pasted in chat, rotate Railway Postgres password.
- **PRs #2 / #3**: Merge, split, or close manually.

### Post-push fix (same day)
- **`product_catalog.search`**: Use `search_vector.match(query)` with plain text only; removed nested `plainto_tsquery` that caused `UndefinedFunction: plainto_tsquery(tsquery)` under CI Postgres.
- **CI - Tests** run `23394041751`: **success** on `main`.

### 2026-03-22 (continued)
- **`style(backend): isort`**: Ran `isort` with `profile=black` on backend; **Backend CI/CD** run `23394213670` **success**.
- **`daily-ai-agile-reminder.yml`**: Fixed embedded script syntax (apostrophe in `you've` broke `github-script`); use plain wording and `join('\n')`.

---

## Iteration 2026-01-27 (Database Tables & Startup Fix)

### Goal
Ensure all database tables are created at startup and fix potential registration issues.

### Problem
- Services returning 404 from Railway (deployment issue)
- `ProductReview` table from recent commit not included in startup table creation
- Individual table creation was fragmented, some tables missing

### Scope (Completed)
- **main.py**: Import ALL model files to ensure tables are registered with Base
- **main.py**: Replace individual `__table__.create()` calls with `Base.metadata.create_all()`
- **Database docs**: Updated with comprehensive table creation strategy and model file reference
- **Database docs**: Added sections for adding new fields and external data integration

### Key Changes (Code)
- `backend/app/main.py` — comprehensive model imports + `create_all()` at startup
- `docs/02-architecture/Database-Design-Extensible.md` — updated with table creation strategy

### Verification / Tests
- No lint errors in main.py
- Deployment needed to verify tables are created

### Risks / Follow-ups
- Railway services currently showing 404 (deployment issue, not code)
- After redeploy, all tables including `product_reviews` will be created automatically

---

## Iteration 2026-01-27 (Password Reset E2E)

### Goal
Complete password reset end-to-end flow with confirmation page.

### Scope (Completed)
- **New page:** `PasswordResetConfirmPage.tsx` — reads token from URL, lets user enter new password, calls confirm API.
- **Route:** Added `/password-reset/confirm` route in App.tsx.
- **CSS:** Added success/error icon states and form-hint styling.
- **Flow:** Request → email sent → user clicks link → lands on confirm page → enters new password → redirected to login.

### Key Changes (Code)
- `frontend/src/pages/PasswordResetConfirmPage.tsx` — new file
- `frontend/src/App.tsx` — added import and route
- `frontend/src/pages/PasswordResetPage.css` — added success/error icon styles, form-hint

### Key Changes (Docs)
- `docs/06-operations/Features-Left-to-Implement.md` — marked 1.3 done
- `docs/11-working/AI-AGILE-ITERATION-LOG.md` — this entry

### Verification / Tests
- No lint errors.
- Manual test: request reset → check email → click link → enter password → success.

### Risks / Follow-ups
- Ensure SMTP is configured in production for emails to send.

---

## Iteration 2026-01-27 (Product Reviews System)

### Goal
Implement product reviews system — backend API + frontend UI.

### Scope (Completed)
- **Backend model:** `ProductReview` in `product_models.py` with rating, title, comment, skin_type, would_recommend, verified_purchase, helpful_count.
- **Backend schemas:** `ReviewCreate`, `ReviewResponse`, `ReviewsListResponse` in `product_schemas.py`.
- **Backend endpoints:**
  - `GET /api/v1/products/{product_id}/reviews` — paginated reviews with rating distribution
  - `POST /api/v1/products/{product_id}/reviews` — create review (auth required, one per user per product)
- **Frontend:** ProductDetailsPage Reviews tab now shows:
  - Reviews list with user name, rating, title, comment, skin type, date
  - Average rating and rating distribution bars
  - Review submission form with star rating, title, comment, skin type, would_recommend
- **CSS:** Full styling for review form, summary, and list.

### Key Changes (Code)
- `backend/app/models/product_models.py` — added `ProductReview`
- `backend/app/schemas/product_schemas.py` — added review schemas
- `backend/app/routers/products.py` — added reviews endpoints
- `frontend/src/pages/ProductDetailsPage.tsx` — reviews fetch, display, submit
- `frontend/src/pages/ProductDetailsPage.css` — review styling

### Key Changes (Docs)
- `docs/06-operations/Features-Left-to-Implement.md` — marked 1.1 done
- `docs/11-working/AI-AGILE-ITERATION-LOG.md` — this entry

### Verification / Tests
- No lint errors in changed files.
- Manual test: visit product page, click Reviews tab, submit review.

### Risks / Follow-ups
- Database migration needed in production to create `product_reviews` table.
- `verified_purchase` not yet calculated from shelf (TODO).

---

## Iteration 2026-01-27 (ConsentPage API Wiring)

### Goal
Wire ConsentPage frontend to real backend Consent API.

### Scope (Completed)
- ConsentPage now calls `GET /consent/policies/current` on mount to fetch policy versions.
- ConsentPage now calls `GET /consent/status` to check for existing consent.
- ConsentPage now calls `POST /consent/accept` on submit with `terms_accepted`, `privacy_accepted`, and version strings.
- Backend `consent.py` fixed to properly set `terms_accepted` and `privacy_accepted` fields.
- Backend `consent.py` returns proper `ConsentResponse` with boolean fields.
- Added loading state and "existing consent" notice to ConsentPage.
- Updated footer date to January 2026.
- Added CSS for `.consent-existing-notice`.

### Key Changes (Code)
- Frontend consent wiring: `frontend/src/pages/ConsentPage.tsx`
- Frontend CSS: `frontend/src/pages/ConsentPage.css`
- Backend consent router fix: `backend/app/routers/consent.py`

### Key Changes (Docs)
- Iteration log: `docs/11-working/AI-AGILE-ITERATION-LOG.md`

### Verification / Tests
- No lint errors in ConsentPage.tsx or consent.py.
- Manual test: visit `/consent`, verify policies load, submit, verify API called.

### Risks / Follow-ups
- Granular consents (analytics, marketing, thirdParty) still stored in localStorage; backend schema extension is optional future work.

---

## Iteration 2026-01-27 (Email Verification + Docs Update)

### Goal
Confirm email verification is working and update all docs per protocol.

### Scope (Completed)
- Email verification confirmed working after SMTP password (Gmail App Password) updated in Railway.
- FavoritesPage import fix: changed `import api from '../services/api'` to `import { api } from '../services/api'` (named export).
- Digital Twin empty-state reverted to original simple design (dt-card + "Start a Scan" button).
- Current-State, Implementation-Status, Required-Secrets, and docs README updated per protocol.

### Key Changes (Code)
- FavoritesPage API import: `frontend/src/pages/FavoritesPage.tsx`
- Digital Twin empty state reverted: `frontend/src/pages/DigitalTwinTimelinePage.tsx`
- Digital Twin empty-state CSS removed: `frontend/src/components/digital-twin/styles/digital-twin.css`

### Key Changes (Docs)
- Iteration log: `docs/11-working/AI-AGILE-ITERATION-LOG.md`
- Current state addendum: `docs/06-operations/Current-State.md`
- Implementation status + What We Need Now: `docs/06-operations/Implementation-Status-2026-01-26.md`
- Required secrets (SMTP/encryption): `docs/05-deployment/Required-Secrets.md`
- Docs index: `docs/README.md`

### Verification / Tests
- Backend logs: `POST /api/v1/auth/verify-email/request` returns 200 OK; no "Failed to send verification email" in logs.
- Register → verify-email/request → verify-email → login flow confirmed working in production.
- Frontend build: FavoritesPage import fix unblocks `npm run build`.

### Risks / Follow-ups
- None. Email verification, onboarding (ENCRYPTION_KEY/ENCRYPTION_SALT), and frontend build are operational.

---

## Iteration 2026-01-26 (Global GUI Polish)

### Goal
Apply quick global UI polish across all pages within the 1-hour timebox.

### Scope (Completed)
- Added Digital Twin navigation access in header/footer.
- Standardized empty-state styling and added Digital Twin empty CTA.
- Tightened shared UI spacing and utility styling for page headers/buttons.

### Key Changes (Code)
- Global layout polish + empty state styles: `frontend/src/components/AppLayout.css`
- Navigation links: `frontend/src/components/AppLayout.tsx`
- Digital Twin empty state CTA: `frontend/src/pages/DigitalTwinTimelinePage.tsx`

### Key Changes (Docs)
- Iteration log update: `docs/11-working/AI-AGILE-ITERATION-LOG.md`

### Verification / Tests
- Frontend: `npm run test -- --run`
- Frontend e2e: `npm run e2e` (6 skipped: login requires valid E2E credentials)

### Risks / Follow-ups
- Re-check nav density on small screens if more links are added.

---

## Iteration 2026-01-26 (CI SQLite UUID Compile Fix)

### Goal
Unblock CI tests by ensuring UUID columns compile under SQLite.

### Scope (Completed)
- Added SQLite UUID compilation override in test setup.

### Key Changes (Code)
- SQLite UUID compiler shim: `backend/tests/conftest.py`

### Verification / Tests
- Backend: `python -m pytest tests -k digital_twin` (failed coverage gate at 47% on partial run)
- CI - Tests (GitHub Actions): succeeded; warnings for Pydantic deprecations.

### Risks / Follow-ups
- CI will re-run full suite; verify coverage and UUID compilation there.

---

## Iteration 2026-01-26 (Digital Twin MVP Completion)

### Goal
Complete Epic 3 (Digital Twin) MVP using scan-based snapshots, summary insights, and UI polish.

### Scope (Completed)
- Digital Twin API now derives snapshots/timeline from scan sessions.
- Summary insights added (trend, best improvement, top concern).
- Digital Twin UI shows latest snapshot summary + insights, including top concerns.
- Added backend and frontend tests for Digital Twin.

### Key Changes (Code)
- Scan-based Digital Twin mapping + insights: `backend/app/routers/digital_twin.py`
- Digital Twin UI insights + mood mapping: `frontend/src/pages/DigitalTwinTimelinePage.tsx`
- Backend test coverage: `backend/tests/test_digital_twin.py`
- Frontend test coverage: `frontend/src/tests/DigitalTwinTimelinePage.test.tsx`

### Verification / Tests
- Backend: `python -m pytest backend/tests -k digital_twin`
- Frontend: `npm run test -- --run`
- Frontend e2e: `npm run e2e` (Digital Twin route)

---

## Iteration 2026-01-26 (Admin UI Lint Fix + Deploy + Test Pass)

### Goal
Clear frontend lint warnings, deploy the fix, and re-validate production with E2E.

### Scope (Completed)
- Fixed admin page hook dependencies to satisfy lint rules.
- Deployed frontend to Railway.
- Re-ran frontend lint/unit/E2E against production.
- Re-ran backend test suite.

### Key Changes (Code)
- Hook deps memoization: `frontend/src/pages/AdminProductsPage.tsx`, `frontend/src/pages/AdminUsersPage.tsx`

### Verification / Tests
- Backend: `python -m pytest` (23 passed, 4 skipped; coverage 52.72%)
- Frontend lint: `npm run lint`
- Frontend unit: `npm run test -- --run`
- Frontend e2e (prod): `npm run e2e` with `PLAYWRIGHT_BASE_URL=https://frontend-production-0415.up.railway.app`

---

## Iteration 2026-01-26 (Digital Twin + Routine + Progress + Admin MVP)

### Goal
Ship MVP functionality for Digital Twin, Routine Builder, Progress Tracking, and Admin Dashboard.

### Scope (Completed)
- Digital Twin timeline now pulls from backend snapshots.
- Routine builder loads and saves AM/PM routines via API.
- Progress tracking uses backend summary metrics.
- Admin dashboard added with user/product management and analytics summary.
- Admin access control via allowlist + is_admin flag.

### Key Changes (Code)
- Digital twin API integration: `frontend/src/pages/DigitalTwinTimelinePage.tsx`
- Progress summary endpoint: `backend/app/api/v1/progress.py`
- Routine updates with products: `backend/app/api/v1/routines.py`
- Admin APIs + summary counts: `backend/app/routers/admin.py`
- Admin UI pages/routes: `frontend/src/pages/AdminDashboardPage.tsx`, `AdminUsersPage.tsx`, `AdminProductsPage.tsx`, `frontend/src/App.tsx`

### Key Changes (Docs)
- Backlog updates: `docs/03-product/Product-Backlog-V5.md`
- Traceability updates: `docs/01-requirements/Traceability-Matrix.md`
- Current state addendum: `docs/06-operations/Current-State.md`
- Required secrets update: `docs/05-deployment/Required-Secrets.md`

### Verification / Tests
- Not run in this iteration (manual verification pending).

---

## Iteration 2026-01-25 (ScanPage Hook Cleanup + Test Run)

### Goal
Clear hook lint warnings and complete requested test runs.

### Scope (Completed)
- Memoized camera helper callbacks to stabilize hook dependencies.
- Updated hook dependency arrays for `getFriendlyError`.
- Ran frontend lint and Playwright suites.

### Key Changes (Code)
- Hook dependency cleanup: `frontend/src/pages/ScanPage.tsx`

### Verification / Tests
- Frontend lint: `npm run lint`
- Frontend e2e: `npm run e2e` (3 skipped, 1 passed)

---

## Iteration 2026-01-25 (Email Verification + Skin Questionnaire)

### Goal
Ship email verification and ensure onboarding captures skin questionnaire data.

### Scope (Completed)
- Added email verification tokens and verification endpoints.
- Enforced verification before authenticated access.
- Routed authenticated users without a profile to onboarding.
- Added SMTP delivery for verification emails.

### Key Changes (Code)
- Auth verification endpoints: `backend/app/api/v1/endpoints/auth.py`
- User model verification fields: `backend/app/models/user.py`
- Auth guard for unverified users: `backend/app/core/security.py`
- SMTP email service: `backend/app/services/email_service.py`
- Verification UI: `frontend/src/pages/EmailVerificationPage.tsx`
- Auth flow routing: `frontend/src/pages/AuthPage.tsx`

### Key Changes (Docs)
- Iteration log update: `docs/11-working/AI-AGILE-ITERATION-LOG.md`
- Product tracker: `docs/03-product/Product-Tracker.md`
- Traceability matrix: `docs/01-requirements/Traceability-Matrix.md`
- Current state addendum: `docs/06-operations/Current-State.md`

### Verification / Tests
- Manual: verify email request + confirm flow.
- Manual: onboarding questionnaire route after login/register.

---

## Iteration 2026-01-25 (Profile Settings Modernization)

### Goal
Modernize the profile settings experience while keeping the existing color system.

### Scope (Completed)
- Rebuilt profile layout with sidebar navigation and summary card.
- Added quick stats and clearer header with unsaved status.
- Simplified the personal tab by moving avatar controls to the sidebar.
- Updated layout styling to match current SaaS settings patterns.
- Added section cards and clearer subtitles per 2026 UI patterns.

### Key Changes (Code)
- Profile layout + navigation: `frontend/src/pages/ProfileSettingsPage.tsx`
- Profile styling refresh: `frontend/src/pages/ProfileSettingsPage.css`

### Key Changes (Docs)
- Iteration log update: `docs/11-working/AI-AGILE-ITERATION-LOG.md`
- Product tracker: `docs/03-product/Product-Tracker.md`
- Traceability matrix: `docs/01-requirements/Traceability-Matrix.md`
- Design changelog: `frontend/DESIGN-CHANGELOG.md`
- GUI polish summary: `frontend/GUI-POLISH-SUMMARY.md`
- Current state addendum: `docs/06-operations/Current-State.md`
- Index entry confirmed: `docs/00-index/README.md`

### Verification / Tests
- Manual: profile layout checked in browser.
- Deploy: Railway frontend deployed; logs reviewed.

### Risks / Follow-ups
- Validate mobile layout spacing for sidebar collapse.
- Accessibility review for sidebar navigation focus states.

---

## Iteration 2026-01-25 (Camera Capture UX + Background Masking)

### Goal
Improve camera capture UX so only usable face images proceed, without blocking desktop users.

### Scope (Completed)
- Tuned auto-capture alignment + hold timer with live guidance.
- Added pre-validation flow that freezes the capture frame before accepting.
- Expanded face crop padding and oval mask to keep full face in-frame.
- Disabled live quality blocking on desktop to avoid user friction.
- Maintained alignment checks (single face, centered, front-facing).

### Key Changes (Code)
- Camera capture flow + live guidance: `frontend/src/pages/ScanPage.tsx`
- Capture UI and overlay updates: `frontend/src/pages/ScanPage.css`
- Face crop + validation updates: `frontend/src/utils/faceValidation.ts`
- Background segmentation helper: `frontend/src/utils/backgroundSegmentation.ts`

### Key Changes (Docs)
- Iteration protocol rule: `docs/11-working/AGILE-ITERATION-PROTOCOL.md`
- Iteration log update: `docs/11-working/AI-AGILE-ITERATION-LOG.md`
- Backlog update: `docs/03-product/Product-Backlog-V5.md`
- Current state addendum: `docs/06-operations/Current-State.md`

### Verification / Tests
- Manual: camera capture flow validated in production.
- Deploy: Railway frontend deploys verified; logs checked.

### Risks / Follow-ups
- True background removal requires segmentation (mobile-focused).
- Re-enable stricter quality checks for mobile/tablet app.

---

## Iteration 2026-01-23 (Selfie Validation + Oval Crop)

### Goal
Ensure scans only accept a clear, front-facing face and crop to an oval face image.

### Scope (Completed)
- Added face validation (single face, size threshold, centered, minimal tilt).
- Implemented oval face crop and replaced uploaded file with cropped image.
- Added friendly, actionable error messaging for rejected selfies.
- Added validation status messaging in the scan UI.

### Key Changes (Code)
- Face validation + oval crop: `frontend/src/utils/faceValidation.ts`
- Scan flow integration: `frontend/src/pages/ScanPage.tsx`
- Validation UI styles: `frontend/src/pages/ScanPage.css`

### Verification / Tests
- Manual: pending (requires live camera/upload validation)

---

## Iteration 2026-01-24 (Profile Export Reliability + Tests)

### Goal
Stabilize profile export responses and add automated coverage for profile actions.

### Scope (Completed)
- Fixed profile response serialization for encrypted concerns.
- Guarded export timestamps when profile dates are null.
- Added Playwright coverage for profile actions (upload + navigation).
- Added backend tests for profile export, baseline, and update flows.
- Added frontend unit test for authenticated footer link state.

### Key Changes (Code)
- Profile export/response fixes: `backend/app/routers/profile.py`
- Backend tests: `backend/tests/test_profile_export.py`
- Playwright flow: `frontend/tests/e2e/navigation.spec.ts`
- AppLayout test: `frontend/src/tests/AppLayout.test.tsx`

### Verification / Tests
- Backend: `python -m pytest tests/test_profile_export.py -v`
- Frontend: `npm run test -- --run`

---

## Iteration 2026-01-23 (Profile UX + DB Safety Guard)

### Goal
Resolve Profile Settings UX bugs, align stats, and prevent tests from touching production DB.

### Scope (Completed)
- Fixed Profile Settings actions: password reset, connected accounts notice, export data, delete flow, and comparison navigation.
- Enabled profile photo upload with clear CTA, help text, and preview.
- Added inline validation, unsaved changes indicator, and success/error toast feedback.
- Implemented progress chart with scan history data and aligned stats with dashboard.
- Updated footer auth link to show "My Account" when logged in.
- Hardened test DB config to require explicit `TEST_DATABASE_URL` and `ALLOW_TEST_DB=true`.
- Strengthened migrations to enforce PK constraints on `products` and `ingredients`.

### Key Changes (Code)
- Profile UX + stats: `frontend/src/pages/ProfileSettingsPage.tsx`, `frontend/src/pages/ProfileSettingsPage.css`
- Navigation state: `frontend/src/components/AppLayout.tsx`
- Recommendations polish: `frontend/src/pages/Recommendations.tsx`, `frontend/src/pages/Recommendations.css`
- Notifications UI consistency: `frontend/src/pages/NotificationCenterPage.tsx`, `frontend/src/pages/NotificationCenterPage.css`
- Spinner cleanup: `frontend/src/components/LoadingSpinner.tsx`, `frontend/src/index.css`
- Loading rings theme alignment: `frontend/src/components/LoadingScreen.css`
- Test DB safety guard: `backend/tests/conftest.py`
- Migration PK enforcement: `backend/scripts/run_migrations.py`

### Key Changes (Docs)
- Manual UX checklist: `docs/11-working/UX-MANUAL-SMOKE-CHECKLIST.md`
- Design updates recorded in `frontend/DESIGN-CHANGELOG.md` and `frontend/GUI-POLISH-SUMMARY.md`

### Verification / Tests
- Playwright navigation suite: ✅
- Railway deploys: ✅ Frontend + Backend
- Postgres logs: historical noise only (no new errors after deploy)

---

## Iteration 2026-01-21 (OpenAI Vision Cutover)

### Goal
Replace YouCam with OpenAI Vision, ensure scan flow works end-to-end, keep CI green.

### Scope (Completed)
- Replaced YouCam with OpenAI Vision analysis across backend scan pipeline.
- Removed YouCam service + tests + docs.
- Added OpenAI config/env vars and updated docs/README.
- Fixed scan routing duplication (single scan router).
- Fixed guest scan query logic.
- Fixed frontend typing + lint errors in `AnalysisResults.tsx`.
- Added internal OpenAI health check endpoint.

### Key Changes (Code)
- New OpenAI client: `backend/app/services/openai_vision_service.py`
- OpenAI configs: `backend/app/config.py`
- Scan pipeline (OpenAI): `backend/app/api/v1/endpoints/scan.py` and `backend/app/routers/scan.py`
- Scan router duplication removed: `backend/app/main.py`
- Frontend parsing for OpenAI summary: `frontend/src/pages/AnalysisResults.tsx`
- Internal health check: `backend/app/api/v1/endpoints/internal.py`

### Key Changes (Docs)
- New master API doc: `docs/OPEN API _ AI_Skincare_Full_API_Master_Document.md`
- Updated required secrets: `docs/05-deployment/Required-Secrets.md`
- Deprecated/removed YouCam docs under `docs/youcam-external-api/`
- Marked Skinive plan as deprecated: `docs/11-working/skinive-api-integration.md`

### Environment Variables (Prod)
Required for OpenAI Vision:
- `OPENAI_API_KEY`
- `OPENAI_API_BASE` (default `https://api.openai.com/v1`)
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `OPENAI_TIMEOUT_SECONDS` (default `60`)

### Verification / Tests
GitHub Actions:
- Frontend CI: ✅
- Deploy Frontend to GitHub Pages: ✅
- CI Tests: ✅

API Smoke Tests (Railway prod):
- `POST /api/v1/scan/init` ✅
- `POST /api/v1/scan/{scan_id}/upload` ✅
- `GET /api/v1/scan/{scan_id}/status` ✅
- `GET /api/v1/scan/{scan_id}/results` ✅
- `GET /api/v1/scan/actions` ✅

OpenAI Health Check:
- `GET /api/v1/internal/openai/health` (with `X-SUMMARY-TOKEN`) ✅

### Example Result (OpenAI live)
`provider: "openai"`, `analysis` object present, `model_version: "gpt-4o-mini"`.

---

## Iteration 2026-01-21 (Data Persistence Enhancements)

### Goal
Ensure registration, profile updates, and scan data are fully persisted in Railway DB.

### Scope (Completed)
- Added `/api/v1/auth/register` endpoint for user creation.
- Stored scan image bytes + metadata in `scan_sessions`.
- Added DB columns for image storage on startup (Postgres).
- Expanded profile update to save all detailed fields.
- Enriched profile data export with scan recommendations + metadata.

### Key Changes (Code)
- Registration endpoint: `backend/app/api/v1/endpoints/auth.py`
- Scan image persistence: `backend/app/api/v1/endpoints/scan.py`
- Scan model fields: `backend/app/models/scan.py`
- Startup DB column ensure: `backend/app/main.py`
- Full profile update/response: `backend/app/routers/profile.py`

### Verification / Tests
- Not run (manual/CI pending).

---

## Iteration 2026-01-21 (Extensible Database Foundations)

### Goal
Design and implement an extensible schema to store all scan outputs, future skin conditions, geo data, and recommendations.

### Scope (Completed)
- Added models to store raw/normalized scan outputs, conditions, and recommendations.
- Added geo, environment, guidance, and store availability tables for future expansion.
- Added product scan, routine check-in, notification, and offer tables for roadmap features.
- Updated scan pipeline to persist raw OpenAI outputs and condition details.
- Updated migration runner to be non-destructive and create new tables safely.
- Documented the extensible schema in architecture docs.

### Key Changes (Code)
- New models: `backend/app/models/analysis_outputs.py`
- Scan persistence updates: `backend/app/api/v1/endpoints/scan.py`
- Non-destructive schema creation: `backend/scripts/run_migrations.py`
- Model registry: `backend/app/models/__init__.py`

### Key Changes (Docs)
- Extensible schema design: `docs/02-architecture/Database-Design-Extensible.md`
- Index update: `docs/00-index/README.md`

### Verification / Tests
- `python -m pytest backend/tests/test_scan_model.py` (fails coverage threshold: 44% < 50%).

---

## Backlog (Next Iteration Suggestions)
1. Add structured persistence for OpenAI fields (model_version, processing_time_ms) in DB schema.
2. Add optional image storage retention policy + cleanup job.
3. Add integration tests for OpenAI schema validation (mocked).
4. Add API-level rate limit / cost guardrails.
5. Update frontend to display OpenAI `analysis.notes` and `concerns_detail`.

---

## Risks / Watchlist
- OpenAI billing/credits: failure will fall back to mock unless blocked explicitly.
- Latency: vision calls may be slower; consider async/background job.
- Data privacy: ensure image retention policy is explicit for production.

---

