# E2E Agent

Tests the GUI 24/7 (mobile, tablet, desktop). API calls are **mocked** – no paid APIs.

---

## Schedule

**Every 4 hours** + manual trigger.

---

## What it does

- Tests all public and protected pages
- Checks mobile nav, bottom nav, layout
- Verifies no horizontal overflow
- Uses Playwright's Chromium (not Google Chrome)

---

## How it works

1. **API mocking** – Requests to `/api/v1/*` return mock data. No ML, no cost.
2. **Viewports** – 375px, 768px, 1280px
3. **On failure** – Creates a GitHub Issue with run link

---

## Run locally

```bash
cd frontend
npm run e2e:agent
```

```bash
AGENT_MOCK_API=true PLAYWRIGHT_BASE_URL=https://pellicura.com npx playwright test agent-gui
```

---

## Workflow

| File | Trigger |
|------|---------|
| `.github/workflows/e2e-agent-scheduled.yml` | Cron every 4h + manual |

---

## Repair flow

1. Agent fails → Issue created
2. Open workflow run → view logs, download traces
3. Fix the bug
4. Push → CI runs
5. Re-run workflow to confirm
