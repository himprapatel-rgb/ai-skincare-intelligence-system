# Database Schema Documentation

**Document Version:** 1.1  
**Last Updated:** 2026-01-29  
**Database:** PostgreSQL (Railway)  
**ORM:** SQLAlchemy  
**Backend:** Fly.io  
**Frontend:** Cloudflare Pages

---

## Overview

The Pellicura AI Skincare Intelligence System uses a relational database to store user data, product information, skin analysis results, and personalized recommendations.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     1:1      ┌──────────────────┐                            │
│  │    USERS     │─────────────►│   USER_PROFILE   │                            │
│  └──────┬───────┘              └──────────────────┘                            │
│         │                                                                        │
│         │ 1:Many                                                                │
│         ├─────────────────────────────────────────────────────────┐             │
│         │                                                          │             │
│         ▼                                                          ▼             │
│  ┌──────────────────┐                                    ┌──────────────────┐   │
│  │  SHELF_PRODUCTS  │◄───────────────────────────────────│  SCAN_SESSIONS   │   │
│  └────────┬─────────┘                                    └────────┬─────────┘   │
│           │                                                       │              │
│           │ Many:1 (optional)                                     │ 1:Many      │
│           ▼                                                       ▼              │
│  ┌──────────────────┐                                    ┌──────────────────┐   │
│  │    PRODUCTS      │                                    │ SKIN_SNAPSHOTS   │   │
│  └────────┬─────────┘                                    └──────────────────┘   │
│           │                                                                      │
│           │ 1:Many                                                              │
│           ▼                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                             │
│  │PRODUCT_INGREDIENTS│────────►│   INGREDIENTS    │                             │
│  └──────────────────┘         └──────────────────┘                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### 1. USERS

