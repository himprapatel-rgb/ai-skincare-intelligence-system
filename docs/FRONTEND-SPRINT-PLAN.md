# Frontend Sprint Plan  Sprint F2 (Web App)

**Scope:** Web frontend only (`frontend/` folder)
**Duration:** 2 weeks
**Goal:** Deliver a working **Face Scan & Results** flow that talks to the existing backend API, plus stabilize Sprint1 onboarding/profile flows and set the stage for Digital Twin visualization.

---

## 1. Sprint Goal

Deliver an endtoend **Face Scan** experience on the web app that:

1. Lets a loggedin user open a **Scan Page** and see the camera preview.
2. Captures a face image and sends it to the backend scan API.
3. Displays parsed scan results (concern scores, skin type, confidence) using the `scan` types.
4. Handles errors gracefully and matches the UX/quality goals in the Product Backlog (performance, accessibility).

**Alignment:**

- **EPIC 2: Face Scan & AI Analysis**  guided scan UI, detection, scores.
- **EPIC 18: UX/Design System**  consistent components and accessibility.
- **SRS V5 Enhanced**  sections 4.2 (AI Skin Analysis) and 4.3 (Skin Mood Index) as future integration targets.

---

## 2. Current State Summary

Based on the repo structure and docs:

- `frontend/package.json` exists with dependencies including React, TypeScript, TensorFlow.js, and camera libraries; marked as "dependencies added (TensorFlow.js, camera)".
- `frontend/src/types/scan.ts` is implemented with strong TypeScript types for scan results.
- `frontend/src` currently contains:
  - `services/`  API & ML services skeleton
  - `features/onboarding/` and `features/profile/`  Sprint1.2 flows
  - `pages/`  route pages
  - `App.tsx` and `main.tsx`  entrypoints
- `docs/Sprint-2-Frontend-Implementation-Reference.md` says:
  - **Completed:** `frontend/package.json`, `frontend/src/types/scan.ts`
  - **To create:**
    - `frontend/src/services/api.ts`
    - `frontend/src/services/scanApi.ts`
    - `frontend/src/services/mlService.ts`
    - `frontend/src/features/scan/components/FaceScanCamera.tsx`
    - `frontend/src/features/scan/components/ScanResults.tsx`
    - `frontend/src/features/scan/ScanPage.tsx`
    - `frontend/src/features/scan/components/ScanResults.css`
- Backend CI/CD is stable and the frontend is configured for deployment (Vite, GitHub Pages, Railway backend URL).

---

## 3. Sprint Backlog (Frontend)

### 3.1 Services Layer (Priority 1  must finish)

#### Story F201  Base API Client

- **Path:** `frontend/src/services/api.ts`
- **Summary:** Create a typed Axios client configured with:
  - Base URL: Railway backend URL from the docs.
  - JSON defaults, timeout, and error normalization.
- **Acceptance criteria:**
  - Uses `axios.create({ baseURL, timeout })`.
  - Interceptors map errors into a simple typed shape, e.g. `{ message, statusCode, details? }`.
  - Exported helpers like `get<T>`, `post<T>` are fully typed.
  - No hardcoded secrets; base URL comes from environment config (`import.meta.env`).

#### Story F202  Scan API Service

- **Path:** `frontend/src/services/scanApi.ts`
- **Summary:** Implement functions that call backend scan endpoints using `api.ts`.
- **Acceptance criteria:**
  - `uploadScan(image: Blob | File): Promise<ScanResult>` and `getScan(scanId: string): Promise<ScanResult>` use types from `src/types/scan.ts`.
  - HTTP/network errors are surfaced as typed error objects.
  - Includes minimal unit tests (Jest/Vitest) mocking `api.ts`.

#### Story F203  TensorFlow.js ML Service

- **Path:** `frontend/src/services/mlService.ts`
- **Summary:** Wrap TensorFlow.js / BlazeFace model required in the Sprint2 reference.
- **Acceptance criteria:**
  - Lazyloads the model and exposes functions like `detectFace(video: HTMLVideoElement)` returning bounding box/landmarks.
  - Handles loading/error states (e.g. `ModelLoadingError`).
  - No model file paths hardcoded; configuration via constants.

---

### 3.2 Scan UI & Flow (Priority 2  core feature)

#### Story F204  FaceScanCamera Component

- **Path:** `frontend/src/features/scan/components/FaceScanCamera.tsx`
- **Summary:** Camera component that:
  - Requests webcam permission.
  - Shows live video preview.
  - Uses `mlService` to detect face and draw an overlay (rectangle/guide).
- **Acceptance criteria:**
  - React functional component with hooks (per implementation notes).
  - Supports start/stop and surfaces `onCapture(imageBlob)` to parent.
  - Accessible: focusable controls, ARIA labels, clear permission error messages.
  - Works with a standard laptop webcam in Chrome/Edge.

