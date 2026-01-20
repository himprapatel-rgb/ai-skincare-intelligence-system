"""
Application configuration settings.
"""

from pydantic import Field
from pydantic_settings import BaseSettings


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
                        "https://frontend-production-0415.up.railway.app",  # Railway frontend
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

    # YouCam API settings
    YOUCAM_API_BASE: str = Field(
        default="https://yce-api-01.makeupar.com",
        description="Base URL for YouCam API",
    )
    YOUCAM_API_KEY: str | None = Field(
        default=None, description="YouCam API key"
    )
    YOUCAM_TIMEOUT_SECONDS: int = Field(
        default=30, description="YouCam API timeout in seconds"
    )
    YOUCAM_POLL_INTERVAL_SECONDS: int = Field(
        default=2, description="YouCam polling interval in seconds"
    )
    YOUCAM_MAX_POLL_SECONDS: int = Field(
        default=120, description="YouCam max polling wait in seconds"
    )
    YOUCAM_SKIN_ANALYSIS_FORMAT: str = Field(
        default="json", description="YouCam skin analysis response format"
    )
    YOUCAM_SKIN_ANALYSIS_ACTIONS: str = Field(
        default="wrinkle,texture,acne,redness,age_spot,pore",
        description="Comma-separated YouCam skin analysis actions",
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

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
