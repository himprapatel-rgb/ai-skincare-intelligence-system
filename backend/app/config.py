"""
Application configuration settings.
"""

import json
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings


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
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend base URL for email verification links",
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


# Create settings instance
settings = Settings()
