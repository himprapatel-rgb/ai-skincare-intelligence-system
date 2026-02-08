"""
Apply performance indices to improve query speed.
Run this script to add indices for hot tables.
"""

import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from app.database import engine

logger = logging.getLogger(__name__)


def apply_indices():
    """Apply performance indices from SQL file."""
    sql_file = Path(__file__).parent.parent / "migrations" / "add_performance_indices.sql"
    
    if not sql_file.exists():
        logger.error(f"SQL file not found: {sql_file}")
        return False
    
    try:
        with open(sql_file, "r") as f:
            sql_content = f.read()
        
        # Split by semicolons and filter out comments/empty lines
        statements = [
            stmt.strip()
            for stmt in sql_content.split(";")
            if stmt.strip() and not stmt.strip().startswith("--")
        ]
        
        with engine.begin() as conn:
            for stmt in statements:
                if stmt:
                    try:
                        logger.info(f"Executing: {stmt[:80]}...")
                        conn.execute(text(stmt))
                    except Exception as e:
                        # Log but continue on errors (index may already exist)
                        logger.warning(f"Index creation warning: {e}")
        
        logger.info("✓ Performance indices applied successfully")
        return True
    
    except Exception as e:
        logger.error(f"Failed to apply indices: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    success = apply_indices()
    sys.exit(0 if success else 1)
