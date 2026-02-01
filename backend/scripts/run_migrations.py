#!/usr/bin/env python3
"""Run database migrations"""
import os

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
ENV = os.getenv("ENV", "development").lower()
RUN_MIGRATIONS = os.getenv("RUN_MIGRATIONS", "").lower() in {"1", "true", "yes"}
ALLOW_PROD_MIGRATIONS = os.getenv("ALLOW_PROD_MIGRATIONS", "").lower() in {"1", "true", "yes"}

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
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set.")
    if not RUN_MIGRATIONS:
        raise RuntimeError(
            "Refusing to run migrations without RUN_MIGRATIONS=true."
        )
    if ENV == "production" and not ALLOW_PROD_MIGRATIONS:
        raise RuntimeError(
            "Refusing to run migrations in production without ALLOW_PROD_MIGRATIONS=true."
        )

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

            # Guard against missing core tables for foreign keys
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN (
                    'users',
                    'scan_sessions',
                    'routine_instances'
                  )
                """
            )
            existing = {row[0] for row in cur.fetchall()}
            missing = {"users", "scan_sessions", "routine_instances"} - existing
            if missing:
                raise RuntimeError(
                    f"Missing core tables required for FK constraints: {sorted(missing)}"
                )

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
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255)
                """
            )
            cur.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ
                """
            )
            cur.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ
                """
            )
            cur.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
                """
            )
            
            # Add reminder columns to saved_routines
            print("  - Adding reminder columns to saved_routines...")
            cur.execute(
                """
                ALTER TABLE saved_routines
                ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE
                """
            )
            cur.execute(
                """
                ALTER TABLE saved_routines
                ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(5)
                """
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS ingredients (
                    id UUID DEFAULT gen_random_uuid()
                )
                """
            )

            # Favorites (non-destructive)
            # NOTE: products.id is UUID in our schema; do NOT create product_id as INTEGER
            print("  - Ensuring favorites tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS user_favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    product_id UUID REFERENCES products(id),
                    external_product_id VARCHAR(255),
                    product_name VARCHAR(255) NOT NULL,
                    product_brand VARCHAR(255),
                    product_price DOUBLE PRECISION,
                    product_image VARCHAR(500),
                    product_rating DOUBLE PRECISION,
                    match_score DOUBLE PRECISION,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites (user_id)"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON user_favorites (product_id)"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_favorites_external_product_id ON user_favorites (external_product_id)"
            )

            # If a legacy/incorrect schema exists (e.g. product_id INTEGER), coerce to UUID safely.
            # This is intentionally lossy for product_id because integer->uuid is not representable.
            cur.execute(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'user_favorites'
                          AND column_name = 'product_id'
                          AND data_type = 'integer'
                    ) THEN
                        BEGIN
                            ALTER TABLE user_favorites
                                DROP CONSTRAINT IF EXISTS user_favorites_product_id_fkey;
                        EXCEPTION WHEN undefined_object THEN
                            NULL;
                        END;

                        ALTER TABLE user_favorites
                            ALTER COLUMN product_id TYPE UUID
                            USING (NULL::uuid);

                        ALTER TABLE user_favorites
                            ADD CONSTRAINT user_favorites_product_id_fkey
                            FOREIGN KEY (product_id) REFERENCES products(id);
                    END IF;
                END $$;
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
            cur.execute("UPDATE products SET id = gen_random_uuid() WHERE id IS NULL")
            cur.execute("ALTER TABLE products ALTER COLUMN id SET NOT NULL")
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
            cur.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.table_constraints
                        WHERE table_name = 'products'
                          AND constraint_type = 'PRIMARY KEY'
                    ) THEN
                        ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
                    END IF;
                END $$;
                """
            )

            print("  - Aligning ingredients table schema...")
            cur.execute("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS id UUID")
            cur.execute("ALTER TABLE ingredients ALTER COLUMN id SET DEFAULT gen_random_uuid()")
            if column_exists(cur, "ingredients", "ingredient_id"):
                cur.execute(
                    "UPDATE ingredients SET id = COALESCE(id, ingredient_id) WHERE id IS NULL"
                )
            cur.execute("UPDATE ingredients SET id = gen_random_uuid() WHERE id IS NULL")
            cur.execute("ALTER TABLE ingredients ALTER COLUMN id SET NOT NULL")
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
            cur.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.table_constraints
                        WHERE table_name = 'ingredients'
                          AND constraint_type = 'PRIMARY KEY'
                    ) THEN
                        ALTER TABLE ingredients ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);
                    END IF;
                END $$;
                """
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

            print("  - Ensuring product scan + notification tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_scan_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER REFERENCES users(id),
                    status VARCHAR(30) NOT NULL DEFAULT 'pending',
                    image_data BYTEA,
                    image_content_type VARCHAR(100),
                    image_filename VARCHAR(255),
                    image_hash VARCHAR(64),
                    image_url VARCHAR(500),
                    scan_metadata JSONB,
                    result JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_product_scan_sessions_user "
                "ON product_scan_sessions (user_id)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_scan_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    scan_session_id UUID NOT NULL REFERENCES product_scan_sessions(id),
                    product_id UUID REFERENCES products(id),
                    matched_name VARCHAR(300),
                    match_confidence DOUBLE PRECISION,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_product_scan_items_session "
                "ON product_scan_items (scan_session_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS routine_recommendations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    scan_session_id UUID REFERENCES scan_sessions(id),
                    product_scan_id UUID REFERENCES product_scan_sessions(id),
                    payload JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_routine_recommendations_user "
                "ON routine_recommendations (user_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS routine_checkins (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    routine_instance_id UUID REFERENCES routine_instances(id),
                    status VARCHAR(20) NOT NULL DEFAULT 'completed',
                    notes TEXT,
                    checked_in_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_routine_checkins_user "
                "ON routine_checkins (user_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS user_notifications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    notification_type VARCHAR(50) NOT NULL,
                    title VARCHAR(200),
                    body TEXT,
                    channel VARCHAR(20),
                    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
                    scheduled_for TIMESTAMPTZ,
                    timezone VARCHAR(50),
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    sent_at TIMESTAMPTZ,
                    acknowledged_at TIMESTAMPTZ
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_user_notifications_user "
                "ON user_notifications (user_id)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS notification_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    notification_id UUID NOT NULL REFERENCES user_notifications(id),
                    event_type VARCHAR(30) NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_notification_events_notification "
                "ON notification_events (notification_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS geo_alerts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    location_id UUID REFERENCES geo_locations(id),
                    alert_type VARCHAR(50) NOT NULL,
                    message TEXT,
                    severity VARCHAR(20),
                    uv_index DOUBLE PRECISION,
                    temperature_celsius DOUBLE PRECISION,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_geo_alerts_user "
                "ON geo_alerts (user_id)"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS product_offers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES products(id),
                    store_id UUID REFERENCES stores(id),
                    price DOUBLE PRECISION,
                    currency VARCHAR(10),
                    discount_percent DOUBLE PRECISION,
                    offer_url VARCHAR(500),
                    valid_until TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_product_offers_product "
                "ON product_offers (product_id)"
            )
            
            # Ingredients persistence migration (2026-01-29)
            print("  - Adding ingredients_json to shelf_products...")
            cur.execute(
                """
                ALTER TABLE shelf_products
                ADD COLUMN IF NOT EXISTS ingredients_json JSONB DEFAULT NULL
                """
            )
            
            # Ensure product_ingredients has proper constraints
            print("  - Ensuring product_ingredients constraints...")
            cur.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'uq_product_ingredient'
                    ) THEN
                        ALTER TABLE product_ingredients 
                        ADD CONSTRAINT uq_product_ingredient 
                        UNIQUE (product_id, ingredient_id);
                    END IF;
                EXCEPTION WHEN duplicate_table THEN
                    NULL;
                END $$
                """
            )
            
            # ============================================
            # PRODUCT CATALOG DATABASE (2026-01-29)
            # ============================================
            print("  - Creating Product Catalog tables...")
            
            # catalog_products
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_products (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    barcode VARCHAR(50) UNIQUE,
                    barcode_type VARCHAR(20),
                    name VARCHAR(300) NOT NULL,
                    brand VARCHAR(200) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    subcategory VARCHAR(100),
                    description TEXT,
                    size_ml FLOAT,
                    size_unit VARCHAR(20),
                    price_usd FLOAT,
                    price_range VARCHAR(20),
                    image_front_url VARCHAR(500),
                    image_back_url VARCHAR(500),
                    image_ingredients_url VARCHAR(500),
                    thumbnail_url VARCHAR(500),
                    images_source VARCHAR(50),
                    safety_score INTEGER,
                    safety_summary TEXT,
                    flagged_ingredients JSONB,
                    pregnancy_safe BOOLEAN,
                    sensitive_skin_safe BOOLEAN,
                    suitable_skin_types VARCHAR[],
                    targets_concerns VARCHAR[],
                    is_fragrance_free BOOLEAN DEFAULT FALSE,
                    is_vegan BOOLEAN DEFAULT FALSE,
                    is_cruelty_free BOOLEAN DEFAULT FALSE,
                    is_organic BOOLEAN DEFAULT FALSE,
                    is_clean_beauty BOOLEAN DEFAULT FALSE,
                    ingredients_text TEXT,
                    key_ingredients JSONB,
                    is_verified BOOLEAN DEFAULT FALSE,
                    data_quality_score INTEGER,
                    source VARCHAR(50) NOT NULL,
                    source_id VARCHAR(255),
                    view_count INTEGER DEFAULT 0,
                    scan_count INTEGER DEFAULT 0,
                    last_scanned_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_barcode ON catalog_products(barcode)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_brand_name ON catalog_products(brand, name)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(category)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_source ON catalog_products(source)")
            
            # catalog_ingredients
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_ingredients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    inci_name VARCHAR(255) NOT NULL UNIQUE,
                    common_names JSONB DEFAULT '[]'::jsonb,
                    category VARCHAR(100),
                    function TEXT,
                    ewg_score INTEGER,
                    comedogenic_rating INTEGER,
                    irritancy_rating INTEGER,
                    is_harmful BOOLEAN DEFAULT FALSE,
                    harm_severity VARCHAR(20),
                    harm_categories VARCHAR[],
                    harm_reason TEXT,
                    harm_alternatives VARCHAR[],
                    avoid_if VARCHAR[],
                    fda_approved BOOLEAN,
                    eu_approved BOOLEAN,
                    banned_countries VARCHAR[],
                    max_concentration_percent FLOAT,
                    benefits VARCHAR[],
                    targets_concerns VARCHAR[],
                    data_sources JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_inci ON catalog_ingredients(inci_name)")
            
            # catalog_product_ingredients
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_product_ingredients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
                    ingredient_id UUID NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL,
                    concentration_percent FLOAT,
                    is_key_active BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    CONSTRAINT uq_catalog_product_ingredient UNIQUE (product_id, ingredient_id)
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_prod_ing_product ON catalog_product_ingredients(product_id)")
            
            # catalog_product_images
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_product_images (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
                    image_url VARCHAR(500) NOT NULL,
                    thumbnail_url VARCHAR(500),
                    image_type VARCHAR(50) NOT NULL,
                    is_primary BOOLEAN DEFAULT FALSE,
                    width INTEGER,
                    height INTEGER,
                    file_size_kb INTEGER,
                    quality_score INTEGER,
                    has_white_background BOOLEAN,
                    source VARCHAR(50),
                    source_url VARCHAR(500),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # catalog_brands
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_brands (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL UNIQUE,
                    slug VARCHAR(200) NOT NULL UNIQUE,
                    logo_url VARCHAR(500),
                    website_url VARCHAR(500),
                    is_cruelty_free BOOLEAN,
                    is_vegan BOOLEAN,
                    is_clean_beauty BOOLEAN,
                    is_luxury BOOLEAN,
                    country_of_origin VARCHAR(100),
                    product_count INTEGER DEFAULT 0,
                    average_rating FLOAT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
            """)
            
            # catalog_import_jobs
            cur.execute("""
                CREATE TABLE IF NOT EXISTS catalog_import_jobs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    source VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    total_records INTEGER,
                    processed_records INTEGER DEFAULT 0,
                    imported_records INTEGER DEFAULT 0,
                    skipped_records INTEGER DEFAULT 0,
                    error_records INTEGER DEFAULT 0,
                    started_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ,
                    error_log TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            print("  ✓ Product Catalog tables created")
            # Content tables: blogs, videos, news (admin-managed)
            print("  - Ensuring content tables exist...")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS blogs (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    excerpt TEXT,
                    content TEXT,
                    cover_image_url VARCHAR(500),
                    read_time_min INTEGER DEFAULT 5,
                    published BOOLEAN DEFAULT TRUE,
                    published_at TIMESTAMPTZ,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs (published)"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS videos (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    video_url VARCHAR(500) NOT NULL,
                    thumbnail_url VARCHAR(500),
                    duration_sec INTEGER,
                    difficulty VARCHAR(50) DEFAULT 'Beginner',
                    published BOOLEAN DEFAULT TRUE,
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_videos_published ON videos (published)"
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS news_items (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    body TEXT,
                    link_url VARCHAR(500),
                    is_featured BOOLEAN DEFAULT FALSE,
                    published BOOLEAN DEFAULT TRUE,
                    published_at TIMESTAMPTZ DEFAULT NOW(),
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items (published)"
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
