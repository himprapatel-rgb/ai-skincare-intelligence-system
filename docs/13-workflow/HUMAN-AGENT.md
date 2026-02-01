# Human Agent – Acts Like a Real User

Logs in with credentials, uploads images (skin + product), navigates like a human.  
Uses **Playwright's Chromium** – not Google Chrome.

---

## No Google Chrome Required

| What | How |
|------|-----|
| **Browser** | Playwright installs its own Chromium via `npx playwright install chromium` |
| **Your Chrome** | Never used – no profile, no login, no permission issues |
| **CI** | Runs on GitHub Actions – no browser installed on your machine |

You don't need Chrome installed. Playwright's Chromium is separate and runs in isolation.

---

## What It Does

- Logs in with `E2E_EMAIL` and `E2E_PASSWORD`
- Uploads a test image to the Skin Scan page
- Uploads a test image to the Product Scanner
- Navigates: login → shelf → profile (mobile viewport)
- Uses human-like delays between actions

---

## API Cost

Paid APIs (ML, Skinive) are **mocked**. The Human Agent does not trigger real analysis.  
Only auth and basic endpoints are hit; expensive calls return mock data.

---

## Run Locally

```bash
cd frontend
npm run e2e:human
```

Or:

```bash
HUMAN_AGENT=true E2E_EMAIL=you@example.com E2E_PASSWORD=xxx \
  PLAYWRIGHT_BASE_URL=https://pellicura.com npx playwright test human-agent
```

---

## Workflow

| File | Schedule |
|------|----------|
| `.github/workflows/human-agent-daily.yml` | Daily 10:00 UTC + manual |

**Secrets required:** `E2E_EMAIL`, `E2E_PASSWORD` (in repo Settings → Secrets).

---

## Test Fixtures

| Path | Purpose |
|------|---------|
| `frontend/tests/fixtures/sample.png` | Tiny image for upload tests |
