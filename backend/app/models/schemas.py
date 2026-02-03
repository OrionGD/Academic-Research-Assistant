"""
Pydantic schemas for request/response validation.
Defines strict typing for API contracts and serialization formats.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field, validator, constr, root_validator
from enum import Enum


# ============ Base Schemas ============
class BaseResponse(BaseModel):
    """Base response schema with common fields"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class Pagination(BaseModel):
    """Pagination metadata"""
    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0


# ============ User Schemas ============
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: constr(min_length=3, max_length=100, regex=r'^[a-zA-Z0-9_]+$')
    full_name: Optional[str] = Field(None, max_length=200)


class UserCreate(UserBase):
    """Schema for user creation"""
    password: constr(min_length=8, max_length=100)
    confirm_password: constr(min_length=8, max_length=100)
    
    @root_validator
    def validate_passwords(cls, values):
        """Validate password confirmation"""
        password = values.get('password')
        confirm_password = values.get('confirm_password')
        
        if password != confirm_password:
            raise ValueError('Passwords do not match')
        
        # Additional password strength validation
        if not any(char.isdigit() for char in password):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in password):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in password):
            raise ValueError('Password must contain at least one lowercase letter')
        
        return values


class UserLogin(BaseModel):
    """Schema for user login"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: str
    
    @root_validator
    def validate_credentials(cls, values):
        """Ensure either email or username is provided"""
        email = values.get('email')
        username = values.get('username')
        
        if not email and not username:
            raise ValueError('Either email or username must be provided')
        
        return values


class UserUpdate(BaseModel):
    """Schema for user profile updates"""
    full_name: Optional[str] = Field(None, max_length=200)
    current_password: Optional[str] = None
    new_password: Optional[constr(min_length=8, max_length=100)] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============ Document Schemas ============
class DocumentBase(BaseModel):
    """Base document schema"""
    title: constr(min_length=1, max_length=500)
    filename: constr(min_length=1, max_length=500)


class DocumentCreate(DocumentBase):
    """Schema for document upload"""
    file_size: int = Field(..., gt=0, description="File size in bytes")
    file_type: constr(min_length=1, max_length=100)
    metadata: Optional[Dict[str, Any]] = {}


class DocumentUpdate(BaseModel):
    """Schema for document updates"""
    title: Optional[constr(min_length=1, max_length=500)] = None
    metadata: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    """Schema for document response"""
    id: int
    user_id: int
    file_path: str
    file_size: int
    file_type: str
    upload_date: datetime
    processed: bool
    processing_status: str
    metadata: Dict[str, Any]
    
    class Config:
        from_attributes = True
    
    @property
    def file_size_mb(self) -> float:
        """Calculate file size in MB"""
        return self.file_size / (1024 * 1024)


class DocumentListResponse(BaseResponse):
    """Schema for paginated document list"""
    data: List[DocumentResponse]
    pagination: Pagination


# ============ Document Chunk Schemas ============
class DocumentChunkBase(BaseModel):
    """Base document chunk schema"""
    chunk_index: int = Field(..., ge=0)
    content: constr(min_length=1)
    token_count: Optional[int] = Field(None, ge=0)


class DocumentChunkCreate(DocumentChunkBase):
    """Schema for chunk creation"""
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}


class DocumentChunkResponse(DocumentChunkBase):
    """Schema for chunk response"""
    id: int
    document_id: int
    chunk_size: int
    embedding_model: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Search Schemas ============
class SearchType(str, Enum):
    """Search type enumeration"""
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class SearchFilter(BaseModel):
    """Schema for search filters"""
    document_ids: Optional[List[int]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    file_types: Optional[List[str]] = None
    
    @validator('date_to')
    def validate_date_range(cls, date_to, values):
        """Validate date range consistency"""
        date_from = values.get('date_from')
        if date_from and date_to and date_to < date_from:
            raise ValueError('date_to must be after date_from')
        return date_to


class SearchRequest(BaseModel):
    """Schema for search requests"""
    query: constr(min_length=1, max_length=1000)
    search_type: SearchType = SearchType.SEMANTIC
    filters: Optional[SearchFilter] = None
    limit: int = Field(10, ge=1, le=100)
    include_metadata: bool = True


class SearchResult(BaseModel):
    """Schema for individual search result"""
    chunk_id: int
    document_id: int
    document_title: str
    content: str
    similarity_score: float = Field(..., ge=0, le=1)
    chunk_index: int
    metadata: Optional[Dict[str, Any]] = None


class SearchResponse(BaseResponse):
    """Schema for search response"""
    results: List[SearchResult]
    total_results: int
    query_time_ms: float
    search_type: SearchType


# ============ Conversation Schemas ============
class MessageRole(str, Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageBase(BaseModel):
    """Base message schema"""
    content: constr(min_length=1)
    role: MessageRole


class MessageCreate(MessageBase):
    """Schema for message creation"""
    pass


class MessageResponse(MessageBase):
    """Schema for message response"""
    id: int
    conversation_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    """Schema for conversation creation"""
    title: Optional[str] = Field(None, max_length=500)
    document_id: Optional[int] = None


class ConversationUpdate(BaseModel):
    """Schema for conversation updates"""
    title: Optional[constr(max_length=500)] = None
    is_active: Optional[bool] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response"""
    id: int
    user_id: int
    title: Optional[str]
    document_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Schema for conversation with messages"""
    messages: List[MessageResponse] = []


# ============ Token & Authentication ============
class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str
    expires_in: int


class TokenPayload(BaseModel):
    """Token payload schema"""
    sub: str  # subject (user ID)
    email: str
    username: str
    is_superuser: bool
    exp: int  # expiration timestamp
    iat: int  # issued at timestamp