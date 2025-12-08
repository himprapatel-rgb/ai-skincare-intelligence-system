"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str | None = Field(default=None, description="PostgreSQL database connection URL")

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

    # CORS Settings
    ALLOWED_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",  # Next.js dev
            "http://localhost:19006",  # Expo web
            "http://localhost:8081",  # Expo mobile
            "https://himprapatel-rgb.github.io",  # GitHub Pages production
            "https://ai-skincare-intelligence-system-production.up.railway.app",  # Railway backend
        ],
        description="List of allowed CORS origins",
    )

    # External AI provider keys
    GPTGPT_API_KEY: str | None = Field(
        default=None, description="API key for external GPTGPT service (optional)"
    )
    GPTGPT_API_BASE: str | None = Field(
        default=None,
        description="Optional base URL for GPTGPT API (overrides built-in default)",
    )

    # Summary endpoint protection token (for internal summary endpoint)
    SUMMARY_TOKEN: str | None = Field(
        default=None,
        description="Shared secret token required by internal summary endpoint",
    )

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
