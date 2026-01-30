# Two Databases on Railway – Setup Checklist

**Goal:** Have **both** databases on Railway up and running, each storing its own data.

| Database | Variable | Stores |
|----------|----------|--------|
| **Main** | `DATABASE_URL` | Users, auth, shelf, scans, routines, notifications, digital twin |
| **Product catalog** | `PRODUCT_DATABASE_URL` | Products, ingredients, brands, catalog images, import jobs |

**If you already have multiple PostgreSQL services** in the same project, pick one as main (backend `DATABASE_URL`) and a **different** one as product catalog (backend `PRODUCT_DATABASE_URL`). No need to add a new DB.

**To wire an existing second Postgres as product catalog:** Open your **backend** service (e.g. `ai-skincare-intelligence-system`) → **Variables** → **+ New Variable** → **Add Reference** → select one of the **other** Postgres services (not the one used for `DATABASE_URL`) → choose its **DATABASE_URL** → name the reference **`PRODUCT_DATABASE_URL`** → Save. Railway will redeploy; then run the verify script (Step 4).

---

## Quick checklist

1. [ ] **Main PostgreSQL** – One PostgreSQL service is used as main DB. Backend has `DATABASE_URL` pointing to it.
2. [ ] **Product catalog PostgreSQL** – Either use an **existing** second Postgres service in the project, or add one: **+ New** → **Database** → **PostgreSQL**.
3. [ ] **Backend variables** – On the **backend** service set `PRODUCT_DATABASE_URL` to the **product catalog** Postgres connection URL (reference or paste).
4. [ ] **Redeploy** – Backend creates product catalog tables in that DB on startup.
5. [ ] **Verify** – Run the verify script or hit `/api/health` and `/api/v1/catalog/health`.

---

## Step 1: Get a second PostgreSQL for the product catalog

**If you already have more than one Postgres in the project:** Pick the one that is **not** used as `DATABASE_URL` on the backend. Use that service’s connection URL as `PRODUCT_DATABASE_URL` (Step 2).

**If you only have one Postgres (your main DB):**

1. Open your project on [Railway](https://railway.app).
2. Click **+ New** → **Database** → **PostgreSQL**.
3. Name it e.g. **`product-catalog-db`** (or leave default).
4. Wait until the service shows **Active** / ready.
5. Open that PostgreSQL service → **Variables** (or **Connect**).
6. Copy the **connection URL** (often `DATABASE_URL` or `POSTGRES_URL`). You will use it as `PRODUCT_DATABASE_URL`.

---

## Step 2: Set variables on the backend service

1. Open your **backend** service (the one that runs the API).
2. Go to **Variables**.
3. Ensure **`DATABASE_URL`** is set to your **main** PostgreSQL connection URL (from your first/existing Postgres service).
4. Add the product catalog URL:
   - Click **+ New Variable**.
   - **Option A – Reference (recommended):**  
     Choose **Add Reference** → select the **product-catalog-db** service → select its **DATABASE_URL** (or the variable that holds the Postgres URL). Name the reference: **`PRODUCT_DATABASE_URL`**.
   - **Option B – Paste:**  
     Name: **`PRODUCT_DATABASE_URL`**, Value: paste the connection string you copied from the product-catalog-db service.
5. Save. Railway will redeploy the backend.

---

## Step 3: Confirm startup

After redeploy:

1. Open backend **Logs**.
2. You should see lines like:
   - `Creating database tables (if not exist)...`
   - `✅ Main database tables ensured`
   - `Creating product catalog tables...`
   - `✅ Product catalog tables ensured`
   - Optionally: `Product catalog using SEPARATE database`

If you see errors about "product database not configured" or connection refused, double-check that `PRODUCT_DATABASE_URL` is set and is a valid Postgres URL from the **second** service.

---

## Step 4: Verify both databases

**Option A – Verify script (from repo):**

```bash
cd backend
pip install requests   # if needed
python scripts/verify_two_databases.py --url https://YOUR-BACKEND-URL.up.railway.app
```

Exits 0 if both DBs and catalog API are ok.

**Option B – curl:**

```bash
curl https://YOUR-BACKEND-URL.up.railway.app/api/health
```

Expected:

- `checks.main_database.status`: `"ok"`
- `checks.product_database.status`: `"ok"`
- `checks.product_database.is_separate_db`: `true`

```bash
curl https://YOUR-BACKEND-URL.up.railway.app/api/v1/catalog/health
```

Expected: `"status": "healthy"` and counts (products/ingredients/brands may be 0 until you import data).

---

## If the product database is empty (no tables)

The backend creates catalog tables on startup. If the product DB still has no tables (e.g. older deployment or startup failed), run this **once** from your machine with `PRODUCT_DATABASE_URL` set to the product DB URL (e.g. from Railway → Postgres-rvCO → Variables → `DATABASE_URL`):

```bash
cd backend
# Set PRODUCT_DATABASE_URL to your product catalog Postgres URL from Railway
python scripts/create_catalog_tables.py
```

This creates: `catalog_products`, `catalog_ingredients`, `catalog_product_ingredients`, `catalog_product_images`, `catalog_brands`, `catalog_import_jobs`.

---

## Step 5 (optional): Seed the product catalog

To add real product data into the **product** database:

- From your machine (with env pointing at production), or from a one-off Railway run:

```bash
# Replace with your real PRODUCT_DATABASE_URL from Railway (product-catalog-db)
export PRODUCT_DATABASE_URL="postgresql://..."

# From repo root, with backend deps installed
cd backend
python scripts/import_obf_catalog.py --source api --limit 1000
```

Or use the same URL as in Railway Variables. This writes only to the product catalog DB; the main DB is unchanged.

---

## Summary

| What | Where |
|------|--------|
| Main DB (users, shelf, scans, …) | First PostgreSQL service → `DATABASE_URL` on backend |
| Product catalog DB (products, ingredients, …) | Second PostgreSQL service → `PRODUCT_DATABASE_URL` on backend |
| Tables in product DB | Created automatically on backend startup (`create_product_tables`) |
| Both running | `/api/health` shows both `main_database` and `product_database` ok |

Once both databases are set and health checks pass, the app is using a full two-database setup: main DB for user data, product DB for catalog, both up and storing data.
