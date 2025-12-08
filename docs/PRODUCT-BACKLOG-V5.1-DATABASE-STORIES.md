# 🗓️ Product Backlog V5.1 - Database Integration Stories

**AI Skincare Intelligence System - Sprint 0 Database Stories**  
**Version**: 5.1  
**Last Updated**: December 8, 2025  
**Status**: Ready for Sprint Planning

---

## 🆕 New Epic: Database Integration

**Epic ID**: EPIC 20  
**SRS Traceability**: DR1, DR2, DR5A, TR1-TR4, NFR21-NFR23  
**Priority**: CRITICAL (Sprint 0)  
**Total Stories**: 12  
**Estimated Story Points**: 65-75  
**Team Assignment**: Backend Lead + Data Engineer + ML Lead  
**Completion Target**: End of Sprint 0 (2-3 days)

---

## 🎯 Epic Objective

Bootstrap the ML and product intelligence engines by integrating 9 open-source databases using a hybrid download + API architecture, enabling:
- ML model training with diverse dermatology datasets
- Product catalog with 100k+ products and ingredient safety data
- Real-time barcode lookups with efficient caching

---

## 📊 Epic Success Metrics

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Datasets Imported** | 100% (9 databases) | Database row counts | Backend Lead |
| **Product Coverage** | 100k+ products | `products` table count | Backend |
| **Ingredient Coverage** | 26k+ INCI names | `ingredients` table count | Backend |
| **INCI Normalization Accuracy** | ≥ 95% | Manual validation (100 samples) | Data Engineer |
| **API Cache Hit Rate** | ≥ 90% | Cache analytics | Backend |
| **Data Freshness** | < 7 days stale | Automated monitoring | DevOps |
| **Storage Costs** | < $20/month | Cloud billing dashboard | DevOps |

---

## 📄 User Stories

### **Story 20.1: HAM10000 Dataset Download & Import**

**Priority**: P0 (Sprint 0)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: ML Lead

#### User Story Statement

As an ML engineer, I want to download and preprocess the HAM10000 dermoscopic image dataset, so that I can train baseline skin lesion classification models for the AI analysis engine.

#### Acceptance Criteria (8)

1. ✅ Kaggle API credentials configured in environment variables
2. ✅ HAM10000 dataset downloaded via Kaggle API: 10,015 images + metadata CSV
3. ✅ Raw images stored in `backend/ml/data/raw/ham10000/`
4. ✅ Preprocessing script resizes all images to 224x224 (RGB)
5. ✅ Processed images stored in `backend/ml/data/processed/ham10000/`
6. ✅ Train/validation/test splits generated: 70/15/15 (7,010 / 1,502 / 1,503)
7. ✅ Metadata includes: `image_id`, `diagnostic_category`, `age`, `sex`, `localization`, `dataset_source`
8. ✅ License verified and documented in `DATASET_LICENSES.md`

#### Technical Requirements

**Download Script**:
```python
# backend/scripts/download_ham10000.py
import kaggle
import os

kaggle.api.dataset_download_files(
    'kmader/skin-cancer-mnist-ham10000',
    path='backend/ml/data/raw/ham10000/',
    unzip=True
)
```

**Preprocessing Script**:
```python
# backend/ml/preprocessing/preprocess_ham10000.py
from PIL import Image
import pandas as pd
import os

def preprocess_ham10000():
    raw_path = 'backend/ml/data/raw/ham10000/'
    processed_path = 'backend/ml/data/processed/ham10000/'
    
    metadata = pd.read_csv(f"{raw_path}/HAM10000_metadata.csv")
    
    for idx, row in metadata.iterrows():
        img = Image.open(f"{raw_path}/{row['image_id']}.jpg")
        img_resized = img.resize((224, 224))
        img_resized.save(f"{processed_path}/{row['image_id']}.jpg")
    
    # Generate splits
    train, val, test = train_test_split(metadata, test_size=0.3, random_state=42)
    val, test = train_test_split(val, test_size=0.5, random_state=42)
    
    train.to_csv(f"{processed_path}/train.csv", index=False)
    val.to_csv(f"{processed_path}/val.csv", index=False)
    test.to_csv(f"{processed_path}/test.csv", index=False)
```

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Preprocessing script runs successfully (no errors)
- [ ] Image quality validated (manual spot check: 20 random images)
- [ ] Split counts correct: 7,010 train / 1,502 val / 1,503 test
- [ ] Storage usage documented: ~3 GB total
- [ ] License documented in `DATASET_LICENSES.md`
- [ ] Runbook created: `docs/ml/HAM10000_SETUP.md`

