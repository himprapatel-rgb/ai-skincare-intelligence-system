#!/usr/bin/env python3
"""
Open Beauty Facts Catalog Importer

Downloads and imports products from Open Beauty Facts into the catalog database.
Part of the Product Catalog Database Strategy (Tasks 544-546).

Usage:
    # Import from API (recommended for initial import)
    python scripts/import_obf_catalog.py --source api --limit 10000
    
    # Import from downloaded CSV file
    python scripts/import_obf_catalog.py --source file --file products.csv
    
    # Dry run (no database writes)
    python scripts/import_obf_catalog.py --source api --limit 100 --dry-run

Created: January 29, 2026
"""
import argparse
import csv
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import httpx
import psycopg2
from psycopg2.extras import execute_values

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Open Beauty Facts API
OBF_API_BASE = "https://world.openbeautyfacts.org"
OBF_SEARCH_URL = f"{OBF_API_BASE}/cgi/search.pl"

# Categories to import (skincare focused)
SKINCARE_CATEGORIES = [
    "face care", "skin care", "body care", "moisturizers", "cleansers",
    "serums", "sunscreen", "sun care", "anti-aging", "acne", "masks",
    "toners", "exfoliators", "eye care", "lip care", "body lotions",
    "hand creams", "face creams", "night creams", "day creams"
]

# Category mapping
CATEGORY_MAP = {
    "cleanser": ["cleanser", "face wash", "cleansing", "micellar", "makeup remover"],
    "moisturizer": ["moisturizer", "moisturiser", "cream", "lotion", "hydrat", "emulsion"],
    "serum": ["serum", "essence", "ampoule", "concentrate", "booster"],
    "sunscreen": ["sunscreen", "sun protection", "spf", "solar", "uv"],
    "toner": ["toner", "tonic", "lotion", "mist"],
    "mask": ["mask", "masque", "peel-off"],
    "exfoliant": ["exfoliat", "peel", "scrub", "aha", "bha", "glycolic"],
    "eye_cream": ["eye cream", "eye care", "eye contour", "eye gel"],
    "lip_care": ["lip", "balm", "lip care"],
    "body_care": ["body", "hand cream", "foot", "body butter"],
}


