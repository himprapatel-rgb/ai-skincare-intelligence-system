#!/usr/bin/env python3
"""
SCIN Image Migration to Cloudinary Script

This script:
1. Reads SCIN dataset samples from PostgreSQL database (with HTTP image URLs)
2. Downloads each image from the SCIN URL
3. Uploads images to Cloudinary cloud storage
4. Updates the database image_1_path column with the Cloudinary URL
5. Includes error handling, progress tracking, and retry logic
6. Processes images in batches with resumable state

USAGE:
    pip install -r requirements.txt
    export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"
    export CLOUDINARY_CLOUD_NAME="your_cloud_name"
    export CLOUDINARY_API_KEY="your_api_key"
    export CLOUDINARY_API_SECRET="your_api_secret"
    python migrate_scin_images_to_cloudinary.py

OPTIONAL ENV VARS:
    BATCH_SIZE=100
    MAX_RETRIES=3
    REQUEST_TIMEOUT=30
    DRY_RUN=0
    LIMIT=0  # 0 means no limit
    CLOUDINARY_FOLDER="scin"
"""

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter, Retry

try:
    import cloudinary
    import cloudinary.uploader
    from sqlalchemy import create_engine, text
except ImportError:
    print("❌ Missing required packages. Please install:")
    print("   pip install cloudinary sqlalchemy psycopg2-binary requests")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"
LIMIT = int(os.getenv("LIMIT", "0"))
CLOUDINARY_FOLDER = os.getenv("CLOUDINARY_FOLDER", "scin")
STATE_FILE = ".scin_migration_state.json"


def validate_config():
    """Validate required environment variables."""
    if not DATABASE_URL:
        raise ValueError("❌ DATABASE_URL environment variable is required")
    if not CLOUDINARY_CLOUD_NAME or not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
        raise ValueError("❌ Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) are required")
    
    logger.info("✅ Configuration validated")
    logger.info(f"   Batch size: {BATCH_SIZE}")
    logger.info(f"   Dry run: {DRY_RUN}")
    logger.info(f"   Cloudinary folder: {CLOUDINARY_FOLDER}")


def configure_cloudinary():
    """Configure Cloudinary SDK."""
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info(f"✅ Cloudinary configured (cloud: {CLOUDINARY_CLOUD_NAME})")


