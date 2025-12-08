# SPRINT 4: BACKEND EXTERNAL DATA INTEGRATION & ML DATA PLATFORM
## "ML-Ready Data Pipeline: Postgres → R2 + Product Scanner Foundation"

**Status:** Ready for Sprint Kickoff  
**Sprint Duration:** 2 weeks (10 business days)  
**Start Date:** December 23, 2025  
**End Date:** January 3, 2025  
**Last Updated:** December 8, 2025

---

## EXECUTIVE SUMMARY

Sprint 4 builds the **backend infrastructure for ML-driven skincare intelligence** by:

1. **Ingesting external product/ingredient data** (Open Beauty Facts, EU CosIng) → Railway PostgreSQL
2. **Implementing internal knowledge base schema** (SRS 5.2–5.4) for all data types (skin scans, outcomes, N-of-1 experiments)
3. **Creating ML-ready export pipelines** that periodically dump normalized training datasets to Cloudflare R2
4. **Building product scanner API** (barcode/OCR → ingredient parsing → safety classification → suitability scoring)
5. **Wiring ML training workspace** to use R2 datasets + live Postgres for model development and retraining

By end of Sprint 4, the **system will have:**
- ✅ Normalized product/ingredient reference database
- ✅ Complete internal data schema (DR3–DR6 from SRS 5.x)
- ✅ Nightly export job: Postgres → Cloudflare R2 (versioned, ML-ready)
- ✅ Working product scan → suitability API (stub models → real models by Sprint 5)
- ✅ ML training pipeline pulling from R2 + live Postgres
- ✅ Model registry in Postgres tracking active models & versions

---

## SPRINT 4 GOALS

| Goal | Owner | Success Criteria |
|------|-------|-----------------|
| **Backend can ingest & normalize external product data** | Backend Lead | Open Beauty Facts + CosIng imported, queryable by barcode/INCI |
| **All ML-relevant data stored in Railway Postgres per SRS 5.x** | Backend Lead + ML Lead | Tables for ingredient_effects, skin_outcomes, experiments, user_metadata all populated |
| **Nightly Postgres → R2 export pipeline working** | DevOps + Backend | Datasets versioned in R2, tested for ML loading, no data loss |
| **Product scanner API ready (MVP version)** | Backend Lead | `/products/scan` endpoint returns ingredients + suitability (Safe/Caution/Not Recommended) |
| **ML training workspace integrated with R2 + Postgres** | ML Lead | One model (ingredient-risk classifier or suitability model) trained end-to-end, artifact registered |
| **Database schema documented & migrations tested** | Backend Lead | All new tables have schema diagrams, migrations run clean on dev/staging, rollback tested |
| **Backend inference using trained models** | Backend + ML | Product suitability or concern endpoint uses real model (not stub), latency ≤ 4s |

---

## SCOPE: 7 USER STORIES (~45–50 STORY POINTS)

### Story 4.1: External Data Ingestion (Open Beauty Facts + CosIng)

**Priority:** CRITICAL | **Story Points:** 8 | **Sprint:** 4  
**Assigned To:** Backend Engineer #1  
**Complexity:** Medium | **Estimated Hours:** 20–25

#### USER STORY STATEMENT

As a backend system, I want to download and normalize external product and ingredient data from Open Beauty Facts and EU CosIng, so that the app can power product scanning, ingredient safety profiling, and provide accurate reference data for user queries.

#### ACCEPTANCE CRITERIA (10)

1. **Open Beauty Facts API Integration**
   - Download product catalog: barcode, name, brand, ingredient list, image URL
   - Store normalized products in `products_external` table
   - Weekly sync job runs automatically (cron job)
   - Endpoint: `GET /api/v1/products/external?barcode={barcode}`

2. **EU CosIng Ingredient Reference**
   - Fetch all INCI ingredients with functions, restrictions, regulatory notes
   - Store in `ingredients_reference` table with fields: inci_name, synonyms, functions, restrictions_eu, restrictions_us, microbiome_flag
   - Searchable by INCI name, product ingredient list can match against this reference

3. **Data Normalization**
   - Handle different barcode formats (EAN-13, UPC-A, etc.)
   - Standardize ingredient names (handle typos, synonyms)
   - Flag missing or suspicious data (NULL checks, suspicious ingredient names)

4. **Error Handling**
   - API failures → retry logic with exponential backoff (max 3 retries)
   - Partial failures → rollback partial transaction, log error
   - Data validation → skip invalid rows, log warnings, notify team via Slack

5. **Performance**
   - Initial full sync: ≤ 2 minutes
   - Weekly incremental sync: ≤ 30 seconds
   - Query by barcode: ≤ 100ms
   - Query by INCI name: ≤ 200ms (uses indexed full-text search)

6. **Data Storage & Cleanup**
   - Soft-delete old records (keep audit trail)
   - Database size manageable: ≤ 5GB for 2M products + 10K ingredients
   - Backup before each sync

7. **Documentation**
   - API reference in OpenAPI spec
   - Sync job troubleshooting guide in wiki
   - Data schema diagram (products_external, ingredients_reference)

8. **Testing**
   - Unit tests: data normalization functions (handle edge cases: NULL, duplicates, special characters)
   - Integration tests: full sync workflow (download → normalize → store → query)
   - Load test: query 1000 products/minute, latency p95 < 200ms

9. **Monitoring**
   - Alert if sync job fails or takes > 5 minutes
   - Log all sync events (rows added, updated, failed)
   - Dashboard: last sync time, row counts, error rates

10. **Compliance**
    - Acknowledge source data licenses (Open Beauty Facts: Open License, CosIng: CPNP)
    - No proprietary modifications without license compliance review

#### TECHNICAL REQUIREMENTS

**New Tables:**

```sql
-- External product reference (read-only, synced from Open Beauty Facts)
CREATE TABLE products_external (
    product_id UUID PRIMARY KEY,
    barcode VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    ingredients_raw TEXT,  -- Raw ingredient list from source
    image_url TEXT,
    source_url TEXT,
    source ('open_beauty_facts', 'custom'),
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,  -- Soft delete
    metadata JSONB
);

CREATE INDEX idx_products_external_barcode ON products_external(barcode);
CREATE INDEX idx_products_external_name ON products_external USING GIN (to_tsvector('english', name));

-- Ingredient master reference (synced from CosIng)
CREATE TABLE ingredients_reference (
    ingredient_id UUID PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    synonyms TEXT[],  -- Alternative names
    functions VARCHAR(255)[],  -- e.g. ['humectant', 'surfactant']
    restrictions_eu JSONB,  -- EU CPNP restrictions
    restrictions_us JSONB,  -- FDA restrictions
    microbiome_impact_flag BOOLEAN,  -- Known to disrupt microbiome
    sensitizer_risk_score FLOAT,  -- 0--1 (0=none, 1=high)
    evidence_level VARCHAR(20),  -- 'high', 'medium', 'low'
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_ingredients_reference_inci ON ingredients_reference(inci_name);

-- Mapping: products → ingredients (normalized from raw ingredient lists)
CREATE TABLE product_ingredients (
    product_id UUID NOT NULL REFERENCES products_external(product_id),
    ingredient_id UUID NOT NULL REFERENCES ingredients_reference(ingredient_id),
    concentration_percent FLOAT,  -- If available
    order_in_list INT,  -- Ingredient order (high = concentrated first)
    PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient_id ON product_ingredients(ingredient_id);
```

**Backend Endpoints:**

```
GET /api/v1/products/external?barcode={barcode}
→ Returns: { product_id, barcode, name, brand, ingredients: [{inci_name, functions, sensitizer_risk}], metadata }

GET /api/v1/products/external/search?q={name}
→ Returns: paginated list of matching products

GET /api/v1/ingredients/reference?inci_name={name}
→ Returns: { ingredient_id, inci_name, functions, restrictions_eu, restrictions_us, microbiome_flag, sensitizer_risk }

POST /api/v1/admin/sync/external-data (internal endpoint, auth required)
→ Triggers manual sync job, returns job_id for status tracking
```

**Sync Job Implementation:**

- **Framework:** APScheduler (Python) or node-cron (Node.js)
- **Frequency:** Weekly at 02:00 UTC (low-traffic window)
- **Rollback Strategy:** Keep previous version snapshot in DB, revert if new version fails validation
- **Notification:** Slack webhook on success/failure

#### DATABASE SCHEMA DIAGRAM

```
┌─────────────────────────┐
│  products_external      │
├─────────────────────────┤
│ product_id (PK)         │
│ barcode (unique)        │
│ name                    │
│ brand                   │
│ ingredients_raw         │
│ image_url               │
│ source                  │
│ synced_at               │
└─────────────────────────┘
            │
            │ FK (product_id)
            │
            v
┌─────────────────────────┐       ┌──────────────────────────┐
│  product_ingredients    │───────│  ingredients_reference   │
├─────────────────────────┤ FK    ├──────────────────────────┤
│ product_id              │───────│ ingredient_id (PK)       │
│ ingredient_id           │       │ inci_name (unique)       │
│ concentration_percent   │       │ synonyms[]               │
│ order_in_list           │       │ functions[]              │
└─────────────────────────┘       │ restrictions_eu (JSONB)  │
                                  │ restrictions_us (JSONB)  │
                                  │ microbiome_impact_flag   │
                                  │ sensitizer_risk_score    │
                                  │ evidence_level           │
                                  │ synced_at                │
                                  └──────────────────────────┘
```

#### TESTING STRATEGY

| Test Case ID | Scenario | Expected Result | Pass/Fail |
|---|---|---|---|
| EXT-001 | Download Open Beauty Facts, import 100K products | All products stored with correct schema | ☐ |
| EXT-002 | Download CosIing, import 10K ingredients | All ingredients indexed and searchable | ☐ |
| EXT-003 | Query product by barcode (exists) | ≤ 100ms response, correct data | ☐ |
| EXT-004 | Query product by barcode (doesn't exist) | 404 Not Found | ☐ |
| EXT-005 | Search ingredients by INCI name | Full-text search works, ≤ 200ms | ☐ |
| EXT-006 | Sync job fails (API down) | Retry 3 times, alert on final failure | ☐ |
| EXT-007 | Partial data failure (corrupt row) | Skip corrupt row, log warning, continue | ☐ |
| EXT-008 | Concurrent product queries (1000/min) | All queries complete, p95 < 200ms | ☐ |
| EXT-009 | Duplicate barcode in source | Keep most recent version, soft-delete old | ☐ |
| EXT-010 | Ingredient name with special chars | Normalized, searchable, no errors | ☐ |

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] All 10 acceptance criteria verified via test matrix
- [ ] Code reviewed by Backend Lead + 1 peer
- [ ] Performance targets met (initial sync ≤ 2 min, query ≤ 200ms)
- [ ] Error handling and retry logic working
- [ ] Database migrations run cleanly on dev/staging
- [ ] OpenAPI documentation complete
- [ ] Monitoring alerts configured
- [ ] Sync job schedule documented and tested
- [ ] Data licenses acknowledged in code comments
- [ ] Zero critical security issues (data validation, injection prevention)

