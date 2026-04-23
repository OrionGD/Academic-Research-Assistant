from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
from ..config.database import get_database

router = APIRouter()


def _normalize_message(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id")),
        "userId": doc.get("userId"),
        "sender": doc.get("sender"),
        "senderId": doc.get("senderId"),
        "message": doc.get("message"),
        "createdAt": doc.get("createdAt").isoformat() if hasattr(doc.get("createdAt"), "isoformat") else doc.get("createdAt"),
        "readByAdmin": doc.get("readByAdmin", False),
        "readByUser": doc.get("readByUser", False)
    }


@router.get("/chat")
async def get_support_chat(request: Request, userId: str | None = None):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    if userId:
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        query = {"userId": userId}
    else:
        query = {"userId": user["user_id"]}

    items = await db.support_messages.find(query).sort("createdAt", 1).to_list(length=200)
    return [_normalize_message(item) for item in items]


@router.post("/chat")
async def post_support_chat(request: Request, body: dict):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    message = (body.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    db = get_database()
    doc = {
        "userId": user["user_id"],
        "sender": "user",
        "senderId": user["user_id"],
        "message": message,
        "createdAt": datetime.utcnow(),
        "readByAdmin": False,
        "readByUser": True
    }
    result = await db.support_messages.insert_one(doc)
    return _normalize_message({**doc, "_id": result.inserted_id})


@router.post("/admin/reply")
async def post_admin_reply(request: Request, body: dict):
    user = request.state.user
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user_id = body.get("userId")
    message = (body.get("message") or "").strip()
    if not user_id or not message:
        raise HTTPException(status_code=400, detail="userId and message are required")

    db = get_database()
    doc = {
        "userId": user_id,
        "sender": "admin",
        "senderId": user["user_id"],
        "message": message,
        "createdAt": datetime.utcnow(),
        "readByAdmin": True,
        "readByUser": False
    }
    result = await db.support_messages.insert_one(doc)
    return _normalize_message({**doc, "_id": result.inserted_id})


@router.patch("/admin/read/{user_id}")
async def mark_support_read(request: Request, user_id: str):
    user = request.state.user
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db = get_database()
    await db.support_messages.update_many(
        {"userId": user_id, "sender": "user"},
        {"$set": {"readByAdmin": True}}
    )
    return {"status": "ok"}
