"""
ARAS - AI-Powered Academic Business Intelligence Platform
Main application entry point
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.config.database import connect_to_mongo, close_mongo_connection
from app.utils.logger_config import configure_logging
from app.api import documents, chat

# Configure logging
configure_logging()
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ARAS API",
    description="AI-Powered Academic Business Intelligence Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database connections on startup"""
    logger.info("Starting ARAS application")
    await connect_to_mongo()
    logger.info("Connected to MongoDB")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    logger.info("Shutting down ARAS application")
    await close_mongo_connection()
    logger.info("Disconnected from MongoDB")


# Include API routers
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ARAS API",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ARAS API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )

async def google_oauth_placeholder():
    return {"message": "Google OAuth is not implemented in placeholder mode"}
