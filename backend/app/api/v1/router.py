"""
API Router configuration
"""
from fastapi import APIRouter
from .endpoints import auth, documents, search, chat, embeddings, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