#### Dependencies
- None (foundational story)

---

### **Story 20.2: ISIC Archive Dataset Download & Import**

**Priority**: P0 (Sprint 0)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: ML Lead

#### User Story Statement

As an ML engineer, I want to download and preprocess the ISIC Archive dermoscopic dataset, so that I can train high-quality skin lesion detection models with ground truth masks.

#### Acceptance Criteria (8)

1. ✅ ISIC API credentials configured
2. ✅ 25,000+ images downloaded via ISIC API or bulk download
3. ✅ Raw images stored in `backend/ml/data/raw/isic/`
4. ✅ Ground truth masks stored in `backend/ml/data/raw/isic/masks/`
5. ✅ Preprocessing script resizes images and masks to 224x224
6. ✅ Processed data stored with metadata: `image_id`, `diagnostic_category`, `age`, `sex`, `benign_malignant`, `dataset_source`
7. ✅ Train/val/test splits: 70/15/15
8. ✅ License verified (CC BY-NC-SA) and documented

#### Technical Requirements

**Download via ISIC API**:
```python
# backend/scripts/download_isic.py
import requests
import os

def download_isic():
    api_url = "https://api.isic-archive.com/api/v2"
    # Download images using pagination
    # Store to backend/ml/data/raw/isic/
```

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] 25k+ images downloaded and preprocessed
- [ ] Ground truth masks validated (spot check: 20 samples)
- [ ] Storage usage: ~8 GB
- [ ] License documented

#### Dependencies
- None

---

### **Story 20.3: Open Beauty Facts Bulk Import**

**Priority**: P0 (Sprint 0)  
**Story Points**: 8  
**Complexity**: High  
**Estimated Hours**: 15-20  
**Assigned To**: Backend Engineer #1

#### User Story Statement

As a backend engineer, I want to download and import the Open Beauty Facts product catalog into PostgreSQL, so that users can scan products and get ingredient safety information.

#### Acceptance Criteria (10)

1. ✅ Open Beauty Facts bulk export downloaded (MongoDB JSON or CSV)
2. ✅ 100,000+ products imported into `products` table
3. ✅ Each product has: `barcode`, `name`, `brand`, `ingredients_text`, `allergens`, `image_url`, `source`
4. ✅ Duplicate barcodes handled: upsert logic (update if exists)
5. ✅ Import script logs: new rows, updated rows, duplicates merged, errors
6. ✅ Database indexes created: `idx_products_barcode`, `idx_products_source`
7. ✅ Data validation: < 5% missing `ingredients_text`
8. ✅ Import time: < 30 minutes for full catalog
9. ✅ Attribution displayed in app footer: "Product data from Open Beauty Facts (CC BY-SA 4.0)"
10. ✅ Automated weekly refresh cron job scheduled

#### Technical Requirements

**Database Schema**:
```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500),
    brand VARCHAR(255),
    ingredients_text TEXT,
    allergens JSONB,
    image_url VARCHAR(500),
    source VARCHAR(50) DEFAULT 'openbeautyfacts',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cached_until TIMESTAMP
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_products_cached_until ON products(cached_until);
```

**Import Script**:
```python
# backend/scripts/import_open_beauty_facts.py
import requests
import psycopg2
from datetime import datetime, timedelta

def import_obf():
    # Download bulk export
    url = "https://world.openbeautyfacts.org/data/openfoodfacts-products.jsonl.gz"
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cursor = conn.cursor()
    
    # Import with upsert
    for product in products:
        cursor.execute("""
            INSERT INTO products (barcode, name, brand, ingredients_text, allergens, image_url, source, cached_until)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (barcode) DO UPDATE SET
                name = EXCLUDED.name,
                ingredients_text = EXCLUDED.ingredients_text,
                updated_at = NOW(),
                cached_until = NOW() + INTERVAL '7 days'
        """, (barcode, name, brand, ingredients, allergens, image_url, 'openbeautyfacts', datetime.now() + timedelta(days=7)))
    
    conn.commit()
```

#### Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] 100k+ products in database
- [ ] Import script runs successfully
- [ ] Duplicate handling tested (import same dataset twice)
- [ ] Cron job scheduled: weekly refresh
- [ ] Documentation: `docs/data/OPEN_BEAUTY_FACTS_SETUP.md`

#### Dependencies
- Database schema deployed (Story 17.2)

---

### **Story 20.4: Open Beauty Facts Real-Time API Integration**

**Priority**: P0 (Sprint 0)  
**Story Points**: 8  
**Complexity**: High  
**Estimated Hours**: 15-20  
**Assigned To**: Backend Engineer #2

#### User Story Statement

As a backend engineer, I want to implement a real-time barcode lookup service using the Open Beauty Facts API with PostgreSQL caching, so that users can scan products and get instant results even if the product isn't in our bulk import.

#### Acceptance Criteria (10)

1. ✅ API endpoint implemented: `POST /api/v1/products/lookup`
2. ✅ Accepts barcode as input, returns product details
3. ✅ Cache-first strategy: check `products` table first
4. ✅ If cache hit and `cached_until > NOW()`, return cached data
5. ✅ If cache miss or stale, call Open Beauty Facts API
6. ✅ API response cached in `products` table with 7-day TTL
7. ✅ Rate limiting respected: 100 req/min (circuit breaker if exceeded)
8. ✅ Graceful degradation: if API fails, return stale cache with warning
9. ✅ Response time: p95 < 500ms
10. ✅ Cache hit rate monitored: target ≥ 90%

#### Technical Requirements

**API Service**:
```python
# backend/app/services/product_lookup.py
import requests
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Product

class ProductLookupService:
    
    @staticmethod
    async def lookup_by_barcode(barcode: str):
        db = get_db()
        
        # 1. Check cache
        cached = db.query(Product).filter(Product.barcode == barcode).first()
        
        if cached and cached.cached_until > datetime.now():
            return cached  # Cache hit
        
        # 2. Call API
        url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()['product']
            
            # 3. Cache result
            product = Product(
                barcode=barcode,
                name=data.get('product_name'),
                brand=data.get('brands'),
                ingredients_text=data.get('ingredients_text'),
                allergens=data.get('allergens'),
                image_url=data.get('image_url'),
                source='openbeautyfacts_api',
                cached_until=datetime.now() + timedelta(days=7)
            )
            db.merge(product)
            db.commit()
            
            return product
        
        # 4. Fallback to stale cache
        if cached:
            return cached  # Stale but better than nothing
        
        return None  # Product not found
```

#### Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] Unit tests: cache hit, cache miss, API failure, stale cache
- [ ] Integration test: scan 100 barcodes, measure cache hit rate
- [ ] Performance test: p95 latency < 500ms
- [ ] Monitoring alerts: cache hit rate < 85%, API failures > 5%
- [ ] Documentation: API endpoint in OpenAPI spec

#### Dependencies
- Story 20.3 (Bulk import must be complete)

---

### **Story 20.5: EU CosIng Ingredient Database Import**

**Priority**: P0 (Sprint 0)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: Backend Engineer #1

#### User Story Statement

As a backend engineer, I want to import the EU CosIng ingredient database, so that the system can normalize INCI ingredient names and classify ingredient functions.

#### Acceptance Criteria (8)

1. ✅ CosIng CSV/XML export downloaded
2. ✅ 26,000+ ingredients imported into `ingredients` table
3. ✅ Each ingredient has: `inci_name`, `cas_number`, `function`, `regulatory_status`, `restrictions`
4. ✅ INCI normalization logic handles common variants (e.g., "Aqua" → "Water")
5. ✅ Database index created: `idx_ingredients_inci_name` (case-insensitive)
6. ✅ Data validation: < 1% missing `function`
7. ✅ Import time: < 10 minutes
8. ✅ License documented (Public database, free for non-commercial)

#### Technical Requirements

**Database Schema**:
```sql
CREATE TABLE ingredients (
    ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    cas_number VARCHAR(50),
    ec_number VARCHAR(50),
    function VARCHAR(255),
    regulatory_status VARCHAR(100),
    restrictions TEXT,
    microbiome_risk_flag BOOLEAN DEFAULT false,
    comedogenicity_score INT CHECK (comedogenicity_score BETWEEN 0 AND 5),
    source VARCHAR(50) DEFAULT 'cosing',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ingredients_inci_name ON ingredients(LOWER(inci_name));
CREATE INDEX idx_ingredients_cas_number ON ingredients(cas_number);
```

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] 26k+ ingredients in database
- [ ] INCI normalizer tested with 100 common variants
- [ ] Quarterly refresh procedure documented

#### Dependencies
- Database schema deployed

---

### **Story 20.6: California CSCP Hazard Data Import**

**Priority**: P1 (Sprint 1)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: Backend Engineer #2

#### User Story Statement

As a backend engineer, I want to import the California CSCP hazard data, so that the system can flag hazardous ingredients for pregnancy safety filters.

#### Acceptance Criteria (8)

1. ✅ CSCP CSV downloaded from California Open Data
2. ✅ 10,000+ chemical-product pairs imported into `ingredient_hazards` table
3. ✅ Each hazard has: `ingredient_id`, `cas_number`, `hazard_type`, `regulatory_body`, `evidence_level`
4. ✅ Hazards linked to `ingredients` table via CAS number
5. ✅ Hazard types include: "carcinogen", "reproductive_toxin", "developmental_toxin"
6. ✅ Import validation: unmatched CAS numbers logged for manual review
7. ✅ Import time: < 5 minutes
8. ✅ License documented (Public domain)

#### Technical Requirements

**Database Schema**:
```sql
CREATE TABLE ingredient_hazards (
    hazard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(ingredient_id),
    cas_number VARCHAR(50),
    hazard_type VARCHAR(100),
    regulatory_body VARCHAR(50) DEFAULT 'california_cscp',
    evidence_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hazards_ingredient_id ON ingredient_hazards(ingredient_id);
CREATE INDEX idx_hazards_cas_number ON ingredient_hazards(cas_number);
```

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] 10k+ hazard records imported
- [ ] Pregnancy safety filter working (flag products with hazardous ingredients)
- [ ] Semi-annual refresh procedure documented

#### Dependencies
- Story 20.5 (CosIng must be imported first for linking)

---

### **Story 20.7: INCI Ingredient Normalizer Service**

**Priority**: P1 (Sprint 1)  
**Story Points**: 8  
**Complexity**: High  
**Estimated Hours**: 15-20  
**Assigned To**: Backend Lead

#### User Story Statement

As a backend engineer, I want to implement an INCI ingredient normalizer service, so that product ingredient lists can be parsed, cleaned, and matched to standardized INCI names from the CosIng database.

#### Acceptance Criteria (10)

1. ✅ Service accepts raw ingredient text (e.g., "Aqua, Glycerin, Alcohol Denat.")
2. ✅ Parses text into individual ingredient strings (split by comma/semicolon)
3. ✅ Cleans each ingredient: trim whitespace, remove special characters
4. ✅ Matches to CosIng `inci_name` (case-insensitive, fuzzy matching ≥ 90% similarity)
5. ✅ Returns normalized ingredient list with: `inci_name`, `function`, `cas_number`, `hazard_flags`
6. ✅ Handles common variants: "Aqua" → "Water", "Tocopherol" → "Vitamin E"
7. ✅ Logs unmatched ingredients for manual review
8. ✅ Normalization accuracy ≥ 95% (validated on 100 sample products)
9. ✅ Response time: < 500ms for typical product (20-30 ingredients)
10. ✅ Unit tests: 50+ edge cases (misspellings, abbreviations, special characters)

#### Technical Requirements

**Service Implementation**:
```python
# backend/app/services/ingredient_normalizer.py
import re
from fuzzywuzzy import fuzz
from app.models import Ingredient

class IngredientNormalizer:
    
    def __init__(self, db_session):
        self.db = db_session
        self.cosing_ingredients = self.db.query(Ingredient).all()
    
    def normalize(self, ingredient_text: str):
        # 1. Parse into individual ingredients
        ingredients = re.split(r'[,;]', ingredient_text)
        
        normalized = []
        
        for raw in ingredients:
            # 2. Clean
            cleaned = raw.strip().lower()
            
            # 3. Fuzzy match to CosIng
            match = self._fuzzy_match(cleaned)
            
            if match:
                normalized.append({
                    'raw': raw,
                    'inci_name': match.inci_name,
                    'function': match.function,
                    'cas_number': match.cas_number,
                    'hazard_flags': self._get_hazards(match.ingredient_id)
                })
            else:
                # Log unmatched
                normalized.append({'raw': raw, 'matched': False})
        
        return normalized
    
    def _fuzzy_match(self, ingredient: str, threshold=90):
        best_match = None
        best_score = 0
        
        for cosing_ing in self.cosing_ingredients:
            score = fuzz.ratio(ingredient, cosing_ing.inci_name.lower())
            if score > best_score and score >= threshold:
                best_match = cosing_ing
                best_score = score
        
        return best_match
```

#### Definition of Done

- [ ] All 10 acceptance criteria verified
- [ ] Unit tests: 95% coverage
- [ ] Manual validation: 100 products, ≥ 95% accuracy
- [ ] Performance test: 100 products normalized in < 50 seconds
- [ ] Unmatched ingredients logged and reviewed weekly