#### Story F205  ScanResults Component

- **Path:** `frontend/src/features/scan/components/ScanResults.tsx`
- **Summary:** Presentational component for scan results.
- **Acceptance criteria:**
  - Accepts a `ScanResult` prop typed from `scan.ts`.
  - Renders concern scores, skin type, and optional explanation text.
  - Handles "loading", "empty", and "error" states gracefully.
  - Includes responsive styling in `ScanResults.css`.

#### Story F206  ScanPage

- **Path:** `frontend/src/features/scan/ScanPage.tsx`
- **Summary:** Orchestrates camera, API calls, and results.
- **Acceptance criteria:**
  - Implements a simple state machine: `idle → capturing → uploading → showingResults | error`.
  - Calls `scanApi.uploadScan` with captured image and passes response to `ScanResults`.
  - Integrates with router as page component (e.g. via `/scan` route).
  - Uses shared error UI (reusing any existing error component under `src/components/` if available).

#### Story F207  Scan Page Routing & Navigation

- **Paths:**
  - `frontend/src/pages/ScanPageRoute.tsx` (if using page wrappers), and/or
  - `App.tsx` / routing config.
- **Acceptance criteria:**
  - `/scan` route is reachable from main navigation or a temporary link on the home/dashboard page.
  - Route paths defined centrally (no magic strings scattered across components).

---

### 3.3 Onboarding/Profile Cleanup (Priority 3  Sprint1 debt)

#### Story F208  Onboarding Flow Verification

- **Summary:** Verify Sprint1.2 onboarding/profile flows against Product Backlog EPIC 1 (User Accounts & Onboarding).
- **Acceptance criteria:**
  - Web UI flows in `features/onboarding` and `features/profile` match backend contracts (auth/profile endpoints).
  - Fix any TypeScript or runtime issues discovered during manual testing.
  - Add minimal smoke tests to ensure core onboarding/profile pages render without errors.

---

### 3.4 Quality & Tooling (Priority 4  pipeline & tests)

#### Story F209  Frontend Test & Lint Baseline

- **Summary:** Add a basic test setup and ensure linting runs locally in `frontend/`.
- **Acceptance criteria:**
  - Jest or Vitest configured for React + TypeScript.
  - Minimal tests for:
    - `scanApi` (happypath call using mocked `api.ts`),
    - `FaceScanCamera` (renders, handles permission failure),
    - `ScanPage` (renders basic flow).
  - ESLint config (`.eslintrc.cjs`) is used; `npm test` and `npm run lint` succeed from the `frontend` directory.

#### Story F210  Frontend CI Job

- **Summary:** Add/update a CI workflow to build and test the frontend separately (not just backend).
- **Acceptance criteria:**
  - New or updated workflow file (e.g. `.github/workflows/frontend-ci.yml`) which:
    - Checks out repo.
    - Installs dependencies under `frontend/`.
    - Runs `npm run lint`, `npm test`, and `npm run build`.
  - Pipeline time under 5 minutes.
  - No interference with existing backend CI workflows.

---

## 4. Definition of Done (Frontend Sprint F2)

A story is **Done** when:

1. Code is implemented with TypeScript types (`strict` mode respected).
2. Unit tests or component tests exist and pass.
3. Linting passes with no new warnings.
4. Feature is wired into the app (routes/components actually used in navigation).
5. Behavior matches the relevant SRS + backlog intent for MVP (advanced scenarios can be deferred).
6. Changes are documented briefly in:
   - `FRONTEND-SPRINT-PLAN.md` (this file)  update story status list, and
   - Optionally, `Sprint-2-Implementation-Status.md` in `docs/`.

---

## 5. Sprint Execution Checklist

Use this like a miniboard:

- [ ] F201 `api.ts` base client
- [ ] F202 `scanApi.ts`
- [ ] F203 `mlService.ts`
- [ ] F204 `FaceScanCamera.tsx`
- [ ] F205 `ScanResults.tsx` + `ScanResults.css`
- [ ] F206 `ScanPage.tsx`
- [ ] F207 Routing to `/scan`
- [ ] F208 Onboarding/profile verification
- [ ] F209 Tests & lint baseline
- [ ] F210 Frontend CI job

---

## 6. Suggested Next Sprint (Preview)

Once Sprint F2 is complete and stable:

**Sprint F3 (Frontend) focus:**

1. **Digital Twin progress view**  visualizing key state vector dimensions, aligning with **EPIC 3: Digital Twin Engine**.
2. **Skin Mood UI overlays**  presenting Skin Mood Index on the scan results/home screen, aligning with **EPIC 4: Skin Mood Index**.
3. **Environmental intelligence hooks**  surfacing UV/skin weather data on the web UI, aligned with Environmental Intelligence Engine and related backlog items.
