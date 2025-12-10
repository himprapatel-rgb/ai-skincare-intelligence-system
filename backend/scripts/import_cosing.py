#!/usr/bin/env python3
"""EU CosIng Database Import Script

Imports 26,000+ standardized INCI ingredient names from EU CosIng database.
Target: < 10 min import time, 100% data coverage
"""

import os
import sys
import csv
import logging
import requests
import xml.etree.ElementTree as ET
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, List, Optional
from io import StringIO

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
COSING_XML_URL = "https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=export.export"
COSING_CSV_URL = "https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=export.exportcsv"
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"
DATABASE_URL = os.getenv('DATABASE_URL')
BATCH_SIZE = 1000

class CosIngImporter:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.stats = {'new': 0, 'updated': 0, 'skipped': 0, 'errors': 0}
    
    def download_data(self) -> Path:
        """Download CosIng database export"""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        filepath = DATA_DIR / "cosing-ingredients.csv"
        
        logger.info(f"Downloading CosIng database...")
        
        # Try CSV export first (simpler format)
        try:
            response = requests.get(COSING_CSV_URL, timeout=300)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Downloaded to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"CSV download failed: {e}")
            logger.info("Falling back to XML export...")
            return self._download_xml()
    
    def _download_xml(self) -> Path:
        """Fallback: Download XML export"""
        filepath = DATA_DIR / "cosing-ingredients.xml"
        
        response = requests.get(COSING_XML_URL, timeout=300)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"Downloaded XML to {filepath}")
        return filepath
    
    def parse_csv(self, filepath: Path) -> List[Dict]:
        """Parse CSV export"""
        ingredients = []
        
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    ingredient = self._parse_ingredient(row)
                    if ingredient:
                        ingredients.append(ingredient)
                except Exception as e:
                    logger.debug(f"Parse error: {e}")
                    self.stats['errors'] += 1
        
        logger.info(f"Parsed {len(ingredients)} ingredients")
        return ingredients
    
    def _parse_ingredient(self, row: Dict) -> Optional[Dict]:
        """Parse single ingredient row"""
        inci_name = row.get('INCI name', row.get('INCIName', '')).strip()
        if not inci_name:
            return None
        
        return {
            'inci_name': inci_name,
            'cas_number': row.get('CAS No', row.get('CASNo', '')).strip() or None,
            'ec_number': row.get('EC No', row.get('ECNo', '')).strip() or None,
            'function': row.get('Function', row.get('Functions', ''))[:255],
            'regulatory_status': row.get('Regulation', row.get('Status', ''))[:100],
            'restrictions': row.get('Restrictions', ''),
            'microbiome_risk_flag': False,  # Will be updated by ML models
            'comedogenicity_score': None,  # Will be populated separately
            'source': 'cosing'
        }
    
    def import_batch(self, ingredients: List[Dict]):
        """Import batch of ingredients"""
        if not ingredients:
            return
        
        query = """
            INSERT INTO ingredients (
                inci_name, cas_number, ec_number, function, 
                regulatory_status, restrictions, microbiome_risk_flag, 
                comedogenicity_score, source
            )
            VALUES %s
            ON CONFLICT (inci_name) DO UPDATE SET
                cas_number = EXCLUDED.cas_number,
                ec_number = EXCLUDED.ec_number,
                function = EXCLUDED.function,
                regulatory_status = EXCLUDED.regulatory_status,
                restrictions = EXCLUDED.restrictions,
                updated_at = NOW()
        """
        
        values = [
            (
                i['inci_name'], i['cas_number'], i['ec_number'],
                i['function'], i['regulatory_status'], i['restrictions'],
                i['microbiome_risk_flag'], i['comedogenicity_score'], i['source']
            )
            for i in ingredients
        ]
        
        try:
            with self.conn.cursor() as cur:
                execute_values(cur, query, values)
                self.conn.commit()
                self.stats['new'] += len(ingredients)
        except Exception as e:
            logger.error(f"Batch import error: {e}")
            self.conn.rollback()
            self.stats['errors'] += len(ingredients)
    
    def run(self):
        """Main import process"""
        logger.info("Starting CosIng import...")
        
        filepath = self.download_data()
        
        if filepath.suffix == '.csv':
            ingredients = self.parse_csv(filepath)
        else:
            logger.error("XML parsing not implemented yet")
            return
        
        # Import in batches
        for i in range(0, len(ingredients), BATCH_SIZE):
            batch = ingredients[i:i + BATCH_SIZE]
            self.import_batch(batch)
            logger.info(f"Imported {min(i + BATCH_SIZE, len(ingredients))}/{len(ingredients)} ingredients...")
        
        logger.info(f"Import complete! Stats: {self.stats}")
        self.conn.close()

if __name__ == '__main__':
    importer = CosIngImporter()

def main():
    """Entry point for database seeding"""
    importer = CosingImporter()
    importer.run()
    importer.run()
