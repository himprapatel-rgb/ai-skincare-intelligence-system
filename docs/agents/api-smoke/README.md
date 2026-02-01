# API Smoke Agent

Checks backend health once daily. Creates an Issue if the API is down.

---

## Schedule

**Daily 08:00 UTC** + manual trigger.

---

## What it does

- Calls `GET /api/v1/health`
- If status is not 200 → creates a GitHub Issue
- No paid APIs – health check only

---

## Workflow

| File | Trigger |
|------|---------|
| `.github/workflows/api-smoke-daily.yml` | Cron daily 08:00 UTC + manual |

---

## On failure

1. Issue created with run link
2. Check Railway logs for backend
3. Verify `DATABASE_URL` and env vars
4. Restart or fix backend
5. Re-run workflow to confirm
