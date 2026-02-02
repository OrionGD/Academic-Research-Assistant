"""
Dependency Injection Definitions
FastAPI dependencies for database, authentication, rate limiting, etc.
"""

import time
from typing import Generator, Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import redis

from app.core.config import settings
from app.core.security import (
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
    require_scopes,
    rate_limiter,
    SecurityManager,
    verify_password_reset_token,
    get_current_institution_admin
)
from app.database.session import get_db
from app.database.models import User, Institution
from app.services.vector_store import VectorStore
from app.services.llm_client import LLMClient
from app.services.document_processor import DocumentProcessor
from app.services.search_engine import SearchEngine
from app.services.rag_pipeline import RAGPipeline

# Security schemes
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# Database Dependencies
def get_database() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    Yields a SQLAlchemy session and ensures it's closed after use.
    """
    db = get_db()
    try:
        yield db
    finally:
        db.close()


def get_db_session(
    request: Request,
    db: Session = Depends(get_database)
) -> Session:
    """
    Enhanced database session with request context.
    """
    # Add request ID to session info for logging
    request_id = getattr(request.state, "request_id", "unknown")
    db.info["request_id"] = request_id
    return db


# Authentication Dependencies
def get_current_user_optional(
    token: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_database)
) -> Optional[User]:
    """
    Optional authentication dependency.
    Returns current user if authenticated, None otherwise.
    """
    if token and token.credentials:
        try:
            return get_current_user(db=db, token=token.credentials)
        except HTTPException:
            return None
    return None


def get_required_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires authenticated user.
    """
    return current_user


def get_admin_user(
    current_user: User = Depends(get_current_admin_user)
) -> User:
    """
    Dependency that requires admin privileges.
    """
    return current_user


def get_institution_admin(
    institution_id: str,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_user)
) -> Institution:
    """
    Dependency that requires institution admin privileges.
    """
    return get_current_institution_admin(institution_id, current_user, db)


# Scoped Dependencies
def require_read_scope(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires read scope.
    """
    return require_scopes(["read"])(current_user)


def require_write_scope(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires write scope.
    """
    return require_scopes(["write"])(current_user)


def require_document_upload_scope(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires document upload scope.
    """
    return require_scopes(["documents:upload"])(current_user)


def require_document_delete_scope(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that requires document delete scope.
    """
    return require_scopes(["documents:delete"])(current_user)


# Service Dependencies
def get_vector_store() -> VectorStore:
    """
    Dependency to get vector store instance.
    """
    return VectorStore()


def get_llm_client() -> LLMClient:
    """
    Dependency to get LLM client instance.
    """
    return LLMClient()


def get_document_processor() -> DocumentProcessor:
    """
    Dependency to get document processor instance.
    """
    return DocumentProcessor()


def get_search_engine() -> SearchEngine:
    """
    Dependency to get search engine instance.
    """
    return SearchEngine()


def get_rag_pipeline() -> RAGPipeline:
    """
    Dependency to get RAG pipeline instance.
    """
    return RAGPipeline()


# Rate Limiting Dependencies
class RateLimitDependency:
    """
    Dependency for rate limiting.
    """
    
    def __init__(self, requests_per_minute: Optional[int] = None):
        self.requests_per_minute = requests_per_minute or settings.RATE_LIMIT_REQUESTS_PER_MINUTE
    
    async def __call__(self, request: Request) -> None:
        """
        Check if request should be rate limited.
        """
        if not settings.RATE_LIMIT_ENABLED:
            return
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get endpoint path
        endpoint = request.url.path
        
        # Generate rate limit key
        key = rate_limiter.get_client_key(client_ip, endpoint)
        
        # Check rate limit
        if await rate_limiter.is_rate_limited(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": "60"
                }
            )


# Request Validation Dependencies
def validate_file_size(request: Request) -> None:
    """
    Validate file size before upload.
    """
    content_length = request.headers.get("content-length")
    
    if content_length:
        file_size = int(content_length)
        max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
            )


