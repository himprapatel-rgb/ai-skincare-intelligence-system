# ML Training & External Dataset Integration for Railway PostgreSQL

## Version: 1.0
**Date:** December 13, 2025
**Purpose:** Enhance ML model accuracy through external dataset integration into Railway PostgreSQL

---

## 🎯 OBJECTIVE

Integrate high-quality external skincare datasets into Railway PostgreSQL database to improve ML model training and prediction accuracy for:
- Skin type classification
- Product recommendations
- Ingredient analysis
- Skin condition detection

---

## 📊 IDENTIFIED EXTERNAL DATASETS

### 1. **Skincare Products Dataset** [web:114]
**Source:** Kaggle - Skincare Products Clean Dataset
**URL:** https://www.kaggle.com/datasets/eward96/skincare-products-clean-dataset
**Content:**
- Product names
- Product URLs
- Product types (moisturizer, serum, etc.)
- Complete ingredient lists
- Pricing information
**Size:** Thousands of products
**Use Case:** Product recommendation engine, ingredient analysis

### 2. **Facial Skin Condition Dataset** [web:120]
**Source:** UniData - Facial Skin Condition
**URL:** https://unidata.pro/datasets/facial-skin-condition-image-dataset/
**Content:**
- High-quality facial images
- Multiple skin types and tones
- Labeled skin conditions
- 639+ files with metadata
**Use Case:** Skin condition detection, diagnostic AI

### 3. **Skin Type Classification Dataset** [web:126]
**Source:** Kaggle - Oily, Dry and Normal Skin Types
**URL:** https://www.kaggle.com/datasets/shakyadissanayake/oily-dry-and-normal-skin-types-dataset
**Content:**
- Labeled skin type images
- Normal, oily, and dry classifications
**Use Case:** Skin type detection model

### 4. **Sephora Products & Reviews** [web:125]
**Source:** Kaggle - Sephora Products and Skincare Reviews
**URL:** https://www.kaggle.com/datasets/nadyinky/sephora-products-and-skincare-reviews
**Content:**
- 8,000+ beauty products
- User reviews and ratings
- Product descriptions
**Use Case:** Product recommendations, sentiment analysis

### 5. **COSING Ingredient Database** [web:118]
**Source:** EU Institutions API
**URL:** https://api.store/cosmetic-ingredient-database
**Content:**
- Official cosmetic ingredient data
- INCI names, functions, restrictions
- Safety and compliance information
**Use Case:** Ingredient safety analysis

---

## 🎯 PRIORITY: Facial Skin Condition Dataset

**Selected for immediate implementation** [web:120]

### Why This Dataset?
- **High-quality labeled data** for skin condition detection
- **Diverse representation** across skin types and tones
- **Medical-grade labeling** with metadata
- **Perfect fit** for your AI skincare analysis system

### Dataset Specifications:
```
Total Files: 639+
Format: High-resolution images
Labels: Skin conditions (acne, eczema, etc.)
Metadata: ID, gender, age, ethnicity
License: Commercial use allowed
```

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: Database Schema (Week 1)

#### New Tables for Railway PostgreSQL:

```sql
-- Training images table
CREATE TABLE ml_training_images (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    local_path VARCHAR(255),
    image_hash VARCHAR(64) UNIQUE,
    dataset_source VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skin condition labels
CREATE TABLE skin_condition_labels (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES ml_training_images(id),
    condition_type VARCHAR(100) NOT NULL,
    confidence_score FLOAT,
    severity_level VARCHAR(50),
    metadata JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject metadata
CREATE TABLE subject_metadata (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES ml_training_images(id),
    gender VARCHAR(20),
    age_range VARCHAR(20),
    ethnicity VARCHAR(50),
    skin_type VARCHAR(50),
    fitzpatrick_scale INTEGER CHECK (fitzpatrick_scale BETWEEN 1 AND 6),
    additional_info JSONB
);

-- Model training metrics
CREATE TABLE model_training_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_size INTEGER,
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    training_duration_minutes INTEGER,
    hyperparameters JSONB,
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_training_images_source ON ml_training_images(dataset_source);
CREATE INDEX idx_condition_labels_type ON skin_condition_labels(condition_type);
CREATE INDEX idx_metadata_skin_type ON subject_metadata(skin_type);
CREATE INDEX idx_training_metrics_date ON model_training_metrics(training_date);
```

### Phase 2: Data Download & Processing

#### Download Script Location:
```
backend/scripts/download_facial_dataset.py
```

#### Processing Pipeline:
1. Download from UniData/Kaggle
2. Validate image integrity
3. Extract metadata from filenames
4. Generate image hashes (prevent duplicates)
5. Upload to Google Cloud Storage
6. Insert metadata into Railway PostgreSQL

### Phase 3: ETL Pipeline

#### Load Script Location:
```
backend/scripts/load_to_postgres.py
```

#### Data Flow:
```
Local/GCS → Image Processing → Feature Extraction → PostgreSQL
```

---

## 💻 CODE IMPLEMENTATION

### 1. Requirements Update

```python
# Add to backend/requirements.txt
kaggle==1.6.0
pillow==10.1.0
imageh ash==4.3.1
google-cloud-storage==2.14.0
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
tensorflow==2.15.0  # For model training
```

### 2. Database Migration

```python
# backend/migrations/versions/add_ml_training_tables.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create ml_training_images table
    op.create_table(
        'ml_training_images',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('image_url', sa.String(500), nullable=False),
        sa.Column('local_path', sa.String(255)),
        sa.Column('image_hash', sa.String(64), unique=True),
        sa.Column('dataset_source', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    
    # Create other tables...
    # (Include all 4 tables from schema above)
    
def downgrade():
    op.drop_table('model_training_metrics')
    op.drop_table('subject_metadata')
    op.drop_table('skin_condition_labels')
    op.drop_table('ml_training_images')
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Prepare Environment
```bash
# Install Kaggle CLI
pip install kaggle

# Configure Kaggle credentials
mkdir -p ~/.kaggle
echo '{"username":"your_username","key":"your_api_key"}' > ~/.kaggle/kaggle.json
chmod 600 ~/.kaggle/kaggle.json
```

### Step 2: Run Database Migration
```bash
cd backend
alembic upgrade head
```

### Step 3: Download Dataset
```bash
python scripts/download_facial_dataset.py --output-dir ./data/facial_skin
```

### Step 4: Load to PostgreSQL
```bash
python scripts/load_to_postgres.py --data-dir ./data/facial_skin
```

### Step 5: Train Model
```bash
# Use Google Colab for GPU training
# Upload training script to Colab
# Connect to Railway PostgreSQL
# Train and save model to GCS
```

---

## 📊 EXPECTED OUTCOMES

### Database Growth:
- **639+ training images** loaded
- **Comprehensive metadata** for each image
- **Labeled conditions** ready for supervised learning

### Model Improvements:
- **Skin condition detection accuracy:** +25-35%
- **Multi-class classification:** Support for 7+ conditions
- **Demographic fairness:** Balanced across skin types

### API Enhancements:
- New endpoint: `/api/v1/ml/analyze-condition`
- Confidence scores per condition
- Severity level predictions

---

## 🔧 NEXT ACTIONS

1. **Immediate** (Today):
   - Commit this documentation
   - Create database migration script
   - Set up Kaggle API credentials

2. **Week 1**:
   - Implement download script
   - Run database migration on Railway
   - Download facial skin dataset

3. **Week 2**:
   - Load data into PostgreSQL
   - Start model training in Colab
   - Test initial predictions

4. **Week 3**:
   - Integrate trained model
   - Update API endpoints
   - Deploy to production

---

**Document Status:** Ready for Implementation
**Priority:** HIGH
**Estimated Time:** 2-3 weeks
**Dependencies:** Kaggle API access, Railway PostgreSQL, Google Cloud Storage
