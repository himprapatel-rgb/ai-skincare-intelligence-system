# Where We Are – Project Status

**Last Updated:** January 27, 2026

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| **Scanner & Barcode (500 tasks)** | ✅ 100% complete | Camera, photo, AI recognition, My Shelf, product details |
| **Product Database (500 tasks)** | ✅ 100% complete | Two-DB architecture, catalog API, scanner integration |
| **Staging (Fly.io + Cloudflare)** | ✅ Live | `develop` → auto-deploy |
| **Production (Fly.io + Cloudflare)** | ✅ Live | `main` → manual deploy |
| **Database** | ✅ Railway PostgreSQL | Main DB; product catalog can use same or second DB |
| **Railway deployment** | 📄 Documented | Backend + product DB deploy guide added |
| **Google Sign-In** | ⚠️ Needs secrets | Set `GOOGLE_CLIENT_ID` (GitHub + Fly.io) and `GOOGLE_CLIENT_SECRET` (Fly.io) |

---

## 1. Product Scanner & Barcode (500 tasks – done)

- **Docs:** `docs/TASK-LIST-1-500.md`
- **Done:** Camera/barcode, photo capture, AI recognition, My Shelf (filters, sort), product details (ingredients, overview, usage guide), error handling (ErrorBoundary, NetworkStatus), performance (LazyImage), API (health, tracing), DB indexes, unit + E2E tests.
- **Live on:** Staging + Production (Fly.io backend, Cloudflare frontend).

---

## 2. Product Database (500 tasks – done)

- **Docs:** `docs/TASK-LIST-PRODUCT-DATABASE.md`
- **Done:**
  - Two-DB support: `DATABASE_URL` (main) + optional `PRODUCT_DATABASE_URL` (catalog).
  - Backend: `app/product_database.py`, `ProductBase`, catalog models, catalog router (barcode/lookup/search/product/stats/categories/brands/ingredients/popular/recent/vegan/pregnancy-safe/fragrance-free/safe-for/health).
  - **Admin/DB:** PUT/DELETE product, verify product, duplicates, data-quality report, export (JSON/CSV), import/jobs. Product-Database-Migrations doc.
  - Scanner uses product DB: barcode + image scan check catalog first; new products auto-saved to catalog.
  - OBF importer uses `PRODUCT_DATABASE_URL` (or `DATABASE_URL`).
  - Frontend: `frontend/src/services/catalogService.ts`.
  - Tests: `backend/tests/test_catalog_api.py`.
- **Deploy:** Use one DB (omit `PRODUCT_DATABASE_URL`) or add a second Postgres and set `PRODUCT_DATABASE_URL`. See `docs/05-deployment/Railway-Product-Database-Deploy.md`.

---

## 3. Deployment

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Staging** | staging.pellicura.pages.dev (Cloudflare) | pellicura-api-staging.fly.dev (Fly.io) | Railway PostgreSQL |
| **Production** | pellicura.com (Cloudflare) | pellicura-api.fly.dev (Fly.io) | Railway PostgreSQL |
| **Railway (optional)** | — | Deploy backend via Railway | Same Railway Postgres or second DB for catalog |

- **Branch flow:** `develop` → staging; `main` → production (manual).
- **Railway:** Backend + product DB deploy steps in `docs/05-deployment/Railway-Product-Database-Deploy.md` and `Railway-Environment-Variables-Setup.md`.

---

## 4. Still To Do (your side)

1. **Google Sign-In (if you want it):**
   - GitHub Secrets: `GOOGLE_CLIENT_ID`
   - Fly.io (staging/production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - See `docs/05-deployment/Required-Secrets.md`

2. **Product catalog on live envs:**
   - On Fly.io: either leave `PRODUCT_DATABASE_URL` unset (use main DB) or set it to a second Postgres URL.
   - On Railway: follow `Railway-Product-Database-Deploy.md` (Option A or B).

3. **Optional:** Run OBF import to fill catalog:  
   `PRODUCT_DATABASE_URL=$DATABASE_URL python backend/scripts/import_obf_catalog.py --source api --limit 1000`

---

## 5. Key Files

| Purpose | Path |
|---------|------|
| Scanner task list (500) | `docs/TASK-LIST-1-500.md` |
| Product DB task list (500) | `docs/TASK-LIST-PRODUCT-DATABASE.md` |
| Product DB config | `backend/app/product_database.py` |
| Catalog API | `backend/app/routers/catalog.py` |
| Catalog service (frontend) | `frontend/src/services/catalogService.ts` |
| Railway product DB deploy | `docs/05-deployment/Railway-Product-Database-Deploy.md` |
| Deployment URLs | `DEPLOYMENT_URLS.md` |
| Required secrets | `docs/05-deployment/Required-Secrets.md` |

---

**In short:** Scanner and product database work are complete (1,000 tasks). Staging and production are live on Fly.io + Cloudflare with Railway for the DB. Railway backend + product DB deployment is documented; remaining steps are setting Google OAuth secrets (if needed) and configuring the product catalog DB on your chosen environment.
