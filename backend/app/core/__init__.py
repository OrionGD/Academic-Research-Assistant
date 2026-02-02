"""
Core Configuration Module
Exports configuration, security, and dependency injection utilities.
"""

from app.core.config import settings, get_settings
from app.core.security import (
    SecurityManager,
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
    get_current_institution_admin,
    require_scopes,
    verify_password_reset_token,
    create_password_reset_token,
    create_email_verification_token,
    rate_limiter,
    RateLimiter,
    pwd_context,
    oauth2_scheme,
    api_key_scheme
)
from app.core.dependencies import (
    get_database,
    get_db_session,
    get_current_user_optional,
    get_required_user,
    get_admin_user,
    require_read_scope,
    require_write_scope,
    require_document_upload_scope,
    require_document_delete_scope,
    get_vector_store,
    get_llm_client,
    get_document_processor,
    get_search_engine,
    get_rag_pipeline,
    RateLimitDependency,
    validate_file_size,
    validate_api_key,
    get_cache_manager,
    CacheManager,
    get_request_timer,
    RequestTimer,
    check_feature_flag,
    require_feature_flag,
    get_pagination_params,
    PaginationParams,
    security,
    optional_security
)

__version__ = "1.0.0"
__author__ = "Research Assistant Team"

__all__ = [
    # Configuration
    "settings",
    "get_settings",
    
    # Security
    "SecurityManager",
    "get_current_user",
    "get_current_active_user",
    "get_current_admin_user",
    "get_current_institution_admin",
    "get_current_user_optional",
    "get_required_user",
    "get_admin_user",
    "require_scopes",
    "require_read_scope",
    "require_write_scope",
    "require_document_upload_scope",
    "require_document_delete_scope",
    "verify_password_reset_token",
    "create_password_reset_token",
    "create_email_verification_token",
    "rate_limiter",
    "RateLimiter",
    "pwd_context",
    "oauth2_scheme",
    "api_key_scheme",
    "security",
    "optional_security",
    
    # Database
    "get_database",
    "get_db_session",
    
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
]