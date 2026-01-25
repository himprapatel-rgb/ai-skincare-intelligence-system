# AI Agile Iteration Log

Purpose: Track what changed, why, how it was tested, and what’s next.  
This is a living log to enforce the agile workflow from `docs/99-archive/legacy/Archive/Status-Reports/AI_AGILE_WORKFLOW.md`.
Use that workflow doc for checklists and templates to avoid duplication here.

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

