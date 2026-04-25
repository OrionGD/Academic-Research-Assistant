from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from ..config.database import get_database
from ..pipelines.ml_search import search_pipeline

router = APIRouter()


@router.post("/")
async def search_documents(request: Request, body: Dict[str, Any]):
    query = (body.get("query") or "").strip()
    if not query:
        return []

    filters = body.get("filters") or {}
    page = int(body.get("page", 1))
    limit = int(body.get("limit", 10))
    document_ids = body.get("document_ids") or body.get("documentIds") or None

    try:
        # Use the semantic search pipeline (Gemini embeddings + ChromaDB)
        results = await search_pipeline(
            query=query,
            limit=limit * 3,  # Fetch extra for deduplication
            user_id="",
            document_ids=document_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

    # Deduplicate by documentId and keep highest score
    seen_docs: dict[str, dict] = {}
    for r in results:
        doc_id = r.get("documentId")
        if not doc_id:
            continue
        if doc_id not in seen_docs or r.get("relevanceScore", 0) > seen_docs[doc_id].get("relevanceScore", 0):
            seen_docs[doc_id] = r

    # Fetch document metadata from MongoDB for enriched results
    db = get_database()
    doc_ids = list(seen_docs.keys())
    docs_meta = {}
    if doc_ids:
        cursor = db.documents.find({"documentId": {"$in": doc_ids}})
        async for doc in cursor:
            docs_meta[doc.get("documentId")] = doc

    # Format final results
    formatted = []
    for doc_id, r in seen_docs.items():
        meta = docs_meta.get(doc_id, {})
        # Normalize relevance score to 0-1 range for display
        score = min(1.0, max(0.0, r.get("relevanceScore", 0)))
        
        formatted.append({
            "documentId": doc_id,
            "title": meta.get("title", "Untitled Document"),
            "snippet": r.get("snippet", ""),
            "fullText": r.get("fullText", ""),
            "relevanceScore": round(score, 4),
            "authors": meta.get("authors", []) or meta.get("metadata", {}).get("authors", []),
            "year": meta.get("year") or meta.get("metadata", {}).get("year"),
            "section": r.get("section", "unknown"),
            "chunkIndex": r.get("chunkIndex", 0),
        })

    # Sort by relevance score descending
    formatted.sort(key=lambda x: x["relevanceScore"], reverse=True)

    # Pagination
    start = (page - 1) * limit
    paginated = formatted[start:start + limit]

    return paginated

