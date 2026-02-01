# Login Issues – Root Causes & Permanent Fixes

**Last updated:** February 2026

---

## Summary of login issues

| Issue | Symptom | Why it happens | Fix |
|-------|---------|----------------|-----|
| **Network Error** | "Sign-in Failed - Network Error" or "Cannot reach the server" | Railway backend **sleeps** after ~10 min inactivity. First request after sleep fails or times out (cold start 30–60s). | Keep backend awake (see below). |
| **Email not verified** | "Please verify your email to sign in" | Verification emails never arrived (SMTP not configured, spam folder). | Use `/api/v1/internal/verify-user` or configure SMTP. |
| **Test user / admin** | Can't log in as himanshu@test.com or admin | User doesn't exist, wrong password, or `is_verified=false`. | Use `/api/v1/internal/fix-test-user` or run `verify_test_user.py`. |

---

## Why "Network Error" happens frequently

1. **Railway App Sleeping (Serverless)**  
   Railway puts services to sleep after **~10 minutes of no inbound traffic**. When a user tries to log in:
   - First request wakes the backend (cold start).
   - Cold start can take **30–60 seconds**.
   - Frontend timeout (e.g. 30s) may be shorter, so the user gets "Network Error".

2. **Low traffic**  
   If pellicura.com has few visitors, the backend sleeps often. Every new visitor after ~10 min of inactivity hits a cold start.

3. **Google Sign-in flow**  
   User clicks "Continue with Google" → redirects to Google → back to your callback → callback calls backend `/auth/google`. If the backend was asleep, that call times out → "Network Error".

---

## Permanent fix: Keep backend awake

You need to send a request to the backend **at least every 8–9 minutes** so it never goes to sleep.

### Option A: GitHub Actions (recommended for this repo)

A workflow runs every 8 minutes and pings `/api/health`:

```yaml
# .github/workflows/keep-awake.yml
```

**Note:** On free GitHub plan, private repos get 2,000 minutes/month. This workflow uses ~720 runs/month × ~20 sec ≈ 240 min. For public repos, Actions minutes are free.

### Option B: External service (no GitHub usage)

Use a free uptime monitor that pings every 5 minutes:

1. **[UptimeRobot](https://uptimerobot.com)** (free): Add monitor for  
   `https://ai-skincare-intelligence-system-production.up.railway.app/api/health`  
   Interval: 5 minutes.

2. **[cron-job.org](https://cron-job.org)** (free): Create a cron job to GET that URL every 5 minutes.

3. **[Better Uptime](https://betteruptime.com)**, **Pingdom**, etc. – same idea.

### Option C: Railway Pro / paid plan

Paid Railway plans may offer always-on services or different sleep behavior. Check [Railway pricing](https://railway.app/pricing).

---

## Permanent fix: Email verification

| Approach | When to use |
|----------|-------------|
| **Configure SMTP** | Production: Send real verification emails. Set `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` in Railway. |
| **Manual verify** | One-off: Use `POST /api/v1/internal/verify-user` with `SUMMARY_TOKEN` to verify a user. |
| **Auto-verify for Google** | Already done: Google sign-in creates users with `is_verified=true`. |

---

## Quick reference

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check (use for keep-awake ping) |
| `POST /api/v1/internal/fix-test-user` | Create/fix himanshu@test.com |
| `POST /api/v1/internal/verify-user` | Set `is_verified=true` for any user |
| `GET /api/v1/internal/db-status` | Check DB and test user status |

All internal endpoints require `X-SUMMARY-TOKEN` header matching `SUMMARY_TOKEN` in Railway.
