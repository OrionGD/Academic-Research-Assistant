"""
Document models
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import Field, HttpUrl
from .base import BaseMongoModel
from .user import PyObjectId


class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    MD = "md"
    URL = "url"


class DocumentBase(BaseMongoModel):
    user_id: PyObjectId
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_url: Optional[HttpUrl] = None
    file_size: Optional[int] = None
    file_type: DocumentType
    status: DocumentStatus = DocumentStatus.UPLOADING
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    language: Optional[str] = None
    is_public: bool = False
    chunk_count: int = 0
    processed_at: Optional[datetime] = None


class DocumentCreate(BaseMongoModel):
    title: str
    description: Optional[str] = None
    file_type: DocumentType
    is_public: bool = False
    tags: Optional[List[str]] = None


class DocumentUpdate(BaseMongoModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class Chunk(BaseMongoModel):
    document_id: PyObjectId
    user_id: PyObjectId
    content: str
    chunk_index: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding_vector: Optional[List[float]] = None
    token_count: Optional[int] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
