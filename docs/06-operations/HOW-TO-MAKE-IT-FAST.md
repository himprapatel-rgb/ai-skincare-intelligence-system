# How to make the app fast

One-page checklist: what we do already and what you can do.

---

## Already done (in code)

| Area | What | Where |
|------|------|--------|
| **Frontend** | Lazy routes (every page is a separate chunk) | `frontend/src/App.tsx` |
| **Frontend** | Heavy libs in separate chunks (MediaPipe, TensorFlow, Recharts, Three.js) | `frontend/vite.config.ts` |
| **Frontend** | Prefetch on hover: main nav (Home, Scan, Dashboard, Digital Twin, About, Admin, Auth, Profile) | `frontend/src/components/AppLayout.tsx` |
| **Frontend** | Prefetch on touch: same + Features/Learn/legal and mobile Profile, Export, Notifications | `AppLayout.tsx` (mobile nav) |
| **Frontend** | Auth init timeout: app shows after 4s even if `/auth/me` is slow (e.g. cold start) | `frontend/src/context/AuthContext.tsx` |
| **Backend** | GZip compression for responses ≥ 500 bytes | `backend/app/main.py` (GZipMiddleware) |
| **Backend** | 16 uvicorn workers per replica (override with `UVICORN_WORKERS`); DB pool 20+30 | `backend/Dockerfile`, `railway.toml`, `app/database.py` |
| **Backend** | DB performance indexes | `backend/migrations/2026_01_27_performance_indexes.py` |
| **Ops** | Keep-awake pings every 8 min to reduce cold starts | `.github/workflows/keep-awake.yml` |

---

## What you do (Railway dashboard)

1. **Give the backend more CPU and memory**  
   Railway → **backend** service → **Settings** → **Resources** → increase **vCPU** and **Memory**.

2. **Add replicas**  
   Same place → **Deploy** / **Regions** → set **Replicas** to **2** (or more). Traffic is spread across replicas.

Details: [RAILWAY-SCALING-AND-SPEED.md](./RAILWAY-SCALING-AND-SPEED.md).

---

## Optional next steps (bigger impact)

| Change | Benefit | Effort |
|--------|---------|--------|
| **Background scan analysis** | Upload returns immediately; analysis runs in background; user sees “Processing…” then result | Medium (backend: queue + worker or async task) |
| **Cache catalog/read-heavy API** | Faster repeat visits and list pages | Low (e.g. short TTL cache in backend or CDN) |
| **Image optimization** | Smaller images = faster load (WebP, `srcset`, smaller thumbs) | Low–medium |
| **Reduce Scan chunk size** | Load 3D / MediaPipe only when user opens camera or 3D view | Medium (more dynamic imports) |

---

## Quick reference

- **“App feels slow”** → Check [RAILWAY-SCALING-AND-SPEED.md](./RAILWAY-SCALING-AND-SPEED.md) (CPU, replicas, workers, cold start).
- **“First load is slow”** → [PERFORMANCE-OPTIMIZATION-GUIDE.md](./PERFORMANCE-OPTIMIZATION-GUIDE.md) (chunks, lazy loading, images).
- **“Scan/API is slow”** → Backend: more workers + replicas; long-term: move analysis to background job.
