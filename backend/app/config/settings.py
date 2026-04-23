from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "ARAS"
    DEBUG: bool = False
    # Database Settings
    MONGODB_URI: str
    DATABASE_NAME: str = "aras_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI Services
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_CHAT_MODEL: str = "llama-3.1-8b-instant"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-2-preview"
    
    # ML Config
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    CHROMA_DB_PATH: str = "./chroma_db"
    
    # Placeholder for billing (Real integration removed)
    
    # Pricing
    PRICE_PRO_MONTHLY: int = 1499
    PRICE_PRO_ANNUAL: int = 14999
    PRICE_ENTERPRISE_MONTHLY: int = 7999
    PRICE_ENTERPRISE_ANNUAL: int = 79999
    
    # Session Settings
    SESSION_COOKIE_NAME: str = "aras_session"
    SESSION_EXPIRE_SECONDS: int = 3600 * 24 * 7  # 7 days
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
