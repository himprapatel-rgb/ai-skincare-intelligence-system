"""
Performance Indexes Migration (Task 426)
Add indexes for frequently queried fields to improve performance.

Run: python -m scripts.run_migrations
"""
import logging

from sqlalchemy import text

from app.database import engine

logger = logging.getLogger(__name__)


def run_migration():
    """Add performance indexes for frequently queried fields."""
    
    indexes = [
        # User-related indexes
        ("idx_users_email_lower", "users", "LOWER(email)"),
        ("idx_users_is_active", "users", "is_active"),
        ("idx_users_created_at", "users", "created_at DESC"),
        
        # Shelf products - frequently queried by user
        ("idx_shelf_user_status", "shelf_products", "user_id, status"),
        ("idx_shelf_user_category", "shelf_products", "user_id, product_category"),
        ("idx_shelf_created_at", "shelf_products", "created_at DESC"),
        
        # Scan sessions - frequently queried by user and date
        ("idx_scan_user_date", "scan_sessions", "user_id, created_at DESC"),
        ("idx_scan_created_at", "scan_sessions", "created_at DESC"),
        
        # Skin analysis - linked to scans
        ("idx_analysis_session", "skin_analyses", "session_id"),
        
        # User favorites
        ("idx_favorites_user", "user_favorites", "user_id"),
        
        # Products - search optimization
        ("idx_products_brand", "products", "brand"),
        ("idx_products_category", "products", "category"),
        ("idx_products_name_trgm", "products", "name gin_trgm_ops"),  # For fuzzy search
        
        # Notifications - user inbox
        ("idx_notifications_user_read", "notifications", "user_id, is_read"),
        ("idx_notifications_created", "notifications", "created_at DESC"),
        
        # Progress photos
        ("idx_progress_user_date", "progress_photos", "user_id, captured_at DESC"),
        
        # Ingredients - for search
        ("idx_ingredients_name", "ingredients", "name"),
    ]
    
    with engine.begin() as conn:
        for index_name, table, columns in indexes:
            try:
                # Check if using trigram (requires pg_trgm extension)
                if "gin_trgm_ops" in columns:
                    # First ensure pg_trgm extension exists
                    try:
                        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                    except Exception:
                        logger.warning(f"Could not create pg_trgm extension, skipping {index_name}")
                        continue
                    
                    # Create GIN index for trigram search
                    col_name = columns.replace(" gin_trgm_ops", "")
                    sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} USING gin ({col_name} gin_trgm_ops)"
                else:
                    sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({columns})"
                
                conn.execute(text(sql))
                logger.info(f"✅ Created index: {index_name}")
            except Exception as e:
                # Index might already exist or table doesn't exist yet
                logger.warning(f"⚠️ Could not create index {index_name}: {str(e)[:100]}")
    
    logger.info("✅ Performance indexes migration complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration()
