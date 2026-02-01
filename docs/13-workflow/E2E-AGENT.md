# E2E Agent – 24/7 GUI Testing

Automated testing that runs around the clock **without hitting paid APIs** (ML, Skinive, etc.).

---

## What it does

| Component | Schedule | What |
|-----------|----------|------|
| **E2E Agent** | Every 4 hours | Tests GUI (mobile, tablet, desktop), all pages, nav, layout. API calls **mocked**. |
| **Human Agent** | Daily | Login, upload images, navigate like a user. See [HUMAN-AGENT.md](HUMAN-AGENT.md). |
| **API Smoke** | Once daily | Hits `/api/v1/health` only. Reports if backend is down. |

**Browser:** All use Playwright's Chromium – **not** Google Chrome. No profile or permission issues.

---

## How it works

1. **API mocking** – Playwright intercepts requests to `/api/v1/*` and returns mock responses. No ML, no catalog, no cost.
2. **Viewports** – 375px (mobile), 768px (tablet), 1280px (desktop).
3. **On failure** – Creates a GitHub Issue with run link and labels (`e2e-agent`, `api-smoke`).

---

## Run locally

```bash
cd frontend
npm run e2e:agent
```

Or:

```bash
AGENT_MOCK_API=true PLAYWRIGHT_BASE_URL=https://pellicura.com npx playwright test agent-gui
```

---

## Workflows

| File | Trigger |
|------|---------|
| `.github/workflows/e2e-agent-scheduled.yml` | Cron every 4h + manual |
| `.github/workflows/api-smoke-daily.yml` | Cron daily 08:00 UTC + manual |

---

## Repair flow

1. Agent fails → GitHub Issue created.
2. Open the workflow run → view logs and download traces.
3. Fix the failing test or GUI bug.
4. Push fix → CI runs.
5. (Optional) Manually re-run the agent workflow to confirm.

---

## API used once a day

The API smoke test calls `/health` once daily. If it fails, an Issue is created. Fix backend or env vars and re-run.
