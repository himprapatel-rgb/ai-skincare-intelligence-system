"""create search_queries table

Revision ID: 006_search
Revises: 004_ai_chat
Create Date: 2026-03-26

Adds a search_queries table to log user searches for analytics.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '006_search'
down_revision: Union[str, None] = '004_ai_chat'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'search_queries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('query', sa.String(200), nullable=False),
        sa.Column('result_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index('idx_search_queries_user_id', 'search_queries', ['user_id'])
    op.create_index('idx_search_queries_created_at', 'search_queries', ['created_at'])


def downgrade() -> None:
    op.drop_table('search_queries')
