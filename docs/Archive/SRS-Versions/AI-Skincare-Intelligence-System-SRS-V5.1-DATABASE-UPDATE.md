# 📋 SRS V5.1 - Database Integration Update

**AI Skincare Intelligence System - Software Requirements Specification**  
**Version**: 5.1 (Database Integration Enhancement)  
**Last Updated**: December 8, 2025  
**Status**: Active

---

## 🆕 What's New in V5.1

This update adds **comprehensive open-source database integration requirements** to support both ML training and product intelligence features using a **hybrid download + API approach**.

---

## 📊 Section 5: Data Requirements (DR) - **UPDATED**

### 5.1 External Open-Source Datasets (ML Training)

**DR1: Dermatology Image Datasets for ML Training**

The system shall integrate the following open-source dermatology datasets using a **download-first, local storage** approach:

#### Priority 0 (Sprint 0 - Must Have)

| Dataset | Size | Purpose | License | Integration Method | Storage Location |
|---------|------|---------|---------|-------------------|------------------|
| **HAM10000** | 10,015 images | Baseline dermoscopic lesion classification (7 categories) | CC BY-NC-SA 4.0 | Download via Kaggle API | `backend/ml/data/raw/ham10000/` |
| **ISIC Archive** | 25,000+ images | High-quality dermoscopic images with masks & metadata | CC BY-NC-SA | Download via ISIC API or bulk | `backend/ml/data/raw/isic/` |

**Acceptance Criteria**:
- ✅ Raw datasets downloaded and stored with license verification
- ✅ Preprocessing scripts resize images to 224x224 for model training
- ✅ Dataset metadata includes `dataset_id`, `source`, `fitzpatrick_type` (where available)
- ✅ Train/validation/test splits generated (70/15/15)
- ✅ Dataset licenses documented in `DATASET_LICENSES.md`

---

#### Priority 1 (Sprint 1-2 - Should Have)

| Dataset | Size | Purpose | License | Integration Method |
|---------|------|---------|---------|-------------------|
| **Google SCIN** | 10,000+ images | Diverse skin tones, real-world conditions, self-reported demographics | SCIN Data Use License | Download from GCS bucket |
| **Diverse Dermatology Images (DDI)** | Biopsy-proven | Fairness evaluation across skin tones | Open for research | Download |

**Acceptance Criteria**:
- ✅ SCIN dataset includes demographic metadata for fairness analysis
- ✅ DDI dataset used for bias detection validation
- ✅ Fairness metrics computed: accuracy variance ≤ ±5% across Fitzpatrick I-VI

---

#### Priority 2 (Phase 2 - Could Have)

| Dataset | Purpose | Notes |
|---------|---------|-------|
| **SkinCAP** | Natural language medical descriptions | Enables text-based interaction with scan results |
| **SkinDisNet** | Comprehensive clinical dataset (13k images) | Phase 2 expansion |

---

### 5.2 Product & Ingredient Databases

**DR2: Product Intelligence Open-Source Databases**

The system shall integrate the following open-source product and ingredient databases using a **hybrid approach**: **download for bulk data + API for real-time lookups**.

#### Priority 0 (Sprint 0 - Must Have)

##### **Open Beauty Facts** 🌟🌟🌟

- **Size**: 100,000+ cosmetic products
- **Features**: Ingredients (INCI), allergens, barcodes, images, brand info
- **License**: CC BY-SA 4.0 ✅ Free for commercial use with attribution
- **Integration Method**: **HYBRID**
  - **Download**: Bulk export (MongoDB JSON/CSV) for initial database seeding
  - **API**: REST API for real-time barcode lookups
- **Endpoint**: `https://world.openbeautyfacts.org/api/v0/product/{barcode}.json`
- **Rate Limit**: 100 req/min (unlimited with caching)
- **Cache Strategy**: Store API responses in PostgreSQL `products` table for 7 days
- **Update Frequency**: Weekly bulk refresh via cron job

**Database Schema**:
```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY,
    barcode VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500),
    brand VARCHAR(255),
    ingredients_text TEXT,
    allergens JSONB,
    image_url VARCHAR(500),
    source VARCHAR(50) DEFAULT 'openbeautyfacts',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cached_until TIMESTAMP  -- 7-day cache TTL
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_products_cached_until ON products(cached_until);
```

**Acceptance Criteria**:
- ✅ Bulk download imported: 100k+ products in `products` table
- ✅ API lookup working: barcode scan → API call → cache result
- ✅ Cache hit rate ≥ 90% (most scans use cached data)
- ✅ API fallback: if API fails, use cached data with staleness warning
- ✅ Attribution displayed: "Product data from Open Beauty Facts"

