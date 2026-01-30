# Product Catalog Database Strategy

**Version:** 1.0  
**Created:** 2026-01-29  
**Status:** Planned  
**Priority:** High - Long-term Infrastructure

---

## Executive Summary

Build an in-house product catalog database to reduce API dependency, improve response times, and create a competitive data moat. The database will be populated from open-source datasets (Open Beauty Facts), AI-enriched scans, and curated content.

---

## Current State vs Target State

### Current State (API-Dependent)

```
User Scan → OpenAI Vision API ($$$) → Parse Response → Return to User
                    ↓
              2-5 second latency
              $0.01-0.03 per scan
              No data retention
```

### Target State (In-House Database)

```
User Scan → Check Product Catalog DB → Found? → Return instantly (50ms)
                    ↓                     ↓
              Not Found?           Pre-computed:
                    ↓              • Safety scores
              Call AI (rare)       • Ingredients analyzed
                    ↓              • Clean images
              Store result         • Skin compatibility
                    ↓
              Never analyze again
```

---

## Business Benefits

| Benefit | Current Cost | After Implementation |
|---------|--------------|----------------------|
| **API Costs** | ~$300/month at 10K scans | ~$30/month (new products only) |
| **Response Time** | 2-5 seconds | 50-200ms |
| **Reliability** | Depends on OpenAI uptime | Self-hosted, always available |
| **Data Quality** | Variable (AI extraction) | Curated, verified |
| **Offline Mode** | Not possible | Possible for known products |
| **Competitive Moat** | None | Proprietary clean dataset |

---

## Data Architecture

### Database Selection

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **PostgreSQL (same server)** | Simple, no extra cost | Shared resources | MVP/Phase 1 |
| **PostgreSQL (separate)** | Isolated, scalable | Extra cost (~$20/mo) | Phase 2 |
| **MongoDB** | Flexible schema | Different tech stack | Not recommended |
| **Supabase** | PostgreSQL + API + Storage | Good value | Consider for Phase 2 |

**Recommendation:** Start with same PostgreSQL server, separate schema. Migrate to dedicated instance when product count > 500K.

### Schema Design

