"""
Core configuration for ScholarAI platform
"""
import os
from typing import Optional, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Settings
    app_name: str = "ScholarAI"
    debug: bool = False
    
    # API Keys
    gemini_api_key: str = ""
    gemini_embedding_api_key: str = ""
    gemini_analysis_api_key: str = ""
    groq_api_key: str = ""
    hf_token: str = ""
    
    # Database
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "scholarai_db"
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_uri: str = "redis://localhost:6379"
    
    # ChromaDB
    chroma_persist_dir: str = "./chroma_storage"
    chroma_db_path: str = "./chroma_db" # Alias for compatibility
    

    
    # Server
    port: int = 2022
    environment: str = "development"
    allowed_origins: Union[List[str], str] = [
        "http://localhost:3033",
        "http://127.0.0.1:3033",
        "http://localhost:3000",
        "http://localhost:2022",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # ML Models
    enable_remote_embeddings: bool = False
    local_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    gemini_embedding_model: str = "gemini-embedding-2-preview"
    gemini_embedding_dim: int = 3072
    gemini_analysis_model: str = "gemma-4-26b-a4b-it"
    groq_chat_model: str = "llama-3.1-8b-instant"
    llm_provider: str = "groq"
    
    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Vector Search
    vector_num_candidates: int = 200
    vector_top_k: int = 5  # Number of chunks to retrieve
    
    # Admin
    admin_email: str = "admin@scholarai.ai"
    
    @property
    def gemini_chat_model(self):
        """Legacy alias for gemini_analysis_model"""
        return self.gemini_analysis_model

    
    # Additional fields from .env
    ml_service_url: str = ""
    ml_service_api_key: str = ""
    

    
    # URLs
    frontend_url: str = "http://localhost:3033"
    


    # Legacy uppercase aliases for compatibility
    @property
    def MONGODB_URI(self): return self.mongodb_uri
    @property
    def DATABASE_NAME(self): return self.database_name

    @property
    def REDIS_URL(self): return self.redis_uri
    @property
    def GROQ_API_KEY(self): return self.groq_api_key
    @property
    def GEMINI_API_KEY(self): return self.gemini_api_key
    @property
    def CHROMA_DB_PATH(self): return self.chroma_db_path

    @property
    def FRONTEND_URL(self): return self.frontend_url

    @property
    def ENABLE_REMOTE_EMBEDDINGS(self): return self.enable_remote_embeddings
    @property
    def LOCAL_EMBEDDING_MODEL(self): return self.local_embedding_model
    @property
    def GROQ_CHAT_MODEL(self): return self.groq_chat_model
    @property
    def GEMINI_EMBEDDING_MODEL(self): return self.gemini_embedding_model
    @property
    def GEMINI_ANALYSIS_MODEL(self): return self.gemini_analysis_model

    @property
    def DEBUG(self): return self.debug
    @property
    def CHUNK_SIZE(self): return self.chunk_size
    @property
    def CHUNK_OVERLAP(self): return self.chunk_overlap
    @property
    def LLM_PROVIDER(self): return self.llm_provider

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }



settings = Settings()

# Trigger reload
