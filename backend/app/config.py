"""
Application configuration settings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL database connection URL"
    )
    
    # JWT Settings
    SECRET_KEY: str = Field(
        ...,
        description="Secret key for JWT token generation"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="Algorithm for JWT encoding"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )
    
    # Application Settings
    APP_NAME: str = Field(
        default="AI Skincare Intelligence System",
        description="Application name"
    )
    APP_VERSION: str = Field(
        default="1.0.0",
        description="Application version"
    )
    DEBUG: bool = Field(
        default=False,
        description="Debug mode"
    )
    
    # CORS Settings
    ALLOWED_ORIGINS: list[str] = Field(
        default=[
            "http://localhost:3000",  # Next.js dev
            "http://localhost:19006",  # Expo web
            "http://localhost:8081",   # Expo mobile
        ],
        description="List of allowed CORS origins"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
