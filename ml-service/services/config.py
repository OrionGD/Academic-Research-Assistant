"""
ML Service Configuration
All sensitive values must be provided via environment variables.
No hardcoded credentials or connection strings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Database ──────────────────────────────────────────────────────────────────
# MUST be set in the environment — no insecure default
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is not set. "
        "Please configure it in your .env file or environment."
    )

DATABASE_NAME = os.getenv("DATABASE_NAME", "aras_db")

# ─── AI / Gemini ───────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Embedding model — Gemini text-embedding-004 produces 768-dim vectors
EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSIONS = 768

# Chat / generation model
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-1.5-flash")

# ─── Service Auth ──────────────────────────────────────────────────────────────
# Shared secret between backend and ML service (X-API-Key header)
ML_SERVICE_API_KEY = os.getenv("ML_SERVICE_API_KEY", "")

# ─── Chunking ──────────────────────────────────────────────────────────────────
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# ─── Vector Search ─────────────────────────────────────────────────────────────
VECTOR_INDEX_NAME = os.getenv("VECTOR_INDEX_NAME", "vector_index")
VECTOR_NUM_CANDIDATES = int(os.getenv("VECTOR_NUM_CANDIDATES", "200"))
