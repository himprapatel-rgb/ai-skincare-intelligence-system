"""add refresh_token column to users

Revision ID: 002_refresh_token
Revises: a001_perf
Create Date: 2026-03-26

Adds refresh_token column to users table for JWT token rotation.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '002_refresh_token'
down_revision: Union[str, None] = 'a001_perf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name == 'sqlite':
        # SQLite doesn't support ADD COLUMN with constraints easily, use batch
        with op.batch_alter_table('users') as batch_op:
            batch_op.add_column(
                sa.Column('refresh_token', sa.String(512), nullable=True)
            )
    else:
        op.add_column(
            'users',
            sa.Column('refresh_token', sa.String(512), nullable=True),
        )
        # Index for fast token lookup during refresh
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token) "
            "WHERE refresh_token IS NOT NULL"
        )


def downgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name != 'postgresql':
        with op.batch_alter_table('users') as batch_op:
            batch_op.drop_column('refresh_token')
    else:
        op.execute("DROP INDEX IF EXISTS idx_users_refresh_token")
        op.drop_column('users', 'refresh_token')
