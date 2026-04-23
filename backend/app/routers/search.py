from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
from ..config.database import get_database

router = APIRouter()


def _score_document(query: str, doc: dict) -> int:
    score = 0
    lower_query = query.lower()
    title = doc.get("title", "") or ""
    if lower_query in title.lower():
        score += 4
    if lower_query in (doc.get("abstract", "") or "").lower():
        score += 2
    analysis = doc.get("analysis", {}) or {}
    analysis_text = " ".join([str(analysis.get(field, "")) for field in ["summary", "results", "keyInsights"]])
    if lower_query in analysis_text.lower():
        score += 3
    return score


@router.post("/")
async def search_documents(request: Request, body: Dict[str, Any]):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    query = (body.get("query") or "").strip()
    if not query:
        return []

    filters = body.get("filters") or {}
    page = int(body.get("page", 1))
    limit = int(body.get("limit", 10))

    db = get_database()
    docs = await db.documents.find({"userId": user["user_id"]}).to_list(length=1000)

    results = []
    for doc in docs:
        score = _score_document(query, doc)
        if score <= 0:
            continue

        snippet_source = doc.get("abstract") or (doc.get("analysis", {}) or {}).get("summary") or ""
        snippet = snippet_source[:200].strip()

        results.append({
            "documentId": doc.get("documentId"),
            "title": doc.get("title", "Untitled Document"),
            "snippet": snippet,
            "relevanceScore": score,
            "authors": doc.get("metadata", {}).get("authors", []) or [],
            "year": doc.get("metadata", {}).get("year", None) or None
        })

    results.sort(key=lambda item: item["relevanceScore"], reverse=True)
    start = (page - 1) * limit
    return results[start:start + limit]
