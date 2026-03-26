"""Alembic env.py — configured for Pellicura main database."""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from app.config import settings
from app.database import Base

# Import ALL models so autogenerate detects them
from app.models.user import User, UserProfile, UserConsent, UserAccessLog, PolicyVersion  # noqa: F401
from app.models.scan import ScanSession, SkinAnalysis, ConfidenceMetrics, FairnessMetrics  # noqa: F401
from app.models.analysis_outputs import (  # noqa: F401
    ScanOutput, ScanCondition, ScanRecommendation, DailySkinGuidance,
    EnvironmentalReading, GeoLocation, ProductRecommendation as PRModel,
    ProductStoreAvailability, SkinCondition, Store, UserEvent,
    UserProgressSnapshot,
)
from app.models.product_models import Product, Ingredient, ProductIngredient, ProductReview  # noqa: F401
from app.models.shelf import ShelfProduct  # noqa: F401
from app.models.favorites import UserFavorite  # noqa: F401
from app.models.goals import SkinGoal  # noqa: F401
from app.models.notifications import Notification  # noqa: F401
from app.models.content import Blog, NewsItem, Video  # noqa: F401
from app.models.saved_routine import SavedRoutine  # noqa: F401
from app.models.progress_photo import ProgressPhoto  # noqa: F401
from app.models.twin_models import (  # noqa: F401
    SkinStateSnapshot, SkinRegionState, EnvironmentSnapshot,
    RoutineInstance, RoutineProductUsage,
)
from app.models.engagement import (  # noqa: F401
    GeoAlert, NotificationEvent, ProductOffer, ProductScanItem,
    ProductScanSession, RoutineCheckin, RoutineRecommendation,
    UserNotification,
)

config = context.config

# Use app DATABASE_URL instead of alembic.ini value
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
