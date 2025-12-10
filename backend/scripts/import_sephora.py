#!/usr/bin/env python3
"""Kaggle Sephora Products Import Script

Imports 5,000+ skincare products with pricing, ratings, and full INCI lists.
Enriches product catalog with market data.
Target: < 5 min import time, 100% data coverage

Data Source: Kaggle Sephora Products Dataset (CC0 / CC BY-SA)
"""

import os
import sys
import csv
import json
import logging
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, List, Optional
from decimal import Decimal

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"
DATABASE_URL = os.getenv('DATABASE_URL')
BATCH_SIZE = 500

# Expected CSV path (user must download from Kaggle manually)
SEPHORA_CSV_PATH = DATA_DIR / "sephora-products.csv"

class SephoraImporter:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.stats = {'new': 0, 'updated': 0, 'skipped': 0, 'errors': 0}
    
    def check_file_exists(self) -> bool:
        """Check if Sephora CSV exists"""
        if not SEPHORA_CSV_PATH.exists():
            logger.error(f"""\nSephora CSV not found at: {SEPHORA_CSV_PATH}
            
Please download it manually from Kaggle:
1. Visit: https://www.kaggle.com/datasets/raghadalharbi/all-products-available-on-sephora-website
2. Download the CSV file
3. Place it at: {SEPHORA_CSV_PATH}
4. Re-run this script
            """)
            return False
        return True
    
    def parse_csv(self, filepath: Path) -> List[Dict]:
        """Parse Sephora CSV file"""
        products = []
        
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    product = self._parse_product(row)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.debug(f"Parse error: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Parsed {len(products)} products")
        return products
    
    def _parse_product(self, row: Dict) -> Optional[Dict]:
        """Parse single product row"""
        # Generate a unique identifier (use product ID or name as barcode)
        product_id = row.get('product_id', row.get('id', '')).strip()
        name = row.get('product_name', row.get('name', '')).strip()
        
        if not name:
            return None
        
        # Use product_id or hash of name as barcode
        barcode = product_id if product_id else f"SEPHORA_{hash(name) & 0xFFFFFFFF}"
        
        # Parse price
        price_str = row.get('price', row.get('price_usd', '0')).strip()
        try:
            # Remove currency symbols and parse
            price_clean = price_str.replace('$', '').replace(',', '').strip()
            price_usd = Decimal(price_clean) if price_clean else None
        except:
            price_usd = None
        
        # Parse rating
        rating_str = row.get('rating', row.get('rating_value', '0')).strip()
        try:
            rating = Decimal(rating_str) if rating_str else None
        except:
            rating = None
        
        # Parse review count
        review_count_str = row.get('reviews', row.get('review_count', '0')).strip()
        try:
            review_count = int(review_count_str) if review_count_str else 0
        except:
            review_count = 0
        
        return {
            'barcode': barcode[:255],
            'name': name[:500],
            'brand': row.get('brand_name', row.get('brand', ''))[:255].strip(),
            'ingredients_text': row.get('ingredients', row.get('ingredients_text', '')),
            'allergens': json.dumps([]),  # Sephora data typically doesn't have allergens
            'image_url': row.get('primary_image', row.get('image_url', ''))[:500],
            'price_usd': price_usd,
            'rating': rating,
            'review_count': review_count,
            'source': 'sephora'
        }
    
    def import_batch(self, products: List[Dict]):
        """Import batch of products"""
        if not products:
            return
        
        query = """
            INSERT INTO products (
                barcode, name, brand, ingredients_text, allergens,
                image_url, price_usd, rating, review_count, source
            )
            VALUES %s
            ON CONFLICT (barcode) DO UPDATE SET
                name = EXCLUDED.name,
                brand = EXCLUDED.brand,
                ingredients_text = EXCLUDED.ingredients_text,
                price_usd = EXCLUDED.price_usd,
                rating = EXCLUDED.rating,
                review_count = EXCLUDED.review_count,
                updated_at = NOW()
        """
        
        values = [
            (
                p['barcode'], p['name'], p['brand'], p['ingredients_text'],
                p['allergens'], p['image_url'], p['price_usd'],
                p['rating'], p['review_count'], p['source']
            )
            for p in products
        ]
        
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
        """Main import process"""
        logger.info("Starting Sephora products import...")
        
        # Check if file exists
        if not self.check_file_exists():
            return
        
        products = self.parse_csv(SEPHORA_CSV_PATH)
        
        # Import in batches
        for i in range(0, len(products), BATCH_SIZE):
            batch = products[i:i + BATCH_SIZE]
            self.import_batch(batch)
            logger.info(f"Imported {min(i + BATCH_SIZE, len(products))}/{len(products)} products...")
        
        logger.info(f"Import complete! Stats: {self.stats}")
        self.conn.close()

if __name__ == '__main__':


def main() -> None:
    """Entry point for database seeding"""
    db = SessionLocal()
    try:
        logger.info("Starting Sephora dataset import")
        run_import(db)
        db.commit()
        logger.info("Sephora dataset import completed successfully")
    except Exception:
        logger.exception("Sephora dataset import failed - rolling back")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
