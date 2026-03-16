from google import genai
from services.config import GEMINI_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS
import logging
import asyncio

logger = logging.getLogger(__name__)

_client = None

def get_genai_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

async def generate_embedding(text: str) -> list[float]:
    """Generate a 768-dim embedding using Gemini text-embedding-004."""
    try:
        client = get_genai_client()
        # Run in executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
        )
        embedding = result.embeddings[0].values
        if len(embedding) != EMBEDDING_DIMENSIONS:
            logger.warning(f"Unexpected embedding dimension: {len(embedding)} (expected {EMBEDDING_DIMENSIONS})")
        return list(embedding)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise

async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts concurrently (batched)."""
    if not texts:
        return []
    # Process in batches of 10 to respect rate limits
    BATCH_SIZE = 10
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        tasks = [generate_embedding(t) for t in batch]
        batch_embeddings = await asyncio.gather(*tasks)
        all_embeddings.extend(batch_embeddings)
    return all_embeddings
