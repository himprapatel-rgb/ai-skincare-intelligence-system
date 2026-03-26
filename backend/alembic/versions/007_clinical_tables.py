"""create clinical intelligence tables

Revision ID: 007_clinical_tables
Revises: 006_search
Create Date: 2026-03-26

Adds skin_alerts, derm_reports, and ingredient_interactions tables
for the clinical intelligence engine (Sprint 5).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '007_clinical_tables'
down_revision: Union[str, None] = '006_search'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # skin_alerts — proactive skin health warnings for users
    op.create_table(
        'skin_alerts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),  # low / medium / high / critical
        sa.Column('concern', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('is_dismissed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('scan_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('scan_sessions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_skin_alerts_user_id', 'skin_alerts', ['user_id'])
    op.create_index('idx_skin_alerts_severity', 'skin_alerts', ['severity'])
    op.create_index('idx_skin_alerts_created_at', 'skin_alerts', ['created_at'])

    # derm_reports — shareable dermatologist-ready reports
    op.create_table(
        'derm_reports',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scan_ids', sa.JSON(), nullable=False),  # array of scan UUIDs
        sa.Column('report_data', sa.JSON(), nullable=False),
        sa.Column('share_token', sa.String(64), unique=True, nullable=True),
        sa.Column('share_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_derm_reports_user_id', 'derm_reports', ['user_id'])
    op.create_index('idx_derm_reports_share_token', 'derm_reports', ['share_token'])

    # ingredient_interactions — clinical interaction database
    op.create_table(
        'ingredient_interactions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('ingredient_a', sa.String(200), nullable=False),
        sa.Column('ingredient_b', sa.String(200), nullable=False),
        sa.Column('interaction_type', sa.String(50), nullable=False),  # conflict / caution / synergy
        sa.Column('severity', sa.String(20), nullable=False),  # low / medium / high
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_ingredient_interactions_a', 'ingredient_interactions', ['ingredient_a'])
    op.create_index('idx_ingredient_interactions_b', 'ingredient_interactions', ['ingredient_b'])


def downgrade() -> None:
    op.drop_table('ingredient_interactions')
    op.drop_table('derm_reports')
    op.drop_table('skin_alerts')