```sql
-- ============================================
-- PRODUCT CATALOG SCHEMA
-- ============================================

-- Core product table
CREATE TABLE catalog.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    barcode VARCHAR(50) UNIQUE,          -- EAN-13, UPC-A, etc.
    barcode_type VARCHAR(20),            -- 'ean13', 'upc', 'qr'
    
    -- Basic info
    name VARCHAR(300) NOT NULL,
    brand VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,      -- cleanser, serum, moisturizer, etc.
    subcategory VARCHAR(100),            -- hydrating, anti-aging, etc.
    
    -- Product details
    description TEXT,
    size_ml FLOAT,
    size_unit VARCHAR(20),               -- ml, oz, g
    price_usd FLOAT,
    price_range VARCHAR(20),             -- budget, mid, luxury
    
    -- Images
    image_front_url VARCHAR(500),
    image_back_url VARCHAR(500),
    image_ingredients_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    images_source VARCHAR(50),           -- 'cloudinary', 'obf', 'brand'
    
    -- Pre-computed analysis
    safety_score INTEGER,                -- 0-100
    safety_summary TEXT,
    flagged_ingredients JSONB,           -- Pre-analyzed harmful ingredients
    pregnancy_safe BOOLEAN,
    sensitive_skin_safe BOOLEAN,
    
    -- Skin compatibility (pre-computed)
    suitable_skin_types VARCHAR[],       -- ['oily', 'dry', 'combination']
    targets_concerns VARCHAR[],          -- ['acne', 'aging', 'hydration']
    
    -- Product attributes
    is_fragrance_free BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_cruelty_free BOOLEAN DEFAULT FALSE,
    is_organic BOOLEAN DEFAULT FALSE,
    is_clean_beauty BOOLEAN DEFAULT FALSE,
    
    -- Data quality
    is_verified BOOLEAN DEFAULT FALSE,   -- Manually verified
    data_quality_score INTEGER,          -- 0-100
    source VARCHAR(50) NOT NULL,         -- 'obf', 'ai_scan', 'manual', 'brand'
    source_id VARCHAR(255),              -- Original ID in source system
    
    -- Metadata
    view_count INTEGER DEFAULT 0,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_products_barcode ON catalog.products(barcode);
CREATE INDEX idx_products_brand_name ON catalog.products(brand, name);
CREATE INDEX idx_products_category ON catalog.products(category);
CREATE INDEX idx_products_source ON catalog.products(source);

-- Full-text search index
CREATE INDEX idx_products_search ON catalog.products 
    USING gin(to_tsvector('english', name || ' ' || brand || ' ' || COALESCE(description, '')));


-- ============================================
-- INGREDIENTS MASTER TABLE
-- ============================================

CREATE TABLE catalog.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    inci_name VARCHAR(255) NOT NULL UNIQUE,  -- Official INCI name
    common_names JSONB DEFAULT '[]',          -- ["Vitamin C", "Ascorbic Acid"]
    
    -- Classification
    category VARCHAR(100),                    -- humectant, emollient, preservative
    function TEXT,                            -- What it does
    
    -- Safety data
    ewg_score INTEGER,                        -- EWG Skin Deep score 1-10
    comedogenic_rating INTEGER,               -- 0-5
    irritancy_rating INTEGER,                 -- 0-5
    
    -- Safety flags
    is_harmful BOOLEAN DEFAULT FALSE,
    harm_severity VARCHAR(20),                -- 'high', 'moderate', 'low'
    harm_categories VARCHAR[],                -- ['irritant', 'allergen', 'carcinogen']
    harm_reason TEXT,
    harm_alternatives TEXT[],
    avoid_if TEXT[],                          -- ['pregnant', 'sensitive_skin']
    
    -- Regulatory
    fda_approved BOOLEAN,
    eu_approved BOOLEAN,
    banned_countries VARCHAR[],
    max_concentration_percent FLOAT,
    
    -- Benefits
    benefits TEXT[],
    targets_concerns VARCHAR[],
    
    -- Metadata
    data_sources JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_inci ON catalog.ingredients(inci_name);
CREATE INDEX idx_ingredients_harmful ON catalog.ingredients(is_harmful) WHERE is_harmful = TRUE;


-- ============================================
-- PRODUCT-INGREDIENT LINKS
-- ============================================

CREATE TABLE catalog.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
    
    position INTEGER NOT NULL,               -- Order in ingredient list (1 = highest concentration)
    concentration_percent FLOAT,             -- If known (e.g., "Niacinamide 10%")
    is_key_active BOOLEAN DEFAULT FALSE,     -- Featured active ingredient
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, ingredient_id)
);

CREATE INDEX idx_prod_ing_product ON catalog.product_ingredients(product_id);
CREATE INDEX idx_prod_ing_ingredient ON catalog.product_ingredients(ingredient_id);


-- ============================================
-- PRODUCT IMAGES (for multiple images per product)
-- ============================================

CREATE TABLE catalog.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    image_type VARCHAR(50) NOT NULL,         -- 'front', 'back', 'ingredients', 'texture'
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Image quality
    width INTEGER,
    height INTEGER,
    file_size_kb INTEGER,
    quality_score INTEGER,                   -- 0-100
    has_white_background BOOLEAN,
    
    -- Source
    source VARCHAR(50),                      -- 'cloudinary', 'obf', 'user', 'brand'
    source_url VARCHAR(500),                 -- Original URL if downloaded
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_product ON catalog.product_images(product_id);


-- ============================================
-- BRAND INFORMATION
-- ============================================

CREATE TABLE catalog.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(200) NOT NULL UNIQUE,
    
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Brand attributes
    is_cruelty_free BOOLEAN,
    is_vegan BOOLEAN,
    is_clean_beauty BOOLEAN,
    is_luxury BOOLEAN,
    country_of_origin VARCHAR(100),
    
    -- Stats
    product_count INTEGER DEFAULT 0,
    average_rating FLOAT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brands_name ON catalog.brands(name);
CREATE INDEX idx_brands_slug ON catalog.brands(slug);


-- ============================================
-- IMPORT TRACKING
-- ============================================

CREATE TABLE catalog.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source VARCHAR(50) NOT NULL,             -- 'obf', 'off', 'manual'
    status VARCHAR(20) DEFAULT 'pending',    -- pending, running, completed, failed
    
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    imported_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_log TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Data Sources & Import Strategy

### 1. Open Beauty Facts (Primary Source)

**URL:** https://world.openbeautyfacts.org/data

**What to Import:**
- ~1 million beauty/skincare products
- Product names, brands, categories
- Ingredient lists
- Barcodes (EAN-13, UPC)
- Images (front, ingredients)

**Cleaning Required:**
- Remove non-skincare products (makeup, hair dye)
- Standardize category names
- Clean ingredient lists (remove "may contain", formatting)
- Filter by data quality score
- Download and re-host images

**Import Script Location:** `backend/scripts/import_obf_catalog.py`

### 2. Open Food Facts (Supplement)

**URL:** https://world.openfoodfacts.org/data

**What to Import:**
- Products with cosmetic barcodes
- Additional ingredient data

### 3. AI Scans (Continuous)

**Process:**
1. User scans unknown product
2. AI extracts product info
3. Manual review queue for verification
4. Approved products added to catalog

### 4. Community Contributions (Future)

- Users can submit corrections
- Moderation queue for review
- Gamification (points for contributions)

---

## Image Management Strategy

### Image Quality Requirements

| Type | Minimum Size | Background | Format |
|------|--------------|------------|--------|
| Primary | 800x800px | White preferred | JPEG/WebP |
| Thumbnail | 200x200px | Any | JPEG/WebP |
| Ingredients | 1200px wide | Any (readable) | JPEG/PNG |

### Image Pipeline

```
Source Image (OBF, Brand, User)
        ↓
    Validation
    • Size check (min 400px)
    • Format check
    • Duplicate check (hash)
        ↓
    Processing
    • Resize to standard sizes
    • Optimize (compress)
    • Generate thumbnail
        ↓
    Upload to Cloudinary
    • CDN distribution
    • Automatic WebP conversion
    • Responsive URLs
        ↓
    Store URLs in Database