def create_session():
    """Create requests session with retry logic."""
    session = requests.Session()
    retry_strategy = Retry(
        total=MAX_RETRIES,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def load_state() -> Dict:
    """Load migration state from file."""
    if Path(STATE_FILE).exists():
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {"processed": [], "failed": [], "last_id": 0}


def save_state(state: Dict):
    """Save migration state to file."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def fetch_samples(engine, state: Dict) -> List[Tuple]:
    """Fetch SCIN samples that need migration."""
    with engine.connect() as conn:
        query = text("""
            SELECT id, case_id, image_1_path
            FROM scin_samples
            WHERE image_1_path IS NOT NULL
              AND image_1_path LIKE 'http%'
              AND image_1_path NOT LIKE '%cloudinary%'
              AND id > :last_id
            ORDER BY id
            LIMIT :limit
        """)
        
        limit = LIMIT if LIMIT > 0 else 999999
        result = conn.execute(query, {"last_id": state["last_id"], "limit": limit})
        return result.fetchall()


def download_image(session: requests.Session, url: str) -> Optional[bytes]:
    """Download image from URL."""
    try:
        response = session.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return None


def upload_to_cloudinary(image_data: bytes, case_id: str) -> Optional[str]:
    """Upload image to Cloudinary and return the URL."""
    try:
        result = cloudinary.uploader.upload(
            image_data,
            folder=CLOUDINARY_FOLDER,
            public_id=f"case_{case_id}",
            resource_type="image",
            overwrite=True
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Failed to upload to Cloudinary (case {case_id}): {e}")
        return None


def update_database(engine, sample_id: int, cloudinary_url: str):
    """Update database with Cloudinary URL."""
    if DRY_RUN:
        logger.info(f"[DRY RUN] Would update sample {sample_id} with URL: {cloudinary_url}")
        return True
    
    try:
        with engine.connect() as conn:
            query = text("""
                UPDATE scin_samples
                SET image_1_path = :cloudinary_url
                WHERE id = :sample_id
            """)
            conn.execute(query, {"cloudinary_url": cloudinary_url, "sample_id": sample_id})
            conn.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to update database for sample {sample_id}: {e}")
        return False


def process_batch(engine, session: requests.Session, samples: List[Tuple], state: Dict) -> Tuple[int, int]:
    """Process a batch of samples."""
    success_count = 0
    fail_count = 0
    
    for sample_id, case_id, image_url in samples:
        logger.info(f"Processing sample {sample_id} (case: {case_id})...")
        
        # Skip if already processed
        if sample_id in state["processed"]:
            logger.info(f"   Skipping (already processed)")
            continue
        
        # Download image
        image_data = download_image(session, image_url)
        if not image_data:
            state["failed"].append({"id": sample_id, "case_id": case_id, "reason": "download_failed"})
            fail_count += 1
            continue
        
        # Upload to Cloudinary
        cloudinary_url = upload_to_cloudinary(image_data, case_id)
        if not cloudinary_url:
            state["failed"].append({"id": sample_id, "case_id": case_id, "reason": "upload_failed"})
            fail_count += 1
            continue
        
        # Update database
        if update_database(engine, sample_id, cloudinary_url):
            state["processed"].append(sample_id)
            state["last_id"] = sample_id
            success_count += 1
            logger.info(f"   ✅ Success! Cloudinary URL: {cloudinary_url}")
        else:
            state["failed"].append({"id": sample_id, "case_id": case_id, "reason": "db_update_failed"})
            fail_count += 1
        
        # Save state periodically
        if (success_count + fail_count) % 10 == 0:
            save_state(state)
        
        # Rate limiting
        time.sleep(0.5)
    
    return success_count, fail_count


def main():
    """Main migration function."""
    try:
        # Validate configuration
        validate_config()
        configure_cloudinary()
        
        # Create database connection
        engine = create_engine(DATABASE_URL)
        logger.info("✅ Database connection established")
        
        # Create HTTP session
        session = create_session()
        
        # Load state
        state = load_state()
        logger.info(f"📊 Migration state loaded: {len(state['processed'])} processed, {len(state['failed'])} failed")
        
        # Fetch samples
        samples = fetch_samples(engine, state)
        total_samples = len(samples)
        logger.info(f"📥 Fetched {total_samples} samples to process")
        
        if total_samples == 0:
            logger.info("✅ No samples to process. Migration complete!")
            return
        
        # Process in batches
        total_success = 0
        total_failed = 0
        
        for i in range(0, total_samples, BATCH_SIZE):
            batch = samples[i:i+BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            logger.info(f"\n🔄 Processing batch {batch_num}/{(total_samples + BATCH_SIZE - 1) // BATCH_SIZE}")
            
            success, failed = process_batch(engine, session, batch, state)
            total_success += success
            total_failed += failed
            
            # Save state after each batch
            save_state(state)
            logger.info(f"✅ Batch {batch_num} complete: {success} success, {failed} failed")
        
        # Final summary
        logger.info(f"\n{'='*60}")
        logger.info(f"🎉 MIGRATION COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"✅ Total successful: {total_success}")
        logger.info(f"❌ Total failed: {total_failed}")
        logger.info(f"📊 Total processed (all time): {len(state['processed'])}")
        logger.info(f"💾 State saved to: {STATE_FILE}")
        
        if state["failed"]:
            logger.warning(f"\n⚠️  {len(state['failed'])} samples failed. Check state file for details.")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        sys.exit(1)
    finally:
        # Save final state
        if 'state' in locals():
            save_state(state)


if __name__ == "__main__":
    main()
