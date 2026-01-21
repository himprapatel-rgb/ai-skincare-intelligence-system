#!/usr/bin/env python3
"""Run database migrations"""
import os

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

def column_exists(cur, table_name, column_name):
    cur.execute(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        (table_name, column_name),
    )
    return cur.fetchone() is not None


def run_migrations():
    """Run all pending migrations"""
    print("=" * 80)
    print("Running Database Migrations")
    print("=" * 80)
    
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    
    try:
        print("\n[1/1] Running sprint0_database_integration migration...")
        
        with conn.cursor() as cur:
            # Ensure UUID generation is available
            cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

            # Create minimal tables if they do not exist (non-destructive)
            print("  - Ensuring core tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id UUID DEFAULT gen_random_uuid()
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS ingredients (
                    id UUID DEFAULT gen_random_uuid()
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_ingredients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID,
                    ingredient_id UUID,
                    position INTEGER NOT NULL,
                    concentration_percent DOUBLE PRECISION,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )

            print("  - Aligning products table schema...")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS id UUID")
            cur.execute("ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid()")
            if column_exists(cur, "products", "product_id"):
                cur.execute(
                    "UPDATE products SET id = COALESCE(id, product_id) WHERE id IS NULL"
                )
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(200)")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(300)")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS upc VARCHAR(50)")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS size_ml DOUBLE PRECISION")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_concerns JSONB")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_types JSONB")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS suitable_for VARCHAR[]")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS targets VARCHAR[]")
            cur.execute(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_fragrance_free INTEGER DEFAULT 0"
            )
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_vegan INTEGER DEFAULT 0")
            cur.execute(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_cruelty_free INTEGER DEFAULT 0"
            )
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DOUBLE PRECISION")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd DOUBLE PRECISION")
            cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(500)")
            cur.execute(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()"
            )
            cur.execute(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"
            )

            print("  - Aligning ingredients table schema...")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS id UUID")
            cur.execute("ALTER TABLE ingredients ALTER COLUMN id SET DEFAULT gen_random_uuid()")
            if column_exists(cur, "ingredients", "ingredient_id"):
                cur.execute(
                    "UPDATE ingredients SET id = COALESCE(id, ingredient_id) WHERE id IS NULL"
                )
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS name_inci VARCHAR(255)")
            if column_exists(cur, "ingredients", "inci_name"):
                cur.execute(
                    "UPDATE ingredients SET name_inci = inci_name WHERE name_inci IS NULL"
                )
            cur.execute(
                "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS common_names JSONB DEFAULT '[]'::jsonb"
            )
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category VARCHAR(100)")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS function TEXT")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS safety_category VARCHAR(50)")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS safety_rating INTEGER")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS comedogenic_rating INTEGER")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS microbiome_impact VARCHAR(50)")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS is_antimicrobial INTEGER DEFAULT 0")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS fda_approved INTEGER DEFAULT 0")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS eu_approved INTEGER DEFAULT 0")
            cur.execute(
                "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS data_sources JSONB"
            )
            cur.execute(
                "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()"
            )
            cur.execute(
                "ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"
            )

            # Add supporting indexes without breaking existing schemas
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_products_brand_name "
                "ON products (brand, name)"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_ingredients_name_inci "
                "ON ingredients (name_inci)"
            )

            print("  - Ensuring scan output tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_outputs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id),
                    raw_result JSONB,
                    normalized_result JSONB,
                    model_name VARCHAR(50),
                    model_version VARCHAR(50),
                    confidence_score DOUBLE PRECISION,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_scan_outputs_session "
                "ON scan_outputs (scan_session_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS skin_conditions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    category VARCHAR(100),
                    description TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_conditions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id),
                    condition_id UUID NOT NULL REFERENCES skin_conditions(id),
                    severity_label VARCHAR(20),
                    severity_score DOUBLE PRECISION,
                    confidence DOUBLE PRECISION,
                    affected_regions JSONB,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_scan_conditions_session "
                "ON scan_conditions (scan_session_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_recommendations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id),
                    recommendation_type VARCHAR(50) NOT NULL,
                    payload JSONB,
                    confidence DOUBLE PRECISION,
                    source VARCHAR(50),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_scan_recommendations_session "
                "ON scan_recommendations (scan_session_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_recommendations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    scan_session_id UUID NOT NULL REFERENCES scan_sessions(id),
                    product_id UUID REFERENCES products(id),
                    reason TEXT,
                    match_score DOUBLE PRECISION,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_product_recommendations_session "
                "ON product_recommendations (scan_session_id)"
            )

            print("  - Ensuring geo + environmental tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS geo_locations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    city VARCHAR(100),
                    region VARCHAR(100),
                    country VARCHAR(100),
                    timezone VARCHAR(50),
                    source VARCHAR(50),
                    collected_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_geo_locations_user "
                "ON geo_locations (user_id)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS environmental_readings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    location_id UUID NOT NULL REFERENCES geo_locations(id),
                    uv_index DOUBLE PRECISION,
                    temperature_celsius DOUBLE PRECISION,
                    humidity_percent DOUBLE PRECISION,
                    air_quality_index INTEGER,
                    pollen_index INTEGER,
                    weather_conditions VARCHAR(100),
                    raw_payload JSONB,
                    source VARCHAR(50),
                    recorded_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_environmental_readings_location "
                "ON environmental_readings (location_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_skin_guidance (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    guidance_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    summary TEXT,
                    uv_alert TEXT,
                    hydration_tip TEXT,
                    sunscreen_tip TEXT,
                    routine_tip TEXT,
                    reasoning JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_daily_skin_guidance_user "
                "ON daily_skin_guidance (user_id, guidance_date)"
            )

            print("  - Ensuring store availability tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS stores (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    chain VARCHAR(100),
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    address TEXT,
                    city VARCHAR(100),
                    region VARCHAR(100),
                    postal_code VARCHAR(20),
                    country VARCHAR(100),
                    phone VARCHAR(50),
                    website VARCHAR(255),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_store_availability (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES products(id),
                    store_id UUID NOT NULL REFERENCES stores(id),
                    price DOUBLE PRECISION,
                    currency VARCHAR(10),
                    in_stock BOOLEAN DEFAULT true,
                    purchase_url VARCHAR(500),
                    last_checked_at TIMESTAMPTZ
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_store_availability_product "
                "ON product_store_availability (product_id)"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_store_availability_store "
                "ON product_store_availability (store_id)"
            )

            print("  - Ensuring analytics tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS user_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER REFERENCES users(id),
                    event_type VARCHAR(100) NOT NULL,
                    metadata JSONB,
                    ip_address VARCHAR(50),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_events_user "
                "ON user_events (user_id)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS user_progress_snapshots (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
                    overall_score DOUBLE PRECISION,
                    hydration DOUBLE PRECISION,
                    acne DOUBLE PRECISION,
                    redness DOUBLE PRECISION,
                    wrinkles DOUBLE PRECISION,
                    pigmentation DOUBLE PRECISION,
                    metadata JSONB
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_progress_snapshots_user "
                "ON user_progress_snapshots (user_id, snapshot_date)"
            )
            
        conn.commit()
        print("  ✓ Migration completed successfully!")
        
        print("\n" + "=" * 80)
        print("✅ All migrations completed successfully")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
