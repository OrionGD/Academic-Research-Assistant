from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from ..config.database import get_database
from ..pipelines.ml_search import search_pipeline

router = APIRouter()


@router.post("")
async def search_documents(request: Request, body: Dict[str, Any]):
    query = (body.get("query") or "").strip()
    if not query:
        return []

    page = int(body.get("page", 1))
    limit = int(body.get("limit", 10))
    document_ids = body.get("document_ids") or body.get("documentIds") or None

    session_id = request.headers.get("X-Session-ID", "public")
    db = get_database()
    collection_name = body.get("collection")
    
    # Restrict search to documents belonging to the current session
    query_filter = {"sessionId": session_id}
    if collection_name:
        # Heuristic: Match collection name against title, topics, or insights
        query_filter["$or"] = [
            {"collection": collection_name}, # Direct match if field exists
            {"title": {"$regex": collection_name, "$options": "i"}},
            {"topics": {"$in": [collection_name]}},
            {"analysis.keyInsights": {"$regex": collection_name, "$options": "i"}}
        ]

    session_docs = await db.documents.find(query_filter).to_list(length=1000)
    session_doc_ids = [doc["documentId"] for doc in session_docs]
    
    if not session_doc_ids:
        return []

    if document_ids:
        # Narrow down search to requested IDs that also belong to this filtered list
        document_ids = [did for did in document_ids if did in session_doc_ids]
        if not document_ids:
            return []
    else:
        # Search across all documents in the current session (potentially filtered by collection)
        document_ids = session_doc_ids

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

    # Fetch document metadata from MongoDB for enriched results
    db = get_database()
    doc_ids = list(set(r.get("documentId") for r in results if r.get("documentId")))
    docs_meta = {}
    if doc_ids:
        session_id = request.headers.get("X-Session-ID", "public")
        cursor = db.documents.find({"documentId": {"$in": doc_ids}, "sessionId": session_id})
        async for doc in cursor:
            docs_meta[doc.get("documentId")] = doc

    # Format final results (No deduplication to allow multiple segments per document)
    formatted = []
    for r in results:
        doc_id = r.get("documentId")
        if not doc_id:
            continue
            
        meta = docs_meta.get(doc_id)
        if not meta:
            # Skip if document metadata not found in the current session
            continue
            
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

    # Final pagination
    start = (page - 1) * limit
    paginated = formatted[start:start + limit]

    return paginated

