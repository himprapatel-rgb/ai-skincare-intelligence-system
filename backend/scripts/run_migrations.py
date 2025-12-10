#!/usr/bin/env python3
"""Run database migrations"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import psycopg2
from migrations.sprint0_database_integration import upgrade, downgrade

DATABASE_URL = os.getenv('DATABASE_URL')

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
        
        # Execute the upgrade function
        # Note: This is a simplified runner. In production, use Alembic properly.
        # For now, we'll execute the SQL directly
        
        with conn.cursor() as cur:
            # Drop existing tables if they exist (to recreate with proper schema)
            print("  - Dropping existing tables...")
            cur.execute("DROP TABLE IF EXISTS ingredient_hazards CASCADE")
            cur.execute("DROP TABLE IF EXISTS ingredients CASCADE")
            cur.execute("DROP TABLE IF EXISTS products CASCADE")
            
            print("  - Creating tables with proper schema...")
            
            # Now run the migration's upgrade function
            # Since we can't directly call upgrade() without Alembic context,
            # we'll execute the SQL manually based on the migration
            
            # Create products table
            cur.execute("""
                CREATE TABLE products (
                    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    barcode VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(500),
                    brand VARCHAR(255),
                    ingredients_text TEXT,
                    categories TEXT,
                    image_url TEXT,
                    microbiome_risk_flag BOOLEAN DEFAULT false,
                    comedogenicity_score INTEGER,
                    source VARCHAR(50) DEFAULT 'cosing',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create ingredients table
            cur.execute("""
                CREATE TABLE ingredients (
                    ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    inci_name VARCHAR(500) UNIQUE NOT NULL,
                    cas_number VARCHAR(50),
                    ec_number VARCHAR(50),
                    function VARCHAR(255),
                    regulatory_status VARCHAR(100),
                    restrictions TEXT,
                    microbiome_risk_flag BOOLEAN DEFAULT false,
                    comedogenicity_score INTEGER,
                    source VARCHAR(50) DEFAULT 'cosing',
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            # Create case-insensitive index on inci_name
            cur.execute("""
                CREATE INDEX idx_ingredients_inci_name_lower 
                ON ingredients (LOWER(inci_name))
            """)
            
            # Create check constraint for comedogenicity score
            cur.execute("""
                ALTER TABLE ingredients 
                ADD CONSTRAINT ck_comedogenicity_score 
                CHECK (comedogenicity_score >= 0 AND comedogenicity_score <= 5)
            """)
            
            # Create ingredient_hazards table
            cur.execute("""
                CREATE TABLE ingredient_hazards (
                    hazard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    ingredient_id UUID REFERENCES ingredients(ingredient_id),
                    cas_number VARCHAR(50),
                    hazard_type VARCHAR(100),
                    regulatory_body VARCHAR(50) DEFAULT 'california_cscp',
                    evidence_level VARCHAR(50),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
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
