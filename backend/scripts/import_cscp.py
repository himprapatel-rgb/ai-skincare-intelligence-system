#!/usr/bin/env python3
"""California CSCP Hazard Data Import Script

Imports 10,000+ chemical-product pairs with hazard classifications.
Links hazardous ingredients to CosIng database via CAS numbers.
Target: < 5 min import time, 100% hazard linkage
"""

import os
import sys
import csv
import logging
import requests
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
CSCP_CSV_URL = "https://data.ca.gov/dataset/596b5eed-31de-4fd8-a645-249f3f9b19c4/resource/57da6c9a-41a7-44b0-ab8d-815ff2cd5913/download/cscpopendata.csv"
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"
DATABASE_URL = os.getenv('DATABASE_URL')
BATCH_SIZE = 1000

# Hazard type mappings from CSCP categories
HAZARD_MAPPINGS = {
    'Carcinogen': 'carcinogen',
    'Developmental toxicity': 'reproductive_toxin',
    'Female reproductive toxicity': 'reproductive_toxin',
    'Male reproductive toxicity': 'reproductive_toxin',
    'Endocrine disruptor': 'endocrine_disruptor',
}

class CSCPImporter:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.stats = {'new': 0, 'linked': 0, 'unlinked': 0, 'errors': 0}
        self.ingredient_cache = {}  # Cache CAS -> ingredient_id mappings
    
    def download_data(self) -> Path:
        """Download CSCP CSV data"""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        filepath = DATA_DIR / "cscp-hazards.csv"
        
        logger.info(f"Downloading CSCP data from {CSCP_CSV_URL}...")
        
        response = requests.get(CSCP_CSV_URL, timeout=120, stream=True)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.info(f"Downloaded to {filepath}")
        return filepath
    
    def load_ingredient_cache(self):
        """Load CAS number to ingredient_id mappings"""
        logger.info("Loading ingredient cache...")
        
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT ingredient_id, cas_number 
                FROM ingredients 
                WHERE cas_number IS NOT NULL
            """)
            
            for ingredient_id, cas_number in cur.fetchall():
                self.ingredient_cache[cas_number.strip()] = ingredient_id
        
        logger.info(f"Loaded {len(self.ingredient_cache)} CAS mappings")
    
    def parse_csv(self, filepath: Path) -> List[Dict]:
        """Parse CSCP CSV file"""
        hazards = []
        
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    hazard = self._parse_hazard(row)
                    if hazard:
                        hazards.append(hazard)
                except Exception as e:
                    logger.debug(f"Parse error: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Parsed {len(hazards)} hazard records")
        return hazards
    
    def _parse_hazard(self, row: Dict) -> Optional[Dict]:
        """Parse single hazard row"""
        cas_number = row.get('CASNumber', row.get('CAS', '')).strip()
        if not cas_number:
            return None
        
        # Map hazard category to our schema
        hazard_category = row.get('ToxicityCategory', row.get('Category', ''))
        hazard_type = HAZARD_MAPPINGS.get(hazard_category, 'other')
        
        # Look up ingredient_id from cache
        ingredient_id = self.ingredient_cache.get(cas_number)
        
        if not ingredient_id:
            self.stats['unlinked'] += 1
        else:
            self.stats['linked'] += 1
        
        return {
            'ingredient_id': ingredient_id,
            'cas_number': cas_number,
            'hazard_type': hazard_type,
            'regulatory_body': 'california_cscp',
            'evidence_level': row.get('ListingMechanism', 'regulatory')[:50]
        }
    
    def import_batch(self, hazards: List[Dict]):
        """Import batch of hazards"""
        if not hazards:
            return
        
        query = """
            INSERT INTO ingredient_hazards (
                ingredient_id, cas_number, hazard_type, 
                regulatory_body, evidence_level
            )
            VALUES %s
            ON CONFLICT DO NOTHING
        """
        
        values = [
            (h['ingredient_id'], h['cas_number'], h['hazard_type'],
             h['regulatory_body'], h['evidence_level'])
            for h in hazards
        ]
        
        try:
            with self.conn.cursor() as cur:
                execute_values(cur, query, values)
                self.conn.commit()
                self.stats['new'] += len(hazards)
        except Exception as e:
            logger.error(f"Batch import error: {e}")
            self.conn.rollback()
            self.stats['errors'] += len(hazards)
    
    def run(self):
        """Main import process"""
        logger.info("Starting CSCP hazard import...")
        
        # Load ingredient mappings first
        self.load_ingredient_cache()
        
        filepath = self.download_data()
        hazards = self.parse_csv(filepath)
        
        # Import in batches
        for i in range(0, len(hazards), BATCH_SIZE):
            batch = hazards[i:i + BATCH_SIZE]
            self.import_batch(batch)
            logger.info(f"Imported {min(i + BATCH_SIZE, len(hazards))}/{len(hazards)} hazards...")
        
        logger.info(f"Import complete! Stats: {self.stats}")
        logger.info(f"Linkage rate: {self.stats['linked']}/{self.stats['linked'] + self.stats['unlinked']} "
                   f"({100 * self.stats['linked'] / max(1, self.stats['linked'] + self.stats['unlinked']):.1f}%)")
        
        self.conn.close()

def main() -> None:
    """Entry point for database seeding"""
    try:
        logger.info("Starting CSCP dataset import")
        importer = CSCPImporter()
        importer.run()
        logger.info("CSCP dataset import completed successfully")
    except Exception:
        logger.exception("CSCP dataset import failed")
        raise

if __name__ == "__main__":
    main()
