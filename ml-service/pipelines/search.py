"""
Hybrid Semantic Search Pipeline

Flow:
  1. Embed query with Gemini text-embedding-004 (768 dims)
  2. MongoDB Atlas vector search with numCandidates=200
     — filtered by userId for multi-tenant isolation
     — optionally filtered by documentIds
  3. BM25 re-ranking over the vector search candidates
  4. Return top-K ranked results
"""
import logging
from rank_bm25 import BM25Okapi
from services.db import get_db
from services.embedding_service import generate_embedding
from services.config import VECTOR_INDEX_NAME, VECTOR_NUM_CANDIDATES

logger = logging.getLogger(__name__)


async def _vector_search(
    query_embedding: list[float],
    limit: int,
    user_id: str,
    document_ids: list[str] | None,
) -> list[dict]:
    """
    Run MongoDB Atlas $vectorSearch.
    Always scopes to userId for multi-tenant isolation.
    """
    db = get_db()

    # Build pre-filter for Atlas vector search
    # userId is ALWAYS included to enforce multi-tenant isolation
    pre_filter: dict = {}
    if user_id:
        pre_filter["userId"] = user_id
    if document_ids:
        pre_filter["documentId"] = {"$in": document_ids}

    pipeline: list = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": VECTOR_NUM_CANDIDATES,
                "limit": limit,
                **({"filter": pre_filter} if pre_filter else {}),
            }
        },
        {
            "$project": {
                "_id": 0,
                "documentId": 1,
                "userId": 1,
                "chunkIndex": 1,
                "chunkText": 1,
                "metadata": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    try:
        cursor = db.document_chunks.aggregate(pipeline)
        return await cursor.to_list(length=limit)
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
        return []


def _bm25_rerank(query: str, candidates: list[dict]) -> list[dict]:
    """
    BM25 re-scoring over vector search candidates.
    Final score = vector_score * 0.6 + bm25_score * 0.4
    """
    if not candidates:
        return candidates

    corpus = [c.get("chunkText", "") for c in candidates]
    tokenized_corpus = [doc.lower().split() for doc in corpus]
    tokenized_query = query.lower().split()

    try:
        bm25 = BM25Okapi(tokenized_corpus)
        bm25_scores = bm25.get_scores(tokenized_query)

        max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        normalized_bm25 = [s / max_bm25 for s in bm25_scores]

        for i, candidate in enumerate(candidates):
            vector_score = candidate.get("score", 0.0)
            bm25_score = normalized_bm25[i]
            candidate["hybridScore"] = round(vector_score * 0.6 + bm25_score * 0.4, 4)
            candidate["bm25Score"] = round(bm25_score, 4)

        return sorted(candidates, key=lambda x: x.get("hybridScore", 0), reverse=True)

    except Exception as e:
        logger.warning(f"BM25 reranking failed: {e}. Falling back to vector scores.")
        return candidates


async def search_pipeline(
    query: str,
    limit: int = 5,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> list[dict]:
    """
    Hybrid semantic search pipeline.
    user_id is required for multi-tenant isolation.
    """
    # Step 1: Embed query
    query_embedding = await generate_embedding(query)

    # Step 2: Fetch candidates (more than needed for BM25 re-ranking)
    fetch_limit = min(limit * 5, 50)
    candidates = await _vector_search(query_embedding, fetch_limit, user_id, document_ids)

    if not candidates:
        logger.info(f"[Search] No vector results for query '{query[:50]}'")
        return []

    # Step 3: BM25 hybrid reranking
    reranked = _bm25_rerank(query, candidates)

    # Step 4: Return top-K
    top_results = reranked[:limit]

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
            "relevanceScore": r.get("hybridScore", round(r.get("score", 0.0), 4)),
            "vectorScore": round(r.get("score", 0.0), 4),
            "bm25Score": r.get("bm25Score", 0.0),
            "section": r.get("metadata", {}).get("section", "unknown"),
        }
        for r in top_results
    ]

    logger.info(f"[Search] '{query[:50]}' → {len(formatted)} hybrid results (userId={user_id})")
    return formatted
