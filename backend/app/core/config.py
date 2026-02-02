"""
Centralized Configuration Management
Loads environment variables and defines application settings.
Supports different configurations for development, testing, and production.
"""

import os
import secrets
from typing import List, Optional, Dict, Any, Union
from pydantic import AnyHttpUrl, BaseSettings, validator, PostgresDsn, Field
from pydantic.networks import AnyUrl
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application Settings"""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    API_VERSION: str = "1.0.0"
    PROJECT_NAME: str = "Research Assistant API"
    PROJECT_DESCRIPTION: str = "RAG-based Research Assistant with Document Management and Semantic Search"
    DEBUG: bool = False
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # Frontend dev server
        "http://localhost:8000",  # Backend dev server
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: str = "5432"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = ""
    DATABASE_NAME: str = "research_assistant"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    DATABASE_POOL_RECYCLE: int = 3600
    DATABASE_POOL_PRE_PING: bool = True
    DATABASE_ECHO: bool = False
    
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("DATABASE_USER"),
            password=values.get("DATABASE_PASSWORD"),
            host=values.get("DATABASE_HOST"),
            port=values.get("DATABASE_PORT"),
            path=f"/{values.get('DATABASE_NAME') or ''}",
        )
    
    # Redis (for caching and rate limiting)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # Vector Database (ChromaDB/Weaviate/Pinecone)
    VECTOR_DB_TYPE: str = "chromadb"  # chromadb, weaviate, pinecone
    VECTOR_DB_HOST: str = "localhost"
    VECTOR_DB_PORT: int = 8000
    VECTOR_DB_COLLECTION: str = "research_documents"
    VECTOR_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    VECTOR_EMBEDDING_DIM: int = 384
    
    # ChromaDB specific
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    # Weaviate specific
    WEAVIATE_API_KEY: Optional[str] = None
    WEAVIATE_CLUSTER_URL: Optional[str] = None
    
    # Pinecone specific
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: Optional[str] = None
    
    # LLM Configuration (OpenAI/Anthropic/Local)
    LLM_PROVIDER: str = "openai"  # openai, anthropic, local
    LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 2000
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_ORGANIZATION: Optional[str] = None
    
    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Local LLM (Ollama, vLLM, etc.)
    LOCAL_LLM_HOST: str = "localhost"
    LOCAL_LLM_PORT: int = 11434
    LOCAL_LLM_TIMEOUT: int = 300
    
    # Search Configuration
    SEARCH_TOP_K: int = 10
    SEARCH_SIMILARITY_THRESHOLD: float = 0.7
    SEARCH_HYBRID_ALPHA: float = 0.5  # 0.5 = equal weight, 1.0 = semantic only, 0.0 = keyword only
    
    # Document Processing
    MAX_FILE_SIZE_MB: int = 100
    UPLOAD_DIR: str = "./uploads"
    PROCESSED_DIR: str = "./processed"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # Supported file formats
    SUPPORTED_FORMATS: List[str] = ["pdf", "docx", "txt", "md", "html"]
    
    # OCR Configuration (for scanned PDFs)
    ENABLE_OCR: bool = True
    TESSERACT_PATH: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_BURST_SIZE: int = 10
    
    # Email (for notifications)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Monitoring & Logging
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True
    SENTRY_DSN: Optional[str] = None
    
    # Feature Flags
    FEATURE_STREAMING_RESPONSES: bool = True
    FEATURE_WEBSEARCH: bool = False
    FEATURE_MULTILINGUAL: bool = True
    FEATURE_CITATION_GENERATION: bool = True
    
    # Academic Institution Features
    ENABLE_INSTITUTION_AUTH: bool = False
    ENABLE_LIBRARY_INTEGRATION: bool = False
    ENABLE_CITATION_STYLES: bool = True
    
    # AWS S3 (for file storage)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    USE_S3_STORAGE: bool = False
    
    # Celery (for background tasks)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    ENABLE_CELERY: bool = True
    
    # API Keys for external services
    GOOGLE_SEARCH_API_KEY: Optional[str] = None
    GOOGLE_CSE_ID: Optional[str] = None
    ARXIV_API_KEY: Optional[str] = None
    SEMANTIC_SCHOLAR_API_KEY: Optional[str] = None
    
    # WebSocket Configuration
    WEBSOCKET_PING_INTERVAL: int = 20
    WEBSOCKET_PING_TIMEOUT: int = 40
    WEBSOCKET_MAX_SIZE: int = 1000000  # 1MB
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create settings instance
settings = Settings()


class DevelopmentSettings(Settings):
    """Development environment settings"""
    DEBUG: bool = True
    DATABASE_ECHO: bool = True
    LOG_LEVEL: str = "DEBUG"
    ENVIRONMENT: str = "development"
    
    class Config:
        env_prefix = "DEV_"


class TestingSettings(Settings):
    """Testing environment settings"""
    DEBUG: bool = True
    DATABASE_NAME: str = "research_assistant_test"
    ENVIRONMENT: str = "testing"
    REDIS_DB: int = 1  # Use different DB for testing
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db_test"
    UPLOAD_DIR: str = "./test_uploads"
    
    class Config:
        env_prefix = "TEST_"


class ProductionSettings(Settings):
    """Production environment settings"""
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    LOG_LEVEL: str = "WARNING"
    DATABASE_POOL_SIZE: int = 50
    DATABASE_MAX_OVERFLOW: int = 100
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 30
    
    class Config:
        env_prefix = "PROD_"


def get_settings() -> Settings:
    """Get settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Export settings
settings = get_settings()