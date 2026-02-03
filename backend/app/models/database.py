"""
SQLAlchemy ORM models representing database tables.
Defines core data structures with relationships and constraints.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, 
    ForeignKey, Float, JSON, Index, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """
    User model representing application users with authentication and preferences.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    search_histories = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
    )
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format"""
        if '@' not in email:
            raise ValueError("Invalid email format")
        return email.lower()


class Document(Base):
    """
    Document model representing uploaded files and their metadata.
    """
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer)  # Size in bytes
    file_type = Column(String(100))
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    processed = Column(Boolean, default=False)
    processing_status = Column(String(50), default='pending')  # pending, processing, completed, failed
    metadata = Column(JSON, default={})  # Store additional metadata like author, pages, etc.
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_document_user_id', 'user_id'),
        Index('idx_document_processed', 'processed'),
        Index('idx_document_upload_date', 'upload_date'),
        UniqueConstraint('user_id', 'filename', name='uq_user_filename'),
    )
    
    @property
    def file_size_mb(self) -> float:
        """Return file size in megabytes"""
        return self.file_size / (1024 * 1024) if self.file_size else 0


class DocumentChunk(Base):
    """
    Document chunk model representing split document sections with embeddings.
    """
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Order of chunk in document
    content = Column(Text, nullable=False)
    chunk_size = Column(Integer)  # Character count
    token_count = Column(Integer)  # Approximate token count
    embedding = Column(JSON)  # Store vector embedding as JSON array
    embedding_model = Column(String(100))  # Model used for embedding
    metadata = Column(JSON, default={})  # Page number, section title, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_chunk_document_id', 'document_id'),
        Index('idx_chunk_embedding_model', 'embedding_model'),
        Index('idx_chunk_document_index', 'document_id', 'chunk_index'),
    )
    
    @validates('content')
    def validate_content(self, key, content):
        """Ensure content is not empty"""
        if not content or len(content.strip()) == 0:
            raise ValueError("Chunk content cannot be empty")
        return content.strip()


class SearchHistory(Base):
    """
    Search history model tracking user search queries and results.
    """
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query = Column(Text, nullable=False)
    search_type = Column(String(50), default='semantic')  # semantic, keyword, hybrid
    filters = Column(JSON, default={})  # Search filters applied
    results_count = Column(Integer, default=0)
    response_time = Column(Float)  # Response time in milliseconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="search_histories")
    
    # Indexes
    __table_args__ = (
        Index('idx_search_user_date', 'user_id', 'created_at'),
        Index('idx_search_created_at', 'created_at'),
    )


class Conversation(Base):
    """
    Conversation model for chat interactions with documents.
    """
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500))
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON, default={})
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    document = relationship("Document")
    
    # Indexes
    __table_args__ = (
        Index('idx_conversation_user_active', 'user_id', 'is_active'),
        Index('idx_conversation_updated', 'updated_at'),
    )