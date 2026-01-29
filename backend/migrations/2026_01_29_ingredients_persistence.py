"""
Migration: Add ingredients_json to shelf_products and ensure product_ingredients table
Created: 2026-01-29

This migration:
1. Adds ingredients_json column to shelf_products for storing ingredient snapshots
2. Ensures product_ingredients table exists for linking products to ingredients
"""

import logging
import os

import psycopg2
from psycopg2 import sql

logger = logging.getLogger(__name__)


def get_connection():
    """Get database connection from environment."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    return psycopg2.connect(database_url)


def run_migration():
    """Run the ingredients persistence migration."""
    logger.info("Starting ingredients persistence migration...")
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # 1. Add ingredients_json column to shelf_products
        logger.info("Adding ingredients_json column to shelf_products...")
        cur.execute("""
            ALTER TABLE shelf_products
            ADD COLUMN IF NOT EXISTS ingredients_json JSONB DEFAULT NULL;
        """)
        
        # 2. Ensure ingredients table exists (should already exist from product_models)
        logger.info("Ensuring ingredients table exists...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ingredients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name_inci VARCHAR(255) NOT NULL UNIQUE,
                common_names JSONB DEFAULT '[]'::jsonb NOT NULL,
                category VARCHAR(100),
                function TEXT,
                safety_category VARCHAR(50),
                safety_rating INTEGER,
                comedogenic_rating INTEGER,
                microbiome_impact VARCHAR(50),
                is_antimicrobial INTEGER DEFAULT 0 NOT NULL,
                fda_approved INTEGER DEFAULT 0 NOT NULL,
                eu_approved INTEGER DEFAULT 0 NOT NULL,
                data_sources JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        
        # 3. Create index on ingredients name_inci if not exists
        cur.execute("""
            CREATE INDEX IF NOT EXISTS ix_ingredients_name_inci 
            ON ingredients(name_inci);
        """)
        
        # 4. Ensure product_ingredients junction table exists
        logger.info("Ensuring product_ingredients table exists...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS product_ingredients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                concentration_percent FLOAT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """)
        
        # 5. Create indexes on product_ingredients
        cur.execute("""
            CREATE INDEX IF NOT EXISTS ix_product_ingredients_product_id 
            ON product_ingredients(product_id);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS ix_product_ingredients_ingredient_id 
            ON product_ingredients(ingredient_id);
        """)
        
        # 6. Add unique constraint to prevent duplicate product-ingredient links
        cur.execute("""
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
            END $$;
        """)
        
        conn.commit()
        logger.info("Ingredients persistence migration completed successfully!")
        
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
