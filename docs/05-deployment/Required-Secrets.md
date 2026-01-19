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
- `YOUCAM_API_KEY` — API key for YouCam skin analysis (required to enable live analysis).
- `SKINIVE_API_TOKEN` — Deprecated. Previously used for Skinive skin analysis.

Optional / Environment-specific
- `GPTGPT_API_BASE` — Custom base URL for the LLM provider API (if your provider requires a custom host).
- `YOUCAM_API_BASE` — Override for YouCam API base URL (default `https://yce-api-01.makeupar.com`).
- `YOUCAM_TIMEOUT_SECONDS` — YouCam request timeout in seconds (default `30`).
- `YOUCAM_POLL_INTERVAL_SECONDS` — YouCam polling interval in seconds (default `2`).
- `YOUCAM_MAX_POLL_SECONDS` — YouCam max polling wait in seconds (default `120`).
- `YOUCAM_SKIN_ANALYSIS_FORMAT` — Response format (`json` or `zip`, default `json`).
- `YOUCAM_SKIN_ANALYSIS_ACTIONS` — Comma-separated actions (default `wrinkle,pore,texture,acne`).
- `SKINIVE_API_BASE` — Override for Skinive API base URL (default `https://api.skiniver.com`).
- `SKINIVE_LOCALE` — Locale for Skinive responses (default `en`).
- `SKINIVE_TIMEOUT_SECONDS` — Skinive request timeout in seconds (default `30`).
- `DAILY_ASSIGNEE` — GitHub username to auto-assign the daily reminder issue created by the scheduled workflow.

Notes
- Keep secrets private and rotate them regularly.
- CI workflows expect these secrets to be present when running LLM-related jobs; otherwise the jobs will skip or fail safely.
- For local development, copy `backend/.env.example` → `backend/.env` and populate the values. Ensure `.env` is ignored by git.
