from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.config.database import get_database
from app.pipelines.ml_chat import chat_pipeline, chat_stream_pipeline
import json

router = APIRouter()


def get_session_id(request: Request) -> str:
    """Extract session ID from headers; fallback to 'public' if missing."""
    return request.headers.get("X-Session-ID", "public")


@router.get("/history/{document_id}")
async def get_chat_history(request: Request, document_id: str):
    session_id = get_session_id(request)
    db = get_database()
    
    # Verify document belongs to session
    doc = await db.documents.find_one({"documentId": document_id, "sessionId": session_id})
    if not doc:
        return {"document_id": document_id, "chats": [], "total": 0}

    # Proper async cursor handling (NO chained await)
    cursor = db.chat_history.find({"document_id": document_id})
    cursor = cursor.sort("timestamp", 1)

    items = await cursor.to_list(length=500)

    return {
        "document_id": document_id,
        "chats": items,
        "total": len(items)
    }


@router.post("")
async def chat(request: Request, payload: dict):
    """General chat endpoint (non-document-specific)."""
    session_id = get_session_id(request)
    db = get_database()
    collection_name = payload.get("collection")
    
    # Restrict context to current session documents
    query_filter = {"sessionId": session_id}
    if collection_name:
        query_filter["$or"] = [
            {"collection": collection_name},
            {"title": {"$regex": collection_name, "$options": "i"}},
            {"topics": {"$in": [collection_name]}},
            {"analysis.keyInsights": {"$regex": collection_name, "$options": "i"}}
        ]

    session_docs = await db.documents.find(query_filter).to_list(length=1000)
    session_doc_ids = [doc["documentId"] for doc in session_docs]
    
    document_ids = payload.get("documentIds") or payload.get("document_ids") or None
    if document_ids:
        document_ids = [did for did in document_ids if did in session_doc_ids]
    else:
        document_ids = session_doc_ids

    try:
        result = await chat_pipeline(
            message=payload.get("query", ""),
            user_id="",
            document_ids=document_ids
        )
    except Exception as e:
        return {"error": str(e)}

    return {
        "message": {
            "content": result.get("answer", ""),
            "citations": result.get("sources", []),
        },
        "suggestedQuestions": []
    }


@router.post("/query")
async def query_document(request: Request, payload: dict):
    session_id = get_session_id(request)
    db = get_database()
    
    document_ids = payload.get("document_ids") or [payload.get("document_id")] if payload.get("document_id") else None
    
    # Verify these documents belong to the session
    if document_ids:
        valid_docs = await db.documents.find({"documentId": {"$in": document_ids}, "sessionId": session_id}).to_list(length=100)
        document_ids = [doc["documentId"] for doc in valid_docs]

    try:
        result = await chat_pipeline(
            message=payload.get("query", ""),
            user_id="",
            document_ids=document_ids
        )
    except Exception as e:
        return {"error": str(e)}

    return {
        "answer": result.get("answer", ""),
        "sources": result.get("sources", [])
    }


@router.post("/stream")
async def chat_stream(request: Request, payload: dict):
    """
    SSE streaming chat endpoint.
    Streams token-by-token (or chunk-by-chunk) responses.
    """
    session_id = get_session_id(request)
    db = get_database()
    collection_name = payload.get("collection")
    
    # Restrict to current session documents
    query_filter = {"sessionId": session_id}
    if collection_name:
        query_filter["$or"] = [
            {"collection": collection_name},
            {"title": {"$regex": collection_name, "$options": "i"}},
            {"topics": {"$in": [collection_name]}},
            {"analysis.keyInsights": {"$regex": collection_name, "$options": "i"}}
        ]

    session_docs = await db.documents.find(query_filter).to_list(length=1000)
    session_doc_ids = [doc["documentId"] for doc in session_docs]
    
    document_ids = payload.get("documentIds") or payload.get("document_ids") or None
    if document_ids:
        document_ids = [did for did in document_ids if did in session_doc_ids]
    else:
        document_ids = session_doc_ids

    async def event_generator():
        try:
            async for chunk in chat_stream_pipeline(
                message=payload.get("query", ""),
                user_id="",
                document_ids=document_ids
            ):
                yield chunk
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        },
    )

@router.delete("/history/{id}")
async def clear_chat_history(request: Request, id: str):
    """
    Clear chat history for a document ID OR a session ID.
    """
    session_id = get_session_id(request)
    db = get_database()
    
    # Try document ID first
    doc_result = await db.chat_history.delete_many({"document_id": id})
    # Also try sessionId just in case the 'id' passed is a sessionId
    sess_result = await db.chat_history.delete_many({"sessionId": id})
    
    # Also cleanup legacy chats collection
    await db.chats.delete_many({"document_id": id})
    await db.chats.delete_many({"sessionId": id})
    
    return {
        "message": "Chat history cleared",
        "deleted_count": doc_result.deleted_count + sess_result.deleted_count
    }