---

### Story 4.2: Internal Knowledge Base & Outcome Schema (SRS 5.2–5.4)

**Priority:** CRITICAL | **Story Points:** 8 | **Sprint:** 4  
**Assigned To:** Backend Engineer #2  
**Complexity:** Medium | **Estimated Hours:** 20–25

#### USER STORY STATEMENT

As an ML system and backend API, I want to store all user skin outcome data, feedback, and experiment metadata in a normalized schema aligned with SRS 5.2–5.4 (DR3–DR6), so that the data can be exported for training, supports outcome tracking, and enables N-of-1 experiments.

#### ACCEPTANCE CRITERIA (8)

1. **Extend `scans` table with new fields**
   - regional_metrics (JSONB: forehead_redness, cheeks_acne, chin_dryness, etc.)
   - lighting_score (0–100)
   - angle_deviation (degrees)
   - confidence_overall (0–1)
   - scan_completed_at (timestamp)

2. **New table: `user_skin_outcomes`** (tracks routine + product impact)
   - scan_id, routine_id (or NULL), product_ids[], user_feedback ('improved'/'same'/'worse'), feedback_score (0–10), time_to_outcome_days (int, e.g., 7, 14, 30), irritation_flag (boolean), notes (text), created_at
   - Enable users to report: "After using routine X for 7 days, my acne improved by 3 points"

3. **New table: `ingredient_skin_effects`** (maps ingredients to observed effects)
   - ingredient_id, effect_type ('irritant'/'sensitizer'/'hydrating'/'occlusive'/'etc'), evidence_level ('high'/'medium'/'low'), regulatory_notes (text), microbiome_impact_flag (boolean), aggregate_user_feedback_score (float, 0–1)
   - Join with skin_outcomes to build effect profiles

4. **New table: `experiment_periods`** (for N-of-1 tracking, SRS DR6)
   - experiment_id, period_type ('baseline'/'intervention'), start_date, end_date, routine_id, products_used[], scan_schedule (dates), user_notes

5. **New table: `experiment_outcomes`** (aggregates experiment results)
   - experiment_id, period_type, mean_concern_score_before, mean_concern_score_after, improvement_pct, adherence_rate, outcome_summary (narrative)

6. **ML-Ready Views** (exportable to R2)
   - `ml_product_suitability_view`: user_id, scan_id, product_id, ingredient_ids[], skin_state, user_feedback, feedback_score
   - `ml_routine_safety_view`: routine_id, products[], concern_scores_before, concern_scores_after, user_feedback
   - `ml_n_of_1_view`: experiment_id, baseline_metrics, intervention_metrics, outcome

7. **Data Validation**
   - Foreign key constraints (scan_id → scans, routine_id → routines, experiment_id → experiments)
   - Check constraints (feedback_score 0–10, time_to_outcome > 0, adherence_rate 0–1)
   - NOT NULL enforcement for required fields

8. **Indexing & Performance**
   - Indexes on: user_id, scan_id, routine_id, product_id, ingredient_id, created_at
   - Partitioning strategy (optional): partition user_skin_outcomes by user_id for large tables
   - Query performance: SELECT from outcomes table 10K rows ≤ 200ms

#### TECHNICAL REQUIREMENTS

**Schema:**

```sql
-- Extend scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS (
    regional_metrics JSONB,  -- {forehead_redness: 45, cheeks_acne: 23, chin_dryness: 55, ...}
    lighting_score INT CHECK (lighting_score >= 0 AND lighting_score <= 100),
    angle_deviation FLOAT,  -- degrees from straight-on
    confidence_overall FLOAT CHECK (confidence_overall >= 0 AND confidence_overall <= 1),
    scan_completed_at TIMESTAMP
);

-- User skin outcomes: tracks routine/product impact feedback
CREATE TABLE user_skin_outcomes (
    outcome_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scan_id UUID NOT NULL REFERENCES scans(scan_id) ON DELETE CASCADE,
    routine_id UUID REFERENCES routines(routine_id) ON DELETE SET NULL,
    product_ids UUID[],  -- Product UUIDs used in tested routine/shelf
    user_feedback VARCHAR(20) NOT NULL CHECK (user_feedback IN ('improved', 'same', 'worse')),
    feedback_score INT CHECK (feedback_score >= 0 AND feedback_score <= 10),  -- 0=worse, 10=much improved
    time_to_outcome_days INT CHECK (time_to_outcome_days > 0),  -- e.g., 7, 14, 30
    irritation_flag BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_skin_outcomes_user_id ON user_skin_outcomes(user_id);
CREATE INDEX idx_user_skin_outcomes_scan_id ON user_skin_outcomes(scan_id);
CREATE INDEX idx_user_skin_outcomes_routine_id ON user_skin_outcomes(routine_id);
CREATE INDEX idx_user_skin_outcomes_created_at ON user_skin_outcomes(created_at);

-- Ingredient skin effects: reference table mapping ingredients → observed effects
CREATE TABLE ingredient_skin_effects (
    effect_id UUID PRIMARY KEY,
    ingredient_id UUID NOT NULL REFERENCES ingredients_reference(ingredient_id) ON DELETE CASCADE,
    effect_type VARCHAR(50) NOT NULL CHECK (effect_type IN ('irritant', 'sensitizer', 'allergen', 'hydrating', 'occlusive', 'exfoliating', 'antimicrobial', 'antioxidant', 'etc')),
    evidence_level VARCHAR(20) NOT NULL CHECK (evidence_level IN ('high', 'medium', 'low')),
    regulatory_notes TEXT,  -- e.g., "Banned in EU", "Restricted concentration in US"
    microbiome_impact_flag BOOLEAN DEFAULT FALSE,
    aggregate_user_feedback_score FLOAT CHECK (aggregate_user_feedback_score >= 0 AND aggregate_user_feedback_score <= 1),  -- 0=bad, 1=good
    study_references TEXT[],  -- URLs to supporting studies
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredient_skin_effects_ingredient_id ON ingredient_skin_effects(ingredient_id);

-- N-of-1 Experiments (SRS 5.4, DR6)
CREATE TABLE experiments (
    experiment_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'baseline_phase', 'intervention_phase', 'completed', 'aborted')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE experiment_periods (
    period_id UUID PRIMARY KEY,
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('baseline', 'intervention')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    routine_id UUID REFERENCES routines(routine_id),
    products_used UUID[],
    scan_schedule DATE[],  -- Dates user should take scans
    user_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE experiment_outcomes (
    outcome_id UUID PRIMARY KEY,
    experiment_id UUID NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
    metric_name VARCHAR(100),  -- e.g., 'acne', 'redness', 'overall_improvement'
    baseline_mean FLOAT,
    baseline_std FLOAT,
    intervention_mean FLOAT,
    intervention_std FLOAT,
    improvement_pct FLOAT CHECK (improvement_pct >= -100 AND improvement_pct <= 100),  -- e.g., +25% improvement
    adherence_rate FLOAT CHECK (adherence_rate >= 0 AND adherence_rate <= 1),  -- e.g., 0.85 = 85% adherence
    statistical_significance VARCHAR(20),  -- 'significant', 'not_significant', 'inconclusive'
    outcome_summary TEXT,  -- Natural language summary for user
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiments_user_id ON experiments(user_id);
CREATE INDEX idx_experiment_periods_experiment_id ON experiment_periods(experiment_id);
CREATE INDEX idx_experiment_outcomes_experiment_id ON experiment_outcomes(experiment_id);
```

**ML-Ready Views (for export to R2):**

```sql
-- Product Suitability Training View
CREATE OR REPLACE VIEW ml_product_suitability_view AS
SELECT
    uo.outcome_id,
    u.user_id,
    uo.scan_id,
    s.concern_scores,  -- JSON: {acne: 45, redness: 32, ...}
    STRING_AGG(DISTINCT p.inci_name, ', ') AS product_inci_list,
    uo.user_feedback,
    uo.feedback_score,
    uo.time_to_outcome_days,
    uo.irritation_flag,
    s.created_at
FROM user_skin_outcomes uo
JOIN users u ON uo.user_id = u.user_id
JOIN scans s ON uo.scan_id = s.scan_id
LEFT JOIN UNNEST(uo.product_ids) AS prod_id ON TRUE
LEFT JOIN product_ingredients pi ON prod_id = pi.product_id
LEFT JOIN ingredients_reference p ON pi.ingredient_id = p.ingredient_id
GROUP BY uo.outcome_id, u.user_id, uo.scan_id, s.concern_scores, uo.user_feedback, uo.feedback_score, uo.time_to_outcome_days, uo.irritation_flag, s.created_at;

-- Routine Safety Training View
CREATE OR REPLACE VIEW ml_routine_safety_view AS
SELECT
    r.routine_id,
    r.user_id,
    STRING_AGG(DISTINCT p.inci_name, ', ') AS ingredients_in_routine,
    s_before.concern_scores AS concern_scores_before,
    s_after.concern_scores AS concern_scores_after,
    uo.user_feedback,
    uo.feedback_score,
    uo.irritation_flag,
    r.created_at
FROM routines r
LEFT JOIN routine_products rp ON r.routine_id = rp.routine_id
LEFT JOIN product_ingredients pi ON rp.product_id = pi.product_id
LEFT JOIN ingredients_reference p ON pi.ingredient_id = p.ingredient_id
LEFT JOIN user_skin_outcomes uo ON r.routine_id = uo.routine_id
LEFT JOIN scans s_before ON uo.scan_id = s_before.scan_id
LEFT JOIN scans s_after ON s_after.scan_id = (SELECT scan_id FROM scans WHERE user_id = r.user_id AND created_at > s_before.created_at ORDER BY created_at LIMIT 1)
GROUP BY r.routine_id, r.user_id, s_before.concern_scores, s_after.concern_scores, uo.user_feedback, uo.feedback_score, uo.irritation_flag, r.created_at;

-- N-of-1 Experiments Training View
CREATE OR REPLACE VIEW ml_n_of_1_view AS
SELECT
    e.experiment_id,
    e.user_id,
    ep_baseline.products_used AS baseline_products,
    ep_intervention.products_used AS intervention_products,
    eo.baseline_mean,
    eo.intervention_mean,
    eo.improvement_pct,
    eo.adherence_rate,
    eo.metric_name,
    e.created_at
FROM experiments e
LEFT JOIN experiment_periods ep_baseline ON e.experiment_id = ep_baseline.experiment_id AND ep_baseline.period_type = 'baseline'
LEFT JOIN experiment_periods ep_intervention ON e.experiment_id = ep_intervention.experiment_id AND ep_intervention.period_type = 'intervention'
LEFT JOIN experiment_outcomes eo ON e.experiment_id = eo.experiment_id;
```

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] All tables created and indexed
- [ ] Foreign key constraints working
- [ ] ML-ready views return correct data (sample queries tested)
- [ ] Migrations run cleanly on dev/staging, rollback tested
- [ ] Schema diagram documented
- [ ] Sample data inserted (test outcomes, experiments)
- [ ] Query performance: all views return data in ≤ 200ms
- [ ] Code reviewed by 2+ backend engineers
- [ ] WCAG 2.1 AA if any UI changes

