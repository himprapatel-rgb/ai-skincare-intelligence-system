"""create ai_chat_sessions and ai_chat_messages tables

Revision ID: 004_ai_chat
Revises: 002_refresh_token
Create Date: 2026-03-26

Adds AI Chat Assistant tables with SSE-ready schema.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '004_ai_chat'
down_revision: Union[str, None] = '002_refresh_token'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    use_jsonb = bind.dialect.name == 'postgresql'

    json_type = postgresql.JSONB(astext_type=sa.Text()) if use_jsonb else sa.JSON()

    op.create_table(
        'ai_chat_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False, server_default='New Chat'),
        sa.Column('context_snapshot', json_type, nullable=True),  # profile+scans+shelf snapshot
        sa.Column('message_count', sa.Integer(), default=0, nullable=False, server_default='0'),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'ai_chat_messages',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('ai_chat_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),  # 'user' | 'assistant' | 'system'
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('model', sa.String(60), nullable=True),  # e.g. gpt-4o-mini
        sa.Column('input_tokens', sa.Integer(), nullable=True),
        sa.Column('output_tokens', sa.Integer(), nullable=True),
        sa.Column('cost_usd', sa.Numeric(10, 6), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('metadata', json_type, nullable=True),  # function calls, citations, etc.
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'ai_usage_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('endpoint', sa.String(100), nullable=False),
        sa.Column('model', sa.String(60), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('output_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cost_usd', sa.Numeric(10, 6), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Indexes
    op.create_index('idx_chat_sessions_user_id', 'ai_chat_sessions', ['user_id'])
    op.create_index('idx_chat_messages_session_id', 'ai_chat_messages', ['session_id'])
    op.create_index('idx_ai_usage_user_id', 'ai_usage_logs', ['user_id'])


def downgrade() -> None:
    op.drop_table('ai_usage_logs')
    op.drop_table('ai_chat_messages')
    op.drop_table('ai_chat_sessions')