#### Dependencies
- Story 20.5 (CosIng database)
- Story 20.6 (CSCP hazards)

---

### **Story 20.8: Google SCIN Dataset Import**

**Priority**: P1 (Sprint 1)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: ML Lead

#### User Story Statement

As an ML engineer, I want to download and preprocess the Google SCIN dataset, so that ML models can be trained on diverse skin tones for fairness.

#### Acceptance Criteria (8)

1. ✅ SCIN dataset downloaded from Google Cloud Storage
2. ✅ 10,000+ images stored in `backend/ml/data/raw/scin/`
3. ✅ Metadata includes: `image_id`, `fitzpatrick_type`, `monk_skin_tone`, `age`, `sex`, `self_reported_demographics`
4. ✅ Preprocessing script resizes to 224x224
5. ✅ Processed data stored with demographic stratification
6. ✅ Train/val/test splits: 70/15/15 (stratified by Fitzpatrick type)
7. ✅ License verified (SCIN Data Use License)
8. ✅ Fairness baseline: accuracy variance ≤ ±5% across Fitzpatrick I-VI

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] 10k+ images imported
- [ ] Fairness validation completed
- [ ] Storage: ~4 GB

#### Dependencies
- None

---

### **Story 20.9: Kaggle Sephora Products Import**

**Priority**: P1 (Sprint 1)  
**Story Points**: 3  
**Complexity**: Low  
**Estimated Hours**: 5-8  
**Assigned To**: Backend Engineer #1

#### User Story Statement

As a backend engineer, I want to import the Kaggle Sephora products dataset, so that the product catalog has pricing, ratings, and review data.

#### Acceptance Criteria (6)

1. ✅ Kaggle Sephora CSV downloaded
2. ✅ 5,000+ products imported into `products` table
3. ✅ Products enriched with: `price_usd`, `rating`, `review_count`
4. ✅ Duplicate barcodes merged with Open Beauty Facts data
5. ✅ Import time: < 5 minutes
6. ✅ License documented (CC0)

#### Definition of Done

- [ ] All 6 acceptance criteria verified
- [ ] 5k+ products enriched
- [ ] Pricing displayed in product scan results

#### Dependencies
- Story 20.3 (Open Beauty Facts bulk import)

---

### **Story 20.10: Automated Data Refresh Cron Jobs**

**Priority**: P1 (Sprint 1)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: DevOps Lead

#### User Story Statement

As a DevOps engineer, I want to schedule automated cron jobs to refresh external datasets, so that product and ingredient data stays up-to-date without manual intervention.

#### Acceptance Criteria (8)

1. ✅ Weekly cron job scheduled: Open Beauty Facts bulk refresh
2. ✅ Quarterly cron job scheduled: CosIng update
3. ✅ Semi-annual cron job scheduled: CSCP update
4. ✅ Cron jobs run in production environment
5. ✅ Success/failure logs sent to monitoring dashboard
6. ✅ Alerting configured: notify if refresh fails 2x in a row
7. ✅ Stale data warnings displayed if refresh overdue
8. ✅ Runbook documented: manual refresh procedure

#### Technical Requirements

**Cron Job Configuration**:
```bash
# crontab -e

# Open Beauty Facts: Every Sunday at 2 AM
0 2 * * 0 /usr/bin/python /app/backend/scripts/import_open_beauty_facts.py >> /var/log/data-refresh.log 2>&1

# CosIng: 1st of every quarter at 3 AM
0 3 1 1,4,7,10 * /usr/bin/python /app/backend/scripts/import_cosing.py >> /var/log/data-refresh.log 2>&1

# CSCP: 1st of Jan and July at 4 AM
0 4 1 1,7 * /usr/bin/python /app/backend/scripts/import_cscp.py >> /var/log/data-refresh.log 2>&1
```

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Cron jobs tested in staging
- [ ] Monitoring alerts working
- [ ] Runbook documented

#### Dependencies
- Stories 20.3, 20.5, 20.6 (import scripts must exist)

---

### **Story 20.11: Dataset License Compliance Documentation**

**Priority**: P0 (Sprint 0)  
**Story Points**: 2  
**Complexity**: Low  
**Estimated Hours**: 3-5  
**Assigned To**: Product Lead

#### User Story Statement

As a product manager, I want to document all dataset licenses and display attributions in the app, so that the system complies with open-source license requirements.

#### Acceptance Criteria (6)

