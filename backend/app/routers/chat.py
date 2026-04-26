from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.config.database import get_database
from app.pipelines.ml_chat import chat_pipeline, chat_stream_pipeline
import json

router = APIRouter()


@router.get("/history/{document_id}")
async def get_chat_history(document_id: str):
    db = get_database()

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
async def chat(payload: dict):
    """General chat endpoint (non-document-specific)."""
    try:
        result = await chat_pipeline(
            message=payload.get("query", ""),
            user_id=payload.get("user_id", ""),
            document_ids=payload.get("documentIds") or payload.get("document_ids") or None,
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
async def query_document(payload: dict):
    try:
        result = await chat_pipeline(
            message=payload.get("query", ""),
            user_id=payload.get("user_id", ""),
            document_ids=payload.get("document_ids") or [payload.get("document_id")] if payload.get("document_id") else None
        )
    except Exception as e:
        return {"error": str(e)}

    return {
        "answer": result.get("answer", ""),
        "sources": result.get("sources", [])
    }


@router.post("/stream")
async def chat_stream(payload: dict):
    """
    SSE streaming chat endpoint.
    Streams token-by-token (or chunk-by-chunk) responses.
    """
    async def event_generator():
        try:
            async for chunk in chat_stream_pipeline(
                message=payload.get("query", ""),
                user_id=payload.get("user_id", ""),
                document_ids=payload.get("documentIds") or payload.get("document_ids") or None,
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