```

### Cloudinary Configuration

```python
# Image upload settings
CLOUDINARY_FOLDER = "pellicura/products"
TRANSFORMATIONS = {
    "primary": {"width": 800, "height": 800, "crop": "fit", "quality": "auto"},
    "thumbnail": {"width": 200, "height": 200, "crop": "thumb", "quality": "auto"},
    "listing": {"width": 400, "height": 400, "crop": "fit", "quality": "auto"},
}
```

---

## Implementation Phases

### Phase 1: Infrastructure (Week 1-2)

**Tasks:**
- [ ] Create catalog schema in PostgreSQL
- [ ] Build ProductCatalog service class
- [ ] Implement barcode lookup endpoint
- [ ] Add lookup-first logic to scanner

**Deliverables:**
- `backend/app/models/catalog_models.py`
- `backend/app/services/product_catalog.py`
- `backend/app/routers/catalog.py`
- Migration scripts

### Phase 2: Open Beauty Facts Import (Week 2-3)

**Tasks:**
- [ ] Download OBF data dump
- [ ] Build import script with cleaning
- [ ] Filter to skincare/beauty only
- [ ] Import ~100K high-quality products
- [ ] Download and upload images to Cloudinary

**Deliverables:**
- `backend/scripts/import_obf_catalog.py`
- `backend/scripts/download_obf_images.py`
- Import status dashboard

### Phase 3: Pre-compute Safety Data (Week 3-4)

**Tasks:**
- [ ] Build batch safety analyzer
- [ ] Run safety analysis on all imported products
- [ ] Store pre-computed scores
- [ ] Update ingredients with safety flags

**Deliverables:**
- `backend/scripts/batch_safety_analysis.py`
- Pre-computed safety scores for all products

### Phase 4: Optimize & Monitor (Week 4+)

**Tasks:**
- [ ] Add full-text search
- [ ] Implement caching (Redis)
- [ ] Build analytics dashboard
- [ ] Set up monitoring for cache hits vs AI calls

**Metrics to Track:**
- Cache hit rate (target: >80%)
- Average response time
- API cost per month
- Products added per day

---

## API Endpoints

### Catalog Lookup

```
GET /api/v1/catalog/barcode/{barcode}
Response: Product details with pre-computed safety

GET /api/v1/catalog/search?q=niacinamide+serum&category=serum
Response: List of matching products

GET /api/v1/catalog/product/{id}
Response: Full product details with ingredients

GET /api/v1/catalog/ingredient/{inci_name}
Response: Ingredient details with safety info
```

### Catalog Admin

```
POST /api/v1/catalog/import/obf
Start Open Beauty Facts import job

GET /api/v1/catalog/import/status/{job_id}
Check import job status

POST /api/v1/catalog/product
Add/update product manually

POST /api/v1/catalog/verify/{product_id}
Mark product as verified
```

---

## Cost Analysis

### Current Costs (API-Dependent)

| Volume | OpenAI Cost | Total/Month |
|--------|-------------|-------------|
| 1,000 scans | $30 | $30 |
| 10,000 scans | $300 | $300 |
| 100,000 scans | $3,000 | $3,000 |

### After Implementation

| Volume | OpenAI (new only) | Database | Cloudinary | Total/Month |
|--------|-------------------|----------|------------|-------------|
| 1,000 scans | $3 (10% new) | $0 | $5 | $8 |
| 10,000 scans | $30 (10% new) | $20 | $20 | $70 |
| 100,000 scans | $300 (10% new) | $50 | $50 | $400 |

**Savings at 100K scans: $2,600/month (87% reduction)**

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Cache Hit Rate** | >80% | Products found in catalog vs total scans |
| **Response Time (cached)** | <200ms | P95 latency for catalog lookups |
| **API Cost Reduction** | >70% | Monthly OpenAI spend vs baseline |
| **Product Coverage** | >500K | Total products in catalog |
| **Data Quality** | >90% | Products with complete data |
| **Image Quality** | >80% | Products with high-quality images |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Import data quality** | Strict filtering, quality scores |
| **Storage costs** | Cloudinary free tier, optimize images |
| **Stale data** | Periodic re-sync with sources |
| **Legal/licensing** | Use only open-licensed data (OBF is ODbL) |
| **Duplicate products** | Barcode deduplication, name matching |

---

## Next Steps

1. **Approve this plan** - Review with team
2. **Set up catalog schema** - Create tables in staging
3. **Build import script** - Start with 10K products for testing
4. **Integrate with scanner** - Add lookup-first logic
5. **Monitor & iterate** - Track metrics, improve quality

---

## Related Documents

- [PRODUCT-SCANNER-SHELF-FEATURES.md](./PRODUCT-SCANNER-SHELF-FEATURES.md)
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
- [Database-Schema.md](../02-architecture/Database-Schema.md)

---

*Document created: January 29, 2026*  
*Author: AI Development Assistant*  
*Status: Awaiting Approval*
