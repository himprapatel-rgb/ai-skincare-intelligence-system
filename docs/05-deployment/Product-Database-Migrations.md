# Product Catalog Database – Migrations

**Last Updated:** January 27, 2026

---

## How catalog tables are created

### Option A: Same database (single DB)

When `PRODUCT_DATABASE_URL` is **not** set, the app uses `DATABASE_URL` for both main and catalog.

- **Main migrations:** Run `python backend/scripts/run_migrations.py` (or let Docker/Railway run it). This creates **catalog_*** tables in the same database (`catalog_products`, `catalog_ingredients`, `catalog_brands`, `catalog_import_jobs`, etc.).
- **Startup:** On app startup, `create_product_tables()` also runs and creates any missing catalog tables (SQLAlchemy `ProductBase.metadata.create_all`). So catalog tables exist whether migrations ran first or not.

### Option B: Separate product database

When `PRODUCT_DATABASE_URL` **is** set to a second PostgreSQL URL:

- **Main DB:** Use `run_migrations.py` as usual for main app tables. Do **not** point it at the product DB.
- **Product DB:** Catalog tables are created **only** on app startup via `create_product_tables()` in `app/product_database.py`. There is no separate migration script for the product DB.
- **First deploy:** Deploy the backend with `PRODUCT_DATABASE_URL` set; the first startup creates all catalog tables in the product database.

---

## Tables created for the catalog

| Table | Purpose |
|-------|---------|
| `catalog_products` | Products (barcode, name, brand, category, safety, ingredients, etc.) |
| `catalog_ingredients` | Ingredient master (INCI name, safety, EWG, etc.) |
| `catalog_product_ingredients` | Product–ingredient links (position, concentration) |
| `catalog_product_images` | Multiple images per product |
| `catalog_brands` | Brand info |
| `catalog_import_jobs` | OBF/import job tracking |

---

## Checklist

- [ ] **Same DB:** `DATABASE_URL` set; `run_migrations.py` run (or run on deploy); app startup creates catalog tables if missing.
- [ ] **Separate DB:** `DATABASE_URL` + `PRODUCT_DATABASE_URL` set; deploy backend; first startup creates catalog tables in product DB.
- [ ] **OBF import:** Use `PRODUCT_DATABASE_URL` (or `DATABASE_URL` if same DB) when running `import_obf_catalog.py`.