---

### Story 4.3: Product Scanner Backend API (Barcode → Safety/Suitability)

**Priority:** CRITICAL | **Story Points:** 10 | **Sprint:** 4  
**Assigned To:** Backend Engineer #3 + ML Engineer  
**Complexity:** High | **Estimated Hours:** 25–30

#### USER STORY STATEMENT

As a user scanning a skincare product, I want the backend to identify ingredients from a barcode or product image, analyze safety against my skin profile, and return a suitability score with recommendations, so that I know whether the product is safe for me before using it.

#### ACCEPTANCE CRITERIA (12)

1. **Barcode Lookup**
   - Input: barcode (EAN-13, UPC-A, etc.)
   - Output: product info (name, brand, image, ingredient list)
   - Lookup from `products_external` + user's `My Shelf` (custom products)
   - Handles missing barcodes gracefully (404 + fallback to manual entry)

2. **Ingredient Parser**
   - Parse raw ingredient list into INCI names
   - Normalize against `ingredients_reference` database
   - Flag unknown/unrecognized ingredients (may need manual verification)
   - Handle common aliases & typos

3. **Safety Classification Engine**
   - For each ingredient, join to `ingredient_skin_effects` and `ingredients_reference`
   - Build ingredient safety profile:
     - Regulatory restrictions (EU/US)
     - Sensitizer risk score
     - Microbiome impact
     - Evidence level
   - Flag ingredients with known issues for this user:
     - User's recorded allergies
     - Ingredients user has previously reacted to (from feedback history)

4. **Suitability Score Generator**
   - Combine ingredient profiles + user's Digital Twin state
   - Return classification: **Safe** (Green), **Use with Caution** (Yellow), **Not Recommended** (Red)
   - Provide explanation for each ingredient concern
   - Consider:
     - Barrier function of user's skin (can they tolerate actives?)
     - Current skin state (acne-prone → avoid comedogenic ingredients)
     - Microbiome health (avoid disruptive ingredients if microbiome stressed)

5. **Interaction Detection**
   - Check if product conflicts with user's current routine
   - Flag interactions (e.g., Vitamin A + Retinoid, BHA + Acid Toner)
   - Warn if product is very rich + user has oily skin + recent breakouts

6. **API Response Format**
   - Structured JSON with ingredient-level detail + product-level summary
   - Include top 3 concerns if Not Recommended
   - Include alternatives (if product is Not Recommended, suggest similar Safe products from My Shelf)

7. **Performance**
   - Barcode lookup: ≤ 100ms
   - Ingredient parsing: ≤ 500ms
   - Suitability calculation: ≤ 2 seconds (includes Digital Twin lookup)
   - Total request latency p95: ≤ 4 seconds

8. **Caching**
   - Cache product lookups (24-hour TTL)
   - Cache ingredient safety profiles (1-week TTL)
   - Cache user's Digital Twin state (1-hour TTL)

9. **Logging & Monitoring**
   - Log all scans: timestamp, user_id, product_scanned, barcode, suitability_result
   - Monitor: barcode lookup success rate, unknown ingredient rate
   - Alert on: > 10% unknown ingredients (may indicate data quality issue)

10. **Fairness & Bias**
    - Ensure suitability scoring doesn't discriminate by skin tone
    - Test with diverse skin types, concerns (acne-prone to sensitive)
    - Fairness audit: same product should receive same classification regardless of user demographics

11. **Error Handling**
    - Barcode not found → 404, suggest manual product entry
    - External API failure (ingredient DB unavailable) → graceful degradation, return cached data
    - User not authenticated → 401 Unauthorized
    - Malformed request → 400 Bad Request with helpful error message

12. **Documentation**
    - OpenAPI spec with request/response examples
    - Ingredient safety scoring methodology documented
    - Interaction rules documented
    - Troubleshooting guide

#### TECHNICAL REQUIREMENTS

**Endpoint Specification:**

```
POST /api/v1/products/scan
Authorization: Bearer {access_token}
Content-Type: application/json

REQUEST:
{
  "barcode": "5901234123457",  // EAN-13, UPC-A, etc.
  "product_name": "Optional: if barcode not found",
  "ingredients_raw": "Optional: comma-separated ingredient list"
}

RESPONSE (200 OK):
{
  "product_id": "uuid",
  "barcode": "5901234123457",
  "product_name": "CeraVe Moisturizing Cream",
  "brand": "CeraVe",
  "image_url": "https://...",
  "suitability_classification": "SAFE",  // or "USE_WITH_CAUTION", "NOT_RECOMMENDED"
  "suitability_score": 8.5,  // 0--10, 10 = most suitable
  "overall_safety_score": 9.0,  // 0--10, based on ingredients
  "ingredients": [
    {
      "inci_name": "Ceramide NP",
      "functions": ["barrier_repair", "emollient"],
      "safety_level": "SAFE",  // "SAFE", "CAUTION", "CONCERN"
      "sensitizer_risk": 0.1,  // 0--1
      "regulatory_status_eu": "Approved, unrestricted",
      "regulatory_status_us": "Approved",
      "microbiome_impact": false,
      "evidence_level": "high",
      "explanation": "Well-tolerated barrier-repair ingredient, hypoallergenic"
    },
    {
      "inci_name": "Salicylic Acid",
      "functions": ["exfoliant", "acne_fighter"],
      "safety_level": "CAUTION",
      "sensitizer_risk": 0.4,
      "regulatory_status_eu": "Approved, max 2% concentration",
      "regulatory_status_us": "OTC active ingredient",
      "microbiome_impact": true,
      "evidence_level": "high",
      "explanation": "Effective for acne but can disrupt skin barrier if overused. Not recommended if you have active irritation."
    }
  ],
  "user_allergy_conflicts": [  // Custom to user's profile
    {
      "inci_name": "Fragrance",
      "conflict_reason": "You reported sensitivity to fragrance in past scans"
    }
  ],
  "routine_interaction_warnings": [
    {
      "warning": "Product contains Salicylic Acid. Your routine also includes Niacinamide + Vitamin C Serum (morning). Safe combo, but avoid overexfoliation.",
      "severity": "MEDIUM"
    }
  ],
  "top_3_concerns_if_not_recommended": [  // Only if classification is "NOT_RECOMMENDED"
    "Ingredient X is sensitizing and you reported irritation in past",
    "Too many actives for your current skin barrier state",
    "Contains microbiome-disruptive ingredient, not recommended while barrier healing"
  ],
  "alternative_products": [  // If Not Recommended, suggest alternatives from My Shelf
    {
      "product_id": "uuid",
      "product_name": "CeraVe Gentle Cleanser",
      "suitability_score": 9.2,
      "reason": "Similar benefits, gentler formula"
    }
  ],
  "recommendation": "This is a good moisturizer for your current skin state. Safe to use daily.",
  "timestamp": "2025-12-23T14:30:00Z"
}

RESPONSE (404 Not Found - Barcode unknown):
{
  "error": "Product not found in database",
  "barcode": "5901234123457",
  "message": "Please enter product details manually or check barcode format",
  "fallback_url": "/api/v1/products/manual-entry"
}

RESPONSE (400 Bad Request):
{
  "error": "Invalid input",
  "details": "Barcode must be 8--14 digits"
}
```

**Ingredient Parser Implementation:**

```python
# Pseudo-code: parse_ingredients(raw_list: str) -> List[INCI]

def parse_ingredients(raw_list: str, user_allergies: List[str]) -> List[dict]:
    """
    Parse raw ingredient string into normalized INCI names.
    Handle aliases, typos, unknown ingredients.
    """
    
    # Step 1: Split by comma, normalize whitespace
    raw_ingredients = [ing.strip() for ing in raw_list.split(',')]
    
    # Step 2: For each ingredient, try to match against ingredients_reference
    parsed = []
    for raw_ing in raw_ingredients:
        # Exact match
        match = db.query(ingredients_reference).filter_by(inci_name=raw_ing).first()
        
        if not match:
            # Try fuzzy match (handle typos)
            similar = db.query(ingredients_reference).filter(
                ingredients_reference.inci_name.ilike(f"%{raw_ing}%")
            ).limit(3)
            if similar:
                match = similar[0]  # Take best match
        
        if not match:
            # Try to match against synonyms
            match = db.query(ingredients_reference).filter(
                ingredients_reference.synonyms.contains(raw_ing)
            ).first()
        
        if match:
            # Get effects from ingredient_skin_effects
            effects = db.query(ingredient_skin_effects).filter_by(
                ingredient_id=match.ingredient_id
            ).all()
            
            # Check if user has allergy
            is_user_allergy = raw_ing in user_allergies
            
            parsed.append({
                "inci_name": match.inci_name,
                "ingredient_id": match.ingredient_id,
                "functions": match.functions,
                "safety_level": determine_safety(match, effects, user_allergies),
                "sensitizer_risk": match.sensitizer_risk_score or 0.0,
                "regulatory_status_eu": match.restrictions_eu,
                "regulatory_status_us": match.restrictions_us,
                "microbiome_impact": match.microbiome_impact_flag,
                "evidence_level": max([e.evidence_level for e in effects], default="low"),
                "is_user_allergy": is_user_allergy
            })
        else:
            # Unknown ingredient
            parsed.append({
                "inci_name": raw_ing,
                "ingredient_id": None,
                "safety_level": "UNKNOWN",
                "explanation": "Ingredient not found in database. Please verify INCI name or consult a dermatologist."
            })
    
    return parsed


def determine_suitability(user_digital_twin: dict, ingredients: List[dict], user_routine: dict) -> str:
    """
    Determine overall suitability: SAFE, USE_WITH_CAUTION, NOT_RECOMMENDED
    """
    
    # Count safety levels
    concerns = sum(1 for ing in ingredients if ing["safety_level"] == "CONCERN")
    cautions = sum(1 for ing in ingredients if ing["safety_level"] == "CAUTION")
    unknowns = sum(1 for ing in ingredients if ing["safety_level"] == "UNKNOWN")
    user_allergies = sum(1 for ing in ingredients if ing.get("is_user_allergy"))
    
    # Decision logic
    if user_allergies > 0 or concerns >= 2:
        return "NOT_RECOMMENDED"
    elif cautions >= 3 or unknowns >= 2:
        return "USE_WITH_CAUTION"
    elif check_barrier_stress(user_digital_twin) and too_many_actives(ingredients):
        return "USE_WITH_CAUTION"
    else:
        return "SAFE"
```

