"""
Migration: Create Product Catalog Database Tables
Created: 2026-01-29

This migration creates the in-house product catalog infrastructure:
- catalog_products: Master product table with pre-computed data
- catalog_ingredients: Master ingredient database
- catalog_product_ingredients: Product-ingredient links
- catalog_product_images: Multiple images per product
- catalog_brands: Brand information
- catalog_import_jobs: Import tracking
"""

import logging
import os

import psycopg2

logger = logging.getLogger(__name__)


def get_connection():
    """Get database connection from environment."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    return psycopg2.connect(database_url)


def run_migration():
    """Run the catalog database migration."""
    logger.info("Starting Product Catalog Database migration...")
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # Ensure UUID generation is available
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        
        # ============================================
        # CATALOG PRODUCTS
        # ============================================
        logger.info("Creating catalog_products table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS catalog_products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Identifiers
                barcode VARCHAR(50) UNIQUE,
                barcode_type VARCHAR(20),
                
                -- Basic info
                name VARCHAR(300) NOT NULL,
                brand VARCHAR(200) NOT NULL,
                category VARCHAR(100) NOT NULL,
                subcategory VARCHAR(100),
                
                -- Product details
                description TEXT,
                size_ml FLOAT,
                size_unit VARCHAR(20),
                price_usd FLOAT,
                price_range VARCHAR(20),
                
                -- Images
                image_front_url VARCHAR(500),
                image_back_url VARCHAR(500),
                image_ingredients_url VARCHAR(500),
                thumbnail_url VARCHAR(500),
                images_source VARCHAR(50),
                
                -- Pre-computed safety
                safety_score INTEGER,
                safety_summary TEXT,
                flagged_ingredients JSONB,
                pregnancy_safe BOOLEAN,
                sensitive_skin_safe BOOLEAN,
                
                -- Skin compatibility
                suitable_skin_types VARCHAR[],
                targets_concerns VARCHAR[],
                
                -- Attributes
                is_fragrance_free BOOLEAN DEFAULT FALSE,
                is_vegan BOOLEAN DEFAULT FALSE,
                is_cruelty_free BOOLEAN DEFAULT FALSE,
                is_organic BOOLEAN DEFAULT FALSE,
                is_clean_beauty BOOLEAN DEFAULT FALSE,
                
                -- Ingredients text
                ingredients_text TEXT,
                key_ingredients JSONB,
                
                -- Data quality
                is_verified BOOLEAN DEFAULT FALSE,
                data_quality_score INTEGER,
                source VARCHAR(50) NOT NULL,
                source_id VARCHAR(255),
                
                -- Stats
                view_count INTEGER DEFAULT 0,
                scan_count INTEGER DEFAULT 0,
                last_scanned_at TIMESTAMPTZ,
                
                -- Metadata
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)
        
        # Indexes for catalog_products
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_barcode ON catalog_products(barcode);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_name ON catalog_products(name);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_brand ON catalog_products(brand);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_brand_name ON catalog_products(brand, name);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(category);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_products_source ON catalog_products(source);")
        
        # Full-text search index
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_catalog_products_search 
            ON catalog_products USING gin(to_tsvector('english', name || ' ' || brand || ' ' || COALESCE(description, '')));
        """)
        
        # ============================================
        # CATALOG INGREDIENTS
        # ============================================
        logger.info("Creating catalog_ingredients table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS catalog_ingredients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Identification
                inci_name VARCHAR(255) NOT NULL UNIQUE,
                common_names JSONB DEFAULT '[]'::jsonb,
                
                -- Classification
                category VARCHAR(100),
                function TEXT,
                
                -- Safety data
                ewg_score INTEGER,
                comedogenic_rating INTEGER,
                irritancy_rating INTEGER,
                
                -- Safety flags
                is_harmful BOOLEAN DEFAULT FALSE,
                harm_severity VARCHAR(20),
                harm_categories VARCHAR[],
                harm_reason TEXT,
                harm_alternatives VARCHAR[],
                avoid_if VARCHAR[],
                
                -- Regulatory
                fda_approved BOOLEAN,
                eu_approved BOOLEAN,
                banned_countries VARCHAR[],
                max_concentration_percent FLOAT,
                
                -- Benefits
                benefits VARCHAR[],
                targets_concerns VARCHAR[],
                
                -- Metadata
                data_sources JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_inci ON catalog_ingredients(inci_name);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_harmful ON catalog_ingredients(is_harmful) WHERE is_harmful = TRUE;")
        
        # ============================================
        # CATALOG PRODUCT INGREDIENTS
        # ============================================
        logger.info("Creating catalog_product_ingredients table...")
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
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_prod_ing_product ON catalog_product_ingredients(product_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_prod_ing_ingredient ON catalog_product_ingredients(ingredient_id);")
        
        # ============================================
        # CATALOG PRODUCT IMAGES
        # ============================================
        logger.info("Creating catalog_product_images table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS catalog_product_images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
                
                image_url VARCHAR(500) NOT NULL,
                thumbnail_url VARCHAR(500),
                image_type VARCHAR(50) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                
                -- Image quality
                width INTEGER,
                height INTEGER,
                file_size_kb INTEGER,
                quality_score INTEGER,
                has_white_background BOOLEAN,
                
                -- Source
                source VARCHAR(50),
                source_url VARCHAR(500),
                
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_images_product ON catalog_product_images(product_id);")
        
        # ============================================
        # CATALOG BRANDS
        # ============================================
        logger.info("Creating catalog_brands table...")
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
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_brands_name ON catalog_brands(name);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_catalog_brands_slug ON catalog_brands(slug);")
        
        # ============================================
        # CATALOG IMPORT JOBS
        # ============================================
        logger.info("Creating catalog_import_jobs table...")
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
            );
        """)
        
        conn.commit()
        logger.info("Product Catalog Database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration()
