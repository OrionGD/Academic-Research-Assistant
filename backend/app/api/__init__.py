"""
API Router Configuration
Main router that includes all API versions.
"""

from fastapi import APIRouter

from app.api.v1 import api_router as v1_router

# Main API router
api_router = APIRouter()

# Include API version routers
api_router.include_router(v1_router, prefix="/v1")

# Health check endpoint (not versioned)
@api_router.get("/health")
async def health_check():
    """
    Health check endpoint for the API.
    Returns service status and version information.
    """
    from app.core.config import settings
    
    return {
        "status": "healthy",
        "service": "research-assistant-api",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG
    }


# API information endpoint
@api_router.get("/")
async def api_info():
    """
    API information and available endpoints.
    """
    from app.core.config import settings
    
    return {
        "service": "Research Assistant API",
        "description": "RAG-based research assistant with document management and semantic search",
        "version": settings.API_VERSION,
        "documentation": "/docs",
        "openapi_spec": "/openapi.json",
        "available_versions": ["v1"],
        "current_version": "v1",
        "endpoints": {
            "v1": {
                "documents": "/api/v1/documents",
                "search": "/api/v1/search",
                "chat": "/api/v1/chat"
            }
        }
    }