# Human Agent

Acts like a real user: logs in, uploads images, navigates. Uses Playwright's Chromium – **not** Google Chrome.

---

## Schedule

**Daily 10:00 UTC** + manual trigger.

---

## No Google Chrome required

| What | How |
|------|-----|
| Browser | Playwright installs its own Chromium |
| Your Chrome | Never used – no profile, no permission issues |
| CI | Runs on GitHub Actions |

---

## What it does

- Logs in with `E2E_EMAIL` and `E2E_PASSWORD`
- Uploads a test image to Skin Scan page
- Uploads a test image to Product Scanner
- Navigates: login → shelf → profile (mobile)

Paid APIs are **mocked** – no ML cost.

---

## Run locally

```bash
cd frontend
npm run e2e:human
```

```bash
HUMAN_AGENT=true E2E_EMAIL=you@example.com E2E_PASSWORD=xxx \
  PLAYWRIGHT_BASE_URL=https://pellicura.com npx playwright test human-agent
```

---

## Workflow

| File | Trigger |
|------|---------|
| `.github/workflows/human-agent-daily.yml` | Daily 10:00 UTC + manual |

**Secrets:** `E2E_EMAIL`, `E2E_PASSWORD` (Settings → Secrets).

---

## Fixtures

| Path | Purpose |
|------|---------|
| `frontend/tests/fixtures/sample.png` | Test image for uploads |
