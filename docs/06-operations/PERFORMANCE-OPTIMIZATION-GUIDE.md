# Performance optimization guide

How the app is built for speed and what you can do to keep it lean.

**One-page checklist:** [HOW-TO-MAKE-IT-FAST.md](./HOW-TO-MAKE-IT-FAST.md)

---

## What we already do

### Frontend

- **Route-level code splitting** – Every page is `React.lazy()` in `App.tsx`, so the initial bundle only loads the shell; each route loads its chunk when you navigate.
- **Heavy libs in separate chunks (Vite)** – In `vite.config.ts`, `manualChunks` splits:
  - `@mediapipe` → mediapipe chunk
  - `@tensorflow` → tensorflow chunk
  - `recharts` → recharts chunk
  - `three` → three chunk
  - `jspdf` / `html2canvas` → export-pdf chunk
- **Scan page**
  - **Product scanner** – `ProductScannerPage` is lazy-loaded only when the user switches to the “Product” tab, so barcode/QR and related code load on demand.
  - **Face validation (TF/Blazeface)** – `validateAndCropFace` is loaded via dynamic `import()` only when the user uploads a file or captures from camera, so TensorFlow/Blazeface are not in the initial Scan chunk.
- **Images** – `loading="lazy"` is used on product/list images and similar content where appropriate.
- **Prefetch on hover** – AppLayout prefetches Scan and Dashboard when the user hovers the nav links.

### Backend

- Use existing DB indexes and avoid N+1 queries where possible (see BACKEND_GUIDE and API code).

---

## Where the weight is

| Area | What | Why it’s heavy |
|------|------|-----------------|
| Scan (face) | MediaPipe Face Landmarker + WASM | Face mesh + vision task |
| Scan (face) | Three.js + FaceMesh3D | 3D mesh only on mobile/tablet |
| Scan (file/capture) | TensorFlow.js + Blazeface | Face validation (now loaded on demand) |
| Scan (product tab) | ProductScannerPage | Barcode/QR + UI (now lazy) |
| Export / PDF | jspdf, html2canvas | Only when user exports (in separate chunk) |
| Dashboard / charts | recharts | Only when user opens dashboard (lazy route) |

Initial load should not pull in TensorFlow, ProductScanner, or the PDF libs until those features are used.

---

## How to optimize further

### Frontend

1. **Reduce Scan initial load**
   - FaceMesh3D (Three.js) could be dynamic-imported only when the user taps “3D view” on mobile/tablet, so Three.js loads only then (adds a short delay on first 3D open).
   - MediaPipe is still needed as soon as the user opens the camera; keep it in the Scan chunk or load it when “Use camera” is first clicked.

2. **Images**
   - Use responsive images (`srcset` / `sizes`) and modern formats (e.g. WebP) where supported.
   - Ensure product/list images have reasonable dimensions and compression.

3. **CSS**
   - The main CSS bundle is large; consider removing unused rules (e.g. PurgeCSS or similar) or splitting by route if needed.

4. **Re-renders**
   - Use `React.memo` on heavy list items (e.g. product cards, history items) where props are stable.
   - Keep context updates narrow (e.g. separate contexts for auth vs theme vs shelf) so only affected trees re-render.

### Backend

1. **API**
   - Add caching (e.g. short TTL) for catalog or non-personalized endpoints where appropriate.
   - Compress responses (gzip/brotli) if not already enabled by the host.
   - Paginate large list endpoints and avoid loading full history in one go.

2. **DB**
   - Ensure indexes exist for filters and sort fields used in list/scan history and recommendations.
   - Profile slow queries and optimize or add indexes as needed.

3. **Railway: use more CPU and scale**
   - **Give the backend more resources:** Railway Dashboard → your **backend** service → **Settings** → under **Resources** (or plan), increase **vCPU** and **Memory** so the app isn’t throttled.
   - **Add replicas:** Same place → **Deploy** / **Regions** → increase **Replicas** (e.g. 2). Each replica is another container; traffic is spread across them, so more concurrent users are handled without queueing on one process.
   - **Keep-awake:** The `keep-awake.yml` workflow pings `/api/health` every 8 minutes to reduce cold starts; ensure it’s enabled.
   - See **Railway scaling and speed:** `docs/06-operations/RAILWAY-SCALING-AND-SPEED.md`.

### Monitoring

- Use the browser **Network** and **Performance** tabs to see which chunks and requests dominate load time.
- **Lighthouse** (Performance score and opportunities) helps find images, JS, and long tasks.
- Backend: add timing logs or APM for slow endpoints and DB queries.

---

## Quick reference

- **Lazy routes**: `frontend/src/App.tsx` (all pages are `React.lazy`).
- **Chunk splitting**: `frontend/vite.config.ts` → `build.rollupOptions.output.manualChunks`.
- **Scan optimizations**: `frontend/src/pages/ScanPage.tsx` (lazy ProductScannerPage, dynamic `faceValidation` import).
- **Image lazy loading**: `loading="lazy"` and `LazyImage` where used.
- **Backend workers**: `railway.toml` / `backend/Dockerfile` → uvicorn with `--workers 2` (or more if the plan has enough RAM).
- **Railway scaling**: `docs/06-operations/RAILWAY-SCALING-AND-SPEED.md`.

Keeping heavy features behind lazy loading and dynamic imports keeps the app responsive as we add more functionality.
