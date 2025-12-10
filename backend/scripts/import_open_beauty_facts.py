import_open_beauty_facts.py#!/usr/bin/env python3
"""Open Beauty Facts Bulk Import Script

Story 20.3: Import 100k+ products from Open Beauty Facts
Target: < 30 min import time, < 5% missing ingredients
"""

import os
import sys
import json
import gzip
import logging
import requests
from datetime import datetime, timedelta
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, List, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OBF_BULK_URL = "https://world.openbeautyfacts.org/data/openfoodfacts-products.jsonl.gz"
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"
DATABASE_URL = os.getenv('DATABASE_URL')
BATCH_SIZE = 1000
CACHE_TTL_DAYS = 7

class OBFImporter:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.stats = {'new': 0, 'updated': 0, 'skipped': 0, 'errors': 0}
        
    def download_data(self) -> Path:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        filepath = DATA_DIR / "obf-products.jsonl.gz"
        logger.info(f"Downloading from {OBF_BULK_URL}...")
        response = requests.get(OBF_BULK_URL, stream=True)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        logger.info(f"Downloaded to {filepath}")
        return filepath
    
    def parse_product(self, raw: Dict) -> Optional[Dict]:
        try:
            if not raw.get('code'): return None
            return {
                'barcode': raw['code'],
                'name': raw.get('product_name', '')[:500],
                'brand': raw.get('brands', '')[:255],
                'ingredients_text': raw.get('ingredients_text'),
                'allergens': json.dumps(raw.get('allergens_tags', [])),
                'image_url': raw.get('image_url', '')[:500],
                'source': 'openbeautyfacts',
                'cached_until': datetime.now() + timedelta(days=CACHE_TTL_DAYS)
            }
        except Exception as e:
            logger.debug(f"Parse error: {e}")
            return None
    
    def import_batch(self, products: List[Dict]):
        if not products: return
        query = """
            INSERT INTO products (barcode, name, brand, ingredients_text, allergens, image_url, source, cached_until)
            VALUES %s
            ON CONFLICT (barcode) DO UPDATE SET
                name = EXCLUDED.name,
                ingredients_text = EXCLUDED.ingredients_text,
                updated_at = NOW(),
                cached_until = EXCLUDED.cached_until
        """
        values = [(p['barcode'], p['name'], p['brand'], p['ingredients_text'],
                   p['allergens'], p['image_url'], p['source'], p['cached_until'])
                  for p in products]
        try:
            with self.conn.cursor() as cur:
                execute_values(cur, query, values)
            self.conn.commit()
            self.stats['new'] += len(products)
        except Exception as e:
            logger.error(f"Batch import error: {e}")
            self.conn.rollback()
            self.stats['errors'] += len(products)
    
    def run(self):
        logger.info("Starting OBF import...")
        filepath = self.download_data()
        batch = []
        count = 0
        
        with gzip.open(filepath, 'rt', encoding='utf-8') as f:
            for line in f:
                if not line.strip(): continue
                raw = json.loads(line)
                if 'beauty' not in raw.get('categories_tags', []):
                    continue
                product = self.parse_product(raw)
                if product:
                    batch.append(product)
                    count += 1
                    if len(batch) >= BATCH_SIZE:
                        self.import_batch(batch)
                        logger.info(f"Imported {count} products...")
                        batch = []
        
        if batch:
            self.import_batch(batch)
        
        logger.info(f"Import complete! Stats: {self.stats}")
        self.conn.close()

if __name__ == '__main__':


def main() -> None:
    """Entry point for database seeding"""
    db = SessionLocal()
    try:
        logger.info("Starting Open Beauty Facts dataset import")
        run_import(db)
        db.commit()
        logger.info("Open Beauty Facts dataset import completed successfully")
    except Exception:
        logger.exception("Open Beauty Facts dataset import failed - rolling back")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