**Suitability Score Logic:**

- Formula: `score = 10 - (sum of ingredient_concern_weights) - (interaction_penalty) - (barrier_stress_penalty)`
- Ingredient concern weights: sensitizer_risk * evidence_level_multiplier (high=1.0, medium=0.5, low=0.2)
- Interaction penalty: check user's routine for conflicts
- Barrier stress penalty: if user's skin barrier compromised, penalize harsh ingredients

#### TESTING STRATEGY

| Test Case | Scenario | Expected Result | Pass/Fail |
|---|---|---|---|
| SCAN-001 | Known barcode (CeraVe Moisturizer) | Product found, ingredients parsed, SAFE classification | ☐ |
| SCAN-002 | Unknown barcode | 404 Not Found, suggest manual entry | ☐ |
| SCAN-003 | Product with user's recorded allergy | Classification = NOT_RECOMMENDED, explains allergy conflict | ☐ |
| SCAN-004 | Too many actives + barrier stressed | Classification = USE_WITH_CAUTION | ☐ |
| SCAN-005 | Product with unknown ingredient | Classification = USE_WITH_CAUTION, explains unknown | ☐ |
| SCAN-006 | Barcode lookup latency | ≤ 100ms | ☐ |
| SCAN-007 | Full scan request (p95) | ≤ 4 seconds | ☐ |
| SCAN-008 | Concurrent scans (100/min) | All complete, p95 < 4s | ☐ |
| SCAN-009 | Cache effectiveness | Repeated scan much faster (< 500ms) | ☐ |
| SCAN-010 | Fairness: diverse skin types | Same product gets same classification | ☐ |

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] All 12 acceptance criteria verified
- [ ] Barcode/ingredient parsing working
- [ ] Suitability scoring logic implemented & tested
- [ ] API endpoint deployed, tested with Postman/curl
- [ ] Performance targets met (p95 < 4s)
- [ ] Caching implemented
- [ ] Fairness audit passed (no bias by demographics)
- [ ] OpenAPI documentation complete
- [ ] Error handling tested (404, 400, etc.)
- [ ] Code reviewed by 2+ engineers
- [ ] Monitoring & logging in place

---

### Story 4.4: ML Data Export Pipeline (Postgres → Cloudflare R2)

**Priority:** CRITICAL | **Story Points:** 8 | **Sprint:** 4  
**Assigned To:** DevOps Engineer + Backend Lead  
**Complexity:** Medium | **Estimated Hours:** 20–25

#### USER STORY STATEMENT

As an ML training system, I want an automated nightly job that exports training datasets from Railway PostgreSQL to Cloudflare R2 in ML-ready formats (Parquet), so that the ML workspace can download large versioned datasets without querying the production database.

#### ACCEPTANCE CRITERIA (10)

1. **Automated Nightly Export Job**
   - Runs daily at 02:00 UTC (low-traffic window)
   - Uses APScheduler (Python) or node-cron (Node.js)
   - Exports 3 datasets: `ml_product_suitability_view`, `ml_routine_safety_view`, `ml_n_of_1_view`

2. **Export Format: Parquet**
   - Efficient columnar format for ML (compresses well, fast to load)
   - Preserves data types (int, float, string, boolean)
   - Supports partitioning (optional: partition by user_id for large datasets)

3. **Versioning & Storage**
   - R2 bucket structure: `datasets/{dataset_name}/v{YYYYMMDD}.parquet`
   - Keep last 30 days of versions (auto-delete older)
   - Also upload `latest.parquet` symlink for convenience

4. **Data Integrity Checks**
   - Validate row counts before/after export (≤ 0.1% variance tolerance)
   - Checksum verification (SHA256)
   - Check for NULL values in critical fields (log warnings)

