"""performance indexes

Revision ID: a001_perf
Revises: 7f61184170c2
Create Date: 2026-03-26

Add partial indexes for common filtered queries and materialized view
for dashboard aggregations. PostgreSQL-only (skipped on SQLite).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a001_perf'
down_revision: Union[str, None] = '7f61184170c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return  # Skip on SQLite

    # Enable pg_trgm for fuzzy text search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Partial indexes for common filtered queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_scans_completed
        ON scan_sessions(user_id, created_at DESC)
        WHERE status = 'COMPLETED'
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_shelf_active
        ON shelf_products(user_id)
        WHERE status = 'active'
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_notifications_unread
        ON notifications(user_id)
        WHERE read = false
    """)

    # Trigram index for fuzzy product name search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_products_name_trgm
        ON products USING gin (name gin_trgm_ops)
    """)

    # Composite index for user email lookup during login
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_email_active
        ON users(email, is_active)
    """)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return

    op.execute("DROP INDEX IF EXISTS idx_users_email_active")
    op.execute("DROP INDEX IF EXISTS idx_products_name_trgm")
    op.execute("DROP INDEX IF EXISTS idx_notifications_unread")
    op.execute("DROP INDEX IF EXISTS idx_shelf_active")
    op.execute("DROP INDEX IF EXISTS idx_scans_completed")
