"""Sprint 4 – Routines + Progress Tracking

Tables:
1. saved_routines
2. routine_products
3. progress_photos

Depends on Sprint 3 migration.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Alembic identifiers
revision = "sprint4_routines_tracking"
down_revision = "sprint3_digital_twin"   # REQUIRED BY USER
branch_labels = None
depends_on = None


def upgrade():
    # ---------------------------------------------------------
    # saved_routines
    # ---------------------------------------------------------
    op.create_table(
        "saved_routines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("routine_type", sa.String(32), nullable=False, server_default="custom"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_saved_routines_user_id", "saved_routines", ["user_id"])

    # ---------------------------------------------------------
    # routine_products (junction table)
    # ---------------------------------------------------------
    op.create_table(
        "routine_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "routine_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("saved_routines.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("step_order", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_routine_products_routine_id", "routine_products", ["routine_id"])
    op.create_index("ix_routine_products_product_id", "routine_products", ["product_id"])

    # ---------------------------------------------------------
    # progress_photos
    # ---------------------------------------------------------
    op.create_table(
        "progress_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "routine_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("saved_routines.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("photo_type", sa.String(32), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_progress_photos_user_id", "progress_photos", ["user_id"])
    op.create_index("ix_progress_photos_routine_id", "progress_photos", ["routine_id"])
    op.create_index("ix_progress_photos_taken_at", "progress_photos", ["taken_at"])


def downgrade():
    op.drop_table("progress_photos")
    op.drop_table("routine_products")
    op.drop_table("saved_routines")
