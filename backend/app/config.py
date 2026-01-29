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
    ENV: str = Field(default="development", description="Runtime environment")
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend base URL for email verification links",
    )

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

    ALLOWED_HOSTS: list[str] = Field(
        default=["*"],
        description="Allowed hostnames for TrustedHostMiddleware",
    )

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

    # AI Processing Provider Configuration
    # Options: "replicate" (cloud), "self_hosted" (your own server)
    AI_PROVIDER: str = Field(
        default="replicate",
        description="AI provider: 'replicate' (cloud) or 'self_hosted' (your Dell server)"
    )
    
    # Self-Hosted Server URL (for future home server setup)
    SELF_HOSTED_ML_URL: str = Field(
        default="http://localhost:5000",
        description="URL of your self-hosted ML server (Dell server at home)"
    )
    SELF_HOSTED_ML_TOKEN: str | None = Field(
        default=None,
        description="API token for self-hosted ML server (optional security)"
    )

    # Replicate AI API (Cloud - Pay per use)
    REPLICATE_API_TOKEN: str | None = Field(
        default=None,
        description="Replicate API token for premium AI models (3D face, enhancement)"
    )

    # Cloudflare R2 Storage (S3-compatible)
    R2_ACCESS_KEY_ID: str | None = Field(
        default=None,
        description="Cloudflare R2 access key ID"
    )
    R2_SECRET_ACCESS_KEY: str | None = Field(
        default=None,
        description="Cloudflare R2 secret access key"
    )
    R2_BUCKET_NAME: str = Field(
        default="pellicura-assets",
        description="Cloudflare R2 bucket name"
    )
    R2_PUBLIC_URL: str | None = Field(
        default=None,
        description="Public URL for R2 bucket (e.g., https://pub-xxx.r2.dev)"
    )

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