Primary user authentication and account table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary key |
| `public_id` | VARCHAR(255) | UNIQUE, INDEX | Public-facing UUID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | User email |
| `hashed_password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `full_name` | VARCHAR(255) | NULLABLE | User's display name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Email verified status |
| `is_admin` | BOOLEAN | DEFAULT FALSE | Admin privileges |
| `email_verification_token` | VARCHAR(255) | NULLABLE, INDEX | Email verification token |
| `email_verification_expires_at` | TIMESTAMP | NULLABLE | Token expiration |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update timestamp |

**Relationships:**
- One-to-One: `user_profile`
- One-to-Many: `shelf_products`, `scan_sessions`, `skin_snapshots`, `consents`

---

### 2. USER_PROFILE

Extended user profile with skin information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary key |
| `user_id` | INTEGER | FK → users.id, UNIQUE | User reference |
| `skin_type` | VARCHAR(50) | NULLABLE | oily, dry, combination, normal, sensitive |
| `skin_concerns` | JSONB | DEFAULT [] | Array of concerns |
| `allergies` | JSONB | DEFAULT [] | Known allergies |
| `age_range` | VARCHAR(20) | NULLABLE | 18-24, 25-34, 35-44, etc. |
| `gender` | VARCHAR(20) | NULLABLE | User's gender |
| `climate` | VARCHAR(50) | NULLABLE | humid, dry, temperate, etc. |
| `skin_goals` | JSONB | DEFAULT [] | User's skincare goals |
| `avatar_url` | VARCHAR(500) | NULLABLE | Profile picture URL |
| `timezone` | VARCHAR(50) | NULLABLE | User's timezone |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update |

---

### 3. PRODUCTS

Global product database for all beauty/skincare products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `brand` | VARCHAR(200) | NOT NULL, INDEX | Product brand |
| `name` | VARCHAR(300) | NOT NULL, INDEX | Product name |
| `category` | VARCHAR(100) | NOT NULL | cleanser, moisturizer, serum, etc. |
| `upc` | VARCHAR(50) | NULLABLE, INDEX | Barcode (EAN/UPC) |
| `size_ml` | FLOAT | NULLABLE | Product size in ml |
| `primary_concerns` | JSONB | NULLABLE | Skin concerns addressed |
| `skin_types` | JSONB | NULLABLE | Suitable skin types |
| `suitable_for` | VARCHAR[] | NULLABLE | Array of skin types |
| `targets` | VARCHAR[] | NULLABLE | Array of concerns targeted |
| `is_fragrance_free` | BOOLEAN | DEFAULT FALSE | Fragrance-free flag |
| `is_vegan` | BOOLEAN | DEFAULT FALSE | Vegan flag |
| `is_cruelty_free` | BOOLEAN | DEFAULT FALSE | Cruelty-free flag |
| `average_rating` | FLOAT | NULLABLE | Community rating (1-5) |
| `price_usd` | FLOAT | NULLABLE | Price in USD |
| `product_image_url` | VARCHAR(500) | NULLABLE | Clean product image |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update |

**Indexes:**
- `ix_products_brand` on `brand`
- `ix_products_name` on `name`
- `ix_products_upc` on `upc`

---

### 4. SHELF_PRODUCTS

User's personal product inventory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary key |
| `user_id` | INTEGER | FK → users.id, NOT NULL, INDEX | User reference |
| `product_id` | UUID | FK → products.id, NULLABLE | Global product reference |
| `external_product_id` | VARCHAR(255) | NULLABLE, INDEX | Barcode or external ID |
| `product_name` | VARCHAR(255) | NOT NULL | Product name |
| `product_brand` | VARCHAR(255) | NULLABLE | Brand name |
| `product_category` | VARCHAR(100) | NULLABLE | Product category |
| `product_image` | VARCHAR(500) | NULLABLE | Product image URL |
| `status` | VARCHAR(20) | DEFAULT 'active' | active, finished, discontinued, wishlist |
| `rating` | FLOAT | NULLABLE | User's rating (1-5) |
| `notes` | TEXT | NULLABLE | User's notes |
| `routine_type` | VARCHAR(20) | NULLABLE | am, pm, both |
| `routine_order` | INTEGER | NULLABLE | Order in routine |
| `purchase_date` | TIMESTAMP | NULLABLE | When purchased |
| `expiry_date` | TIMESTAMP | NULLABLE | Product expiration |
| `purchase_price` | FLOAT | NULLABLE | Purchase price |
| `would_repurchase` | BOOLEAN | NULLABLE | Repurchase intention |
| `times_repurchased` | INTEGER | DEFAULT 0 | Repurchase count |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Added to shelf date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update |

**Relationships:**
- Many-to-One: `users` (user_id)
- Many-to-One: `products` (product_id) - optional

---

### 5. INGREDIENTS

Master ingredient database with safety information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `name_inci` | VARCHAR(255) | NOT NULL, UNIQUE, INDEX | INCI name |
| `common_names` | JSONB | DEFAULT [] | Common name aliases |
| `category` | VARCHAR(100) | NULLABLE | Ingredient category |
| `function` | TEXT | NULLABLE | What the ingredient does |
| `safety_category` | VARCHAR(50) | NULLABLE | Safety classification |
| `safety_rating` | INTEGER | NULLABLE | Safety score (1-10) |
| `comedogenic_rating` | INTEGER | NULLABLE | Pore-clogging (0-5) |
| `microbiome_impact` | VARCHAR(50) | NULLABLE | Effect on skin microbiome |
| `is_antimicrobial` | BOOLEAN | DEFAULT FALSE | Antimicrobial flag |
| `fda_approved` | BOOLEAN | DEFAULT FALSE | FDA approval status |
| `eu_approved` | BOOLEAN | DEFAULT FALSE | EU approval status |
| `data_sources` | JSONB | NULLABLE | Where data came from |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update |

---

### 6. PRODUCT_INGREDIENTS

Junction table linking products to their ingredients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `product_id` | UUID | FK → products.id, NOT NULL, INDEX | Product reference |
| `ingredient_id` | UUID | FK → ingredients.id, NOT NULL, INDEX | Ingredient reference |
| `position` | INTEGER | NOT NULL | Order in ingredient list |
| `concentration_percent` | FLOAT | NULLABLE | Estimated concentration |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

**Note:** Position 1 = highest concentration (INCI order)

---

### 7. SCAN_SESSIONS

Skin analysis scan history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `user_id` | INTEGER | FK → users.id, NOT NULL, INDEX | User reference |
| `image_url` | VARCHAR(500) | NULLABLE | Scan image URL |
| `analysis_results` | JSONB | NULLABLE | AI analysis output |
| `skin_score` | FLOAT | NULLABLE | Overall skin health (0-100) |
| `concerns_detected` | JSONB | DEFAULT [] | Detected concerns |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Scan timestamp |

---

### 8. SKIN_SNAPSHOTS (Digital Twin)

Point-in-time skin state records for progress tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `user_id` | INTEGER | FK → users.id, NOT NULL, INDEX | User reference |
| `scan_session_id` | UUID | FK → scan_sessions.id, NULLABLE | Related scan |
| `snapshot_date` | DATE | NOT NULL | Snapshot date |
| `skin_metrics` | JSONB | NOT NULL | Detailed metrics |
| `notes` | TEXT | NULLABLE | User notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

---

### 9. PRODUCT_REVIEWS

User reviews for products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid4() | Primary key |
| `product_id` | UUID | FK → products.id, NOT NULL, INDEX | Product reference |
| `user_id` | INTEGER | FK → users.id, NOT NULL, INDEX | User reference |
| `rating` | INTEGER | NOT NULL | 1-5 stars |
| `title` | VARCHAR(200) | NULLABLE | Review title |
| `comment` | TEXT | NULLABLE | Review text |
| `skin_type` | VARCHAR(50) | NULLABLE | Reviewer's skin type |
| `would_recommend` | BOOLEAN | DEFAULT TRUE | Recommendation flag |
| `verified_purchase` | BOOLEAN | DEFAULT FALSE | From user's shelf |
| `helpful_count` | INTEGER | DEFAULT 0 | Upvotes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Review date |
| `updated_at` | TIMESTAMP | ON UPDATE | Last update |

**Constraints:**
- UNIQUE on (product_id, user_id) - one review per user per product

---

### 10. USER_CONSENTS

GDPR consent tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary key |
| `user_id` | INTEGER | FK → users.id, NOT NULL, INDEX | User reference |
| `terms_accepted` | BOOLEAN | DEFAULT FALSE | Terms accepted |
| `privacy_accepted` | BOOLEAN | DEFAULT FALSE | Privacy accepted |
| `terms_version` | VARCHAR(50) | NOT NULL | Terms version |
| `privacy_version` | VARCHAR(50) | NOT NULL | Privacy version |
| `accepted_at` | TIMESTAMP | DEFAULT NOW() | Acceptance date |
| `ip_address` | VARCHAR(50) | NULLABLE | IP address |

---

## Data Flow Diagrams

### Product Scan → Database Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Scans   │────►│ Identify     │────►│ Check Local  │
│ Barcode/Photo│     │ Product      │     │ Database     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                              ┌───────────────────┴───────────────────┐
                              │                                       │
                         FOUND                                   NOT FOUND
                              │                                       │
                              ▼                                       ▼
                     ┌──────────────┐                        ┌──────────────┐
                     │ Use Existing │                        │ Fetch from   │
                     │ Product ID   │                        │ External API │
                     └──────┬───────┘                        └──────┬───────┘
                            │                                       │
                            │                                       ▼
                            │                               ┌──────────────┐
                            │                               │ AUTO-SAVE    │
                            │                               │ to Products  │
                            │                               └──────┬───────┘
                            │                                      │
                            └──────────────────┬───────────────────┘
                                               │
                                               ▼
                                      ┌──────────────┐
                                      │ Add to User's│
                                      │ Shelf        │
                                      └──────────────┘
```

