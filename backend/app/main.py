"""
ScholarAI - AI-Powered Academic Business Intelligence Platform
Main application entry point (Open Access)
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.config.database import connect_to_mongo, close_mongo_connection
from app.config.redis_config import connect_to_redis, close_redis_connection
from app.utils.logger_config import configure_logging
from app.routers import (
    analysis, chat, documents, keys, search, support
)

# Configure logging
configure_logging()
logger = logging.getLogger(__name__)

# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting ScholarAI application")
    try:
        await connect_to_mongo()
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
    
    try:
        await connect_to_redis()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        
    try:
        from app.core.chroma_client import EXPECTED_EMBEDDING_DIM
        backend_name = "Remote (Gemini)" if settings.ENABLE_REMOTE_EMBEDDINGS else f"Local (HuggingFace: {settings.LOCAL_EMBEDDING_MODEL})"
        logger.info(f"Embedding Backend: {backend_name}")
        logger.info(f"Embedding Dimension: {EXPECTED_EMBEDDING_DIM}")
        logger.info(f"Vector Database: ChromaDB at {settings.chroma_persist_dir}")
    except Exception as e:
        logger.error(f"Failed to initialize Vector DB status: {e}")

    # ─── Background Cleanup Loop ───
    import asyncio
    from app.services.cleanup import cleanup_stale_documents
    async def cleanup_loop():
        while True:
            try:
                await cleanup_stale_documents(max_age_hours=2)
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")
            await asyncio.sleep(1800) # Run every 30 minutes

    cleanup_task = asyncio.create_task(cleanup_loop())
    
    yield

    cleanup_task.cancel()
    
    # Shutdown
    logger.info("Shutting down ScholarAI application")
    try:
        await close_mongo_connection()
        logger.info("Disconnected from MongoDB")
    except Exception as e:
        logger.error(f"Error closing MongoDB: {e}")
    
    try:
        await close_redis_connection()
        logger.info("Disconnected from Redis")
    except Exception as e:
        logger.error(f"Error closing Redis: {e}")


# Create FastAPI app with lifespan
app = FastAPI(
    title="ScholarAI API - Open Access",
    description="AI-Powered Academic Business Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,

)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(documents.router, prefix="/documents", tags=["Documents"]) # Compatibility alias
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(keys.router, prefix="/api/keys", tags=["API Keys"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(support.router, prefix="/api/support", tags=["Support"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ScholarAI API",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ScholarAI API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )
