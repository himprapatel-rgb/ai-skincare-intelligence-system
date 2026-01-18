# Setup GPTGPT Integration

This document describes how to configure the repository to allow the GitHub Actions workflows to call your GPTGPT (ChatGPT) endpoint.

1. Add secrets

- `GPTGPT_API_KEY` (required) — API key for the provider. Add via repository Settings → Secrets → Actions.
- `GPTGPT_API_BASE` (optional) — If your provider uses a different base URL than the default, add it here. If not set, the workflows will fall back to the project URL provided in the repo.
- `DAILY_ASSIGNEE` (optional) — GitHub username (e.g. `alice`) used to automatically assign the daily reminder issue after the summary is posted. Store in repository Secrets.
- `GPTGPT_API_BASE` (optional) — If your provider uses a different base URL than the default, add it here. If not set, the workflows will fall back to the project URL provided in the repo.
- `SUMMARY_ENDPOINT` (optional) — If you host the internal summary endpoint (recommended), set this to its full URL (example: `https://example.com/api/v1/internal/summary`).
- `SUMMARY_TOKEN` (optional) — Shared secret required by the internal summary endpoint; set identically on the deployed service and as a secret here.
- `DAILY_ASSIGNEE` (optional) — GitHub username (e.g. `alice`) used to automatically assign the daily reminder issue after the summary is posted. Store in repository Secrets.
- `GPTGPT_API_BASE` (optional) — If your provider uses a different base URL than the default, add it here. If not set, the workflows will fall back to the project URL provided in the repo.

GitHub CLI example:

```bash
# Replace <KEY> and <BASE> with your values
gh secret set GPTGPT_API_KEY --body "<KEY>" --repo himprapatel-rgb/ai-skincare-intelligence-system
# Optional: set a default assignee for daily summaries
gh secret set DAILY_ASSIGNEE --body "alice" --repo himprapatel-rgb/ai-skincare-intelligence-system
# Optional: if you host an internal summary endpoint, set its URL and token
gh secret set SUMMARY_ENDPOINT --body "https://example.com/api/v1/internal/summary" --repo himprapatel-rgb/ai-skincare-intelligence-system
gh secret set SUMMARY_TOKEN --body "my-secret-token" --repo himprapatel-rgb/ai-skincare-intelligence-system
# Optional
gh secret set GPTGPT_API_BASE --body "https://api.yourprovider.example/v1" --repo himprapatel-rgb/ai-skincare-intelligence-system
```

2. Create the daily reminder issue (the workflows look for this exact title):

Title: `Daily: Update AI Agile Workflow trackers`

You can create it via the Issues page or with the CLI:

```bash
gh issue create --repo himprapatel-rgb/ai-skincare-intelligence-system \
  --title "Daily: Update AI Agile Workflow trackers" \
  --body "Automated reminder for daily updates. If you've updated today, close this issue." \
  --label "reminder,daily"
```

3. Trigger the workflow manually for the first run (optional)

Use Actions → `Daily AI Agile Summary` → `Run workflow` in GitHub, or:

```bash
gh workflow run daily-ai-agile-summary.yml --repo himprapatel-rgb/ai-skincare-intelligence-system --ref main
```

4. Notes

- The workflow will read key docs (AI_AGILE_WORKFLOW.md, PROJECT_PROGRESS_TRACKER.md, SPRINT-1.1-CODE-FILES.md, README.md) to build the prompt.
- The prompt is truncated to keep size reasonable. If you need more context, consider updating the workflow to include additional files or a dedicated summary file that the LLM can read.
- Monitor usage on your GPTGPT provider dashboard — LLM calls may cost money.

5. Local quick test

- A helper script is provided at `backend/scripts/test_gpt.py`. To run locally:

```bash
cd backend
make venv
make install
# Set GPTGPT_API_KEY in backend/.env or export in shell, then:
make run-gpt
```

This script calls the `GPTService.chat` method and prints the provider's response. It's intended for manual verification only.

6. Deploy with Docker (quick)

Build the Docker image from the `backend/` folder and run it with your secrets set as environment variables.

```bash
# from repository root
docker build -t ai-skincare-backend -f backend/Dockerfile ./

# Run container (example):
docker run -d \
  --name ai-skincare-backend \
  -p 8000:8000 \
  -e GPTGPT_API_KEY="<YOUR_KEY>" \
  -e SUMMARY_TOKEN="<YOUR_SUMMARY_TOKEN>" \
  -e GPTGPT_API_BASE="<OPTIONAL_PROVIDER_BASE>" \
  ai-skincare-backend

# Test locally (after container started):
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-SUMMARY-TOKEN: <YOUR_SUMMARY_TOKEN>" \
  -d '{"prompt":"Give a short status."}' \
  http://localhost:8000/api/v1/internal/summary
```

Optional docker-compose snippet (`docker-compose.yml`):

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GPTGPT_API_KEY=${GPTGPT_API_KEY}
      - SUMMARY_TOKEN=${SUMMARY_TOKEN}
      - GPTGPT_API_BASE=${GPTGPT_API_BASE}
```

When deploying to production, consider using a process manager or container orchestrator (e.g., Docker Compose, Kubernetes, or a hosted service like Render/Fly) and configure secrets in the hosting provider rather than passing them via CLI.

7. Using docker-compose (local)

Create a `.env` file next to `docker-compose.yml` with values for the environment variables referenced by the compose file, for example:

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/skincare_db
GPTGPT_API_KEY=sk-...
SUMMARY_TOKEN=my-secret-token
```

Then start services:

```bash
docker compose up --build
```

The backend will be available at `http://localhost:8000` and the internal summary endpoint at `/api/v1/internal/summary`.
