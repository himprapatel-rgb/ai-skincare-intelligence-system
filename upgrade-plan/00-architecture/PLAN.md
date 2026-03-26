# Architecture & Foundation Upgrades

**Sprint:** 1 (Weeks 1-2)
**Team Size:** 15 engineers
**Dependencies:** None (first to start)

---

## A1. Monorepo & Build Tooling

### Current Problems
- `requirements.txt` uses `>=` version pins — non-reproducible builds
- No shared linting/formatting config across frontend + backend
- No pre-commit hooks enforcing code quality

### Changes
1. Pin all Python dependencies to exact versions (`==`) in `requirements.txt`
2. Add `pyproject.toml` with ruff + mypy + black config
3. Add `pre-commit` hooks: ruff, mypy, biome, commitlint
4. Add Biome (or dprint) for frontend formatting alongside ESLint

### Files
- `backend/requirements.txt` — pin versions
- `backend/pyproject.toml` — new
- `.pre-commit-config.yaml` — new
- `frontend/.biomerc.json` — new

---

## A2. API Contract First (OpenAPI → TypeScript)

### Current Problems
- 9 hand-written API service files (`api.ts`, `scanApi.ts`, `aiService.ts`, `catalogService.ts`, `profileApi.ts`, `notificationService.ts`, `apiOptimized.ts`, `deviceContextService.ts`, `cameraService.ts`)
- Types manually maintained, drift from backend schemas
- No compile-time safety for API calls

### Changes
1. Generate OpenAPI 3.1 spec from FastAPI (`/openapi.json` already exists)
2. Install `orval` to auto-generate TypeScript API client + React Query hooks from the spec
3. Replace hand-written Axios calls with generated clients
4. Add CI step: regenerate client on backend schema changes

### Files
- `frontend/orval.config.ts` — new
- `frontend/src/api/` — generated client (replaces `services/`)
- `frontend/package.json` — add orval dev dependency
- CI workflow — add codegen step

---

## A3. State Management Migration

### Current Problems
- 6 context providers doing manual fetch + cache + setState
- `ScanContext`, `ShelfContext`, `NotificationContext` re-implement caching logic that TanStack Query handles
- Zustand stores (`analysisStore.ts`, `authStore.ts`) overlap with contexts
- No automatic background refetching or cache invalidation

### Changes
1. Install TanStack Query v5 (`@tanstack/react-query`)
2. Add `QueryClientProvider` to App.tsx
3. Migrate server-state contexts:

| Context | Migration |
|---------|-----------|
| `AuthContext` | Keep as Context (auth = client state), add query invalidation |
| `ScanContext` | → TanStack Query: `useQuery(['scans', userId])` |
| `ShelfContext` | → TanStack Query: `useQuery(['shelf', userId])` |
| `NotificationContext` | → TanStack Query: `useQuery(['notifications'])` |
| `ThemeContext` | Keep as Context (client state) |
| `ToastContext` | Keep as Context (client state) |

4. Create `frontend/src/api/queryKeys.ts` — namespaced query key factory
5. Remove Zustand stores (`analysisStore.ts`, `authStore.ts`)

### Files
- `frontend/src/App.tsx` — add QueryClientProvider
- `frontend/src/api/queryKeys.ts` — new
- `frontend/src/context/ScanContext.tsx` — rewrite with useQuery
- `frontend/src/context/ShelfContext.tsx` — rewrite with useQuery
- `frontend/src/context/NotificationContext.tsx` — rewrite with useQuery
- Delete: `frontend/src/stores/analysisStore.ts`, `authStore.ts`

---

## A4. Design Token Pipeline

### Current Problems
- Tokens duplicated across `index.css :root`, `design-system.css :root`, `dark-mode.css`
- No single source of truth
- 12+ style files with overlapping rules

### Changes
1. Create `frontend/src/tokens/tokens.json` as single source of truth
2. Build script generates `tokens.css` (light) + `tokens-dark.css` (dark) from JSON
3. Consolidate remaining global styles into 4 files:
   - `tokens.css` — generated from tokens.json
   - `base.css` — resets, typography, global element styles
   - `utilities.css` — responsive helpers, safe-area utils
   - `dark-mode.css` — generated dark overrides
4. Delete merged files: `mobile-gradients.css`, `clinical-clean.css`, `ui-polish-2026.css`, `designer-hotfix.css`, `page-block-polish.css`

### Files
- `frontend/src/tokens/tokens.json` — new (single source of truth)
- `frontend/src/tokens/build.js` — new (token → CSS generator)
- `frontend/src/styles/tokens.css` — generated
- `frontend/src/styles/base.css` — consolidated
- `frontend/src/styles/utilities.css` — consolidated
- `frontend/src/index.css` — reduce to 4 imports
- Delete: 5-8 redundant style files

---

## A5. Image Storage Migration

### Current Problems
- Scan images stored as `BYTEA` column in `scan_sessions` table
- Bloats database, makes backups huge
- Code uses `defer(ScanSession.image_data)` to avoid loading images on every query

### Changes
1. Set up Cloudflare R2 bucket for image storage
2. Create `backend/app/services/storage_service.py`:
   - `upload_image(file, key) → url`
   - `get_signed_url(key) → url`
   - `delete_image(key)`
3. Add migration: copy existing BYTEA images to R2, store key in new `storage_key` column
4. Add `scan_images` table (id, scan_session_id, storage_backend, storage_key, content_type, file_size_bytes, width, height, created_at)
5. Update scan upload endpoint to write to R2 instead of BYTEA

### Files
- `backend/app/services/storage_service.py` — new
- `backend/app/models/scan_images.py` — new
- `backend/alembic/versions/xxx_add_scan_images.py` — migration
- `backend/app/routers/scan.py` — update upload logic
- `backend/app/config.py` — add R2 credentials

---

## Verification Checklist
- [ ] `cd backend && python -m pytest tests/ -x -q` — all pass
- [ ] `cd frontend && npm run build` — zero errors
- [ ] `cd frontend && npx orval` — generates API client without errors
- [ ] OpenAPI spec at `/openapi.json` includes all endpoints
- [ ] Token JSON → CSS generation produces valid CSS
- [ ] R2 upload/download works in staging