5. **Error Handling & Retry Logic**
   - If Postgres query fails: log error, alert team, don't upload to R2
   - If R2 upload fails: retry up to 3 times with exponential backoff
   - On final failure: alert and rollback (mark failed in logs, don't delete previous version)

6. **Performance**
   - Export ≤ 5M rows: ≤ 3 minutes
   - Export time logged (alert if > 5 minutes)
   - R2 upload: ≤ 1 minute for 1GB file

7. **Monitoring & Alerting**
   - Slack notification on success (dataset size, row count, version)
   - Slack alert on failure (error details, rollback status)
   - Dashboard: last export time, file sizes, export frequency

8. **Access Control**
   - R2 bucket: read-only for ML workspace, read-write for backend
   - Environment variables for credentials (no hardcoded secrets)
   - Audit log: track who downloaded what files (Cloudflare logs)

9. **Documentation**
   - Export job script location in wiki
   - Troubleshooting guide (common failures + solutions)
   - Dataset schema documentation (column names, data types, example rows)

10. **Testing**
    - Unit test: mock Postgres query, verify Parquet output format
    - Integration test: full end-to-end export to R2 (staging environment)
    - Rollback test: verify fallback if export fails

#### TECHNICAL REQUIREMENTS

**Export Script (Python example):**

```python
# /backend/ml_export/export_datasets.py

import logging
import os
import asyncio
from datetime import datetime
from typing import List
import pandas as pd
import boto3
import asyncpg
from hashlib import sha256
import slack_sdk

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PG_CONNSTR = os.getenv("DATABASE_URL")
R2_ENDPOINT = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "skincare-ml-datasets")
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL")

# Initialize clients
s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto"
)

slack_client = slack_sdk.WebClient(token=os.getenv("SLACK_BOT_TOKEN"))


async def export_dataset(
    dataset_name: str,
    sql_query: str,
    db_pool: asyncpg.Pool
) -> dict:
    """
    Execute SQL query, export to Parquet, upload to R2.
    Returns: {success: bool, file_size: int, row_count: int, version: str, error: str}
    """
    
    try:
        # 1. Execute query
        logger.info(f"Exporting {dataset_name}...")
        start_time = datetime.utcnow()
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(sql_query)
        
        if not rows:
            logger.warning(f"{dataset_name}: No rows returned. Skipping upload.")
            return {"success": False, "error": "No data to export"}
        
        # 2. Convert to DataFrame, validate
        df = pd.DataFrame([dict(row) for row in rows])
        row_count = len(df)
        
        # Check for unexpected nulls in critical columns
        critical_cols = ["user_id", "scan_id", "feedback_score"]
        for col in critical_cols:
            if col in df.columns:
                null_count = df[col].isna().sum()
                if null_count > row_count * 0.01:  # > 1% nulls
                    logger.warning(f"{dataset_name}: {col} has {null_count} NULLs ({100*null_count/row_count:.1f}%)")
        
        # 3. Export to Parquet
        version = datetime.utcnow().strftime("%Y%m%d")
        parquet_file = f"/tmp/{dataset_name}_v{version}.parquet"
        df.to_parquet(parquet_file, compression="snappy", index=False)
        
        file_size = os.path.getsize(parquet_file)
        logger.info(f"Parquet file created: {parquet_file} ({file_size / 1024 / 1024:.2f} MB)")
        
        # 4. Calculate checksum
        with open(parquet_file, "rb") as f:
            checksum = sha256(f.read()).hexdigest()
        logger.info(f"Checksum: {checksum}")
        
        # 5. Upload to R2 (with retry logic)
        r2_key = f"datasets/{dataset_name}/v{version}.parquet"
        await upload_to_r2_with_retry(
            parquet_file,
            r2_key,
            checksum,
            retries=3
        )
        
        # 6. Also upload as "latest.parquet"
        latest_key = f"datasets/{dataset_name}/latest.parquet"
        await upload_to_r2_with_retry(
            parquet_file,
            latest_key,
            checksum,
            retries=1
        )
        
        # 7. Cleanup
        os.remove(parquet_file)
        
        # Calculate elapsed time
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Export completed in {elapsed:.1f}s")
        
        return {
            "success": True,
            "dataset_name": dataset_name,
            "file_size": file_size,
            "row_count": row_count,
            "version": version,
            "checksum": checksum,
            "elapsed_seconds": elapsed
        }
    
    except Exception as e:
        logger.error(f"Error exporting {dataset_name}: {e}", exc_info=True)
        return {
            "success": False,
            "dataset_name": dataset_name,
            "error": str(e)
        }


async def upload_to_r2_with_retry(
    file_path: str,
    r2_key: str,
    checksum: str,
    retries: int = 3
) -> bool:
    """
    Upload file to R2 with exponential backoff retry.
    """
    
    for attempt in range(1, retries + 1):
        try:
            logger.info(f"Uploading {r2_key} (attempt {attempt}/{retries})...")
            
            with open(file_path, "rb") as f:
                s3_client.put_object(
                    Bucket=R2_BUCKET,
                    Key=r2_key,
                    Body=f,
                    Metadata={"checksum": checksum}
                )
            
            logger.info(f"Upload successful: {r2_key}")
            return True
        
        except Exception as e:
            logger.warning(f"Upload failed (attempt {attempt}): {e}")
            if attempt < retries:
                wait_time = 2 ** attempt  # Exponential backoff: 2s, 4s, 8s
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Upload failed after {retries} attempts: {e}")
                return False


async def cleanup_old_versions(dataset_name: str, keep_days: int = 30):
    """
    Delete versions older than `keep_days`.
    """
    
    try:
        logger.info(f"Cleaning up versions for {dataset_name} (keeping last {keep_days} days)...")
        
        # List all versions
        response = s3_client.list_objects_v2(
            Bucket=R2_BUCKET,
            Prefix=f"datasets/{dataset_name}/v"
        )
        
        if "Contents" not in response:
            logger.info(f"No versions found for {dataset_name}")
            return
        
        # Extract dates, sort
        versions = []
        for obj in response["Contents"]:
            key = obj["Key"]  # datasets/{dataset_name}/v{YYYYMMDD}.parquet
            try:
                version_date = key.split("v")[1].split(".")[0]  # YYYYMMDD
                versions.append((key, version_date))
            except:
                pass
        
        versions.sort(key=lambda x: x[1], reverse=True)
        
        # Delete old versions
        cutoff_date = (datetime.utcnow() - timedelta(days=keep_days)).strftime("%Y%m%d")
        for key, version_date in versions:
            if version_date < cutoff_date:
                logger.info(f"Deleting old version: {key}")
                s3_client.delete_object(Bucket=R2_BUCKET, Key=key)
    
    except Exception as e:
        logger.error(f"Cleanup error: {e}")


async def main():
    """
    Main export job: run all datasets.
    """
    
    # Define datasets to export
    datasets = [
        {
            "name": "product_suitability",
            "query": "SELECT * FROM ml_product_suitability_view;"
        },
        {
            "name": "routine_safety",
            "query": "SELECT * FROM ml_routine_safety_view;"
        },
        {
            "name": "n_of_1_experiments",
            "query": "SELECT * FROM ml_n_of_1_view;"
        }
    ]
    
    # Create DB connection pool
    db_pool = await asyncpg.create_pool(PG_CONNSTR, min_size=1, max_size=5)
    
    try:
        # Export all datasets
        results = []
        for dataset in datasets:
            result = await export_dataset(dataset["name"], dataset["query"], db_pool)
            results.append(result)
        
        # Send Slack notification
        await send_slack_notification(results)
        
        # Cleanup old versions
        for dataset in datasets:
            await cleanup_old_versions(dataset["name"], keep_days=30)
    
    finally:
        await db_pool.close()


async def send_slack_notification(results: List[dict]):
    """
    Send export results to Slack.
    """
    
    successes = [r for r in results if r.get("success")]
    failures = [r for r in results if not r.get("success")]
    
    status = "✅ Success" if len(failures) == 0 else "⚠️ Partial Failure"
    color = "#36a64f" if len(failures) == 0 else "#ff9900"
    
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*ML Dataset Export {status}*\n{datetime.utcnow().isoformat()}Z"
            }
        }
    ]
    
    for result in successes:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"✅ *{result['dataset_name']}*\nRows: {result['row_count']}, Size: {result['file_size'] / 1024 / 1024:.1f} MB, Time: {result['elapsed_seconds']:.1f}s"
            }
        })
    
    for result in failures:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"❌ *{result['dataset_name']}*\nError: {result['error']}"
            }
        })
    
    try:
        slack_client.chat_postMessage(
            channel="#ml-team",
            blocks=blocks
        )
    except Exception as e:
        logger.error(f"Slack notification failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
```

**Scheduler Configuration (APScheduler):**

```python
# /backend/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from ml_export.export_datasets import main as export_job
import logging

logger = logging.getLogger(__name__)

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Schedule export job daily at 02:00 UTC
    scheduler.add_job(
        export_job,
        trigger=CronTrigger(hour=2, minute=0),
        id="ml_export_job",
        name="ML Dataset Export",
        replace_existing=True,
        misfire_grace_time=600  # Allow 10-min grace period if missed
    )
    
    scheduler.start()
    logger.info("ML export scheduler started. Next run: 02:00 UTC")
```

**R2 Bucket Structure:**

```
s3://skincare-ml-datasets/
├── datasets/
│   ├── product_suitability/
│   │   ├── v20251208.parquet
│   │   ├── v20251207.parquet
│   │   ├── v20251206.parquet
│   │   └── latest.parquet → v20251208.parquet
│   ├── routine_safety/
│   │   ├── v20251208.parquet
│   │   └── latest.parquet
│   └── n_of_1_experiments/
│       ├── v20251208.parquet
│       └── latest.parquet
└── checksums/
    └── checksums_20251208.json
```

**Dataset Schema Documentation (wiki page):**

```
## ML Export Datasets

### product_suitability

**Purpose:** Training data for product-user suitability model

**Columns:**
- outcome_id (UUID): unique feedback entry
- user_id (UUID): user who provided feedback
- scan_id (UUID): skin scan this feedback relates to
- concern_scores (JSON): {acne: 45, redness: 32, ...} at time of scan
- product_inci_list (string): comma-separated ingredient list
- user_feedback (string): 'improved', 'same', 'worse'
- feedback_score (int): 0--10, higher = more improved
- time_to_outcome_days (int): days between product use & feedback
- irritation_flag (boolean): user reported irritation
- created_at (timestamp): when feedback was submitted

**Example Row:**
```json
{
  "outcome_id": "a1b2c3d4-...",
  "user_id": "user-uuid-...",
  "scan_id": "scan-uuid-...",
  "concern_scores": {"acne": 45, "redness": 32, "dryness": 60},
  "product_inci_list": "Ceramide NP, Glycerin, Centella Asiatica",
  "user_feedback": "improved",
  "feedback_score": 8,
  "time_to_outcome_days": 14,
  "irritation_flag": false,
  "created_at": "2025-12-15T10:30:00Z"
}
```

### routine_safety

**Purpose:** Training data for routine safety scoring model

**Columns:**
- routine_id (UUID)
- user_id (UUID)
- ingredients_in_routine (string)
- concern_scores_before (JSON)
- concern_scores_after (JSON)
- user_feedback (string)
- feedback_score (int)
- irritation_flag (boolean)
- created_at (timestamp)

### n_of_1_experiments

**Purpose:** Training data for personal experiment outcome prediction

**Columns:**
- experiment_id (UUID)
- user_id (UUID)
- baseline_products (UUID[])
- intervention_products (UUID[])
- baseline_mean (float): average concern score during baseline
- intervention_mean (float): average concern score during intervention
- improvement_pct (float): percentage improvement
- adherence_rate (float): 0--1
- metric_name (string): 'acne', 'redness', etc.
- created_at (timestamp)
```

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] Export script runs without errors
- [ ] All 3 datasets export successfully
- [ ] Parquet files readable in Python/pandas
- [ ] Checksum validation working
- [ ] R2 upload succeeds (files accessible via boto3)
- [ ] Scheduler running (exports nightly at 02:00 UTC)
- [ ] Monitoring alerts configured (Slack)
- [ ] Cleanup job deletes old versions (tested manually)
- [ ] Error handling tested (retry logic works)
- [ ] Documentation complete (schema, troubleshooting)
- [ ] Code reviewed by 2+ engineers
- [ ] End-to-end test in staging environment passed

---

### Story 4.5: ML Training Workspace Integrated with R2 + Postgres

**Priority:** CRITICAL | **Story Points:** 8 | **Sprint:** 4  
**Assigned To:** ML Lead + Data Scientist  
**Complexity:** High | **Estimated Hours:** 25–30

#### USER STORY STATEMENT

As an ML engineer, I want to set up a training environment (Colab/Jupyter) that can download datasets from Cloudflare R2, optionally join with live Postgres for labels, train a model, and save artifacts back to R2 registered in the model registry, so that we can develop, iterate, and deploy ML models in a repeatable, version-controlled manner.

#### ACCEPTANCE CRITERIA (8)

1. **Environment Setup**
   - Colab notebook OR self-hosted Jupyter VM with GPU access
   - Python packages: pandas, scikit-learn, tensorflow/pytorch, boto3, psycopg2
   - Credentials: R2 access keys from environment variables (not hardcoded)
   - Postgres connection: read-only access to production (for live labels during training)

2. **Dataset Loading**
   - Download parquet from R2: `s3://skincare-ml-datasets/datasets/{name}/latest.parquet`
   - Load into pandas/numpy
   - Verify row count, check for NULLs
   - Report data statistics (mean, std, distribution of target variable)

3. **Model Training Pipeline**
   - Train at least one model: ingredient-risk classifier or product-suitability model
   - Use scikit-learn or TensorFlow/PyTorch
   - Implement: train/validation/test split (70/15/15)
   - Hyperparameter tuning (GridSearchCV or Optuna)
   - Cross-validation for robustness
   - Save model artifacts (pickle, ONNX, or h5)

4. **Fairness Testing**
   - Evaluate model accuracy separately by Fitzpatrick skin tone
   - Target: ±5% variance max across Fitzpatrick I--VI
   - Log fairness metrics to tracking (MLflow)
   - Alert if variance > 5%

5. **Model Artifact & Registration**
   - Save trained model to `/tmp/model_artifact.pkl` or equivalent
   - Upload to R2: `s3://skincare-ml-datasets/models/{model_name}/v{version}.pkl`
   - Create/update entry in Postgres `model_registry` table with:
     - model_id (UUID)
     - model_type ('product_suitability', 'concern_classifier', etc.)
     - version (e.g., 'v20251223_001')
     - r2_path (s3 key)
     - metrics (accuracy, precision, recall, fairness_var)
     - active_flag (true/false, only one active per type)
     - created_at

6. **Experiment Tracking**
   - Log training runs to MLflow (run_id, params, metrics, artifacts)
   - Track: model name, version, hyperparameters, train/val/test loss, accuracy by skin tone
   - Enable comparison of multiple runs

7. **Documentation**
   - Notebook comments explain each step
   - Reproducibility: seeds set, requirements.txt pinned
   - Notes on data sources, class imbalance, limitations
   - Instructions for re-running training

8. **Error Handling**
   - R2 download fails → fallback to Postgres query (slower, but works)
   - Postgres connection timeout → use cached data or skip live labels
   - Model training fails → log error, don't upload to R2

#### TECHNICAL REQUIREMENTS

**Training Notebook Example (Colab):**