---

##### **EU CosIng Database** 🌟🌟🌟

- **Size**: 26,000+ standardized INCI ingredient names
- **Features**: Functions (emollient, preservative), regulatory status, restrictions
- **License**: Public database ✅ Free for non-commercial
- **Integration Method**: **DOWNLOAD** (CSV/XML exports)
- **Purpose**: INCI normalization, ingredient safety classification
- **Update Frequency**: Quarterly refresh

**Database Schema**:
```sql
CREATE TABLE ingredients (
    ingredient_id UUID PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    cas_number VARCHAR(50),
    ec_number VARCHAR(50),
    function VARCHAR(255),  -- e.g., "emollient", "preservative"
    regulatory_status VARCHAR(100),
    restrictions TEXT,
    microbiome_risk_flag BOOLEAN DEFAULT false,
    comedogenicity_score INT CHECK (comedogenicity_score BETWEEN 0 AND 5),
    source VARCHAR(50) DEFAULT 'cosing',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ingredients_inci_name ON ingredients(LOWER(inci_name));
CREATE INDEX idx_ingredients_cas_number ON ingredients(cas_number);
```

**Acceptance Criteria**:
- ✅ CosIng dataset imported: 26k+ ingredients in `ingredients` table
- ✅ INCI normalizer: converts variants (e.g., "Aqua" → "Water") to standardized names
- ✅ Function mapping: each ingredient has primary function
- ✅ Regulatory flags: restricted ingredients marked

---

#### Priority 1 (Sprint 1-2 - Should Have)

##### **California Chemicals in Cosmetics (CSCP)**

- **Purpose**: Hazard flagging (carcinogens, reproductive toxins)
- **Size**: 10,000+ chemical-product pairs
- **License**: Public government data ✅ Public domain
- **Integration Method**: **DOWNLOAD** CSV
- **Update Frequency**: Semi-annual refresh

**Database Schema**:
```sql
CREATE TABLE ingredient_hazards (
    hazard_id UUID PRIMARY KEY,
    ingredient_id UUID REFERENCES ingredients(ingredient_id),
    cas_number VARCHAR(50),
    hazard_type VARCHAR(100),  -- e.g., "carcinogen", "reproductive_toxin"
    regulatory_body VARCHAR(50) DEFAULT 'california_cscp',
    evidence_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hazards_ingredient_id ON ingredient_hazards(ingredient_id);
CREATE INDEX idx_hazards_cas_number ON ingredient_hazards(cas_number);
```

**Acceptance Criteria**:
- ✅ CSCP data imported and linked to `ingredients` via CAS number
- ✅ Pregnancy safety filter working: flags hazardous ingredients
- ✅ Hazard warnings displayed in product scan results

---

##### **Kaggle Sephora Products Dataset**

- **Purpose**: Enrich product catalog with pricing, ratings, reviews
- **Size**: 5,000+ products with full INCI
- **License**: CC0 / CC BY-SA
- **Integration Method**: **DOWNLOAD** CSV
- **Update Frequency**: Manual refresh as needed

**Database Schema**:
```sql
ALTER TABLE products ADD COLUMN price_usd DECIMAL(10,2);
ALTER TABLE products ADD COLUMN rating DECIMAL(3,2);
ALTER TABLE products ADD COLUMN review_count INT;
```

**Acceptance Criteria**:
- ✅ Kaggle Sephora dataset imported
- ✅ Pricing and ratings enriched for 5k+ products

---

### 5.3 Real-Time Recommendation Data (Updated)

**DR5A: Feedback Learning**

The system shall capture user feedback on product recommendations to improve suitability models over time:

**Database Schema**:
```sql
CREATE TABLE user_product_feedback (
    feedback_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    product_id UUID REFERENCES products(product_id),
    scan_id UUID REFERENCES scans(scan_id),
    feedback_type VARCHAR(50),  -- 'better', 'same', 'worse', 'irritation'
    irritation_flag BOOLEAN DEFAULT false,
    optional_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON user_product_feedback(user_id);
CREATE INDEX idx_feedback_product_id ON user_product_feedback(product_id);
```

**Acceptance Criteria**:
- ✅ Users can provide feedback on products: "better/same/worse"
- ✅ Feedback stored and linked to product + scan + user profile
- ✅ ML models retrained quarterly using aggregated feedback
- ✅ Product suitability scores adjust based on similar user profiles

---

## 🛠️ Section 7: Technical Requirements (New)

### 7.1 Database Architecture

**TR1: Hybrid Integration Architecture**