def validate_api_key(
    api_key: Optional[str] = None,
    required_scopes: Optional[list] = None
) -> Dict[str, Any]:
    """
    Validate API key and return associated data.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Parse API key format
    if "." not in api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format"
        )
    
    key_id, key = api_key.split(".", 1)
    
    # In production, you would validate against database
    # For now, return mock data
    return {
        "key_id": key_id,
        "scopes": required_scopes or ["read"],
        "is_valid": True
    }


# Cache Dependencies
class CacheManager:
    """
    Cache manager using Redis.
    """
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            decode_responses=True
        )
    
    async def get_or_set(
        self,
        key: str,
        func,
        ttl: int = settings.REDIS_CACHE_TTL,
        *args,
        **kwargs
    ) -> Any:
        """
        Get value from cache or compute and set it.
        """
        # Try to get from cache
        cached = self.redis_client.get(key)
        if cached is not None:
            try:
                import json
                return json.loads(cached)
            except:
                return cached
        
        # Compute value
        result = await func(*args, **kwargs) if callable(func) else func
        
        # Store in cache
        try:
            import json
            self.redis_client.setex(key, ttl, json.dumps(result))
        except:
            self.redis_client.setex(key, ttl, str(result))
        
        return result
    
    def invalidate(self, pattern: str) -> None:
        """
        Invalidate cache entries matching pattern.
        """
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)


def get_cache_manager() -> CacheManager:
    """
    Dependency to get cache manager instance.
    """
    return CacheManager()


# Monitoring Dependencies
class RequestTimer:
    """
    Dependency to measure request processing time.
    """
    
    def __init__(self):
        self.start_time = None
    
    async def __call__(self, request: Request) -> Generator[None, None, None]:
        """
        Start timer on request.
        """
        self.start_time = time.time()
        request.state.start_time = self.start_time
        yield
    
    def get_elapsed_time(self) -> float:
        """
        Get elapsed time since timer started.
        """
        if self.start_time:
            return time.time() - self.start_time
        return 0.0


def get_request_timer() -> RequestTimer:
    """
    Dependency to get request timer.
    """
    return RequestTimer()


# Feature Flag Dependencies
def check_feature_flag(feature_name: str) -> bool:
    """
    Check if a feature flag is enabled.
    """
    feature_flags = {
        "streaming_responses": settings.FEATURE_STREAMING_RESPONSES,
        "web_search": settings.FEATURE_WEBSEARCH,
        "multilingual": settings.FEATURE_MULTILINGUAL,
        "citation_generation": settings.FEATURE_CITATION_GENERATION,
        "institution_auth": settings.ENABLE_INSTITUTION_AUTH,
        "library_integration": settings.ENABLE_LIBRARY_INTEGRATION,
        "citation_styles": settings.ENABLE_CITATION_STYLES,
    }
    
    return feature_flags.get(feature_name, False)


def require_feature_flag(feature_name: str):
    """
    Dependency that requires a feature flag to be enabled.
    """
    def feature_flag_dependency(request: Request):
        if not check_feature_flag(feature_name):
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"Feature '{feature_name}' is not enabled"
            )
        return True
    
    return feature_flag_dependency


# Pagination Dependencies
class PaginationParams:
    """
    Dependency for pagination parameters.
    """
    
    def __init__(
        self,
        page: int = 1,
        page_size: int = 20,
        max_page_size: int = 100
    ):
        self.page = max(1, page)
        self.page_size = min(max_page_size, max(1, page_size))
        self.skip = (self.page - 1) * self.page_size
        self.limit = self.page_size


def get_pagination_params(
    page: int = 1,
    page_size: int = 20
) -> PaginationParams:
    """
    Dependency to get pagination parameters.
    """
    return PaginationParams(page=page, page_size=page_size)


# Export commonly used dependencies
__all__ = [
    # Database
    "get_database",
    "get_db_session",
    
    # Authentication
    "get_current_user",
    "get_current_user_optional",
    "get_current_active_user",
    "get_admin_user",
    "get_institution_admin",
    "require_read_scope",
    "require_write_scope",
    "require_document_upload_scope",
    "require_document_delete_scope",
    
    # Services
    "get_vector_store",
    "get_llm_client",
    "get_document_processor",
    "get_search_engine",
    "get_rag_pipeline",
    
    # Rate Limiting
    "RateLimitDependency",
    
    # Validation
    "validate_file_size",
    "validate_api_key",
    
    # Cache
    "get_cache_manager",
    "CacheManager",
    
    # Monitoring
    "get_request_timer",
    "RequestTimer",
    
    # Feature Flags
    "check_feature_flag",
    "require_feature_flag",
    
    # Pagination
    "get_pagination_params",
    "PaginationParams",
    
    # Security
    "security",
    "optional_security",
    "SecurityManager",
    "verify_password_reset_token",
]