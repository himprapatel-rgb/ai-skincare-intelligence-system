# Deployment Troubleshooting – January 31, 2026

## Summary

Backend and frontend both return **502 Bad Gateway** from Railway. Logs show both services start successfully (migrations run, Uvicorn/Express start), then containers stop. Several fixes have been applied.

---

## Fixes Applied

### 1. Backend: `middleware` ModuleNotFoundError
- **Cause:** `middleware/` folder was not copied into the Docker image.
- **Change:** Added `COPY middleware /app/middleware` to `backend/Dockerfile`.

### 2. TrustedHostMiddleware
- **Change:** Skip TrustedHostMiddleware when `*` is in ALLOWED_HOSTS, to avoid Railway proxy Host header issues.
- **File:** `backend/app/main.py`

### 3. Healthcheck
- **Change:** Disabled healthcheck for both backend and frontend to avoid premature deploy failure during startup.
- **Files:** `railway.toml`, `railway.json`, `frontend/railway.toml`

---

## Current Status (from logs)

- **Backend:** Starts, runs migrations, Uvicorn runs on 8080, returns 200 for `/api/health`, then logs "Stopping Container".
- **Frontend:** Starts, Express runs on 3000, then logs "Stopping Container".

---

## Checks in Railway Dashboard

1. **Backend service**
   - [Railway Dashboard](https://railway.com/project/895dec63-f1c3-4bff-9b24-fd50e6779fdc/service/f0d8c716-b36b-4be3-9d97-72aafff53c25)
   - Confirm **Root Directory** is set to `backend` (or equivalent).
   - Confirm **Build** and **Deploy** logs for the latest deployment.
   - Confirm env vars: `DATABASE_URL`, `PRODUCT_DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`.

2. **Frontend service**
   - [Frontend Service](https://railway.com/project/895dec63-f1c3-4bff-9b24-fd50e6779fdc/service/567c6242-9ec5-465b-bd93-98ecc1e36c67)
   - Confirm **Root Directory** is `frontend`.
   - Confirm build env vars: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

3. **Domain routing**
   - Backend: `ai-skincare-intelligence-system-production.up.railway.app`
   - Frontend: `pellicura.com` (Cloudflare DNS → Railway).
   - In Railway → service → **Settings** → **Networking**, confirm the domain is linked.

---

## Next Steps

1. **Inspect deployment logs**  
   Use Railway → service → **Deployments** → latest → **View Logs** for build and deploy logs.

2. **Confirm build context**  
   Backend Dockerfile uses `COPY app`, `COPY middleware`; this requires build context = `backend/`. If Root Directory is empty/repo root, change Root Directory to `backend` for the backend service.

3. **Restart without redeploy**  
   In Railway: service → **⋮** → **Restart** to restart the current deployment without rebuilding.

4. **Re-enable healthcheck (after stability)**  
   - Backend: `healthcheckPath = "/api/health/live"`, `healthcheckTimeout = 120`
   - Frontend: `healthcheckPath = "/health"`, `healthcheckTimeout = 30`

---

## URLs

| Component | URL |
|-----------|-----|
| Backend API | https://ai-skincare-intelligence-system-production.up.railway.app |
| Backend Health | https://ai-skincare-intelligence-system-production.up.railway.app/api/health |
| Frontend (Railway) | https://frontend-production-0415.up.railway.app |
| Production Domain | https://pellicura.com |
