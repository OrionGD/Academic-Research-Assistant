"""
Models package for data structures and schemas.
"""

from .database import (
    Base, User, Document, DocumentChunk, 
    SearchHistory, Conversation
)
from .schemas import (
    UserBase, UserCreate, UserLogin, UserUpdate, UserResponse,
    DocumentBase, DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentListResponse, DocumentChunkBase, DocumentChunkCreate,
    DocumentChunkResponse, SearchType, SearchFilter, SearchRequest,
    SearchResult, SearchResponse, MessageRole, MessageBase,
    MessageCreate, MessageResponse, ConversationCreate,
    ConversationUpdate, ConversationResponse,
    ConversationDetailResponse, Token, TokenPayload, BaseResponse, Pagination
)
from .embeddings import (
    EmbeddingModel, DistanceMetric, EmbeddingConfig,
    EmbeddingResult, SimilarityCalculator, CosineSimilarity,
    EuclideanDistance, DotProductSimilarity, get_similarity_calculator,
    SearchResultItem, ResultRanker, normalize_vector,
    calculate_average_embedding, calculate_centroid,
    calculate_similarity_matrix, SearchMetrics
)

__all__ = [
    # Database models
    "Base", "User", "Document", "DocumentChunk", 
    "SearchHistory", "Conversation",
    
    # Schemas
    "UserBase", "UserCreate", "UserLogin", "UserUpdate", "UserResponse",
    "DocumentBase", "DocumentCreate", "DocumentUpdate", "DocumentResponse",
    "DocumentListResponse", "DocumentChunkBase", "DocumentChunkCreate",
    "DocumentChunkResponse", "SearchType", "SearchFilter", "SearchRequest",
    "SearchResult", "SearchResponse", "MessageRole", "MessageBase",
    "MessageCreate", "MessageResponse", "ConversationCreate",
    "ConversationUpdate", "ConversationResponse",
    "ConversationDetailResponse", "Token", "TokenPayload", 
    "BaseResponse", "Pagination",
    
    # Embeddings
    "EmbeddingModel", "DistanceMetric", "EmbeddingConfig",
    "EmbeddingResult", "SimilarityCalculator", "CosineSimilarity",
    "EuclideanDistance", "DotProductSimilarity", "get_similarity_calculator",
    "SearchResultItem", "ResultRanker", "normalize_vector",
    "calculate_average_embedding", "calculate_centroid",
    "calculate_similarity_matrix", "SearchMetrics",
]