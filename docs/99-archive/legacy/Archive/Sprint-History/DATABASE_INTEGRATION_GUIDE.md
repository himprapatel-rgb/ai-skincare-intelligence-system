# 🗄️ Open-Source Database Integration Guide

**AI Skincare Intelligence System - Data Sources & Integration Strategy**

**Last Updated**: December 8, 2025

---

## 📋 Table of Contents

1. [Skin Analysis Databases (ML Training)](#1-skin-analysis-databases-ml-training)
2. [Product & Ingredient Databases](#2-product--ingredient-databases)
3. [Integration Methods: Download vs API](#3-integration-methods-download-vs-api)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Technical Integration Steps](#5-technical-integration-steps)

---

## 1. Skin Analysis Databases (ML Training)

### Priority: Must Have (Sprint 0-1)

#### 1.1 HAM10000 Dataset ⭐⭐⭐
**Purpose**: Baseline dermoscopic image classification
- **Size**: 10,015 images
- **Categories**: 7 diagnostic categories (melanoma, benign lesions, etc.)
- **License**: CC BY-NC-SA 4.0 ✅ Free for research
- **Source**: [Kaggle](https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000) | [Harvard Dataverse](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/DBW86T)
- **Integration Method**: 📥 **DOWNLOAD** (one-time bulk download)
- **Storage**: Upload to your backend/ml/data/raw/ folder

**Why**: Industry-standard baseline for skin lesion classification.[web:40][web:48][web:51]

---

#### 1.2 ISIC Archive ⭐⭐⭐
**Purpose**: Large-scale dermoscopic images with masks & metadata
- **Size**: 25,000+ images
- **Features**: Ground truth masks, metadata, EXIF data
- **License**: CC BY-NC-SA ✅ Free for research
- **Source**: [ISIC Archive](https://www.isic-archive.com) | [Challenge Datasets](https://challenge.isic-archive.com/data/)
- **Integration Method**: 📥 **DOWNLOAD** via ISIC API or bulk download
- **Storage**: Upload to your backend/ml/data/raw/ folder

**Why**: High-quality annotations, widely used in research, supports fairness analysis.[web:43][web:45]

---

### Priority: Should Have (Sprint 1-2)

#### 1.3 Google SCIN Dataset ⭐⭐
**Purpose**: Diverse dermatology images with demographic data
- **Size**: 10,000+ images from 5,000+ contributors
- **Features**: Self-reported demographics, Fitzpatrick skin type, Monk Skin Tone
- **License**: SCIN Data Use License ✅ Open for research
- **Source**: [GitHub](https://github.com/google-research-datasets/scin) | Google Cloud Storage
- **Integration Method**: 📥 **DOWNLOAD** from GCS bucket
- **Storage**: Backend ML data folder

**Why**: Diverse skin tones (32.6% non-White contributors), real-world conditions, short-duration conditions (54% <7 days).[web:44][web:50]

---

#### 1.4 Diverse Dermatology Images (DDI) ⭐⭐
**Purpose**: Bias detection & fairness evaluation
- **Size**: Biopsy-proven dataset
- **Features**: Diverse skin tone representation
- **License**: Open for research ✅
- **Source**: [DDI Dataset](https://ddi-dataset.github.io)
- **Integration Method**: 📥 **DOWNLOAD**

**Why**: Essential for fairness testing across skin tones (NFR7 requirement).[web:42]

---

### Priority: Could Have (Phase 2)

#### 1.5 SkinCAP Dataset
**Purpose**: Multi-modal dermatology with medical captions
- **Size**: 4,000 annotated images
- **Features**: Rich medical descriptions by board-certified dermatologists
- **Source**: [Hugging Face](https://huggingface.co/datasets/joshuachou/SkinCAP)
- **Integration Method**: 📥 **DOWNLOAD** via Hugging Face API

**Why**: Enables natural language interaction with skin analysis results.[web:47]

---

## 2. Product & Ingredient Databases

### Priority: Must Have (Sprint 0-1)

#### 2.1 Open Beauty Facts ⭐⭐⭐
**Purpose**: Primary product catalog with ingredients & barcodes
- **Size**: 100,000+ cosmetic products
- **Features**: Ingredients, allergens, INCI names, barcodes, images
- **License**: CC BY-SA 4.0 ✅ Free for commercial use with attribution
- **Integration Methods**: 
  - 📥 **DOWNLOAD**: [Bulk export](https://world.openbeautyfacts.org/data) (MongoDB JSON, CSV)
  - 🔌 **API**: [REST API](https://world.openbeautyfacts.org/api/v0/product/{barcode}.json)

**Recommended**: Use **DOWNLOAD** for initial seeding, **API** for real-time barcode lookups.[web:60][web:61][web:66]

**API Example**:
```python
import requests
response = requests.get('https://world.openbeautyfacts.org/api/v0/product/3017620422003.json')
product = response.json()['product']
print(product['ingredients_text'])
```

---

#### 2.2 EU CosIng Database ⭐⭐⭐
**Purpose**: Official EU cosmetic ingredient database
- **Size**: 26,000+ standardized INCI names
- **Features**: Functions (emollient, preservative), regulatory status, restrictions
- **License**: Public database ✅ Free for non-commercial
- **Integration Methods**:
  - 📥 **DOWNLOAD**: [CSV/XML exports](https://ec.europa.eu/growth/tools-databases/cosing/)
  - 🔌 **API**: [CosIng API](https://api.store/eu-institutions-api/directorate-general-for-internal-market-industry-entrepreneurship-and-smes-api/cosmetic-in...) (limited)

**Recommended**: Use **DOWNLOAD** for complete INCI normalization.[web:52][web:69][web:74]

---

### Priority: Should Have (Sprint 1-2)

#### 2.3 California Chemicals in Cosmetics (CSCP)
**Purpose**: Hazard flagging for ingredients
- **Size**: 10,000+ chemical-product pairs
- **Features**: Carcinogen flags, reproductive toxin warnings
- **License**: Public government data ✅ Public domain
- **Source**: [California Open Data](https://data.ca.gov/dataset/chemicals-in-cosmetics)
- **Integration Method**: 📥 **DOWNLOAD** CSV

**Why**: Critical for pregnancy/safety filters (FR44-FR46).

---

#### 2.4 Kaggle Sephora Products Dataset
**Purpose**: Enrich product catalog with pricing & ratings
- **Size**: 5,000+ products with full INCI, prices, ratings
- **License**: CC0 / CC BY-SA ✅
- **Source**: [Kaggle](https://www.kaggle.com/datasets/kingabzpro/cosmetics-datasets)
- **Integration Method**: 📥 **DOWNLOAD** CSV

---

### Priority: Could Have (Phase 2)

#### 2.5 EWG Skin Deep Database ⚠️
**Purpose**: Ingredient hazard scores
- **Size**: 70,000+ products
- **Features**: Safety ratings (1-10 scale)
- **License**: ⚠️ **Restricted** - Check Terms of Service
- **Source**: [EWG Skin Deep](https://www.ewg.org/skindeep)
- **Integration Method**: 🔴 **NO PUBLIC API** - Manual scraping violates ToS

**Recommended**: Use as **reference only** for manual enrichment, not automated ingestion.[web:65][web:67]

---

#### 2.6 Cosmethics API (Commercial)
**Purpose**: Professional formulation intelligence
- **Features**: Digital label data, active ingredient search, INCI decoder
- **License**: 💰 **Paid API**
- **Source**: [Cosmethics.com](https://cosmethics.com/api/)
- **Integration Method**: 🔌 **API** (paid subscription)

**When**: Consider for Phase 2 when monetizing.[web:64]

---

## 3. Integration Methods: Download vs API

### 📥 Download Method (Recommended for most)

**Use When**:
- Dataset is static or infrequently updated
- You need full dataset for ML training
- You want to avoid API rate limits
- You need offline access

**Process**:
1. **Download** → Raw files to `backend/ml/data/raw/` or `backend/data/products/`
2. **Clean & Filter** → Remove duplicates, normalize INCI names, validate images
3. **Upload to Database** → Populate PostgreSQL tables via migration scripts
4. **Schedule Updates** → Weekly/monthly cron job to refresh data

**Pros**:
- ✅ No API rate limits
- ✅ Fast local queries
- ✅ Offline capability
- ✅ Full control over data processing

**Cons**:
- ❌ Initial setup time
- ❌ Storage costs (minimal for images)
- ❌ Update latency (weekly refresh)

---

### 🔌 API Method

**Use When**:
- You need real-time data (e.g., barcode scanning)
- Dataset is too large to store locally
- Data updates frequently
- You want minimal initial setup

**Process**:
1. **API Call** → Fetch product data on-demand
2. **Cache Response** → Store in PostgreSQL for 24-48 hours
3. **Fallback** → Use cached data if API fails

**Pros**:
- ✅ Always up-to-date
- ✅ No storage needed
- ✅ Quick setup

**Cons**:
- ❌ API rate limits (e.g., Open Beauty Facts: 100 req/min)
- ❌ Network dependency
- ❌ Slower response time

---

## 4. Implementation Roadmap

### Phase 1: Sprint 0 (Immediate)
**Goal**: Bootstrap ML training & product catalog

| Database | Method | Priority | Storage Location |
|----------|--------|----------|------------------|
| HAM10000 | Download | P0 | `backend/ml/data/raw/ham10000/` |
| ISIC | Download | P0 | `backend/ml/data/raw/isic/` |
| Open Beauty Facts | Download | P0 | PostgreSQL `products` & `ingredients` tables |
| CosIng | Download | P0 | PostgreSQL `ingredients` table (INCI normalization) |

**Estimated Time**: 2-3 days
**Storage**: ~15 GB images + 500 MB database

---

### Phase 2: Sprint 1-2 (1-2 Weeks)
**Goal**: Enhance diversity & safety features

| Database | Method | Priority | Purpose |
|----------|--------|----------|----------|
| Google SCIN | Download | P1 | Diverse skin tones for fairness |
| DDI | Download | P1 | Bias detection |
| CSCP | Download | P1 | Hazard flagging (pregnancy safety) |
| Kaggle Sephora | Download | P1 | Pricing & ratings |
| Open Beauty Facts API | API | P1 | Real-time barcode lookup |

**Estimated Time**: 1 week

---

### Phase 3: Production Optimization (Phase 2)
**Goal**: API integrations & paid services

- Implement Open Beauty Facts API for live barcode scanning
- Evaluate Cosmethics API for premium features
- Add SkinCAP for natural language descriptions

---

## 5. Technical Integration Steps

### Step 1: Download & Store Images (ML Datasets)

```python
# backend/scripts/download_ham10000.py
import kaggle
import os

# Download HAM10000 from Kaggle
kaggle.api.dataset_download_files(
    'kmader/skin-cancer-mnist-ham10000',
    path='backend/ml/data/raw/ham10000/',
    unzip=True
)

print("HAM10000 downloaded successfully")
```

**Run**:
```bash
pip install kaggle
export KAGGLE_USERNAME=your_username
export KAGGLE_KEY=your_api_key
python backend/scripts/download_ham10000.py
```

---

### Step 2: Clean & Preprocess Data

```python
# backend/ml/preprocessing/clean_images.py
import pandas as pd
from PIL import Image
import os

def preprocess_ham10000(raw_path, processed_path):
    """Clean and resize HAM10000 images to 224x224"""
    metadata = pd.read_csv(f"{raw_path}/HAM10000_metadata.csv")
    
    for idx, row in metadata.iterrows():
        image_id = row['image_id']
        image_path = f"{raw_path}/{image_id}.jpg"
        
        # Resize to 224x224
        img = Image.open(image_path)
        img_resized = img.resize((224, 224))
        
        # Save to processed folder
        output_path = f"{processed_path}/{image_id}.jpg"
        img_resized.save(output_path)
    
    print(f"Processed {len(metadata)} images")

preprocess_ham10000(
    'backend/ml/data/raw/ham10000',
    'backend/ml/data/processed/ham10000'
)
```

---

### Step 3: Import Products to Database

```python
# backend/scripts/import_open_beauty_facts.py
import requests
import psycopg2
from datetime import datetime

def import_obf_products(db_connection_string):
    """Download and import Open Beauty Facts bulk data"""
    
    # Download bulk export
    url = "https://world.openbeautyfacts.org/data/openfoodfacts-products.jsonl.gz"
    response = requests.get(url, stream=True)
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(db_connection_string)
    cursor = conn.cursor()
    
    # Process each product
    for line in response.iter_lines():
        product = json.loads(line)
        
        # Extract fields
        barcode = product.get('code')
        name = product.get('product_name')
        ingredients = product.get('ingredients_text')
        brands = product.get('brands')
        
        # Insert into database
        cursor.execute("""
            INSERT INTO products (barcode, name, ingredients_text, brands, source, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (barcode) DO UPDATE SET
                name = EXCLUDED.name,
                ingredients_text = EXCLUDED.ingredients_text,
                updated_at = NOW()
        """, (barcode, name, ingredients, brands, 'openbeautyfacts', datetime.now()))
    
    conn.commit()
    print(f"Imported {cursor.rowcount} products")

import_obf_products(os.getenv('DATABASE_URL'))
```

---

### Step 4: Implement Real-Time API Lookup

```python
# backend/app/services/product_lookup.py
import requests
from app.database import get_db

class ProductLookupService:
    
    @staticmethod
    async def lookup_by_barcode(barcode: str):
        """Lookup product by barcode, check cache first"""
        
        # 1. Check local database cache
        db = get_db()
        cached = db.query(Product).filter(Product.barcode == barcode).first()
        
        if cached and (datetime.now() - cached.updated_at).days < 7:
            return cached  # Use cache if <7 days old
        
        # 2. Fetch from Open Beauty Facts API
        url = f"https://world.openbeautyfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()['product']
            
            # 3. Update/insert into database
            product = Product(
                barcode=barcode,
                name=data.get('product_name'),
                ingredients_text=data.get('ingredients_text'),
                brands=data.get('brands'),
                source='openbeautyfacts_api',
                updated_at=datetime.now()
            )
            db.merge(product)
            db.commit()
            
            return product
        
        return None  # Product not found
```

---

### Step 5: Normalize Ingredients with CosIng

```python
# backend/services/ingredient_normalizer.py
import pandas as pd

class IngredientNormalizer:
    
    def __init__(self, cosing_csv_path):
        """Load CosIng database for INCI normalization"""
        self.cosing_df = pd.read_csv(cosing_csv_path)
    
    def normalize(self, ingredient_text):
        """Normalize ingredient name to standard INCI"""
        
        # Example: "Aqua" → "Water"
        # Example: "Sodium Lauryl Sulfate" → "SLS"
        
        match = self.cosing_df[
            self.cosing_df['INCI_name'].str.lower() == ingredient_text.lower()
        ].first()
        
        if match:
            return {
                'inci_name': match['INCI_name'],
                'function': match['Function'],
                'cas_number': match['CAS_number'],
                'restricted': match['Restriction'] is not None
            }
        
        return None  # Not found in CosIng
```

---

## 📊 Summary Table

| Database | Size | Method | Cost | Integration Time | Priority |
|----------|------|--------|------|------------------|----------|
| **HAM10000** | 10k images | Download | Free | 2 hours | P0 |
| **ISIC Archive** | 25k images | Download | Free | 3 hours | P0 |
| **Open Beauty Facts** | 100k products | Download+API | Free | 4 hours | P0 |
| **CosIng** | 26k ingredients | Download | Free | 1 hour | P0 |
| **Google SCIN** | 10k images | Download | Free | 2 hours | P1 |
| **CSCP** | 10k pairs | Download | Free | 1 hour | P1 |
| **Kaggle Sephora** | 5k products | Download | Free | 1 hour | P1 |
| **EWG Skin Deep** | 70k products | ❌ No API | ❌ Restricted | N/A | P2 (reference only) |
| **Cosmethics** | Full catalog | API | 💰 Paid | N/A | P2 (optional) |

---

## ✅ Recommended Approach

### For Your Project:

1. **ML Training** → **DOWNLOAD** all datasets (HAM10000, ISIC, SCIN)
   - One-time bulk download
   - Store in backend/ml/data/
   - Preprocess and upload to training environment

2. **Product Catalog** → **DOWNLOAD** Open Beauty Facts + CosIng
   - Import into PostgreSQL
   - Normalize INCI with CosIng
   - Update weekly via cron job

3. **Real-Time Lookup** → **API** for barcode scanning
   - Open Beauty Facts API for live product lookup
   - Cache results in PostgreSQL for 7 days

4. **Safety Data** → **DOWNLOAD** CSCP for hazard flagging
   - Link to ingredients via CAS/INCI

---

## 📚 Next Steps

1. ✅ Review this guide
2. ✅ Set up Kaggle API credentials
3. ✅ Download HAM10000 & ISIC datasets
4. ✅ Import Open Beauty Facts bulk export
5. ✅ Import CosIng for INCI normalization
6. ✅ Implement barcode lookup API
7. ✅ Create LICENSE.md with all dataset attributions

---

**All datasets listed are legally free for research/commercial use with proper attribution.**[web:40][web:41][web:43][web:44][web:60][web:61]
