# Local Setup Checklist

Quick reference for running backend scripts and tests locally.

## Environment Variables (required for DB operations)

Create a `.env` file in `backend/` (or set in your shell):

```bash
# Main database (required for most backend operations)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Product catalog (optional; falls back to DATABASE_URL)
PRODUCT_DATABASE_URL=postgresql://user:pass@host:port/productdb
```

Copy from Railway Dashboard → your backend project → Variables.

## Seed Product Catalog (OBF)

```bash
cd backend

# Dry run first (no writes)
python scripts/import_obf_catalog.py --source api --limit 100 --dry-run

# Import 1000 products from Open Beauty Facts API
python scripts/import_obf_catalog.py --source api --limit 1000
```

Requires: `PRODUCT_DATABASE_URL` or `DATABASE_URL`.

## Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

Requires: `DATABASE_URL` (tests use SQLite when configured, or skip if not set).

## Frontend Build

```bash
cd frontend
npm ci
npm run build
```

No env vars required for build. For E2E tests, create `frontend/.env.e2e` with `E2E_EMAIL` and `E2E_PASSWORD`.