---

## Database Migrations

Migrations are stored in `backend/migrations/` and run via:

```bash
python scripts/run_migrations.py
```

### Migration Files:
- `sprint0_database_integration.py` - Core tables
- `sprint3_digital_twin.py` - Skin snapshots
- `sprint4_routines_tracking.py` - Routine management
- `2026_01_18_user_products.py` - User product shelf
- `2026_01_18_external_models.py` - External ML models

---

## Connection Details

| Environment | Host | Database |
|-------------|------|----------|
| Production | Railway PostgreSQL | `railway` |
| Staging | Railway PostgreSQL | `railway` (shared) |
| Local | localhost:5432 | `pellicura_dev` |

**Connection String Format:**
```
postgresql://user:password@host:port/database
```

---

## Backup & Recovery

- **Automated Backups:** Railway provides daily backups
- **Retention:** 7 days
- **Recovery:** Via Railway dashboard

---

## Performance Indexes

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| users | ix_users_email | email | Login lookup |
| users | ix_users_public_id | public_id | API access |
| products | ix_products_upc | upc | Barcode lookup |
| products | ix_products_brand | brand | Brand search |
| products | ix_products_name | name | Name search |
| shelf_products | ix_shelf_user | user_id | User's shelf |
| ingredients | ix_ingredients_inci | name_inci | Ingredient lookup |

---

**Document Maintained By:** AI Skincare Intelligence System Team  
**Next Review:** 2026-02-28
