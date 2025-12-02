<!-- Copilot / AI agent instructions for working in this repository -->

# AI Agent Quick Guide — AI Skincare Intelligence System

Purpose: give coding agents immediately useful, repository-specific guidance so they can be productive without asking for trivial details.

- Repository layout (key files):

  - `backend/app/config.py` — centralized settings; use `from app.config import settings` and set `DATABASE_URL` + `.env` in `backend/` when running locally.
  - `backend/app/database.py` — SQLAlchemy engine, `SessionLocal`, `Base`, and `get_db()` dependency used by endpoints.
  - `backend/app/api/v1/__init__.py` and `backend/app/api/v1/endpoints/` — API routing pattern. Routers are mounted on `api_router` and then included in `app` with prefix `/api/v1`.
  - `backend/app/main.py` — FastAPI application entry (used by `uvicorn`); `Base.metadata.create_all(bind=engine)` is called here.
  - `docs/SPRINT-1.1-CODE-FILES.md` — contains the project's sprint scaffolding and example generation scripts. Read before regenerating files to avoid duplication.

- Run & test commands (what actually works here):

  - Dev server (from repo root):
    ```bash
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
  - Run tests (if present):
    ```bash
    cd backend
    pytest -q
    ```
  - Environment: copy `backend/.env.example` → `backend/.env` and update `DATABASE_URL` before starting.

- Project-specific patterns and conventions (do this in PRs / suggestions):

  - Settings: code imports `settings = Settings()` from `backend/app/config.py`. Prefer environment-driven changes; do not hard-code secrets.
  - DB sessions: endpoints depend on `get_db()` generator from `backend/app/database.py`. Use `db: Session = Depends(get_db)` in routes.
  - Services layer: business logic lives in `backend/app/services/` (e.g., `auth_service`). Keep endpoint code thin and delegate to services.
  - Router mounting: add endpoint modules under `backend/app/api/v1/endpoints/` and import them in `backend/app/api/v1/__init__.py` using `api_router.include_router(..., prefix=...)`.
  - Migrations: alembic files expected under `backend/alembic/versions`. Use `alembic` from `backend` directory for migrations.

- When changing or creating files: include/update these concrete artifacts

  - Update `docs/SPRINT-1.1-CODE-FILES.md` only when generating scaffolding or documenting new generated files.
  - Update `README.md` or `docs/PROJECT_PROGRESS_TRACKER.md` for feature-level changes and test evidence.
  - Add tests next to new code under `backend/app/tests/` and run `pytest` before marking tasks done.

- Common gotchas and guardrails

  - Always run services from the `backend` working directory so `pydantic_settings` reads `.env` (settings.Config.env_file = ".env").
  - `Base.metadata.create_all(bind=engine)` is invoked in `app/main.py`; be cautious running this in production-like DBs — prefer migrations.
  - The repo uses Pydantic v2 / `pydantic-settings` patterns — use `field_validator` and `BaseModel` v2 idioms.
  - Many example files are provided in `docs/SPRINT-1.1-CODE-FILES.md` as shell `cat > ...` generators — inspect before re-running to avoid accidental overwrites.

- External AI provider keys

  - If integrating third-party LLM providers, add the API key to `backend/.env` for local development and to GitHub Secrets as `GPTGPT_API_KEY` for workflows.
  - Add a `GPTGPT_API_KEY` entry to `backend/app/config.py` (already present). Use `settings.GPTGPT_API_KEY` in services.

- How to propose changes (PR quality checklist for AI agents)
  - Keep changes small and focused (one feature/bug per PR).
  - Include or update at least one test for new logic under `backend/app/tests/`.
  - Reference the exact files changed in the PR description and link to relevant docs (e.g., `docs/SPRINT-1.1-CODE-FILES.md`).
  - Mention required env changes (`.env`) and DB migrations in the PR body.

If anything in this guide is unclear or you want more examples (e.g., sample test files or CI commands), say which area to expand and I will update this file.

---

## CI / GitHub Actions

- The backend test command used in CI is (from repo root):
  ```bash
  cd backend
  pytest -q
  ```
- If you add dependencies, update `backend/requirements.txt` and ensure the CI job installs them before running tests.
- Common CI failure fixes:
  - Missing env vars: add a `.env.ci` or configure secrets in GitHub Actions and load them before tests.
  - DB-related tests: prefer using a lightweight test DB (SQLite) or a test Postgres service defined in the workflow.

## Codespaces / Devcontainer notes

- There is no committed `.devcontainer/` configuration in this repo yet. Recommended devcontainer tasks for reproducible local development:
  - Start from `mcr.microsoft.com/devcontainers/python:1-3.11`.
  - Set working directory to `/workspaces/ai-skincare-intelligence-system/backend`.
  - Install `pip` deps from `backend/requirements.txt` and set `DATABASE_URL` via Codespaces secrets or environment.
- Always run services from the `backend` directory so `pydantic_settings` reads `.env` as expected.

## Daily Update Requirement

- The AI agent MUST follow the project's `docs/AI_AGILE_WORKFLOW.md` daily and keep progress documentation current.
- Practically: each workday the agent should update `/docs/PROJECT_PROGRESS_TRACKER.md` with progress or blockers, update sprint notes (`/docs/sprint-X.Y.md`) for any status changes, and ensure tests exist for changed code. Treat this as part of the Definition of Done.

## PR Template (example)

Use the following structure for PR descriptions. If you want, I can create a `.github/PULL_REQUEST_TEMPLATE.md` file automatically.

````markdown
### Summary

- **What**: One-line summary of the change
- **Why**: Short justification and links to SRS/backlog

### Changes

- Bullet the files and modules changed (e.g., `backend/app/services/auth_service.py`)

### Testing

- How to run locally (commands):

```bash
cd backend
pytest -q
```

### Checklist

- [ ] Tests added or updated
- [ ] Documentation updated (`docs/PROJECT_PROGRESS_TRACKER.md` or relevant doc)
- [ ] Env changes documented (`backend/.env.example`)

### Notes

- Anything reviewers should know (DB migrations, external services, rollout steps)
````