```python
# /ml_workspace/train_product_suitability_model.ipynb

import os
import pandas as pd
import numpy as np
import boto3
import psycopg2
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import mlflow
from datetime import datetime
import json

# =============================================
# 1. SETUP
# =============================================

# Environment variables
R2_ENDPOINT = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = "skincare-ml-datasets"

DB_CONNSTR = os.getenv("DATABASE_URL")

MODEL_NAME = "product_suitability"
MODEL_VERSION = f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

# Initialize S3 client for R2
s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto"
)

# Initialize MLflow
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
mlflow.set_experiment("product_suitability_models")

print("✅ Setup complete")

# =============================================
# 2. LOAD DATA FROM R2
# =============================================

def load_dataset_from_r2(dataset_name: str) -> pd.DataFrame:
    """
    Download parquet from R2 and load into pandas.
    """
    
    print(f"\n📥 Loading {dataset_name} from R2...")
    
    try:
        # Download from R2
        key = f"datasets/{dataset_name}/latest.parquet"
        response = s3_client.get_object(Bucket=R2_BUCKET, Key=key)
        
        # Load directly into pandas
        df = pd.read_parquet(response["Body"])
        
        print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns")
        print(f"Columns: {list(df.columns)}")
        print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")
        
        return df
    
    except Exception as e:
        print(f"❌ R2 load failed: {e}. Falling back to Postgres query...")
        return load_dataset_from_postgres(dataset_name)


def load_dataset_from_postgres(dataset_name: str) -> pd.DataFrame:
    """
    Fallback: query directly from Postgres view.
    """
    
    print(f"📡 Querying {dataset_name} from Postgres (slower)...")
    
    views = {
        "product_suitability": "SELECT * FROM ml_product_suitability_view LIMIT 100000;",
        "routine_safety": "SELECT * FROM ml_routine_safety_view LIMIT 100000;",
        "n_of_1_experiments": "SELECT * FROM ml_n_of_1_view;"
    }
    
    try:
        conn = psycopg2.connect(DB_CONNSTR)
        df = pd.read_sql_query(views[dataset_name], conn)
        conn.close()
        
        print(f"✅ Loaded {len(df)} rows from Postgres")
        return df
    
    except Exception as e:
        print(f"❌ Postgres load failed: {e}")
        raise

# Load training data
df = load_dataset_from_r2("product_suitability")

# =============================================
# 3. DATA EXPLORATION & PREPARATION
# =============================================

print("\n📊 Data Exploration")
print(df.info())
print(df.describe())
print(f"Missing values:\n{df.isnull().sum()}")

# Check target variable distribution
print(f"\nTarget variable (user_feedback) distribution:")
print(df['user_feedback'].value_counts(normalize=True))

# Check for class imbalance
if df['user_feedback'].value_counts().min() / len(df) < 0.1:
    print("⚠️  Class imbalance detected. Consider resampling or class weights.")

# =============================================
# 4. FEATURE ENGINEERING
# =============================================

print("\n🔧 Feature Engineering")

df_processed = df.copy()

# Encode target
le_target = LabelEncoder()
df_processed['user_feedback_encoded'] = le_target.fit_transform(df_processed['user_feedback'])

# Parse JSON columns
df_processed['concern_scores_mean'] = df_processed['concern_scores'].apply(
    lambda x: np.mean(list(x.values())) if isinstance(x, dict) else 0
)
df_processed['concern_scores_max'] = df_processed['concern_scores'].apply(
    lambda x: np.max(list(x.values())) if isinstance(x, dict) else 0
)

# Feature list
feature_cols = [
    'concern_scores_mean',
    'concern_scores_max',
    'time_to_outcome_days',
    'feedback_score'
]

X = df_processed[feature_cols].fillna(0)
y = df_processed['user_feedback_encoded']

print(f"✅ Features: {feature_cols}")
print(f"Sample X:\n{X.head()}")

# =============================================
# 5. TRAIN/VAL/TEST SPLIT
# =============================================

print("\n✂️  Train/Val/Test Split")

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)

X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.176, random_state=42, stratify=y_temp  # 0.176 * 0.85 ≈ 0.15
)

print(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

# =============================================
# 6. MODEL TRAINING & HYPERPARAMETER TUNING
# =============================================

print("\n🤖 Model Training")

with mlflow.start_run(run_name=f"{MODEL_NAME}_{MODEL_VERSION}"):
    
    # Hyperparameter grid
    param_grid = {
        'n_estimators': [50, 100],
        'max_depth': [5, 10],
        'min_samples_split': [2, 5],
        'class_weight': ['balanced', None]
    }
    
    # GridSearchCV
    rf = RandomForestClassifier(random_state=42, n_jobs=-1)
    grid_search = GridSearchCV(
        rf, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1, verbose=1
    )
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    best_params = grid_search.best_params_
    
    print(f"✅ Best params: {best_params}")
    
    # Evaluate on val/test
    train_score = best_model.score(X_train, y_train)
    val_score = best_model.score(X_val, y_val)
    test_score = best_model.score(X_test, y_test)
    
    print(f"Scores: Train={train_score:.4f}, Val={val_score:.4f}, Test={test_score:.4f}")
    
    # Log to MLflow
    mlflow.log_params(best_params)
    mlflow.log_metrics({
        "train_accuracy": train_score,
        "val_accuracy": val_score,
        "test_accuracy": test_score
    })

# =============================================
# 7. FAIRNESS TESTING
# =============================================

print("\n⚖️  Fairness Testing (by Fitzpatrick Skin Tone)")

# Assume user_id → Fitzpatrick label from a reference table
# For demo: randomly assign Fitzpatrick (I--VI) to test set
np.random.seed(42)
fitzpatrick_labels = np.random.randint(1, 7, len(X_test))

fairness_results = {}
for fitzpatrick_id in range(1, 7):
    mask = fitzpatrick_labels == fitzpatrick_id
    if mask.sum() > 0:
        acc = best_model.score(X_test[mask], y_test[mask])
        fairness_results[f"fitzpatrick_{fitzpatrick_id}"] = acc
        print(f"Fitzpatrick {fitzpatrick_id}: {acc:.4f}")

# Check variance
if len(fairness_results) > 1:
    variances = np.std(list(fairness_results.values()))
    print(f"Variance: {variances:.4f}")
    
    if variances > 0.05:
        print("⚠️  Fairness variance > 5%. Consider retraining with balanced data.")
    else:
        print("✅ Fairness check passed (variance ≤ 5%)")
    
    mlflow.log_metrics(fairness_results)
    mlflow.log_metric("fairness_variance", variances)

# =============================================
# 8. SAVE MODEL ARTIFACT
# =============================================

print("\n💾 Saving Model Artifact")

model_artifact_path = f"/tmp/{MODEL_NAME}_{MODEL_VERSION}.pkl"
with open(model_artifact_path, "wb") as f:
    pickle.dump(best_model, f)

print(f"✅ Model saved: {model_artifact_path}")

# Upload to R2
r2_key = f"models/{MODEL_NAME}/{MODEL_VERSION}.pkl"
with open(model_artifact_path, "rb") as f:
    s3_client.put_object(Bucket=R2_BUCKET, Key=r2_key, Body=f)

print(f"✅ Uploaded to R2: {r2_key}")

# Log artifact to MLflow
mlflow.log_artifact(model_artifact_path)

# =============================================
# 9. REGISTER MODEL IN POSTGRES
# =============================================

print("\n📝 Registering Model in Postgres")

import uuid
from datetime import datetime

model_id = str(uuid.uuid4())
model_metrics = {
    "test_accuracy": float(test_score),
    "fairness_variance": float(fairness_results.get("fairness_variance", 0)),
    "n_features": len(feature_cols),
    "n_training_samples": len(X_train)
}

try:
    conn = psycopg2.connect(DB_CONNSTR)
    cursor = conn.cursor()
    
    # Deactivate previous model of same type
    cursor.execute(
        "UPDATE model_registry SET active_flag = FALSE WHERE model_type = %s;",
        (MODEL_NAME,)
    )
    
    # Insert new model
    cursor.execute(
        """
        INSERT INTO model_registry (model_id, model_type, version, training_data_snapshot, metrics, artifact_path, active_flag, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """,
        (
            model_id,
            MODEL_NAME,
            MODEL_VERSION,
            "ml_product_suitability_view",
            json.dumps(model_metrics),
            f"s3://{R2_BUCKET}/{r2_key}",
            True,
            datetime.utcnow().isoformat()
        )
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"✅ Model registered in DB: {model_id}")
    print(f"   Type: {MODEL_NAME}")
    print(f"   Version: {MODEL_VERSION}")
    print(f"   R2 Path: {r2_key}")
    print(f"   Metrics: {model_metrics}")

except Exception as e:
    print(f"❌ Model registration failed: {e}")

# =============================================
# 10. SUMMARY
# =============================================

print("\n" + "="*60)
print("🎉 TRAINING COMPLETE")
print("="*60)
print(f"Model: {MODEL_NAME} / {MODEL_VERSION}")
print(f"Test Accuracy: {test_score:.4f}")
print(f"R2 Artifact: s3://{R2_BUCKET}/{r2_key}")
print(f"Postgres ID: {model_id}")
print("="*60)
```

**Model Registry Table (Postgres):**

```sql
CREATE TABLE model_registry (
    model_id UUID PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL,  -- 'product_suitability', 'concern_classifier', etc.
    version VARCHAR(20) NOT NULL,     -- 'v20251223_001'
    training_data_snapshot VARCHAR(100),  -- View name or dataset version used
    metrics JSONB,                    -- {accuracy: 0.87, f1: 0.84, fairness_variance: 0.03, ...}
    artifact_path VARCHAR(255) NOT NULL,  -- 's3://bucket/models/product_suitability/v20251223_001.pkl'
    active_flag BOOLEAN DEFAULT FALSE,    -- Only one active per model_type
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    CONSTRAINT unique_active_model UNIQUE (model_type) WHERE active_flag = TRUE
);

CREATE INDEX idx_model_registry_type_active ON model_registry(model_type, active_flag);
```

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] Colab/Jupyter environment set up with GPU
- [ ] R2 dataset download works end-to-end
- [ ] Postgres fallback loading works
- [ ] Model training pipeline runs (train/val/test split, hyperparameter tuning)
- [ ] Fairness testing implemented (Fitzpatrick I--VI variance ≤ 5%)
- [ ] Model artifact saved and uploaded to R2
- [ ] Model registered in Postgres `model_registry` table
- [ ] MLflow tracking working (runs logged with metrics)
- [ ] Notebook is reproducible (fixed seeds, requirements.txt)
- [ ] Documentation complete (comments, instructions for retraining)
- [ ] Code reviewed by ML Lead
- [ ] At least one model trained end-to-end

---

### Story 4.6: Backend Inference Using Trained Models

**Priority:** HIGH | **Story Points:** 8 | **Sprint:** 4  
**Assigned To:** Backend Lead + ML Engineer  
**Complexity:** High | **Estimated Hours:** 25–30

#### USER STORY STATEMENT

As a backend API, I want to load the active trained model from the model registry, and use it to generate predictions for product suitability or ingredient-risk scoring, so that users get personalized, data-driven recommendations instead of stub results.

#### ACCEPTANCE CRITERIA (10)

1. **Model Loading**
   - Endpoint startup: load active model from `model_registry` (active_flag=true)
   - Model artifact fetched from R2 and cached in memory (or warm cache)
   - Fallback to previous version if latest fails to load
   - Log model load: timestamp, model_id, version, artifact size

