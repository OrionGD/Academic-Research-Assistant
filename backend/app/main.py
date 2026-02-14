"""
FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.middleware.auth_middleware import AuthMiddleware
from app.middleware.logging_middleware import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    
    # Create indexes
    from app.db.mongodb import db
    await db.users.create_index("email", unique=True)
    await db.documents.create_index("user_id")
    await db.documents.create_index([("title", "text"), ("content", "text")])
    await db.chunks.create_index([("embedding_vector", "cosmosSearch")])
    
    yield
    
    # Shutdown
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "rag-backend"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RAG Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }
