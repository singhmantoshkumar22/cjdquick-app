"""
B2C Courier Backend Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "CJDQuick B2C Courier API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development")

    # Database - Using B2C Singapore (qfqztrmnvbdmejyclvvc)
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/b2c"
    )
    DIRECT_URL: Optional[str] = None

    # Security
    SECRET_KEY: str = Field(default="change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    FRONTEND_URL: str = Field(default="http://localhost:3002")
    ALLOWED_ORIGINS: list[str] = Field(default=[
        "http://localhost:3002",
        "https://b2c-steel.vercel.app",
    ])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

    @property
    def database_url_sync(self) -> str:
        """Get synchronous database URL"""
        url = self.DIRECT_URL or self.DATABASE_URL
        if "pgbouncer=true" in url:
            url = url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
