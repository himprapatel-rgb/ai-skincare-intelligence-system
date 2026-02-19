# Login troubleshooting (email/password and Google)

**Last updated:** 2026-02-18

If users cannot sign in with **email/password** or **Google**, check the following.

---

## “We couldn’t reach the server” (connection error)

**What you see:**  
Sign-in Failed — *We couldn't reach the server. Check your connection and try again — or the service may be temporarily unavailable (try again in a moment).*  
Tip: *Go back and try "Continue with Google" again in a moment — the server may be starting up.*

**Meaning:** The **backend API** the frontend calls (e.g. Railway) is not responding. The browser cannot open a connection to it (down, sleeping, or wrong URL).

**Do this (in order):**

1. **Open the backend health URL in your browser**  
   Default backend:  
   **https://ai-skincare-intelligence-system-production.up.railway.app/api/health**  
   - If the page **loads and shows JSON** with `"status": "healthy"` or `"degraded"` → backend is up; the problem may be CORS, Google config, or a different frontend URL.  
   - If the page **does not load**, **times out**, or shows an error → **backend is down or not deployed.**

2. **If the backend is down**  
   - In **Railway** → your project → **Backend** (or API) service:  
     - Check **Deployments**: is the latest deploy **Success** and **Active**?  
     - If the deploy **failed** (e.g. “Healthcheck failed”):  
       - Ensure **DATABASE_URL** is set for the backend service.  
       - Redeploy (the repo has fixes: non-blocking migrations, health path `/api/health`).  
     - If the service is **sleeping** (free tier): trigger a new deploy or open the health URL; the first request can take 30–60 seconds.  
   - After fixing, wait a minute and open the health URL again; then try sign-in again.

3. **If the backend health URL works but login still fails**  
   - Follow the rest of this doc: CORS, Google redirect URIs, and backend env vars (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

---

## Why did login stop working? (It was fine before)

Login often stops working for one of these reasons. Check in this order:

| Cause | What happens | What to do |
|-------|----------------|------------|
| **Backend down or sleeping** | Timeouts, "Cannot reach the server", "API offline". Very common on Railway (free tier sleeps; failed deploy leaves old/broken version). | Check `https://<backend-url>/api/health`. If it doesn’t return 200, **restart or redeploy the backend** in Railway. Ensure `DATABASE_URL` is set and the service is running. |
| **Database unreachable** | Backend may return 503 "Database unavailable" or 504 timeout; sometimes the whole backend crashes on first request. | In Railway: confirm the **database** service is running and `DATABASE_URL` points to it. Check DB logs for connection errors. Restart backend after DB is fixed. |
| **Rate limiting (429)** | After **10 failed login attempts from the same IP** in 15 minutes, the backend returns "Too many login attempts. Please try again later." | Wait ~15 minutes or use another network. If many users share one IP (office/VPN), consider increasing the limit in `backend/app/core/rate_limit.py` or relaxing it for production. |
| **Request timeout (504)** | Slow DB or cold start: backend returns "Request timed out" (default 30s). | Restart backend; check DB performance. Increase `REQUEST_TIMEOUT_SECONDS` in backend config if needed. |
| **Config or deploy change** | CORS, env vars, or Google redirect URIs changed; a new deploy didn’t include the right env. | Redeploy with correct `ALLOWED_ORIGINS`, `FRONTEND_URL`, `GOOGLE_*`, and ensure callback URLs match (see sections below). |

**Most likely:** Backend or DB is down/sleeping. Always check `/api/health` first, then Railway dashboard (service + database status and logs).

---

## 1. Backend reachable

- **Symptom:** "Cannot reach the server", "API offline", or requests time out.
- **Check:** Open `https://<your-backend-url>/api/health` (e.g. Railway backend). It should return 200 and JSON with `"status": "ok"` or `"degraded"`.
- **Fix:** Deploy or restart the backend (e.g. Railway). Ensure `DATABASE_URL` (and optional `PRODUCT_DATABASE_URL`) are set so the app can start; the app can run in degraded mode if DB bootstrap fails but must be reachable.

---

## 2. CORS (browser blocking requests)

- **Symptom:** Login requests fail in the browser with CORS errors; same request works from curl/Postman.
- **Check:** Backend `ALLOWED_ORIGINS` (or `DEFAULT_ORIGINS` in `backend/app/config.py`) must include the **exact** frontend origin, e.g.:
  - `https://pellicura.pages.dev`
  - `https://pellicura.com`
  - `https://frontend-production-0415.up.railway.app`
  - `http://localhost:5173` (local dev)
- **Fix:** Add the frontend origin to `DEFAULT_ORIGINS` in `config.py` or set `ALLOWED_ORIGINS` in the backend environment (e.g. Railway) and redeploy.

---

## 3. Email/password login

- **Invalid email or password:** User must be registered and use the correct password. Test users (if enabled in non-production): `himanshu@test.com` / `himprapatel@gmail.com` with password `Test1234!`.
- **Email not verified:** Backend returns 403 until the user verifies email (or is a test user). Use "Verify your email" / request verification email, or in non-production ensure the user is marked verified.

---

## 4. Google sign-in

- **Backend:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend environment (e.g. Railway). If missing, backend returns 501 "Google OAuth is not configured".
- **Frontend:** Set `VITE_GOOGLE_CLIENT_ID` at **build time** (e.g. Cloudflare Pages / GitHub Actions env). Same value as the Google Cloud OAuth client ID. Without it, the Google button may show an alert and not redirect.
- **Google Cloud Console:** In **APIs & Services → Credentials → your OAuth 2.0 Client → Authorized redirect URIs**, add the **exact** callback URL:
  - Production (Pages): `https://pellicura.pages.dev/auth/google/callback`
  - Production (custom): `https://pellicura.com/auth/google/callback` (and `https://www.pellicura.com/auth/google/callback` if used)
  - Staging: `https://staging.pellicura.pages.dev/auth/google/callback`
  - Local: `http://localhost:5173/auth/google/callback`
- **Backend allowed list:** Backend must allow that same redirect URI when the frontend sends it with the auth code. Allowed URIs are in `backend/app/api/v1/endpoints/auth.py` (`ALLOWED_GOOGLE_REDIRECT_URIS`). If you add a new frontend URL, add its callback here and redeploy.

---

## 5. Quick checklist

| Check | Email/password | Google |
|-------|----------------|--------|
| Backend returns 200 on `/api/health` | ✓ | ✓ |
| Frontend origin in backend CORS | ✓ | ✓ |
| User exists and (if required) verified | ✓ | — |
| Backend has Google client ID + secret | — | ✓ |
| Frontend has `VITE_GOOGLE_CLIENT_ID` at build | — | ✓ |
| Callback URL in Google Console | — | ✓ |
| Callback URL in backend `ALLOWED_GOOGLE_REDIRECT_URIS` | — | ✓ |

After changing backend config (CORS, env, or redirect URIs), **redeploy the backend** and retry.
