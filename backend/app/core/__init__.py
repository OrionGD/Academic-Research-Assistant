"""
Core module initialization
"""
from app.core.config import settings
from app.core.gemini_client import gemini_client
from app.core.groq_client import groq_client
from app.core.chroma_client import chroma_client

__all__ = [
    "settings",
    "gemini_client",
    "groq_client",
    "chroma_client"
]
