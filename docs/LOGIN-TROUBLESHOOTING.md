# Login troubleshooting

If you **cannot log in** to the app, use this checklist.

---

## 1. Check backend and database

### Option A: Production (Railway) backend

From your machine (no backend code needed):

```bash
# Windows (PowerShell)
$env:API_URL = "https://ai-skincare-intelligence-system-production.up.railway.app/api/v1"
python backend/scripts/diagnose_login.py

# Or use the test_login script
cd backend
pip install requests
python scripts/test_login.py
```

- **Health check** hits `GET /api/health` and shows main DB status.
- **Login test** uses test user `himanshu@test.com` / `Test1234!`.

If health shows `main_database.status != "ok"`:

- In **Railway**: open your backend service → **Variables** → ensure `DATABASE_URL` is set (from the PostgreSQL plugin or your own DB).
- Redeploy the backend so it picks up the variable.
- Check **Deployments** for startup errors (e.g. "DATABASE_URL is not configured").

### Option B: Local backend + DB

Ensure `.env` in `backend/` has:

- `DATABASE_URL=postgresql://...` (or your DB URL).

Then:

```bash
cd backend
python scripts/diagnose_login.py
# or
python scripts/check_user.py
python scripts/verify_test_user.py   # creates/repairs test user
```

Then start the backend and try logging in from the frontend (with `VITE_API_URL` pointing at your local API if needed).

---

## 2. Common login failure reasons

| Symptom | Cause | Fix |
|--------|--------|-----|
| **401 Invalid email or password** | Wrong email/password or user not in DB | Use test user `himanshu@test.com` / `Test1234!` or register; if DB is new, run `verify_test_user.py` or let backend startup seed the test user. |
| **403 Email not verified** | User registered but has not verified email | In **production**: use the verification link from the signup email. In **development**: only `himanshu@test.com` is auto-verified; for other users use the verification link or mark them verified in DB. |
| **429 Too many login attempts** | Rate limit (10 attempts per IP per 15 min) | Wait ~15 minutes or use another network/VPN. |
| **Network / CORS error in browser** | Frontend cannot reach backend | Set `VITE_API_URL` in frontend `.env` to your backend base URL (e.g. `https://your-backend.up.railway.app/api/v1`). Ensure backend CORS allows your frontend origin (e.g. `https://pellicura.com`). |
| **Backend not reachable** | Backend down or wrong URL | Check Railway (or your host) service status and logs. Confirm `VITE_API_URL` matches the backend URL. |

---

## 3. Test users (development / debugging)

| Email | Password |
|-------|----------|
| `himanshu@test.com` | `Test1234!` |
| `himprapatel@gmail.com` | `Test1234!` |

Both are created or repaired on backend **startup** (see `main.py` → `ensure_test_user`) and can always log in (auto-verified).  
If you use a fresh DB or a user was removed, run:

```bash
cd backend
python scripts/verify_test_user.py
```
(That script fixes `himanshu@test.com`; `himprapatel@gmail.com` is ensured on next backend startup.)

---

## 4. Verify email (production)

After **register**, login is blocked until the user verifies email:

1. User gets an email with a verification link (if SMTP is configured in backend).
2. User clicks the link → backend marks `is_verified=True` → login works.

If SMTP is not set in production, verification emails are not sent and users cannot complete signup. Configure in Railway (or your host):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.

---

## 5. Environment variables quick reference

**Backend (Railway or local .env):**

- `DATABASE_URL` – **Required.** PostgreSQL URL for main DB (users, auth, scans).
- `SECRET_KEY` – **Required in production.** JWT secret (change from default).
- `ENV` – e.g. `production` or `development` (affects auto-verify and SMTP checks).
- `SMTP_*` – Needed in production for verification and password-reset emails.

**Frontend (.env):**

- `VITE_API_URL` – Backend API base, e.g. `https://your-backend.up.railway.app/api/v1`. Must match the backend that serves `/auth/login` and `/auth/me`.

---

## 6. Check test user from browser (no login)

Open this URL in your browser (use your real backend URL if different):

- **Production:** `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/auth/test-user-status`
- **Local:** `http://localhost:8000/api/v1/auth/test-user-status`

You should see JSON like:

- `{"exists": true, "is_verified": true, "is_active": true}` → test user is ready; try logging in with `himanshu@test.com` / `Test1234!`
- `{"exists": false, ...}` → backend could not create the test user (check DATABASE_URL and backend logs). Run `python backend/scripts/verify_test_user.py` locally with DATABASE_URL set, or redeploy backend.

---

## 7. Run full diagnostic

From repo root, with backend URL and (optionally) local DB:

```bash
# Production backend + login test
set API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
python backend/scripts/diagnose_login.py

# If you have backend .env with DATABASE_URL (local DB check)
cd backend
set DATABASE_URL=postgresql://...
python scripts/diagnose_login.py
```

This prints backend health, main DB status, and the result of a test login with `himanshu@test.com` / `Test1234!`.
