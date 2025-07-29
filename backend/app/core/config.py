"""
Configuration settings for AskiBill FastAPI backend
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "AskiBill"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = ""
    DATABASE_ECHO: bool = False
    
    # Security
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Banking APIs
    SETU_API_KEY: Optional[str] = None
    SETU_BASE_URL: str = "https://sandbox.setu.co"
    YODLEE_CLIENT_ID: Optional[str] = None
    YODLEE_CLIENT_SECRET: Optional[str] = None
    ANUMATI_API_KEY: Optional[str] = None
    
    # External Services
    REDIS_URL: str = "redis://localhost:6379"
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Encryption
    ENCRYPTION_KEY: Optional[str] = None
    
    # Mobile Push Notifications
    FCM_SERVER_KEY: Optional[str] = None
    APNS_KEY_ID: Optional[str] = None
    APNS_TEAM_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()


# Validate required settings
def validate_settings():
    """Validate required configuration settings"""
    required_settings = {
        "DATABASE_URL": settings.DATABASE_URL,
        "SECRET_KEY": settings.SECRET_KEY,
    }
    
    missing_settings = [key for key, value in required_settings.items() if not value]
    
    if missing_settings:
        raise ValueError(f"Missing required settings: {', '.join(missing_settings)}")


# Banking provider configuration
class BankingConfig:
    """Banking API provider configuration"""
    
    SUPPORTED_PROVIDERS = ["setu", "yodlee", "anumati"]
    
    PROVIDER_CONFIGS = {
        "setu": {
            "base_url": settings.SETU_BASE_URL,
            "api_key": settings.SETU_API_KEY,
            "supported_banks": [
                "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "bob", "canara"
            ]
        },
        "yodlee": {
            "base_url": "https://sandbox.api.yodlee.com/ysl",
            "client_id": settings.YODLEE_CLIENT_ID,
            "client_secret": settings.YODLEE_CLIENT_SECRET,
            "supported_banks": [
                "hdfc", "icici", "axis", "kotak", "yes", "indusind"
            ]
        },
        "anumati": {
            "base_url": "https://sandbox.anumati.com",
            "api_key": settings.ANUMATI_API_KEY,
            "supported_banks": [
                "sbi", "pnb", "bob", "union", "indian"
            ]
        }
    }
    
    @classmethod
    def get_provider_for_bank(cls, bank_id: str) -> Optional[str]:
        """Get the best provider for a specific bank"""
        for provider, config in cls.PROVIDER_CONFIGS.items():
            if bank_id in config.get("supported_banks", []):
                return provider
        return "setu"  # Default provider


# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "formatter": "detailed",
            "class": "logging.FileHandler",
            "filename": "askibill.log",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["default", "file"],
    },
    "loggers": {
        "uvicorn": {
            "level": "INFO",
            "handlers": ["default"],
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "level": "INFO" if settings.DATABASE_ECHO else "WARNING",
            "handlers": ["default"],
            "propagate": False,
        },
    },
}