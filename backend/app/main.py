"""
ARAS Backend - Main Application Entry Point

Academic Retrieval-Augmented Generation System Backend
This module initializes and runs the FastAPI application.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to Python path for imports
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn

from app.api import router as api_router
from app.core.config import settings
from app.core.database import init_db, get_db
from app.core.cache import init_cache
from app.utils.logger import get_logger, setup_logging

# Initialize logger
logger = get_logger(__name__)

# Configure logging
setup_logging(
    log_level=settings.LOG_LEVEL,
    log_format=settings.LOG_FORMAT,
    log_dir=settings.LOG_DIR,
    enable_console=True,
    enable_file=True,
    service_name="aras-backend"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting ARAS Backend Application")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    logger.info(f"Vector Store: {settings.VECTOR_STORE_TYPE}")
    
    try:
        # Initialize database
        await init_db()
        logger.info("Database initialized successfully")
        
        # Initialize cache
        await init_cache()
        logger.info("Cache initialized successfully")
        
        # Create necessary directories
        directories = [
            settings.UPLOAD_DIR,
            settings.PROCESSED_DIR,
            settings.LOG_DIR,
            settings.CACHE_DIR,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Directory created/verified: {directory}")
        
        yield
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}", exc_info=True)
        raise
    
    finally:
        # Shutdown
        logger.info("Shutting down ARAS Backend Application")
        # Cleanup resources if needed

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Academic Retrieval-Augmented Generation System Backend",
        version=settings.VERSION,
        docs_url="/docs" if settings.DOCS_ENABLED else None,
        redoc_url="/redoc" if settings.DOCS_ENABLED else None,
        openapi_url="/openapi.json" if settings.DOCS_ENABLED else None,
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """
        Middleware to log all incoming requests.
        """
        logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            extra={
                "context": {
                    "method": request.method,
                    "path": request.url.path,
                    "client_host": request.client.host if request.client else None,
                    "query_params": dict(request.query_params),
                }
            }
        )
        
        try:
            response = await call_next(request)
            
            logger.info(
                f"Request completed: {request.method} {request.url.path} - Status: {response.status_code}",
                extra={
                    "context": {
                        "status_code": response.status_code,
                        "method": request.method,
                        "path": request.url.path,
                    }
                }
            )
            
            return response
            
        except Exception as e:
            logger.error(
                f"Request failed: {request.method} {request.url.path} - Error: {str(e)}",
                exc_info=True,
                extra={
                    "context": {
                        "method": request.method,
                        "path": request.url.path,
                        "error": str(e),
                    }
                }
            )
            raise
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Global exception handler for uncaught exceptions.
        """
        logger.error(
            f"Unhandled exception: {str(exc)}",
            exc_info=True,
            extra={
                "context": {
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(exc).__name__,
                }
            }
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error": str(exc) if settings.DEBUG else "An unexpected error occurred",
            },
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """
        Handler for HTTP exceptions.
        """
        logger.warning(
            f"HTTP exception: {exc.status_code} - {exc.detail}",
            extra={
                "context": {
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": exc.status_code,
                    "detail": exc.detail,
                }
            }
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )
    
    # Include API routers
    app.include_router(api_router, prefix=settings.API_PREFIX)
    
    # Mount static files if needed
    if settings.STATIC_FILES_ENABLED:
        static_dir = settings.STATIC_DIR
        static_dir.mkdir(parents=True, exist_ok=True)
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """
        Health check endpoint for monitoring.
        """
        return {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }
    
    # Root endpoint
    @app.get("/")
    async def root():
        """
        Root endpoint with API information.
        """
        return {
            "message": f"Welcome to {settings.PROJECT_NAME}",
            "version": settings.VERSION,
            "docs_url": "/docs" if settings.DOCS_ENABLED else None,
            "api_prefix": settings.API_PREFIX,
            "description": "Academic Retrieval-Augmented Generation System",
        }
    
    return app

# Create the application instance
app = create_application()

def main():
    """
    Main entry point for running the application.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Running on {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
        access_log=True if settings.DEBUG else False,
    )

if __name__ == "__main__":
    main()