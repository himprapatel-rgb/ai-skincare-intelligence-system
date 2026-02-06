# Railway scaling and speed

How to make the backend (and app) faster by giving it more CPU and scaling on Railway.

**Quick checklist for “make it fast”:** [HOW-TO-MAKE-IT-FAST.md](./HOW-TO-MAKE-IT-FAST.md)

---

## Why the app can feel slow

1. **Cold starts** – Railway can sleep services after ~10 minutes without traffic. The first request after that can take 30–60 seconds. The repo’s **keep-awake** workflow pings `/api/health` every 8 minutes to reduce this.
2. **Single process** – By default the backend runs one uvicorn process. Under load, requests queue on that single process.
3. **Limited CPU/RAM** – On free or low-tier plans, the service may be throttled; CPU-heavy work (e.g. image handling, JSON) gets slower.
4. **External APIs** – Scan analysis uses OpenAI; that latency is outside Railway but still affects “app slowness.”

---

## 1. Give the backend more CPU and memory (Railway)

Railway scales **vertically** per service: you can increase the resources of the backend service.

1. Open [Railway Dashboard](https://railway.app) → your project.
2. Select the **backend** service (the one that runs the FastAPI app).
3. Go to **Settings** (or the **Deploy** / **Resources** section, depending on the UI).
4. Find **Resources** or **Compute**:
   - **vCPU** – Increase if the app is CPU-bound (e.g. many concurrent scans or heavy JSON/image work).
   - **Memory** – Increase if you see OOM or slow behavior under load (e.g. 512 MB → 1 GB or 2 GB).
5. Save. Railway will redeploy with the new limits.

**Note:** Higher tiers (e.g. Pro) allow larger vCPU/memory limits per service. Check [Railway pricing](https://railway.app/pricing) for your plan.

---

## 2. Add more replicas (horizontal scaling)

More **replicas** = more copies of the backend. Traffic is spread across them, so you can serve more concurrent users without queueing on one process.

1. Railway Dashboard → **backend** service → **Settings**.
2. In **Deploy** or **Regions**, find **Replicas** (or **Instance count**).
3. Set **Replicas** to **2** (or more). Each replica is a full copy of the app (same Docker image, same env).
4. Deploy. Railway will run multiple containers; their load balancer distributes requests.

**Tip:** With 2 replicas, you effectively double the number of requests the backend can handle at once (e.g. two users doing scans at the same time don’t block each other).

---

## 3. Run enough uvicorn workers (this was the issue with 32 vCPU)

**If you have high CPU (e.g. 32 vCPU) and the app still feels slow:** the bottleneck was **worker count**. With only 2 workers, at most 2 requests run at once; the rest queue. So most of your CPU sat idle.

The repo now defaults to **16 workers** and uses a larger DB connection pool so many requests can run in parallel.

- **Where it’s set:** `railway.toml` and `backend/Dockerfile`:
  - `uvicorn ... --workers ${UVICORN_WORKERS:-16}`
- **Override:** In Railway → backend service → **Variables**, set `UVICORN_WORKERS=24` (or 32) if you want more. Don’t set it higher than your DB’s max connections (pool is 20 + 30 overflow = 50 total).
- **DB pool:** `backend/app/database.py` uses `pool_size=20`, `max_overflow=30` so 16+ workers have enough connections.

After changing, commit and push (or set `UVICORN_WORKERS` in Railway and redeploy).

---

## 4. Login was slow (fixed)

- **Backend:** Login used to call **fetch_geolocation(ip)** in the request (up to ~2s). IP/geo is now done in a **background task**, so the token is returned right after password check.
- **Frontend:** After login we used to **await GET /profile** before navigating, so you waited for two round-trips. We now **navigate to dashboard immediately** and check profile in the background (redirect to onboarding if 404).
- **Cold start:** If the backend was sleeping, the first request (often login) can still take 30–60s. The **auth page now pings /api/health on load** so the backend wakes while the user types; keep the **keep-awake** workflow enabled too.
- **Password check:** Argon2 verify is intentionally slow (~100–200ms) for security; that’s normal.

---

## 5. "Scan is slow" even with many workers?

Scan upload runs **OpenAI's vision API** inside the request. The request stays open for the whole time OpenAI takes (often 5–30+ seconds). That's **API latency**, not your server CPU. With 32 vCPU and 16 workers you're not CPU-bound; you're **waiting on OpenAI**.

- **Short term:** Show a clear "Analyzing…" state so users know it's working. The backend is async so it's not blocking other requests.
- **Long term:** Return 202 Accepted right after upload and run analysis in a background job; frontend polls or uses WebSocket for the result. Then the upload feels instant.

---

## 6. Summary: “Make the app faster” checklist

| Action | Where | Effect |
|--------|--------|--------|
| Increase backend **vCPU / Memory** | Railway → backend → Settings → Resources | Less throttling, faster per-request work. |
| Set **Replicas** to 2 (or more) | Railway → backend → Settings → Deploy / Replicas | More concurrent requests, less queueing. |
| Use **16 uvicorn workers** (default; set `UVICORN_WORKERS` to override) | `railway.toml` / `backend/Dockerfile` | Many concurrent requests so high CPU isn't wasted. |
| Keep **keep-awake** workflow enabled | `.github/workflows/keep-awake.yml` | Fewer cold starts after idle. |
| Optional: move scan analysis to a **background job** | Backend code (e.g. Celery/Redis or async task) | Upload returns quickly; analysis runs in background. |

---

## 7. Database (PostgreSQL on Railway)

If the **database** is the bottleneck (slow queries, high CPU on the DB service):

- In Railway → **PostgreSQL** service → **Settings** → **Resources**, increase **Memory** (and vCPU if available).
- Ensure indexes exist; the repo has a performance indexes migration (`backend/migrations/2026_01_27_performance_indexes.py`). Run migrations if you haven’t.

---

## References

- [Railway scaling docs](https://docs.railway.app/reference/scaling) – Vertical and horizontal scaling.
- [Optimize performance](https://docs.railway.com/guides/optimize-performance) – General performance tips.
- Repo: `docs/06-operations/PERFORMANCE-OPTIMIZATION-GUIDE.md` – App-level optimizations (frontend + backend).
