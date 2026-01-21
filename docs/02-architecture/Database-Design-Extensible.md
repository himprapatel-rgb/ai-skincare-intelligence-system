# Extensible Database Design

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

### Analytics & Audit

- `user_events`
  - login, scan, routine changes, etc.
- `user_progress_snapshots`
  - lightweight trends for charts and reports

## Design Principles

- **Raw + normalized storage** for every scan.
- **JSONB fields** for flexible model output evolution.
- **Stable IDs** (UUIDs) to avoid schema conflicts.
- **Non-destructive migrations** (no table drops in prod).

## Migration Strategy

- Keep `backend/scripts/run_migrations.py` non-destructive.
- Only `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
- Backfill identifiers (`id`) from legacy columns where possible.

## Next Iterations

- Add geo ingestion endpoints for `geo_locations`.
- Store UV/pollen data nightly for each active user.
- Expand `product_store_availability` from partner APIs.

