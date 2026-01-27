# Required Repository Secrets

This file lists the repository secrets that must be configured for CI, deployments,
and for the backend to communicate with external services.

Configure these as GitHub repository secrets (Settings → Secrets) or set them in
`backend/.env` for local development. Do NOT commit `.env` to source control.

Required secrets
- `DATABASE_URL` — PostgreSQL connection string used by SQLAlchemy (e.g. `postgresql://user:pass@host:5432/dbname`).
- `SECRET_KEY` — Application secret used for JWT signing and other cryptographic operations.
- `ENCRYPTION_KEY` — AES-256 key material for encrypting sensitive profile data (e.g. `aes256-secure-key-for-skincare-app-2026`). Required for profile/onboarding; if missing, profile creation fails with "Encryption failed".
- `ENCRYPTION_SALT` — Salt for key derivation (e.g. `skincare-salt-2026-secure`). Must be set with `ENCRYPTION_KEY` for profile encryption.
- `GPTGPT_API_KEY` — API key for the external LLM provider used by `GPTService`.
- `SUMMARY_TOKEN` — Shared secret used to protect the internal `/api/v1/internal/summary` endpoint.
- `OPENAI_API_KEY` — API key for OpenAI vision analysis (required to enable live analysis).
- `SKINIVE_API_TOKEN` — Deprecated. Previously used for Skinive skin analysis.
- `SMTP_HOST` — SMTP server host for email verification (e.g. `smtp.gmail.com`).
- `SMTP_PORT` — SMTP server port (default `587`).
- `SMTP_USERNAME` — SMTP username; for Gmail must match the sending account (same as `SMTP_FROM_EMAIL`).
- `SMTP_PASSWORD` — **Gmail:** use an [App Password](https://support.google.com/accounts/answer/185833) (16 chars), not the account password. 2-Step Verification must be on. If wrong, logs show "Username and Password not accepted".
- `SMTP_FROM_EMAIL` — Sender address for verification emails; must match `SMTP_USERNAME` for Gmail.
- `FRONTEND_URL` — Frontend base URL for verification links.
- `ADMIN_EMAIL_ALLOWLIST` — Comma-separated admin emails (must also have is_admin flag).

Optional / Environment-specific
- `GPTGPT_API_BASE` — Custom base URL for the LLM provider API (if your provider requires a custom host).
- `OPENAI_API_BASE` — Override for OpenAI API base URL (default `https://api.openai.com/v1`).
- `OPENAI_MODEL` — OpenAI model used for vision analysis (default `gpt-4o-mini`).
- `OPENAI_TIMEOUT_SECONDS` — OpenAI request timeout in seconds (default `60`).
- `SKINIVE_API_BASE` — Override for Skinive API base URL (default `https://api.skiniver.com`).
- `SKINIVE_LOCALE` — Locale for Skinive responses (default `en`).
- `SKINIVE_TIMEOUT_SECONDS` — Skinive request timeout in seconds (default `30`).
- `DAILY_ASSIGNEE` — GitHub username to auto-assign the daily reminder issue created by the scheduled workflow.

Notes
- Keep secrets private and rotate them regularly.
- CI workflows expect these secrets to be present when running LLM-related jobs; otherwise the jobs will skip or fail safely.
- For local development, copy `backend/.env.example` → `backend/.env` and populate the values. Ensure `.env` is ignored by git.
