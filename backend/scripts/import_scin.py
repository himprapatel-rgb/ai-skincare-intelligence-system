"""Import SCIN dataset directly into PostgreSQL.

This script runs on Railway and streams SCIN data in batches
to avoid RAM issues. Downloads from HuggingFace and inserts
into PostgreSQL in chunks.
"""
import os
import sys
import logging
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from datasets import load_dataset
from sqlalchemy import text
from app.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BATCH_SIZE = 100  # Process in small batches to avoid RAM issues

def create_scin_table(db):
    """Create scin_samples table if it doesn't exist."""
    create_table_sql = text("""
        CREATE TABLE IF NOT EXISTS scin_samples (
            id SERIAL PRIMARY KEY,
            case_id VARCHAR(255) UNIQUE,
            source VARCHAR(100),
            year INTEGER,
            age_group VARCHAR(50),
            sex_at_birth VARCHAR(50),
            fitzpatrick_skin_type VARCHAR(50),
            monk_skin_tone_india INTEGER,
            monk_skin_tone_us INTEGER,
            dermatologist_fst_label VARCHAR(50),
            image_1_path TEXT,
            image_1_shot_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    db.execute(create_table_sql)
    db.commit()
    logger.info("✅ Created scin_samples table")

def import_scin_data():
    """Import SCIN dataset in streaming batches."""
    logger.info("🚀 Starting SCIN data import...")
    
    db = SessionLocal()
    try:
        # Create table
        create_scin_table(db)
        
        # Load dataset in streaming mode to avoid loading all into RAM
        logger.info("📥 Loading SCIN dataset from HuggingFace (streaming mode)...")
        dataset = load_dataset("google/scin", split="train", streaming=True)
        
        batch = []
        total_inserted = 0
        total_skipped = 0
        
        for idx, sample in enumerate(dataset):
            # Extract metadata (exclude image data)
            sample_data = {
                'case_id': sample.get('case_id'),
                'source': sample.get('source', 'SCIN'),
                'year': sample.get('year'),
                'age_group': sample.get('age_group'),
                'sex_at_birth': sample.get('sex_at_birth'),
                'fitzpatrick_skin_type': sample.get('fitzpatrick_skin_type'),
                'monk_skin_tone_india': sample.get('monk_skin_tone_label_india'),
                'monk_skin_tone_us': sample.get('monk_skin_tone_label_us'),
                'dermatologist_fst_label': sample.get('dermatologist_fitzpatrick_skin_type_label'),
                'image_1_path': sample.get('image_1_path'),
                'image_1_shot_type': sample.get('image_1_shot_type')
            }
            
            batch.append(sample_data)
            
            # Insert batch when it reaches BATCH_SIZE
            if len(batch) >= BATCH_SIZE:
                inserted, skipped = insert_batch(db, batch)
                total_inserted += inserted
                total_skipped += skipped
                logger.info(f"Progress: {idx+1} samples processed | Inserted: {total_inserted} | Skipped (duplicates): {total_skipped}")
                batch = []
        
        # Insert remaining samples
        if batch:
            inserted, skipped = insert_batch(db, batch)
            total_inserted += inserted
            total_skipped += skipped
        
        logger.info("="*60)
        logger.info(f"✅ SCIN import completed!")
        logger.info(f"📊 Total inserted: {total_inserted}")
        logger.info(f"⏭️  Total skipped: {total_skipped}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Import failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def insert_batch(db, batch):
    """Insert a batch of samples into the database."""
    inserted = 0
    skipped = 0
    
    for sample in batch:
        try:
            # Check if already exists
            existing = db.execute(
                text("SELECT id FROM scin_samples WHERE case_id = :case_id"),
                {"case_id": sample['case_id']}
            ).fetchone()
            
            if not existing:
                db.execute(
                    text("""
                        INSERT INTO scin_samples 
                        (case_id, source, year, age_group, sex_at_birth, 
                         fitzpatrick_skin_type, monk_skin_tone_india, monk_skin_tone_us,
                         dermatologist_fst_label, image_1_path, image_1_shot_type)
                        VALUES (:case_id, :source, :year, :age_group, :sex_at_birth,
                         :fitzpatrick_skin_type, :monk_skin_tone_india, :monk_skin_tone_us,
                         :dermatologist_fst_label, :image_1_path, :image_1_shot_type)
                    """),
                    sample
                )
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            logger.error(f"Error inserting sample {sample.get('case_id')}: {str(e)}")
            continue
    
    db.commit()
    return inserted, skipped

if __name__ == "__main__":
    import_scin_data()
