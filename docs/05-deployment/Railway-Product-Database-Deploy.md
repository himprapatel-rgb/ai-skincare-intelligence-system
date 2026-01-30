# Deploy Product Database on Railway

**Last Updated:** January 27, 2026  
**Status:** Ready for deployment

---

## Deploy backend on Railway

Your repo is already set up for Railway:

- **`railway.json`** – build from `backend/Dockerfile`, healthcheck `/api/health`
- **`railway.toml`** – same build/deploy config

### Deploy steps

1. **Connect the repo**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
   - Select this repo and (optionally) the branch to deploy.

2. **Add PostgreSQL**
   - In the project: **+ New** → **Database** → **PostgreSQL**.
   - Railway will set `DATABASE_URL` on the backend when you add the DB (or you can reference it in Variables).

3. **Set backend variables**
   - Open the **backend service** → **Variables**.
   - Ensure:
     - `DATABASE_URL` – from the PostgreSQL service (reference or paste).
     - `SECRET_KEY` – e.g. `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
     - `ENV` = `production`.
   - For the **product catalog** see options A/B below.

4. **Deploy**
   - Railway deploys on push. Or use **Deploy** in the dashboard.
   - Logs: backend service → **Logs**. Health: `https://YOUR-SERVICE.up.railway.app/api/health`.

---

## Overview

The app uses a **two-database architecture**:

| Database | Variable | Purpose |
|----------|----------|---------|
| **Main** | `DATABASE_URL` | Users, scans, shelf, routines, auth |
| **Product Catalog** | `PRODUCT_DATABASE_URL` | Products, ingredients, brands (optional separate DB) |

**On Railway you can:**

1. **Option A (simplest):** Use one PostgreSQL database for both. Do not set `PRODUCT_DATABASE_URL`. The app will use `DATABASE_URL` for the catalog and create catalog tables in the same database.
2. **Option B:** Add a second PostgreSQL service on Railway for the product catalog and set `PRODUCT_DATABASE_URL` to its connection string.

---

## Option A: Single Database (Recommended to start)

1. In Railway, ensure your backend service has **`DATABASE_URL`** set (from your PostgreSQL service).
2. **Do not set** `PRODUCT_DATABASE_URL`.
3. Deploy. On startup the app will:
   - Create main tables (via migrations)
   - Create product catalog tables in the **same** database
   - Use the same connection for both.

**No extra steps.** Deploy as usual.

---

## Option B: Two Databases on Railway

### Step 1: Add a second PostgreSQL service

1. Open your project on [Railway](https://railway.app).
2. Click **+ New** → **Database** → **PostgreSQL**.
3. Name it e.g. `product-catalog-db`.
4. Wait for it to provision.
5. Open the new PostgreSQL service → **Variables** (or **Connect**).
6. Copy the **`DATABASE_URL`** (or `POSTGRES_URL` / connection string).

### Step 2: Set PRODUCT_DATABASE_URL on the backend

1. Open your **backend service** (the one that runs the API).
2. Go to **Variables**.
3. Click **+ New Variable**.
4. **Name:** `PRODUCT_DATABASE_URL`  
   **Value:** paste the connection string from the new PostgreSQL service.
5. Save. Railway will redeploy the backend.

### Step 3: Reference from backend (Railway UI)

If both services are in the same project:

1. In the backend service → **Variables** → **+ New Variable**.
2. Choose **Add Reference** (or “Reference Variable”).
3. Select the **product-catalog-db** service and the variable **DATABASE_URL** (or the one that holds the Postgres URL).
4. Name the reference: `PRODUCT_DATABASE_URL`.
5. Save and redeploy.

---

## Verify deployment

### 1. Health check

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Expected (single DB):

```json
{
  "status": "healthy",
  "checks": {
    "main_database": { "status": "ok", "latency_ms": ... },
    "product_database": { "status": "ok", "latency_ms": ..., "is_separate_db": false }
  }
}
```

With two DBs, `product_database.is_separate_db` will be `true`.

### 2. Catalog health

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/v1/catalog/health
```

Expected:

```json
{
  "status": "healthy",
  "latency_ms": ...,
  "counts": { "products": 0, "ingredients": 0, "brands": 0 }
}
```

### 3. Barcode lookup (should work even with empty catalog)

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/v1/catalog/barcode/0000000000000
```

Expected: `{"found": false, "source": "not_found"}` or a product if that barcode exists.

---

## Environment variables summary (Railway)

### Required for backend

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | From main PostgreSQL service |
| `SECRET_KEY` | Yes | JWT signing |
| `ENV` | Recommended | `production` |
| `PORT` | Set by Railway | Do not override |

### Optional for product catalog

| Variable | Required | Notes |
|----------|----------|--------|
| `PRODUCT_DATABASE_URL` | No | Omit to use main DB; set to second Postgres URL for separate catalog DB |

---

## Troubleshooting

**Catalog endpoints return 500 or “database not configured”**

- Ensure `DATABASE_URL` is set on the backend.
- If you use Option B, ensure `PRODUCT_DATABASE_URL` is set and is a valid Postgres URL from the second service.
- Check backend logs on Railway for connection errors.

**Tables don’t exist**

- Catalog tables are created on app startup. Restart the backend service once after setting variables.
- If you use run_migrations, ensure the migration that creates `catalog_*` tables has been run on the DB that the app uses for the catalog (main DB in Option A, product DB in Option B).

**“Product database not configured”**

- You must set at least `DATABASE_URL`. If `PRODUCT_DATABASE_URL` is not set, the app uses `DATABASE_URL` for the catalog (Option A).

---

## Next steps

- Run the OBF importer against the catalog DB (use `PRODUCT_DATABASE_URL` or `DATABASE_URL` in Option A):  
  `PRODUCT_DATABASE_URL=$DATABASE_URL python scripts/import_obf_catalog.py --source api --limit 1000`
- Point the frontend to your Railway backend URL and test scanner and catalog flows.

---

**Document status:** Ready for use  
**Next step:** Deploy backend on Railway (Option A or B) and run the verification commands above.
