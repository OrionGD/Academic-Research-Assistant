from google import genai
from google.genai import types
from services.config import GEMINI_API_KEY
import logging

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-004"

_client = None


def get_genai_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        # Force stable API version (CRITICAL FIX)
        _client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=types.HttpOptions(api_version="v1")
        )
    return _client


async def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding for a single text using Gemini.
    """
    try:
        client = get_genai_client()

        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text
        )

        # Safe extraction (SDK returns list-like structure)
        return response.embeddings[0].values

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Batch embedding generation using Gemini API.
    """
    if not texts:
        return []

    try:
        client = get_genai_client()

        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=texts
        )

        return [e.values for e in response.embeddings]

    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        raise