2. **Feature Extraction**
   - Given user_id + product_id: extract features for inference
   - Features include: user's Digital Twin state, product ingredients, user's routine, past feedback
   - Match features to training feature set (ensure same columns)
   - Handle missing features (fillna with sensible defaults)

3. **Inference**
   - Load feature vector into model.predict()
   - Return probability for each class (improved/same/worse)
   - Compute confidence (max probability)
   - Latency target: ≤ 4 seconds per request (including feature extraction)

4. **Explainability**
   - Extract top N contributing features (using SHAP or feature importance)
   - Return explanation: "Product contains Salicylic Acid (exfoliant, 40% contribution to 'not recommended' prediction)"
   - Map features back to human-readable descriptions

5. **Caching & Performance**
   - Cache user's Digital Twin state (1-hour TTL)
   - Cache product ingredient profile (24-hour TTL)
   - Cache model predictions per user-product pair (12-hour TTL)
   - Monitor cache hit rate (target > 70%)

6. **Monitoring & Metrics**
   - Log each inference: timestamp, user_id, product_id, prediction, confidence
   - Track prediction distribution (% Safe vs Caution vs Not Recommended)
   - Alert if confidence drops (sudden shift in model behavior → drift detection)
   - Latency tracking: p50, p95, p99

7. **A/B Testing Infrastructure**
   - Support gradual rollout: % of users get new model, rest get stub/previous version
   - Route based on user cohort
   - Track metrics per cohort (acceptance rate, feedback quality)
   - Easy rollback if new model performs worse

