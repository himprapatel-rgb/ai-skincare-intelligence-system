# Database Testing Report – January 31, 2026

## Summary

Comprehensive database integration tests verify that all harvest/save flows persist correctly, routing is correct, and the two-database architecture is well designed.

---

## Architecture

### Two-Database Design

| Database | Variable | Tables | Purpose |
|----------|----------|--------|---------|
| **Main** | `DATABASE_URL` | users, user_profiles, scan_sessions, skin_analyses, shelf_products, skin_goals, saved_routines, progress_photos, notifications, favorites, consent, etc. | User data, scans, shelf, routines, goals |
| **Product Catalog** | `PRODUCT_DATABASE_URL` (or same as main) | catalog_products, catalog_ingredients, catalog_product_ingredients, catalog_brands, catalog_import_jobs | Product catalog, ingredients, lookup |

### Routing

- **`get_db`** → Main DB (SessionLocal) – used by auth, profile, scan, shelf, goals, favorites, notifications, consent, digital_twin, routines, progress
- **`get_product_db`** → Product DB (ProductSessionLocal) – used by catalog router, ProductCatalogService
- **products router** – uses both: `get_db` for legacy Product/Ingredient (main), `get_product_db` for catalog lookups and catalog writes

---

## Harvest/Save Flows Verified

| Flow | Table(s) | DB | Test |
|------|----------|-----|------|
| User registration | users | Main | ✅ test_user_persists, test_register_creates_user |
| User profile | user_profiles | Main | ✅ test_user_profile_persists |
| Scan upload | scan_sessions | Main | ✅ test_scan_session_persists |
| Skin analysis | skin_analyses | Main | ✅ test_skin_analysis_persists |
| Shelf add | shelf_products | Main | ✅ test_shelf_product_persists, test_add_to_shelf_persists |
| Goals | skin_goals | Main | ✅ test_skin_goal_persists |
| Routines | saved_routines | Main | ✅ test_saved_routine_persists |
| Progress photos | progress_photos | Main | ✅ test_progress_photo_persists |
| Catalog product | catalog_products | Product | ✅ test_catalog_product_persists |
| Catalog ingredient | catalog_ingredients | Product | ✅ test_catalog_ingredient_persists |

---

## Test Results

```
19 passed in ~4s
```

### Connection & Tables
- Main DB connection ✅
- Main DB core tables exist (users, user_profiles, scan_sessions, skin_analyses, shelf_products) ✅
- Product DB connection ✅
- Product DB catalog_products table exists ✅

### Main DB Harvest
- User persists ✅
- UserProfile persists ✅
- ScanSession persists ✅
- SkinAnalysis persists (with FK to ScanSession) ✅
- ShelfProduct persists ✅
- SkinGoal persists ✅
- SavedRoutine persists ✅
- ProgressPhoto persists ✅

### Product DB Harvest
- CatalogProduct persists ✅
- CatalogIngredient persists ✅

### Routing
- Catalog uses ProductBase (product DB) ✅
- Shelf uses Base (main DB) ✅
- Scan uses Base (main DB) ✅

### API → Database
- POST /auth/register creates user ✅
- POST /shelf adds to shelf_products ✅

---

## Design Quality

1. **Separation of concerns**: User/scan data isolated from product catalog
2. **Scalability**: Product DB can scale independently; catalog is read-heavy
3. **FK integrity**: ScanSession→SkinAnalysis, User→ShelfProduct, etc. verified
4. **Dependency injection**: get_db / get_product_db correctly wired
5. **Table creation**: Base.metadata (main) and ProductBase.metadata (catalog) created at startup

---

## Run Tests

```bash
cd backend
export DATABASE_URL="sqlite:///./test.db"
export PRODUCT_DATABASE_URL="sqlite:///./test_product.db"
pytest tests/test_database_integration.py -v
```
