"""Sprint 0 Database Integration Migration

Creates tables for:
- products (Open Beauty Facts, Sephora data)
- ingredients (EU CosIng database)
- ingredient_hazards (California CSCP data)

Revision ID: sprint0_001
Date: December 9, 2025
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade():
    """Create products, ingredients, and ingredient_hazards tables"""
    
    # Create products table
    op.create_table(
        'products',
        sa.Column('product_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('barcode', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(500)),
        sa.Column('brand', sa.String(255), index=True),
        sa.Column('ingredients_text', sa.Text()),
        sa.Column('allergens', postgresql.JSONB()),
        sa.Column('image_url', sa.String(500)),
        sa.Column('price_usd', sa.Numeric(10, 2)),
        sa.Column('rating', sa.Numeric(3, 2)),
        sa.Column('review_count', sa.Integer()),
        sa.Column('source', sa.String(50), server_default='openbeautyfacts', index=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('cached_until', sa.TIMESTAMP(), index=True),
    )
    
    # Create ingredients table
    op.create_table(
        'ingredients',
        sa.Column('ingredient_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('inci_name', sa.String(255), unique=True, nullable=False),
        sa.Column('cas_number', sa.String(50), index=True),
        sa.Column('ec_number', sa.String(50)),
        sa.Column('function', sa.String(255)),
        sa.Column('regulatory_status', sa.String(100)),
        sa.Column('restrictions', sa.Text()),
        sa.Column('microbiome_risk_flag', sa.Boolean(), server_default='false'),
        sa.Column('comedogenicity_score', sa.Integer()),
        sa.Column('source', sa.String(50), server_default='cosing'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
    )
    
    # Create case-insensitive index on inci_name
    op.create_index('idx_ingredients_inci_name_lower', 'ingredients', [sa.text('LOWER(inci_name)')])
    
    # Add check constraint for comedogenicity score
    op.create_check_constraint(
        'ck_comedogenicity_score',
        'ingredients',
        'comedogenicity_score >= 0 AND comedogenicity_score <= 5'
    )
    
    # Create ingredient_hazards table
    op.create_table(
        'ingredient_hazards',
        sa.Column('hazard_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('ingredient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ingredients.ingredient_id'), index=True),
        sa.Column('cas_number', sa.String(50), index=True),
        sa.Column('hazard_type', sa.String(100), index=True),
        sa.Column('regulatory_body', sa.String(50), server_default='california_cscp'),
        sa.Column('evidence_level', sa.String(50)),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
    )


def downgrade():
    """Drop all tables created in upgrade"""
    op.drop_table('ingredient_hazards')
    op.drop_table('ingredients')
    op.drop_table('products')