def get_database_connection():
    """Get database connection from environment."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    return psycopg2.connect(database_url)


def parse_category(categories_str: str) -> str:
    """Parse OBF category string to our category."""
    if not categories_str:
        return "other"
    
    categories_lower = categories_str.lower()
    
    for our_cat, keywords in CATEGORY_MAP.items():
        for keyword in keywords:
            if keyword in categories_lower:
                return our_cat
    
    return "other"


def parse_ingredients(ingredients_text: str) -> List[str]:
    """Parse ingredients text to list."""
    if not ingredients_text:
        return []
    
    # Split by comma, handle parentheses
    ingredients = []
    current = ""
    paren_depth = 0
    
    for char in ingredients_text:
        if char == "(":
            paren_depth += 1
            current += char
        elif char == ")":
            paren_depth -= 1
            current += char
        elif char == "," and paren_depth == 0:
            ing = current.strip()
            if ing and len(ing) > 1:
                ingredients.append(ing)
            current = ""
        else:
            current += char
    
    # Add last ingredient
    if current.strip() and len(current.strip()) > 1:
        ingredients.append(current.strip())
    
    return ingredients[:50]  # Limit to 50


def calculate_quality_score(product: Dict) -> int:
    """Calculate data quality score for a product."""
    score = 0
    
    if product.get("product_name"):
        score += 20
    if product.get("brands"):
        score += 20
    if product.get("ingredients_text"):
        score += 25
    if product.get("image_front_url") or product.get("image_url"):
        score += 15
    if product.get("categories"):
        score += 10
    if product.get("code") and len(product.get("code", "")) >= 8:
        score += 10
    
    return min(score, 100)


def is_skincare_product(product: Dict) -> bool:
    """Check if product is skincare-related."""
    categories = (product.get("categories") or "").lower()
    name = (product.get("product_name") or "").lower()
    
    # Check categories
    for keyword in SKINCARE_CATEGORIES:
        if keyword in categories:
            return True
    
    # Check name for skincare keywords
    skincare_keywords = [
        "serum", "moisturizer", "cleanser", "cream", "lotion", "sunscreen",
        "spf", "toner", "mask", "exfoliant", "scrub", "eye cream", "lip balm",
        "face", "skin", "body lotion", "hand cream"
    ]
    
    for keyword in skincare_keywords:
        if keyword in name:
            return True
    
    return False


def fetch_products_from_api(
    page: int = 1,
    page_size: int = 100,
    category_filter: Optional[str] = None
) -> List[Dict]:
    """Fetch products from Open Beauty Facts API."""
    params = {
        "action": "process",
        "json": "1",
        "page": page,
        "page_size": page_size,
        "sort_by": "unique_scans_n",  # Most popular first
    }
    
    if category_filter:
        params["tagtype_0"] = "categories"
        params["tag_contains_0"] = "contains"
        params["tag_0"] = category_filter
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(OBF_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("products", [])
    except Exception as e:
        logger.error(f"API error: {e}")
        return []


def import_products_batch(
    conn,
    products: List[Dict],
    dry_run: bool = False
) -> Dict[str, int]:
    """Import a batch of products to the catalog."""
    stats = {"imported": 0, "skipped": 0, "errors": 0}
    
    if not products:
        return stats
    
    cur = conn.cursor()
    
    # Prepare batch data
    batch_data = []
    existing_barcodes = set()
    
    # Get existing barcodes
    barcodes = [p.get("code") for p in products if p.get("code")]
    if barcodes:
        cur.execute(
            "SELECT barcode FROM catalog_products WHERE barcode = ANY(%s)",
            (barcodes,)
        )
        existing_barcodes = {row[0] for row in cur.fetchall()}
    
    for product in products:
        barcode = product.get("code")
        name = (product.get("product_name") or "").strip()
        brand = (product.get("brands") or "").strip()
        
        # Skip invalid products
        if not name or not brand:
            stats["skipped"] += 1
            continue
        
        if barcode and barcode in existing_barcodes:
            stats["skipped"] += 1
            continue
        
        # Skip non-skincare products
        if not is_skincare_product(product):
            stats["skipped"] += 1
            continue
        
        # Parse data
        category = parse_category(product.get("categories", ""))
        ingredients = parse_ingredients(product.get("ingredients_text", ""))
        quality_score = calculate_quality_score(product)
        
        # Skip low quality products
        if quality_score < 40:
            stats["skipped"] += 1
            continue
        
        # Get image URL
        image_url = product.get("image_front_url") or product.get("image_url")
        
        # Prepare row data
        row = (
            str(uuid.uuid4()),  # id
            barcode,  # barcode
            "ean13" if barcode and len(barcode) == 13 else "upc",  # barcode_type
            name[:300],  # name (limit length)
            brand[:200],  # brand
            category,  # category
            product.get("generic_name", "")[:500] if product.get("generic_name") else None,  # description
            None,  # size_ml
            None,  # size_unit
            None,  # price_usd
            None,  # price_range
            image_url,  # image_front_url
            None,  # image_back_url
            None,  # image_ingredients_url
            image_url,  # thumbnail_url
            "obf",  # images_source
            None,  # safety_score (will be computed later)
            None,  # safety_summary
            None,  # flagged_ingredients
            None,  # pregnancy_safe
            None,  # sensitive_skin_safe
            None,  # suitable_skin_types
            None,  # targets_concerns
            False,  # is_fragrance_free
            False,  # is_vegan
            False,  # is_cruelty_free
            False,  # is_organic
            False,  # is_clean_beauty
            ", ".join(ingredients) if ingredients else None,  # ingredients_text
            None,  # key_ingredients
            False,  # is_verified
            quality_score,  # data_quality_score
            "obf",  # source
            barcode,  # source_id
            0,  # view_count
            0,  # scan_count
            None,  # last_scanned_at
            datetime.utcnow(),  # created_at
            None,  # updated_at
        )
        
        batch_data.append(row)
        stats["imported"] += 1
    
    # Insert batch
    if batch_data and not dry_run:
        try:
            insert_query = """
                INSERT INTO catalog_products (
                    id, barcode, barcode_type, name, brand, category,
                    description, size_ml, size_unit, price_usd, price_range,
                    image_front_url, image_back_url, image_ingredients_url,
                    thumbnail_url, images_source, safety_score, safety_summary,
                    flagged_ingredients, pregnancy_safe, sensitive_skin_safe,
                    suitable_skin_types, targets_concerns,
                    is_fragrance_free, is_vegan, is_cruelty_free, is_organic, is_clean_beauty,
                    ingredients_text, key_ingredients, is_verified, data_quality_score,
                    source, source_id, view_count, scan_count, last_scanned_at,
                    created_at, updated_at
                ) VALUES %s
                ON CONFLICT (barcode) DO NOTHING
            """
            execute_values(cur, insert_query, batch_data)
            conn.commit()
        except Exception as e:
            logger.error(f"Database error: {e}")
            conn.rollback()
            stats["errors"] += len(batch_data)
            stats["imported"] = 0
    
    cur.close()
    return stats


def create_import_job(conn, source: str) -> str:
    """Create an import job record."""
    cur = conn.cursor()
    job_id = str(uuid.uuid4())
    
    cur.execute("""
        INSERT INTO catalog_import_jobs (id, source, status, started_at)
        VALUES (%s, %s, 'running', NOW())
    """, (job_id, source))
    
    conn.commit()
    cur.close()
    return job_id


def update_import_job(
    conn,
    job_id: str,
    total: int,
    imported: int,
    skipped: int,
    errors: int,
    status: str = "completed"
):
    """Update an import job record."""
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE catalog_import_jobs
        SET total_records = %s,
            imported_records = %s,
            skipped_records = %s,
            error_records = %s,
            status = %s,
            completed_at = NOW()
        WHERE id = %s
    """, (total, imported, skipped, errors, status, job_id))
    
    conn.commit()
    cur.close()


