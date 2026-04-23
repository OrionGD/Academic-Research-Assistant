"""
Core configuration for ARAS platform
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    
    # Database
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database_name: str = os.getenv("DATABASE_NAME", "aras_db")
    
    # Redis
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_uri: str = os.getenv("REDIS_URI", "redis://localhost:6379")
    
    # ChromaDB
    chroma_persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_storage")
    
    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Server
    port: int = int(os.getenv("PORT", "5000"))
    environment: str = os.getenv("NODE_ENV", "development")
    allowed_origins: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:5000",
    ]
    
    # ML Models
    gemini_embedding_model: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL", "gemini-embedding-2-preview"
    )
    groq_chat_model: str = os.getenv(
        "GROQ_CHAT_MODEL", "llama-3.1-8b-instant"
    )
    
    # Chunking
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "500"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "100"))
    
    # Vector Search
    vector_num_candidates: int = int(os.getenv("VECTOR_NUM_CANDIDATES", "200"))
    vector_top_k: int = 5  # Number of chunks to retrieve
    
    # Admin
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@aras.ai")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
