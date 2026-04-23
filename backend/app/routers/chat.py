from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from ..pipelines.ml_chat import chat_pipeline
from ..services.credit_service import CreditService
from ..config.database import get_database
from datetime import datetime
import json

router = APIRouter()

@router.post("/")
async def chat(request: Request, body: dict):
    # Guests are assigned a user object by SessionMiddleware
    user_data = request.state.user
    session_id = getattr(request.state, "session_id", None)

    # Credit Check
    if not await CreditService.check_and_deduct(user_data, "chat", session_id):
        raise HTTPException(status_code=403, detail="Chat limit reached. Please upgrade your plan.")

    query = body.get("query") or body.get("message")
    if not query:
        raise HTTPException(status_code=400, detail="Query/message is required")

    document_ids = body.get("documentIds")
    
    try:
        response = await chat_pipeline(
            message=query,
            user_id=user_data["user_id"],
            document_ids=document_ids
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(request: Request, body: dict):
    user_data = request.state.user
    session_id = body.get("sessionId") or getattr(request.state, "session_id", None)
    if not user_data or not session_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    query = body.get("query") or body.get("message")
    if not query:
        raise HTTPException(status_code=400, detail="Query/message is required")

    db = get_database()
    await db.chat_history.insert_one({
        "sessionId": session_id,
        "userId": user_data["user_id"],
        "role": "user",
        "content": query,
        "timestamp": datetime.utcnow()
    })

    assistant_text = f"Simulated AI response for: {query}"  # Placeholder response
    await db.chat_history.insert_one({
        "sessionId": session_id,
        "userId": user_data["user_id"],
        "role": "assistant",
        "content": assistant_text,
        "timestamp": datetime.utcnow()
    })

    async def event_stream():
        payload = {
            "text": assistant_text,
            "id": f"msg_{int(datetime.utcnow().timestamp())}"
        }
        yield f"data: {json.dumps(payload)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history/{session_id}")
async def get_chat_history(request: Request, session_id: str):
    user_data = request.state.user
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    items = await db.chat_history.find({"sessionId": session_id}).sort("timestamp", 1).to_list(length=500)
    return [
        {
            "id": str(item.get("_id")),
            "role": item.get("role"),
            "content": item.get("content"),
            "timestamp": item.get("timestamp").isoformat() if hasattr(item.get("timestamp"), "isoformat") else item.get("timestamp")
        }
        for item in items
    ]


@router.delete("/history/{session_id}")
async def delete_chat_history(request: Request, session_id: str):
    user_data = request.state.user
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    await db.chat_history.delete_many({"sessionId": session_id})
    return {"message": "Chat history cleared"}
