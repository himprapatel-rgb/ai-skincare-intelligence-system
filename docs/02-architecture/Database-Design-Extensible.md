# Extensible Database Design

**Last Updated:** January 27, 2026

This document captures the future-proof schema design for the AI Skincare
Intelligence System. It focuses on durability, extensibility, and storing
all raw + normalized outputs needed for future ML training, personalization,
and product discovery.

## Goals

- Preserve every scan output (raw + normalized) for future learning.
- Support new skin conditions without schema rewrites.
- Enable geo + environment guidance (UV, weather, pollution).
- Store skincare + product recommendations and nearest-store availability.
- Keep migrations non-destructive and compatible with live data.
- **Flexible schema**: Add fields (e.g., gender, new preferences) without migrations.
- **All data persisted**: Every user input, scan result, recommendation, and analysis is stored.
- **Future ML integration**: Ready to integrate external skin datasets (e.g., open-source face/skin databases).

## Core Tables (Existing)

- `users`, `user_profiles`
- `scan_sessions`, `skin_analyses`
- `skin_state_snapshots`, `skin_region_states`
- `environment_snapshots`, `routine_instances`, `routine_product_usage`
- `products`, `ingredients`, `product_ingredients`

## Extended Tables (New)

### Scan Output & Conditions

- `scan_outputs`
  - raw ML output, normalized output, model metadata
- `skin_conditions`
  - condition catalog (extensible by slug/name)
- `scan_conditions`
  - condition severity per scan, confidence, affected regions
- `scan_recommendations`
  - routine/skincare recommendations per scan
- `product_recommendations`
  - specific product recommendations tied to a scan

### Geo + Environment

- `geo_locations`
  - user location history (lat/lng + city/region/timezone)
- `environmental_readings`
  - UV, humidity, AQI, pollen, weather conditions
- `daily_skin_guidance`
  - daily recommendations and the reasoning behind them

### Retail / Store Availability

- `stores`
  - store metadata + geo location
- `product_store_availability`
  - product pricing and availability in nearby stores
- `product_offers`
  - discounts + promo pricing metadata

### Analytics & Audit

- `user_events`
  - login, scan, routine changes, etc.
- `user_progress_snapshots`
  - lightweight trends for charts and reports

### Product Scan + Notifications

- `product_scan_sessions`
  - at-home product scan inputs + outputs
- `product_scan_items`
  - resolved products per scan
- `routine_recommendations`
  - routine payloads derived from scans/products
- `routine_checkins`
  - user confirmations (AM/PM complete)
- `user_notifications`
  - scheduled reminders and alerts
- `notification_events`
  - delivery/open/ack events
- `geo_alerts`
  - UV/heat alerts derived from location

## Design Principles

- **Raw + normalized storage** for every scan.
- **JSONB fields** for flexible model output evolution.
- **Stable IDs** (UUIDs) to avoid schema conflicts.
- **Non-destructive migrations** (no table drops in prod).

## Table Creation Strategy

Tables are created automatically at startup via SQLAlchemy's `Base.metadata.create_all()`:

1. **All models imported in `main.py`** → ensures all tables are created
2. **`checkfirst=True`** → non-destructive, only creates if missing
3. **JSONB fields** → allow flexible schema evolution without migrations
4. **Relationships** → handle FK constraints automatically

### Model Files (backend/app/models/)

| File | Tables |
|------|--------|
| `user.py` | `users`, `user_profiles`, `user_consents`, `policy_versions` |
| `scan.py` | `scan_sessions`, `skin_analyses`, `confidence_metrics`, `fairness_metrics` |
| `product_models.py` | `products`, `ingredients`, `product_ingredients`, `product_reviews` |
| `twin_models.py` | `skin_state_snapshots`, `skin_region_states`, `environment_snapshots`, `routine_instances`, `routine_product_usage` |
| `analysis_outputs.py` | `scan_outputs`, `skin_conditions`, `scan_conditions`, `scan_recommendations`, `product_recommendations`, `geo_locations`, `environmental_readings`, `daily_skin_guidance`, `stores`, `product_store_availability`, `user_events`, `user_progress_snapshots` |
| `engagement.py` | `product_scan_sessions`, `product_scan_items`, `routine_recommendations`, `routine_checkins`, `user_notifications`, `notification_events`, `geo_alerts`, `product_offers` |
| `favorites.py` | `favorites` |
| `goals.py` | `skin_goals` |
| `notifications.py` | `notifications` |
| `shelf.py` | `shelf_items` |
| `progress_photo.py` | `progress_photos` |
| `saved_routine.py` | `saved_routines` |

### Adding New Fields

To add a new field (e.g., `gender` to `user_profiles`):

1. Add column to the model in `user.py`
2. Redeploy → `create_all()` handles new columns via `ALTER TABLE ADD COLUMN IF NOT EXISTS` in production DDL hooks
3. For existing columns that need type changes, use `run_migrations.py`

## Migration Strategy

- Keep `backend/scripts/run_migrations.py` non-destructive.
- Only `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- Backfill identifiers (`id`) from legacy columns where possible.
- For complex migrations, use direct SQL in `run_migrations.py`.

## External Data Integration

Ready for future integration with external skin/face databases:

1. **Products table** → can import from OpenBeautyFacts, cosmetics DBs
2. **Ingredients table** → INCI database, safety ratings
3. **Scan training data** → structure supports importing labeled skin condition datasets
4. **Store availability** → partner API integrations

### Importing Face/Skin Datasets

When importing open-source face/skin databases:

1. **Normalize data** to match existing schema
2. **Use batch inserts** via `psycopg2.extras.execute_values()`
3. **Store raw data** in JSONB `metadata` fields for flexibility
4. **Create mapping tables** if needed for foreign references

## Next Iterations

- Add geo ingestion endpoints for `geo_locations`.
- Store UV/pollen data nightly for each active user.
- Expand `product_store_availability` from partner APIs.
- Import open-source skin condition datasets for ML training.