1. ✅ `DATASET_LICENSES.md` file created in repository
2. ✅ All 9 datasets documented with: name, source URL, license type, permitted uses, attribution text
3. ✅ Attributions displayed in app footer:
   - "Product data from Open Beauty Facts (CC BY-SA 4.0)"
   - "Ingredient data from EU CosIng Database (Public)"
   - "Hazard data from California CSCP (Public Domain)"
   - "ML training data: HAM10000 (CC BY-NC-SA 4.0), ISIC (CC BY-NC-SA)"
4. ✅ Legal review confirms compliance
5. ✅ "Data Sources" page added to app settings
6. ✅ Privacy Policy updated with data sources section

#### Definition of Done

- [ ] All 6 acceptance criteria verified
- [ ] Legal team approves documentation
- [ ] Attributions visible in app (web, iOS, Android)

#### Dependencies
- None

---

### **Story 20.12: Database Monitoring & Alerting**

**Priority**: P1 (Sprint 1)  
**Story Points**: 5  
**Complexity**: Medium  
**Estimated Hours**: 10-12  
**Assigned To**: DevOps Lead

#### User Story Statement

As a DevOps engineer, I want to configure monitoring and alerting for database health and data freshness, so that issues are detected and resolved proactively.

#### Acceptance Criteria (8)

1. ✅ Database metrics monitored: row counts, query latency, connection pool usage
2. ✅ Data freshness alerts: warn if `products.updated_at` > 14 days old
3. ✅ Cache hit rate monitored: alert if < 85%
4. ✅ Storage usage monitored: alert if > 80% capacity
5. ✅ Query performance monitored: alert if p95 > 500ms
6. ✅ Alerts sent to Slack + PagerDuty
7. ✅ Dashboard created: Grafana with database health metrics
8. ✅ Runbook documented: troubleshooting common issues

#### Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Alerts tested (simulate failures)
- [ ] Dashboard accessible to team
- [ ] Runbook documented

#### Dependencies
- Story 17.3 (Monitoring setup)

---

## 📈 Epic 20 Summary

| Story | Points | Priority | Owner | Dependencies |
|-------|--------|----------|-------|-------------|
| 20.1 HAM10000 | 5 | P0 | ML Lead | None |
| 20.2 ISIC | 5 | P0 | ML Lead | None |
| 20.3 OBF Bulk | 8 | P0 | Backend #1 | 17.2 |
| 20.4 OBF API | 8 | P0 | Backend #2 | 20.3 |
| 20.5 CosIng | 5 | P0 | Backend #1 | 17.2 |
| 20.6 CSCP | 5 | P1 | Backend #2 | 20.5 |
| 20.7 INCI Normalizer | 8 | P1 | Backend Lead | 20.5, 20.6 |
| 20.8 Google SCIN | 5 | P1 | ML Lead | None |
| 20.9 Kaggle Sephora | 3 | P1 | Backend #1 | 20.3 |
| 20.10 Cron Jobs | 5 | P1 | DevOps | 20.3, 20.5, 20.6 |
| 20.11 Licenses | 2 | P0 | Product Lead | None |
| 20.12 Monitoring | 5 | P1 | DevOps | 17.3 |
| **TOTAL** | **64** | | | |

---

## 🎯 Sprint 0 Completion Checklist

**Sprint 0 is COMPLETE when**:

- [ ] All P0 stories completed (20.1, 20.2, 20.3, 20.4, 20.5, 20.11)
- [ ] 100k+ products in database
- [ ] 26k+ ingredients in database
- [ ] 35k+ ML images downloaded and preprocessed
- [ ] API cache hit rate ≥ 90%
- [ ] All licenses documented
- [ ] Monitoring alerts configured
- [ ] Team trained on data refresh procedures

---

## 📊 Success Metrics (Post-Sprint 0)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Products imported | 100k+ | ___ | ⏳ |
| Ingredients imported | 26k+ | ___ | ⏳ |
| ML images imported | 35k+ | ___ | ⏳ |
| INCI normalization accuracy | ≥ 95% | ___ | ⏳ |
| API cache hit rate | ≥ 90% | ___ | ⏳ |
| Storage costs | < $20/month | ___ | ⏳ |
| Data freshness | < 7 days stale | ___ | ⏳ |

---

**Next Steps**:
1. ✅ Review stories with team
2. ✅ Assign story points in planning poker
3. ✅ Begin Sprint 0 with P0 stories
4. ✅ Daily standups to track progress
5. ✅ Sprint 0 demo at end of week 1