The system shall implement a **hybrid database integration architecture**:

1. **Download + Import** (Primary): For bulk datasets requiring preprocessing
   - ML training images (HAM10000, ISIC, SCIN)
   - Product catalogs (Open Beauty Facts bulk export)
   - Ingredient databases (CosIng, CSCP)

2. **API + Cache** (Secondary): For real-time lookups
   - Barcode scanning → Open Beauty Facts API
   - Cache results in PostgreSQL for 7 days
   - Fallback to cached data if API unavailable

**Performance Requirements**:
- API response time: p95 < 500ms
- Cache hit rate: ≥ 90%
- Database query time: < 100ms (indexed lookups)

---

### 7.2 Data Refresh Strategy

**TR2: Automated Data Updates**

The system shall automatically refresh external datasets:

| Dataset | Refresh Frequency | Method | Owner |
|---------|------------------|--------|-------|
| Open Beauty Facts | Weekly | Cron job (bulk download) | Backend |
| CosIng | Quarterly | Manual + script | Backend |
| CSCP | Semi-annual | Manual + script | Backend |
| ML Datasets | Annual | Manual validation | ML Team |

**Acceptance Criteria**:
- ✅ Cron jobs scheduled in production
- ✅ Refresh logs audited weekly
- ✅ Stale data warnings if refresh fails

---

### 7.3 Storage Requirements

**TR3: Storage Capacity Planning**

| Data Type | Initial Size | 1-Year Projection | Storage Solution |
|-----------|-------------|-------------------|------------------|
| ML Images (raw) | 15 GB | 20 GB | Railway Volumes |
| Product Catalog | 500 MB | 1 GB | PostgreSQL |
| User Scans | 0 → 100 GB | 500 GB | Cloudflare R2 |
| Metadata | 100 MB | 500 MB | PostgreSQL |

**Total Estimated Cost**: $5-20/month (Railway + R2 free tiers cover most)

---

### 7.4 Data Attribution & Compliance

**TR4: License Compliance**

The system shall display attributions for all open-source data:

**Required Attributions**:
```
Product data from Open Beauty Facts (CC BY-SA 4.0)
Ingredient data from EU CosIng Database (Public)
Hazard data from California CSCP (Public Domain)
ML training data: HAM10000 (CC BY-NC-SA 4.0), ISIC (CC BY-NC-SA)
```

**Acceptance Criteria**:
- ✅ Attributions displayed in app footer
- ✅ `DATASET_LICENSES.md` file in repository
- ✅ Legal review confirms compliance

---

## 📈 Section 8: Non-Functional Requirements (NFR) - **UPDATED**

### NFR21: Data Freshness

- **NFR21.1**: Product catalog shall be refreshed weekly
- **NFR21.2**: Cached API responses shall expire after 7 days
- **NFR21.3**: ML datasets shall be validated annually for accuracy

### NFR22: Data Quality

- **NFR22.1**: INCI normalization accuracy ≥ 95%
- **NFR22.2**: Duplicate product detection ≥ 99%
- **NFR22.3**: Missing ingredient data < 5% of products

### NFR23: API Reliability

- **NFR23.1**: Open Beauty Facts API uptime ≥ 99% (cached fallback if down)
- **NFR23.2**: API rate limits respected (100 req/min)
- **NFR23.3**: Graceful degradation if API unavailable

---

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Dataset Coverage** | 100k+ products, 26k+ ingredients | Database row count |
| **API Cache Hit Rate** | ≥ 90% | Cache analytics |
| **Product Lookup Latency** | p95 < 500ms | APM monitoring |
| **INCI Normalization Accuracy** | ≥ 95% | Manual validation |
| **Data Freshness** | < 7 days stale | Automated alerts |
| **Storage Costs** | < $20/month | Cloud billing |

---

## 📚 References

1. [HAM10000 Dataset](https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000)
2. [ISIC Archive](https://www.isic-archive.com)
3. [Google SCIN Dataset](https://github.com/google-research-datasets/scin)
4. [Open Beauty Facts](https://world.openbeautyfacts.org)
5. [EU CosIng Database](https://ec.europa.eu/growth/tools-databases/cosing/)
6. [California CSCP](https://data.ca.gov/dataset/chemicals-in-cosmetics)
7. [Database Integration Guide](./DATABASE_INTEGRATION_GUIDE.md)

---

**Next Steps**:
1. ✅ Review updated SRS with product team
2. ✅ Begin Sprint 0 database integration
3. ✅ Set up Kaggle API credentials
4. ✅ Download priority datasets
5. ✅ Implement hybrid API + cache architecture
