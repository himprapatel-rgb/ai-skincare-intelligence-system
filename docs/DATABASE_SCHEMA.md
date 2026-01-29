# Database Schema Documentation

> Complete database schema for the AI Skincare Intelligence System

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Feature Tables](#feature-tables)
5. [Indexes](#indexes)
6. [Migrations](#migrations)

---

## Overview

The application uses **PostgreSQL 14+** as the primary database with **SQLAlchemy** as the ORM.

### Database Connection

```
postgresql://user:password@host:5432/database_name
```

### Schema Conventions

- **Table names**: lowercase, plural, snake_case (`users`, `skin_state_snapshots`)
- **Column names**: lowercase, snake_case (`created_at`, `user_id`)
- **Primary keys**: `id` (auto-incrementing integer)
- **Foreign keys**: `{table_singular}_id` (`user_id`, `scan_id`)
- **Timestamps**: `created_at`, `updated_at` (UTC)
- **Soft deletes**: `deleted_at` (nullable timestamp)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │      users      │                                                        │
│  ├─────────────────┤                                                        │
│  │ id (PK)         │──┬──────────────────────────────────────────────────┐  │
│  │ public_id       │  │                                                  │  │
│  │ email (unique)  │  │                                                  │  │
│  │ hashed_password │  │                                                  │  │
│  │ full_name       │  │                                                  │  │
│  │ is_verified     │  │                                                  │  │
│  │ is_admin        │  │                                                  │  │
│  │ is_active       │  │                                                  │  │
│  │ created_at      │  │                                                  │  │
│  └─────────────────┘  │                                                  │  │
│                       │                                                  │  │
├───────────────────────┼──────────────────────────────────────────────────┼──┤
│                       │          ANALYSIS DOMAIN                         │  │
│                       │                                                  │  │
│  ┌─────────────────┐  │  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │      scans      │◄─┘  │  scan_results   │  │ skin_state_     │       │  │
│  ├─────────────────┤     ├─────────────────┤  │ snapshots       │       │  │
│  │ id (PK)         │◄────│ scan_id (FK)    │  ├─────────────────┤       │  │
│  │ user_id (FK)    │     │ id (PK)         │  │ id (PK)         │       │  │
│  │ image_path      │     │ analysis_json   │  │ user_id (FK)    │◄──────┘  │
│  │ status          │     │ concerns        │  │ hydration_level │          │
│  │ created_at      │     │ recommendations │  │ oil_level       │          │
│  └─────────────────┘     └─────────────────┘  │ acne_severity   │          │
│                                               │ skin_mood       │          │
│                                               │ overall_score   │          │
│                                               │ created_at      │          │
│                                               └─────────────────┘          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                            ROUTINE DOMAIN                                    │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐                                │
│  │ saved_routines  │     │routine_products │                                │
│  ├─────────────────┤     ├─────────────────┤                                │
│  │ id (PK)         │◄────│ routine_id (FK) │                                │
│  │ user_id (FK)    │     │ product_id (FK) │───►┌─────────────────┐        │
│  │ name            │     │ step_order      │    │    products     │        │
│  │ time_of_day     │     └─────────────────┘    ├─────────────────┤        │
│  │ products (JSON) │                            │ id (PK)         │        │
│  │ reminder_enabled│                            │ name            │        │
│  │ reminder_time   │                            │ brand           │        │
│  │ created_at      │                            │ category        │        │
│  └─────────────────┘                            │ ingredients     │        │
│                                                 │ rating          │        │
│                                                 └─────────────────┘        │
│                                                          │                  │
├──────────────────────────────────────────────────────────┼──────────────────┤
│                         PRODUCT DOMAIN                   │                  │
│                                                          │                  │
│  ┌─────────────────┐     ┌─────────────────┐            │                  │
│  │   ingredients   │◄────│product_ingred.  │────────────┘                  │
│  ├─────────────────┤     ├─────────────────┤                               │
│  │ id (PK)         │     │ product_id (FK) │                               │
│  │ name            │     │ ingredient_id   │                               │
│  │ category        │     │ concentration   │                               │
│  │ benefits        │     └─────────────────┘                               │
│  │ concerns        │                                                        │
│  │ comedogenic_    │                                                        │
│  │ rating          │                                                        │
│  └─────────────────┘                                                        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                         USER ENGAGEMENT                                      │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   favorites     │  │ shelf_products  │  │  notifications  │             │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤             │
│  │ id (PK)         │  │ id (PK)         │  │ id (PK)         │             │
│  │ user_id (FK)    │  │ user_id (FK)    │  │ user_id (FK)    │             │
│  │ product_id (FK) │  │ product_id (FK) │  │ type            │             │
│  │ created_at      │  │ status          │  │ title           │             │
│  └─────────────────┘  │ notes           │  │ message         │             │
│                       │ added_date      │  │ read            │             │
│                       └─────────────────┘  │ created_at      │             │
│                                            └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │   skin_goals    │  │ progress_photos │                                   │
│  ├─────────────────┤  ├─────────────────┤                                   │
│  │ id (PK)         │  │ id (PK)         │                                   │
│  │ user_id (FK)    │  │ user_id (FK)    │                                   │
│  │ goal_type       │  │ image_path      │                                   │
│  │ target_value    │  │ notes           │                                   │
│  │ current_value   │  │ created_at      │                                   │
│  │ deadline        │  └─────────────────┘                                   │
│  └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### users

Primary user account table.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    public_id VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_public_id ON users(public_id);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | No | auto | Primary key |
| public_id | VARCHAR(36) | No | uuid | Public identifier (exposed in API) |
| email | VARCHAR(255) | No | - | User email (unique) |
| hashed_password | VARCHAR(255) | No | - | Argon2 hashed password |
| full_name | VARCHAR(255) | Yes | NULL | Display name |
| is_active | BOOLEAN | No | TRUE | Account active status |
| is_verified | BOOLEAN | No | FALSE | Email verified |
| is_admin | BOOLEAN | No | FALSE | Admin privileges |
| created_at | TIMESTAMP | No | NOW | Registration date |
| updated_at | TIMESTAMP | No | NOW | Last update |

### scans

Skin analysis scan records.

```sql
CREATE TABLE scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    image_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | No | auto | Primary key |
| user_id | INTEGER | No | - | FK to users |
| image_path | VARCHAR(500) | Yes | NULL | Path to uploaded image |
| status | VARCHAR(50) | No | 'pending' | pending/processing/completed/failed |
| created_at | TIMESTAMP | No | NOW | Scan date |

### scan_results

AI analysis results for scans.

```sql
CREATE TABLE scan_results (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    analysis_json JSONB,
    overall_score DECIMAL(5,2),
    concerns JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
```

| Column | Type | Description |
|--------|------|-------------|
| analysis_json | JSONB | Full AI analysis response |
| overall_score | DECIMAL | 0-100 skin health score |
| concerns | JSONB | Detected concerns with severity |
| recommendations | JSONB | AI-generated recommendations |

---

## Feature Tables

### skin_state_snapshots

Digital twin timeline data.

```sql
CREATE TABLE skin_state_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scan_id INTEGER REFERENCES scans(id),
    hydration_level DECIMAL(5,2),
    oil_level DECIMAL(5,2),
    acne_severity DECIMAL(5,2),
    wrinkle_severity DECIMAL(5,2),
    pigmentation_severity DECIMAL(5,2),
    redness_severity DECIMAL(5,2),
    sensitivity_level DECIMAL(5,2),
    skin_mood VARCHAR(50),
    overall_score DECIMAL(5,2),
    meta JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_user_id ON skin_state_snapshots(user_id);
CREATE INDEX idx_snapshots_created_at ON skin_state_snapshots(created_at DESC);
```

### saved_routines

User-created skincare routines.

```sql
CREATE TABLE saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    time_of_day VARCHAR(20), -- 'morning' or 'evening'
    products JSONB, -- Array of product objects
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_time VARCHAR(5), -- 'HH:MM' format
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routines_user_id ON saved_routines(user_id);
```

### products

Product catalog.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    ingredients TEXT[], -- Array of ingredient names
    key_ingredients TEXT[],
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    price VARCHAR(50),
    image_url VARCHAR(500),
    suitable_for TEXT[], -- Skin types
    concerns TEXT[], -- Addressed concerns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
```

### ingredients

Ingredient database.

```sql
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    inci_name VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    benefits TEXT[],
    concerns TEXT[], -- What it helps with
    comedogenic_rating INTEGER, -- 0-5
    irritancy_rating INTEGER, -- 0-5
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
```

### notifications

In-app notifications.

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'reminder', 'milestone', 'scan_complete', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
```

### favorites

User product favorites.

```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

### shelf_products

User's product shelf (owned products).

```sql
CREATE TABLE shelf_products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    external_product_id VARCHAR(255),        -- Barcode or external ID
    product_name VARCHAR(255) NOT NULL,      -- Product name
    product_brand VARCHAR(255),              -- Brand name
    product_category VARCHAR(100),           -- cleanser, moisturizer, serum, etc.
    product_image VARCHAR(500),              -- Product image URL
    status VARCHAR(50) DEFAULT 'active',     -- 'active', 'wishlist', 'discontinued', 'finished'
    rating FLOAT,                            -- User's rating (1-5)
    notes TEXT,                              -- User's notes
    routine_type VARCHAR(20),                -- 'am', 'pm', 'both'
    routine_order INTEGER,                   -- Order in routine
    purchase_date TIMESTAMP,                 -- When purchased
    expiry_date TIMESTAMP,                   -- Product expiration
    purchase_price FLOAT,                    -- Purchase price
    would_repurchase BOOLEAN,                -- Would repurchase? 
    times_repurchased INTEGER DEFAULT 0,     -- Repurchase count
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_shelf_user_id ON shelf_products(user_id);
CREATE INDEX idx_shelf_external_id ON shelf_products(external_product_id);
```

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | FK to users |
| external_product_id | VARCHAR | Barcode/external ID for lookups |
| product_name | VARCHAR | Product display name |
| product_brand | VARCHAR | Brand name |
| product_category | VARCHAR | Product category |
| product_image | VARCHAR | Clean product image URL |
| status | VARCHAR | active/wishlist/discontinued/finished |
| rating | FLOAT | User's 1-5 star rating |
| notes | TEXT | User notes (can include ingredients) |
| expiry_date | TIMESTAMP | Expiration with reminder support |
| would_repurchase | BOOLEAN | Repurchase intention toggle |
| times_repurchased | INTEGER | Track repurchase count |

### skin_goals

User skincare goals.

```sql
CREATE TABLE skin_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(100) NOT NULL, -- 'hydration', 'acne', 'wrinkles', etc.
    target_value DECIMAL(5,2),
    current_value DECIMAL(5,2),
    deadline DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_user_id ON skin_goals(user_id);
```

### consent_records

GDPR consent tracking.

```sql
CREATE TABLE consent_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    consented BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_user_id ON consent_records(user_id);
```

---

## Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_public_id ON users(public_id);

-- Scan queries
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- Timeline queries
CREATE INDEX idx_snapshots_user_created ON skin_state_snapshots(user_id, created_at DESC);

-- Notification queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
```

---

## Migrations

### Running Migrations

```bash
cd backend
python scripts/run_migrations.py
```

### Migration Script Structure

```python
# scripts/run_migrations.py
def run_migrations():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Create users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            ...
        )
    """)
    
    # Add new columns (safe for existing data)
    cur.execute("""
        ALTER TABLE saved_routines
        ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE
    """)
    
    conn.commit()
    cur.close()
    conn.close()
```

### Adding New Tables

1. Add CREATE TABLE statement to migration script
2. Add SQLAlchemy model in `app/models/`
3. Run migration: `python scripts/run_migrations.py`

### Adding New Columns

```sql
-- Safe column addition (won't fail if exists)
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS column_name data_type DEFAULT default_value;
```

---

## Application Services (Non-Database)

### Ingredient Safety Database

The application includes a **runtime ingredient safety database** (not stored in PostgreSQL) with 50+ harmful ingredients:

**Location:** `backend/app/services/ingredient_safety.py`

**Structure:**
```python
HARMFUL_INGREDIENTS_DB = {
    "ingredient_key": HarmfulIngredient(
        name="Display Name",
        aliases=["alias1", "alias2"],
        severity=Severity.HIGH | MODERATE | LOW,
        categories=[ConcernCategory.IRRITANT, ...],
        reason="Why it's flagged",
        alternatives=["Safer alternatives"],
        avoid_if=["Conditions to avoid"]
    )
}
```

**Categories:**
- `IRRITANT` - Can irritate skin
- `ALLERGEN` - Common allergen
- `CARCINOGEN` - Cancer concerns
- `ENDOCRINE_DISRUPTOR` - Hormone concerns
- `ENVIRONMENTAL_TOXIN` - Environmental harm
- `PREGNANCY_UNSAFE` - Avoid during pregnancy
- `SENSITIZER` - Can cause sensitization
- `COMEDOGENIC` - Can clog pores
- `DRYING` - Can dry out skin

**Severity Levels:**
- `HIGH` - Avoid if possible
- `MODERATE` - Use with caution
- `LOW` - Generally safe but may cause issues for some

---

*Last updated: January 29, 2026*
