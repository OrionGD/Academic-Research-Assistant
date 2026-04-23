"""
Database models/schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class Document(BaseModel):
    """Document model"""
    document_id: str
    title: str
    summary: str
    keywords: List[str] = []
    topics: List[str] = []
    chunk_count: int
    reading_time: int
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    source_url: Optional[str] = None
    text_length: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "document_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Academic Paper",
                "summary": "This paper discusses...",
                "keywords": ["keyword1", "keyword2"],
                "topics": ["topic1", "topic2"],
                "chunk_count": 50,
                "reading_time": 15,
                "file_name": "paper.pdf"
            }
        }


class ChatMessage(BaseModel):
    """Chat message model"""
    document_id: str
    user_id: Optional[str] = None
    query: str
    answer: str
    similarity_scores: List[float] = []
    source_count: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        schema_extra = {
            "example": {
                "document_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "query": "What is the main topic?",
                "answer": "The main topic is...",
                "similarity_scores": [0.95, 0.87, 0.82],
                "source_count": 3
            }
        }


class User(BaseModel):
    """User model"""
    user_id: str
    email: str
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    documents: List[str] = []
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "email": "user@example.com",
                "username": "username",
                "password_hash": "hashed_password"
            }
        }
