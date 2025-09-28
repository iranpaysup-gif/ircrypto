"""
Configuration settings for the Iranian cryptocurrency exchange backend
"""

import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Database Configuration
    mongo_url: str = Field(default="mongodb://localhost:27017", env="MONGO_URL")
    db_name: str = Field(default="wallex_db", env="DB_NAME")
    
    # CORS Configuration
    cors_origins: str = Field(default="*", env="CORS_ORIGINS")
    
    # JWT Configuration
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # API.ir Configuration for SMS and Shahkar KYC
    API_IR_API_KEY: str = Field(default="", env="API_IR_API_KEY")
    API_IR_BEARER_TOKEN: str = Field(default="", env="API_IR_BEARER_TOKEN")
    API_IR_BASE_URL: str = Field(default="https://s.api.ir/api", env="API_IR_BASE_URL")
    
    # SMS Configuration
    SMS_RATE_LIMIT_PER_HOUR: int = Field(default=10, env="SMS_RATE_LIMIT_PER_HOUR")
    SMS_OTP_LENGTH: int = Field(default=6, env="SMS_OTP_LENGTH")
    SMS_OTP_EXPIRY_MINUTES: int = Field(default=5, env="SMS_OTP_EXPIRY_MINUTES")
    
    # KYC Configuration
    KYC_MAX_ATTEMPTS: int = Field(default=3, env="KYC_MAX_ATTEMPTS")
    KYC_VERIFICATION_TIMEOUT_HOURS: int = Field(default=48, env="KYC_VERIFICATION_TIMEOUT_HOURS")
    
    # Wallex API Configuration
    WALLEX_API_URL: str = Field(default="https://api.wallex.ir", env="WALLEX_API_URL")
    WALLEX_API_KEY: Optional[str] = Field(default=None, env="WALLEX_API_KEY")
    
    # Security Settings
    MIN_PASSWORD_LENGTH: int = Field(default=8, env="MIN_PASSWORD_LENGTH")
    MAX_LOGIN_ATTEMPTS: int = Field(default=5, env="MAX_LOGIN_ATTEMPTS")
    
    # Application Settings
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create global settings instance
settings = Settings()

# Environment-specific configurations
def get_cors_origins():
    """Get CORS origins as a list"""
    if settings.cors_origins == "*":
        return ["*"]
    return [origin.strip() for origin in settings.cors_origins.split(",")]

def is_production() -> bool:
    """Check if running in production environment"""
    return settings.ENVIRONMENT.lower() == "production"

def is_development() -> bool:
    """Check if running in development environment"""
    return settings.ENVIRONMENT.lower() == "development"