8. **Error Handling**
   - Model load fails → fallback to stub (return pre-computed classification)
   - Feature extraction fails → return error message (don't crash)
   - R2 unavailable → use cached model or previous version
   - Inference fails → log error, return default safe classification

9. **Documentation**
   - API reference: input features, output format, example response
   - Model performance baseline: accuracy, precision, recall, fairness metrics
   - Troubleshooting: common inference failures, mitigation strategies
   - Deployment runbook: how to roll out new model, rollback procedure

10. **Testing**
    - Unit tests: feature extraction (mock Digital Twin, products)
    - Integration tests: full inference pipeline (model load → feature extract → predict)
    - Performance tests: latency under load (100 concurrent requests)
    - Fairness tests: ensure model prediction doesn't differ by user demographics

#### TECHNICAL REQUIREMENTS

**Backend Inference Service (Python/FastAPI example):**

```python
# /backend/services/ml_inference.py

import os
import json
import pickle
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio
import boto3
import numpy as np
import pandas as pd
import psycopg2
from cachetools import TTLCache
import shap

logger = logging.getLogger(__name__)

# Configuration
R2_ENDPOINT = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = "skincare-ml-datasets"
DB_CONNSTR = os.getenv("DATABASE_URL")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto"
)

# In-memory caches
model_cache = {}  # {model_type: (model_obj, version, timestamp)}
digital_twin_cache = TTLCache(maxsize=10000, ttl=3600)  # 1 hour
product_cache = TTLCache(maxsize=50000, ttl=86400)  # 24 hours
prediction_cache = TTLCache(maxsize=100000, ttl=43200)  # 12 hours

# SHAP explainer (cached, computed once per model)
shap_explainers = {}


class MLInferenceService:
    """
    Service for loading models and generating predictions.
    """
    
    @staticmethod
    async def load_active_model(model_type: str) -> Optional[dict]:
        """
        Load active model from Postgres registry, download from R2, cache in memory.
        
        Returns: {model_obj, version, artifact_path} or None if failed
        """
        
        try:
            # Check cache
            if model_type in model_cache:
                cached_model, version, timestamp = model_cache[model_type]
                age_seconds = (datetime.utcnow() - timestamp).total_seconds()
                if age_seconds < 3600:  # 1-hour cache
                    logger.info(f"Using cached model: {model_type}/{version}")
                    return {"model": cached_model, "version": version}
            
            # Query Postgres for active model
            conn = psycopg2.connect(DB_CONNSTR)
            cursor = conn.cursor()
            
            cursor.execute(
                """
                SELECT model_id, version, artifact_path, metrics FROM model_registry
                WHERE model_type = %s AND active_flag = TRUE
                ORDER BY created_at DESC LIMIT 1;
                """,
                (model_type,)
            )
            
            result = cursor.fetchone()
            if not result:
                logger.warning(f"No active model found for {model_type}")
                return None
            
            model_id, version, artifact_path, metrics = result
            cursor.close()
            conn.close()
            
            # Download from R2
            logger.info(f"Loading model from R2: {artifact_path}")
            response = s3_client.get_object(Bucket=R2_BUCKET, Key=artifact_path.replace(f"s3://{R2_BUCKET}/", ""))
            model_obj = pickle.loads(response["Body"].read())
            
            logger.info(f"✅ Loaded model: {model_type}/{version}")
            
            # Cache
            model_cache[model_type] = (model_obj, version, datetime.utcnow())
            
            return {
                "model": model_obj,
                "version": version,
                "metrics": json.loads(metrics) if metrics else {}
            }
        
        except Exception as e:
            logger.error(f"Error loading model {model_type}: {e}")
            return None
    
    @staticmethod
    async def extract_features(user_id: str, product_id: str) -> Optional[Dict]:
        """
        Extract feature vector for inference.
        
        Returns: {features: [f1, f2, ...], feature_names: [...]} or None if failed
        """
        
        try:
            cache_key = f"{user_id}:{product_id}"
            if cache_key in prediction_cache:
                return prediction_cache[cache_key]["features"]
            
            # Load user's Digital Twin state
            if user_id not in digital_twin_cache:
                conn = psycopg2.connect(DB_CONNSTR)
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT digital_twin_state FROM users WHERE user_id = %s;",
                    (user_id,)
                )
                result = cursor.fetchone()
                cursor.close()
                conn.close()
                
                if result:
                    digital_twin_cache[user_id] = json.loads(result[0])
                else:
                    digital_twin_cache[user_id] = {}
            
            dt_state = digital_twin_cache[user_id]
            
            # Load product ingredients
            if product_id not in product_cache:
                conn = psycopg2.connect(DB_CONNSTR)
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT concern_scores_mean, concern_scores_max, ingredients_list FROM product_ingredients WHERE product_id = %s;",
                    (product_id,)
                )
                result = cursor.fetchone()
                cursor.close()
                conn.close()
                
                if result:
                    product_cache[product_id] = {
                        "concern_scores_mean": result[0] or 0,
                        "concern_scores_max": result[1] or 0,
                        "n_ingredients": len(result[2].split(",")) if result[2] else 0
                    }
                else:
                    product_cache[product_id] = {}
            
            product_info = product_cache[product_id]
            
            # Build feature vector
            features = [
                dt_state.get("concern_scores_mean", 0),
                dt_state.get("concern_scores_max", 0),
                product_info.get("concern_scores_mean", 0),
                product_info.get("concern_scores_max", 0),
                product_info.get("n_ingredients", 0),
            ]
            
            feature_names = [
                "dt_concern_scores_mean",
                "dt_concern_scores_max",
                "prod_concern_scores_mean",
                "prod_concern_scores_max",
                "n_ingredients"
            ]
            
            return {
                "features": np.array([features]),  # Shape: (1, n_features)
                "feature_names": feature_names,
                "raw_data": {"dt_state": dt_state, "product_info": product_info}
            }
        
        except Exception as e:
            logger.error(f"Error extracting features for {user_id}:{product_id}: {e}")
            return None
    
    @staticmethod
    async def predict(user_id: str, product_id: str, model_type: str = "product_suitability") -> Optional[dict]:
        """
        Generate prediction using active model.
        
        Returns: {prediction: "SAFE"|"CAUTION"|"NOT_RECOMMENDED", confidence: 0--1, explanation: "..."}
        """
        
        start_time = datetime.utcnow()
        cache_key = f"{user_id}:{product_id}"
        
        try:
            # Check prediction cache
            if cache_key in prediction_cache:
                cached_result = prediction_cache[cache_key]
                logger.info(f"Cache hit: {cache_key}")
                return cached_result
            
            # Load model
            model_info = await MLInferenceService.load_active_model(model_type)
            if not model_info:
                logger.warning(f"No active model for {model_type}, returning SAFE (default)")
                return {
                    "prediction": "SAFE",
                    "confidence": 0.5,
                    "explanation": "Model unavailable, returning safe default",
                    "model_version": None
                }
            
            model_obj = model_info["model"]
            model_version = model_info["version"]
            
            # Extract features
            feature_data = await MLInferenceService.extract_features(user_id, product_id)
            if not feature_data:
                return {
                    "prediction": "SAFE",
                    "confidence": 0.5,
                    "explanation": "Feature extraction failed, returning safe default",
                    "model_version": model_version
                }
            
            X = feature_data["features"]
            feature_names = feature_data["feature_names"]
            
            # Predict
            y_pred = model_obj.predict(X)[0]
            y_proba = model_obj.predict_proba(X)[0]
            confidence = max(y_proba)
            
            # Map prediction to class label
            class_labels = ["improved", "same", "worse"]  # Assuming binary/multiclass output
            prediction_class = class_labels[y_pred]
            
            # Convert to suitability classification
            if y_pred == 0:  # improved
                suitability = "SAFE"
            elif y_pred == 1:  # same
                suitability = "CAUTION"
            else:  # worse
                suitability = "NOT_RECOMMENDED"
            
            # Generate explanation (simplified; could use SHAP for more detail)
            top_feature_idx = np.argsort(X[0])[-3:][::-1]
            top_features = [feature_names[i] for i in top_feature_idx if i < len(feature_names)]
            explanation = f"Prediction based on {', '.join(top_features)}"
            
            # Log prediction
            logger.info(f"Prediction: {user_id}:{product_id} → {suitability} (conf={confidence:.2f})")
            
            result = {
                "prediction": suitability,
                "confidence": float(confidence),
                "explanation": explanation,
                "model_version": model_version,
                "top_features": top_features,
                "latency_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
            }
            
            # Cache result
            prediction_cache[cache_key] = result
            
            return result
        
        except Exception as e:
            logger.error(f"Inference error for {user_id}:{product_id}: {e}", exc_info=True)
            return {
                "prediction": "SAFE",
                "confidence": 0.5,
                "explanation": f"Inference failed: {str(e)}",
                "error": True
            }


# FastAPI Endpoint
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/api/v1/products/{product_id}/suitability")
async def get_product_suitability(product_id: str, user_id: str):
    """
    Get product suitability for a user using trained ML model.
    """
    
    result = await MLInferenceService.predict(user_id, product_id, model_type="product_suitability")
    
    if result is None:
        raise HTTPException(status_code=500, detail="Inference failed")
    
    return result
```

**API Endpoint:**

```
POST /api/v1/products/{product_id}/suitability?user_id={user_id}
Authorization: Bearer {access_token}

RESPONSE (200 OK):
{
  "prediction": "SAFE",
  "confidence": 0.87,
  "explanation": "Product suitable for your skin based on concern scores and ingredient profile",
  "model_version": "v20251223_001",
  "top_features": ["dt_concern_scores_mean", "prod_n_ingredients"],
  "latency_ms": 1200
}
```

#### ACCEPTANCE CRITERIA CHECKLIST

- [ ] Model loading works end-to-end (registry → R2 → memory cache)
- [ ] Feature extraction working (Digital Twin + product info)
- [ ] Inference generates predictions (SAFE/CAUTION/NOT_RECOMMENDED)
- [ ] Confidence scores computed and reasonable (0--1 range)
- [ ] Explainability working (top contributing features identified)
- [ ] Caching implemented (prediction cache hit rate > 70%)
- [ ] Performance target met (p95 latency ≤ 4s)
- [ ] A/B testing infrastructure in place (gradual rollout)
- [ ] Monitoring & logging working (predictions logged, metrics tracked)
- [ ] Error handling tested (graceful fallback to stub/defaults)
- [ ] API documentation complete (OpenAPI spec)
- [ ] Code reviewed by 2+ engineers

---

## SPRINT 4 DEFINITION OF DONE

**All stories must satisfy:**

### Code Quality
- [ ] Clean, idiomatic code (team conventions followed)
- [ ] 2+ peer code reviews with signed approval
- [ ] No linting errors (black, pylint, eslint)
- [ ] No TODOs or placeholder comments

### Testing
- [ ] Unit tests: ≥ 85% coverage on new code
- [ ] Integration tests: end-to-end flow for each story
- [ ] All tests passing locally and in CI/CD
- [ ] Edge cases and error scenarios tested

### Performance
- [ ] All performance targets met (per story)
- [ ] Load testing completed (if applicable)
- [ ] No regressions vs. Sprint 3 baseline

### Database
- [ ] Migrations designed and tested on dev/staging
- [ ] Rollback procedure documented and tested
- [ ] Indexes created for query optimization
- [ ] Schema diagram updated

### Documentation
- [ ] OpenAPI/Swagger specs complete
- [ ] README updated with setup/run instructions
- [ ] Architecture diagrams updated
- [ ] Known issues & workarounds documented

### Deployment
- [ ] Feature deployed to staging environment
- [ ] Manual QA test cases passed
- [ ] Zero critical Sentry errors in staging
- [ ] Performance baselines logged

### Accessibility
- [ ] WCAG 2.1 AA audit completed (if UI changes)
- [ ] Keyboard navigation tested
- [ ] Screen reader support verified

### Monitoring
- [ ] Alerts configured (failures, latency, errors)
- [ ] Metrics dashboards set up
- [ ] Logging instrumented

---

## SPRINT 4 SUCCESS CRITERIA

**By end of Sprint 4, the system will:**

✅ **Ingest & normalize external product/ingredient data** (Story 4.1)
- Open Beauty Facts: 2M products indexed & searchable
- CosIng: 10K ingredients indexed with safety profiles
- Query performance: barcode lookup ≤ 100ms, ingredient search ≤ 200ms

✅ **Store all ML-relevant data per SRS 5.x** (Story 4.2)
- Internal knowledge base (ingredient effects, user outcomes, experiments) populated
- ML-ready views created and tested
- Sample data ingested for training purposes

✅ **Export training datasets to R2 nightly** (Story 4.4)
- 3 datasets versioned in R2 (`product_suitability`, `routine_safety`, `n_of_1`)
- Nightly job running successfully (02:00 UTC)
- Data integrity checks passing

✅ **Build product scanner API** (Story 4.3)
- `/products/scan` endpoint live and tested
- Ingredient parsing working (handle aliases, unknowns)
- Suitability classification returning Safe/Caution/Not Recommended
- Latency p95 ≤ 4 seconds

✅ **Train & deploy first ML models** (Story 4.5 + 4.6)
- One model trained end-to-end (ingredient-risk or suitability)
- Model artifact in R2, registered in Postgres
- Fairness testing passed (Fitzpatrick variance ≤ 5%)
- MLflow tracking all runs

✅ **Implement backend inference using trained models** (Story 4.6)
- Product suitability endpoint using real model (not stub)
- Feature extraction working
- Predictions cached (70% hit rate)
- Latency ≤ 4s, explainability included

---

## SPRINT 4 TIMELINE & MILESTONES

| Phase | Days | Key Activities |
|-------|------|-----------------|
| **Week 1: Foundation** | Mon–Wed | Setup, schema design, external data ingestion (Stories 4.1, 4.2) |
| **Week 1: APIs** | Thu–Fri | Product scanner API begins (Story 4.3), export job framework (Story 4.4) |
| **Week 2: ML** | Mon–Tue | ML training workspace setup (Story 4.5), model training runs |
| **Week 2: Integration** | Wed–Thu | Model deployment, backend inference (Story 4.6), caching |
| **Week 2: Polish & QA** | Fri | All QA testing, documentation, sprint review & demo |

---

## SPRINT 4 TEAM ASSIGNMENTS

| Story | Title | Owner | Points |
|-------|-------|-------|--------|
| 4.1 | External Data Ingestion | Backend Eng #1 | 8 |
| 4.2 | Internal Knowledge Base Schema | Backend Eng #2 | 8 |
| 4.3 | Product Scanner API | Backend Eng #3 + ML Eng | 10 |
| 4.4 | ML Export Pipeline | DevOps + Backend Lead | 8 |
| 4.5 | ML Training Workspace | ML Lead + Data Scientist | 8 |
| 4.6 | Backend Inference | Backend Lead + ML Eng | 8 |
| **Total** | | | **50 points** |

---

## SPRINT 4 RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **External API rate limits (Open Beauty Facts)** | Medium | Medium | Implement caching, pagination, request batching |
| **ML model fairness variance > 5%** | Medium | High | Start fairness testing early (Sprint 3), collect diverse training data |
| **R2 upload failures (network issues)** | Low | Medium | Exponential backoff retry, local fallback queue |
| **Product scanner latency > 4s** | Medium | Medium | Aggressive caching, feature extraction optimization |
| **Postgres query performance regression** | Low | Medium | Monitor query plans, add indexes early |
| **Model accuracy unexpectedly low** | Medium | High | Start with simpler models (logistic regression), iterate |

---

## DELIVERABLES

### Code Repositories
- **Backend:** PRs merged for Stories 4.1--4.6, all tests passing
- **ML:** Training notebooks in GitHub, model artifacts in R2
- **DevOps:** Export job scripts deployed, scheduler running

### Documentation
- **Database Schema:** Full ERD with all new tables (products_external, ingredients_reference, user_skin_outcomes, experiments, etc.)
- **API Reference:** OpenAPI spec with all new endpoints
- **ML Model Registry:** Documented structure, how to load/deploy models
- **Deployment Guide:** How to run nightly export job, manage model versions
- **Runbooks:** Troubleshooting for common failures (R2 unavailable, Postgres down, etc.)

### Artifacts in Cloudflare R2
- `datasets/product_suitability/latest.parquet` (training-ready CSV)
- `datasets/routine_safety/latest.parquet`
- `datasets/n_of_1_experiments/latest.parquet`
- `models/product_suitability/v20251223_001.pkl` (first trained model)
- Checksums for all files

### Live Services
- ✅ Product scanner API (`/products/scan`)
- ✅ Model inference endpoint (`/products/{id}/suitability`)
- ✅ Nightly export job (scheduled, automated)
- ✅ ML training pipeline (repeatable, logged)

---

## SUCCESS METRICS

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Data Ingestion Rate** | 2M products/week | External API sync logs | Backend Lead |
| **Product Scan Latency (p95)** | ≤ 4 seconds | APM monitoring | Backend Lead |
| **Model Fairness (Fitzpatrick I--VI)** | ±5% variance | Validation dataset audit | ML Lead |
| **Training Dataset Quality** | ≥ 95% valid rows | R2 export validation reports | ML Lead |
| **Nightly Export Success Rate** | ≥ 99% | Scheduler logs, Slack alerts | DevOps |
| **ML Model Accuracy (test set)** | ≥ 80% | MLflow experiments | ML Lead |
| **Inference Cache Hit Rate** | ≥ 70% | Backend metrics dashboard | Backend Lead |
| **End-to-End Latency (p99)** | ≤ 6 seconds | APM tracing | Backend Lead |

---

## NEXT STEPS (Post-Sprint 4)

**Sprint 5 will build on Sprint 4:**
- Replace stub analyses with real ML model scores (all concern dimensions)
- Expand ML training to other models (routine safety, forecasting)
- Implement model monitoring & drift detection
- Add A/B testing framework for model evaluation
- Scale inference to handle 100K+ concurrent users

---

## APPENDIX: DATABASE DOWNLOAD & CLEANUP CHECKLIST

### How to Download & Clean Data for ML Training

```bash
# 1. Export Postgres table to CSV (raw data for ML)
psql -h neon-db.railway.app -U username -d skincare_dev \
  -c "COPY ml_product_suitability_view TO STDOUT WITH CSV HEADER;" \
  > /tmp/product_suitability_raw.csv

# 2. Validate CSV (check row count, no corruption)
wc -l /tmp/product_suitability_raw.csv  # Row count
head -n 100 /tmp/product_suitability_raw.csv  # Inspect first rows

# 3. Clean & transform (Python)
python3 /ml_workspace/clean_data.py \
  --input /tmp/product_suitability_raw.csv \
  --output /tmp/product_suitability_clean.parquet \
  --remove-nulls \
  --handle-outliers

# 4. Upload to R2 manually (if nightly job fails)
aws s3 cp /tmp/product_suitability_clean.parquet \
  s3://skincare-ml-datasets/datasets/product_suitability/manual_v20251208.parquet \
  --endpoint-url $R2_ENDPOINT \
  --storage-class STANDARD

# 5. Verify in R2
aws s3 ls s3://skincare-ml-datasets/datasets/ --endpoint-url $R2_ENDPOINT --recursive
```

---

**Document Status:** Ready for Sprint 4 Kickoff (December 23, 2025)  
**Approval:** Product Manager, Tech Lead, ML Lead  
**Distribution:** Development Team, Leadership, Stakeholders
