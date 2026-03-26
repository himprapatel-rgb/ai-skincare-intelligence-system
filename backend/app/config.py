"""
Application configuration settings.
"""

import json
import logging
from typing import Any

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


def _parse_list_str(value: Any) -> list[str]:
    """Parse list from env: JSON array, comma-separated, or single string."""
    if isinstance(value, list):
        return value
    if not isinstance(value, str):
        return []
    s = value.strip()
    if not s:
        return []
    if s.startswith("["):
        try:
            out = json.loads(s)
            return out if isinstance(out, list) else [s]
        except json.JSONDecodeError:
            pass
    return [x.strip() for x in s.split(",") if x.strip()]


DEFAULT_ORIGINS = [
    "http://localhost:3000", "http://localhost:5173", "http://localhost:19006",
    "http://localhost:8081", "https://himprapatel-rgb.github.io",
    "https://ai-skincare-intelligence-system-production.up.railway.app",
    "https://frontend-production-0415.up.railway.app",
    "https://pellicura.com", "https://www.pellicura.com",
    "https://pellicura.pages.dev", "https://staging.pellicura.pages.dev",
]
DEFAULT_HOSTS = ["*", "healthcheck.railway.app", "ai-skincare-intelligence-system-production.up.railway.app"]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Main Database (users, scans, shelf, routines)
    DATABASE_URL: str | None = Field(default=None, description="PostgreSQL database connection URL")
    
    # Product Catalog Database (separate database for products, ingredients, brands)
    # This enables a two-database architecture for better scalability
    PRODUCT_DATABASE_URL: str | None = Field(
        default=None, 
        description="PostgreSQL connection URL for product catalog database (separate from main DB)"
    )

    # JWT Settings
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production", description="Secret key for JWT token generation")
    ALGORITHM: str = Field(default="HS256", description="Algorithm for JWT encoding")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, description="Access token expiration time in minutes"
    )

    # Application Settings
    APP_NAME: str = Field(
        default="AI Skincare Intelligence System", description="Application name"
    )
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    ENV: str = Field(default="development", description="Runtime environment")
    REQUEST_TIMEOUT_SECONDS: int = Field(
        default=30,
        description="Global request timeout in seconds",
    )
    MAX_REQUEST_BODY_BYTES: int = Field(
        default=5 * 1024 * 1024,
        description="Max request body size in bytes",
    )
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend base URL for email verification links",
    )

    # Database connection pool settings (main DB)
    DB_POOL_SIZE: int = Field(default=3, description="SQLAlchemy pool size for main DB (per worker)")
    DB_MAX_OVERFLOW: int = Field(default=7, description="SQLAlchemy max overflow for main DB (per worker)")
    DB_POOL_TIMEOUT: int = Field(
        default=5,
        description="Seconds to wait for a DB connection before failing",
    )
    DB_POOL_RECYCLE: int = Field(default=1800, description="Recycle seconds for main DB")
    DB_STATEMENT_TIMEOUT_MS: int = Field(
        default=8000,
        description="Postgres statement timeout in milliseconds",
    )

    # Product database connection pool settings
    PRODUCT_DB_POOL_SIZE: int = Field(default=2, description="Pool size for product DB (per worker)")
    PRODUCT_DB_MAX_OVERFLOW: int = Field(default=5, description="Max overflow for product DB (per worker)")
    PRODUCT_DB_POOL_TIMEOUT: int = Field(default=5, description="Pool timeout for product DB")
    PRODUCT_DB_POOL_RECYCLE: int = Field(default=1800, description="Recycle seconds for product DB")
    PRODUCT_DB_STATEMENT_TIMEOUT_MS: int = Field(
        default=8000,
        description="Postgres statement timeout for product DB in milliseconds",
    )

    # CORS Settings - stored as str to avoid pydantic-settings JSON decode of env
    allowed_origins_raw: str | None = Field(default=None, alias="ALLOWED_ORIGINS")
    allowed_hosts_raw: str | None = Field(default=None, alias="ALLOWED_HOSTS")

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        """CORS allowed origins. Always includes production frontends (pellicura.com, Railway)."""
        extra = _parse_list_str(self.allowed_origins_raw) if self.allowed_origins_raw and self.allowed_origins_raw.strip() else []
        combined = list(DEFAULT_ORIGINS)
        for o in extra:
            if o and o not in combined:
                combined.append(o)
        return combined

    @property
    def ALLOWED_HOSTS(self) -> list[str]:
        if not self.allowed_hosts_raw or not self.allowed_hosts_raw.strip():
            return DEFAULT_HOSTS
        return _parse_list_str(self.allowed_hosts_raw) or DEFAULT_HOSTS

    # External AI provider keys
    GPTGPT_API_KEY: str | None = Field(
        default=None, description="API key for external GPTGPT service (optional)"
    )
    GPTGPT_API_BASE: str | None = Field(
        default=None,
        description="Optional base URL for GPTGPT API (overrides built-in default)",
    )

    # OpenAI Vision API settings
    OPENAI_API_KEY: str | None = Field(
        default=None, description="OpenAI API key for vision analysis"
    )
    OPENAI_API_BASE: str = Field(
        default="https://api.openai.com/v1",
        description="Base URL for OpenAI API",
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o-mini",
        description="OpenAI model for vision analysis",
    )
    OPENAI_TIMEOUT_SECONDS: int = Field(
        default=60, description="OpenAI API timeout in seconds"
    )

    # Anthropic API (for future Claude-powered features)
    ANTHROPIC_API_KEY: str | None = Field(
        default=None, description="Anthropic API key for Claude"
    )

    # Skinive API settings
    SKINIVE_API_BASE: str = Field(
        default="https://api.skiniver.com",
        description="Base URL for Skinive API",
    )
    SKINIVE_API_TOKEN: str | None = Field(
        default=None, description="Skinive API token"
    )
    SKINIVE_LOCALE: str = Field(
        default="en", description="Skinive response locale"
    )
    SKINIVE_TIMEOUT_SECONDS: int = Field(
        default=30, description="Skinive API timeout in seconds"
    )

    # Summary endpoint protection token (for internal summary endpoint)
    SUMMARY_TOKEN: str | None = Field(
        default=None,
        description="Shared secret token required by internal summary endpoint",
    )

    # Amazon Product Advertising API (affiliate product recommendations)
    AMAZON_ACCESS_KEY: str | None = Field(
        default=None, description="Amazon PA-API access key (Associates)"
    )
    AMAZON_SECRET_KEY: str | None = Field(
        default=None, description="Amazon PA-API secret key"
    )
    AMAZON_PARTNER_TAG: str | None = Field(
        default=None, description="Amazon Associates partner/tracking tag for affiliate links"
    )
    AMAZON_COUNTRY: str = Field(
        default="US", description="Amazon marketplace country code (US, UK, DE, etc.)"
    )
    AMAZON_SEARCH_INDEX: str = Field(
        default="Beauty", description="PA-API SearchIndex for product category (e.g. Beauty)"
    )

    # Refresh token
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry in days")

    # Sentry error tracking
    SENTRY_DSN: str | None = Field(default=None, description="Sentry DSN for backend error tracking")

    # Rate limiting (multi-worker / multi-instance): when set, scan rate limit uses Redis
    REDIS_URL: str | None = Field(
        default=None,
        description="Redis URL for shared rate limiting (e.g. redis://default:pass@host:6379). If unset, in-memory per-process limit is used.",
    )

    # Admin access control
    ADMIN_EMAIL_ALLOWLIST: str = Field(
        default="",
        description="Comma-separated list of admin emails (must also have is_admin flag)",
    )

    # SMTP settings for email verification
    SMTP_HOST: str | None = Field(default=None, description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USERNAME: str | None = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: str | None = Field(default=None, description="SMTP password")
    SMTP_FROM_EMAIL: str | None = Field(default=None, description="Default sender email")
    SMTP_USE_TLS: bool = Field(default=True, description="Enable STARTTLS")
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: str | None = Field(default=None, description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: str | None = Field(default=None, description="Google OAuth client secret")

        # ML Model Configuration
    MODEL_SOURCE: str = Field(
        default="volume",
        description="Model source: 'volume' (Railway) or 'download' (external URL)"
    )
    MODEL_PATH: str = Field(
        default="/models/skin_analysis_v1.pth",
        description="Path to model file when using volume source"
    )
    MODEL_URL: str | None = Field(
        default=None,
        description="HTTPS URL to download model (required if MODEL_SOURCE='download')"
    )
    MODEL_SHA256: str | None = Field(
        default=None,
        description="SHA256 checksum for downloaded model verification"
    )
    MODEL_VERSION: str = Field(
        default="1.0.0",
        description="Model version identifier for tracking"
    )

    model_config = {"env_file": ".env", "case_sensitive": True, "populate_by_name": True}

    @model_validator(mode="after")
    def _warn_insecure_defaults(self) -> "Settings":
        if self.SECRET_KEY == "dev-secret-key-change-in-production":
            logger.warning(
                "SECRET_KEY is using the default development value — "
                "set a strong SECRET_KEY env var before deploying to production"
            )
        return self


# Create settings instance
settings = Settings()
