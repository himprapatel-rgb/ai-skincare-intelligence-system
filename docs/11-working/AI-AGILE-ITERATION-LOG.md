# AI Agile Iteration Log

Purpose: Track what changed, why, how it was tested, and what’s next.  
This is a living log to enforce the agile workflow from `docs/99-archive/legacy/Archive/Status-Reports/AI_AGILE_WORKFLOW.md`.
Use that workflow doc for checklists and templates to avoid duplication here.

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

