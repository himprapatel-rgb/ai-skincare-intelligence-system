# Required Repository Secrets

This file lists the repository secrets that must be configured for CI, deployments,
and for the backend to communicate with external services.

Configure these as GitHub repository secrets (Settings → Secrets) or set them in
`backend/.env` for local development. Do NOT commit `.env` to source control.

Required secrets
- `DATABASE_URL` — PostgreSQL connection string used by SQLAlchemy (e.g. `postgresql://user:pass@host:5432/dbname`).
- `SECRET_KEY` — Application secret used for JWT signing and other cryptographic operations.
- `GPTGPT_API_KEY` — API key for the external LLM provider used by `GPTService`.
- `SUMMARY_TOKEN` — Shared secret used to protect the internal `/api/v1/internal/summary` endpoint.

Optional / Environment-specific
- `GPTGPT_API_BASE` — Custom base URL for the LLM provider API (if your provider requires a custom host).
- `DAILY_ASSIGNEE` — GitHub username to auto-assign the daily reminder issue created by the scheduled workflow.

Notes
- Keep secrets private and rotate them regularly.
- CI workflows expect these secrets to be present when running LLM-related jobs; otherwise the jobs will skip or fail safely.
- For local development, copy `backend/.env.example` → `backend/.env` and populate the values. Ensure `.env` is ignored by git.
