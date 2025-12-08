"""Sprint 3 – Digital Twin feature core tables.

Tables:
1. user_digital_twins
2. twin_snapshots
3. twin_timeline_points
4. twin_predictions
5. twin_recommendations
6. product_effects
7. twin_correlations
8. twin_insights
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# -------------------------------------------------------------------------
# Alembic identifiers
# -------------------------------------------------------------------------

revision = "sprint3_digital_twin"
down_revision = None  # TODO: replace with your latest revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------------------
    # 1. user_digital_twins
    # ---------------------------------------------------------------------
    op.create_table(
        "user_digital_twins",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "skin_type",
            sa.String(length=64),
            nullable=True,
        ),
        sa.Column(
            "concerns",
            sa.JSON(),
            nullable=True,
            comment="Array/dict of user skin concerns.",
        ),
        sa.Column(
            "goals",
            sa.JSON(),
            nullable=True,
            comment="Array/dict of user skincare goals.",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
            comment="Additional metadata / flags for the twin.",
        ),
    )

    op.create_index(
        "ix_user_digital_twins_user_id",
        "user_digital_twins",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_digital_twins_status",
        "user_digital_twins",
        ["status"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 2. twin_snapshots
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_snapshots",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "snapshot_date",
            sa.DateTime(timezone=True),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "skin_metrics",
            sa.JSON(),
            nullable=True,
            comment="Global metrics snapshot (e.g. redness_index, texture_score).",
        ),
        sa.Column(
            "product_usage",
            sa.JSON(),
            nullable=True,
            comment="Products used around this snapshot.",
        ),
        sa.Column(
            "environmental_factors",
            sa.JSON(),
            nullable=True,
            comment="Environmental context (UV, humidity, pollution, etc.).",
        ),
        sa.Column(
            "lifestyle_data",
            sa.JSON(),
            nullable=True,
            comment="Lifestyle factors (sleep, stress, nutrition, etc.).",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_snapshots_twin_id",
        "twin_snapshots",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_snapshots_snapshot_date",
        "twin_snapshots",
        ["snapshot_date"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 3. twin_timeline_points
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_timeline_points",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "event_type",
            sa.String(length=64),
            nullable=False,
            comment="Type of event, e.g. 'scan', 'routine_change', 'recommendation_applied'.",
        ),
        sa.Column(
            "skin_score",
            sa.Float(),
            nullable=True,
            comment="Optional aggregated/normalized skin score at this point.",
        ),
        sa.Column(
            "change_vector",
            sa.JSON(),
            nullable=True,
            comment="Delta info, e.g. before/after changes in key metrics.",
        ),
        sa.Column(
            "context",
            sa.JSON(),
            nullable=True,
            comment="Additional context for this event (products, environment, etc.).",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_timeline_points_twin_id",
        "twin_timeline_points",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_timeline_points_timestamp",
        "twin_timeline_points",
        ["timestamp"],
        unique=False,
    )
    op.create_index(
        "ix_twin_timeline_points_event_type",
        "twin_timeline_points",
        ["event_type"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 4. twin_predictions
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_predictions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "prediction_date",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Target date this prediction refers to.",
        ),
        sa.Column(
            "predicted_state",
            sa.JSON(),
            nullable=True,
            comment="Predicted skin state vector / regional metrics.",
        ),
        sa.Column(
            "confidence_score",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "factors",
            sa.JSON(),
            nullable=True,
            comment="Key factors influencing this prediction.",
        ),
        sa.Column(
            "recommendations",
            sa.JSON(),
            nullable=True,
            comment="Embedded recommendations related to this prediction.",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_predictions_twin_id",
        "twin_predictions",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_predictions_created_at",
        "twin_predictions",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_twin_predictions_prediction_date",
        "twin_predictions",
        ["prediction_date"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 5. twin_recommendations
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_recommendations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "recommendation_type",
            sa.String(length=64),
            nullable=False,
            comment="e.g. 'routine', 'product', 'lifestyle'.",
        ),
        sa.Column(
            "priority",
            sa.Integer(),
            nullable=True,
            comment="Lower number = higher priority (e.g. 1–5).",
        ),
        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "products",
            sa.JSON(),
            nullable=True,
            comment="List/structure of recommended products.",
        ),
        sa.Column(
            "actions",
            sa.JSON(),
            nullable=True,
            comment="List/structure of recommended actions (steps, habits, etc.).",
        ),
        sa.Column(
            "expected_impact",
            sa.JSON(),
            nullable=True,
            comment="Estimated impact on skin metrics.",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_recommendations_twin_id",
        "twin_recommendations",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_recommendations_created_at",
        "twin_recommendations",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_twin_recommendations_priority",
        "twin_recommendations",
        ["priority"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 6. product_effects
    # ---------------------------------------------------------------------
    op.create_table(
        "product_effects",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "start_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "end_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "observed_effects",
            sa.JSON(),
            nullable=True,
            comment="Observed positive/neutral/negative effects over the period.",
        ),
        sa.Column(
            "side_effects",
            sa.JSON(),
            nullable=True,
            comment="Any side effects or adverse reactions.",
        ),
        sa.Column(
            "effectiveness_score",
            sa.Float(),
            nullable=True,
            comment="Aggregated effectiveness rating (e.g. 0–1, 0–10).",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_product_effects_product_id",
        "product_effects",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_effects_twin_id",
        "product_effects",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_product_effects_start_date",
        "product_effects",
        ["start_date"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 7. twin_correlations
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_correlations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "factor_type",
            sa.String(length=64),
            nullable=False,
            comment="e.g. 'product', 'environment', 'lifestyle'.",
        ),
        sa.Column(
            "factor_value",
            sa.String(length=255),
            nullable=True,
            comment="Identifier for the factor: product_id, city, habit name, etc.",
        ),
        sa.Column(
            "correlation_strength",
            sa.Float(),
            nullable=True,
            comment="e.g. Pearson r or similar (-1 to 1).",
        ),
        sa.Column(
            "observations",
            sa.JSON(),
            nullable=True,
            comment="Raw/aggregated observations underlying this correlation.",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_correlations_twin_id",
        "twin_correlations",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_correlations_factor_type",
        "twin_correlations",
        ["factor_type"],
        unique=False,
    )

    # ---------------------------------------------------------------------
    # 8. twin_insights
    # ---------------------------------------------------------------------
    op.create_table(
        "twin_insights",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "twin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_digital_twins.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "insight_type",
            sa.String(length=64),
            nullable=False,
            comment="e.g. 'trend', 'risk', 'opportunity'.",
        ),
        sa.Column(
            "severity",
            sa.String(length=32),
            nullable=True,
            comment="e.g. 'low', 'medium', 'high'.",
        ),
        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "data_points",
            sa.JSON(),
            nullable=True,
            comment="Underlying data points used to generate this insight.",
        ),
        sa.Column(
            "confidence",
            sa.Float(),
            nullable=True,
            comment="Confidence score in the insight (0–1, 0–100).",
        ),
        sa.Column(
            "action_items",
            sa.JSON(),
            nullable=True,
            comment="Suggested actions / follow-ups.",
        ),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_twin_insights_twin_id",
        "twin_insights",
        ["twin_id"],
        unique=False,
    )
    op.create_index(
        "ix_twin_insights_created_at",
        "twin_insights",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_twin_insights_insight_type",
        "twin_insights",
        ["insight_type"],
        unique=False,
    )


def downgrade() -> None:
    # Drop in reverse dependency order

    op.drop_index("ix_twin_insights_insight_type", table_name="twin_insights")
    op.drop_index("ix_twin_insights_created_at", table_name="twin_insights")
    op.drop_index("ix_twin_insights_twin_id", table_name="twin_insights")
    op.drop_table("twin_insights")

    op.drop_index("ix_twin_correlations_factor_type", table_name="twin_correlations")
    op.drop_index("ix_twin_correlations_twin_id", table_name="twin_correlations")
    op.drop_table("twin_correlations")

    op.drop_index("ix_product_effects_start_date", table_name="product_effects")
    op.drop_index("ix_product_effects_twin_id", table_name="product_effects")
    op.drop_index("ix_product_effects_product_id", table_name="product_effects")
    op.drop_table("product_effects")

    op.drop_index(
        "ix_twin_recommendations_priority",
        table_name="twin_recommendations",
    )
    op.drop_index(
        "ix_twin_recommendations_created_at",
        table_name="twin_recommendations",
    )
    op.drop_index("ix_twin_recommendations_twin_id", table_name="twin_recommendations")
    op.drop_table("twin_recommendations")

    op.drop_index(
        "ix_twin_predictions_prediction_date",
        table_name="twin_predictions",
    )
    op.drop_index("ix_twin_predictions_created_at", table_name="twin_predictions")
    op.drop_index("ix_twin_predictions_twin_id", table_name="twin_predictions")
    op.drop_table("twin_predictions")

    op.drop_index(
        "ix_twin_timeline_points_event_type",
        table_name="twin_timeline_points",
    )
    op.drop_index(
        "ix_twin_timeline_points_timestamp",
        table_name="twin_timeline_points",
    )
    op.drop_index(
        "ix_twin_timeline_points_twin_id",
        table_name="twin_timeline_points",
    )
    op.drop_table("twin_timeline_points")

    op.drop_index(
        "ix_twin_snapshots_snapshot_date",
        table_name="twin_snapshots",
    )
    op.drop_index("ix_twin_snapshots_twin_id", table_name="twin_snapshots")
    op.drop_table("twin_snapshots")

    op.drop_index("ix_user_digital_twins_status", table_name="user_digital_twins")
    op.drop_index("ix_user_digital_twins_user_id", table_name="user_digital_twins")
    op.drop_table("user_digital_twins")