def main():
    parser = argparse.ArgumentParser(description="Import products from Open Beauty Facts")
    parser.add_argument("--source", choices=["api", "file"], default="api", help="Data source")
    parser.add_argument("--file", type=str, help="CSV file path (for file source)")
    parser.add_argument("--limit", type=int, default=1000, help="Maximum products to import")
    parser.add_argument("--page-size", type=int, default=100, help="API page size")
    parser.add_argument("--category", type=str, help="Filter by category")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to database")
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Open Beauty Facts Catalog Importer")
    logger.info("=" * 60)
    logger.info(f"Source: {args.source}")
    logger.info(f"Limit: {args.limit}")
    logger.info(f"Dry run: {args.dry_run}")
    logger.info("")
    
    # Connect to database
    try:
        conn = get_database_connection()
        logger.info("Database connected")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        sys.exit(1)
    
    # Create import job
    job_id = None
    if not args.dry_run:
        job_id = create_import_job(conn, f"obf_{args.source}")
        logger.info(f"Import job created: {job_id}")
    
    # Track stats
    total_stats = {"imported": 0, "skipped": 0, "errors": 0, "total": 0}
    
    try:
        if args.source == "api":
            # Import from API
            page = 1
            products_imported = 0
            
            while products_imported < args.limit:
                logger.info(f"Fetching page {page}...")
                products = fetch_products_from_api(
                    page=page,
                    page_size=args.page_size,
                    category_filter=args.category
                )
                
                if not products:
                    logger.info("No more products found")
                    break
                
                total_stats["total"] += len(products)
                
                # Import batch
                batch_stats = import_products_batch(conn, products, args.dry_run)
                
                total_stats["imported"] += batch_stats["imported"]
                total_stats["skipped"] += batch_stats["skipped"]
                total_stats["errors"] += batch_stats["errors"]
                
                products_imported += batch_stats["imported"]
                
                logger.info(
                    f"Page {page}: +{batch_stats['imported']} imported, "
                    f"{batch_stats['skipped']} skipped, {batch_stats['errors']} errors"
                )
                
                page += 1
                
                # Rate limiting
                time.sleep(1)
                
                if products_imported >= args.limit:
                    break
        
        elif args.source == "file":
            if not args.file:
                logger.error("--file is required for file source")
                sys.exit(1)
            
            # Import from CSV file
            with open(args.file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter='\t')
                batch = []
                
                for row in reader:
                    batch.append(row)
                    total_stats["total"] += 1
                    
                    if len(batch) >= args.page_size:
                        batch_stats = import_products_batch(conn, batch, args.dry_run)
                        total_stats["imported"] += batch_stats["imported"]
                        total_stats["skipped"] += batch_stats["skipped"]
                        total_stats["errors"] += batch_stats["errors"]
                        batch = []
                        
                        if total_stats["imported"] >= args.limit:
                            break
                
                # Final batch
                if batch and total_stats["imported"] < args.limit:
                    batch_stats = import_products_batch(conn, batch, args.dry_run)
                    total_stats["imported"] += batch_stats["imported"]
                    total_stats["skipped"] += batch_stats["skipped"]
                    total_stats["errors"] += batch_stats["errors"]
    
    except KeyboardInterrupt:
        logger.info("\nImport interrupted by user")
    except Exception as e:
        logger.error(f"Import failed: {e}")
        total_stats["errors"] += 1
    
    # Update import job
    if job_id:
        update_import_job(
            conn, job_id,
            total_stats["total"],
            total_stats["imported"],
            total_stats["skipped"],
            total_stats["errors"],
            "completed" if total_stats["errors"] == 0 else "completed_with_errors"
        )
    
    # Close connection
    conn.close()
    
    # Print summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("IMPORT COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total processed: {total_stats['total']}")
    logger.info(f"Imported: {total_stats['imported']}")
    logger.info(f"Skipped: {total_stats['skipped']}")
    logger.info(f"Errors: {total_stats['errors']}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
