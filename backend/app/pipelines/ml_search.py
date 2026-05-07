"""
Semantic Search Pipeline
"""
import logging
from ..services.embedding_service import EmbeddingService
from ..services.chroma_db import query_similar_chunks

logger = logging.getLogger(__name__)
embedding_service = EmbeddingService()

async def search_pipeline(
    query: str,
    limit: int = 5,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> list[dict]:
    """
    Search pipeline using Gemini embeddings and ChromaDB semantic similarity search.
    """
    # Step 1: Embed query
    query_embedding = await embedding_service.generate_query_embedding(query)

    # Step 2: Query ChromaDB
    # Fetch top candidates
    candidates = await query_similar_chunks(
        query_embedding=query_embedding,
        limit=limit,
        user_id=user_id,
        document_ids=document_ids
    )

    if not candidates:
        logger.info(f"[Search] No results found for query '{query[:50]}'")
        return []

    # Step 3: Format Return results
    formatted = [
        {
            "documentId": r.get("documentId"),
            "chunkIndex": r.get("chunkIndex"),
            "snippet": (
                (r.get("chunkText", "")[:200] + "...")
                if len(r.get("chunkText", "")) > 200
                else r.get("chunkText", "")
            ),
            "fullText": r.get("chunkText", ""),
            "relevanceScore": round(r.get("score", 0.0), 4),
            "section": r.get("metadata", {}).get("section", "unknown"),
        }
        for r in candidates
    ]

    logger.info(f"[Search] '{query[:50]}' → {len(formatted)} results (userId={user_id})")
    return formatted
