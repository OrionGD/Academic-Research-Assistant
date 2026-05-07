from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
import secrets
from ..config.database import get_database

router = APIRouter()


def _normalize_key(doc: dict) -> dict:
    return {
        "name": doc.get("name"),
        "prefix": doc.get("prefix"),
        "lastUsedAt": doc.get("lastUsedAt"),
        "createdAt": doc.get("createdAt").isoformat() if hasattr(doc.get("createdAt"), "isoformat") else doc.get("createdAt")
    }


@router.get("/keys")
async def list_api_keys(request: Request):


    db = get_database()
    documents = await db.api_keys.find({}).to_list(length=100)
    return [_normalize_key(doc) for doc in documents]


@router.post("/keys")
async def create_api_key(request: Request, body: dict):


    name = body.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Key name is required")

    prefix = secrets.token_hex(4)
    key = f"{prefix}_{secrets.token_urlsafe(24)}"
    now = datetime.utcnow()

    db = get_database()
    await db.api_keys.insert_one({
        "name": name,
        "prefix": prefix,
        "key": key,
        "createdAt": now,
        "lastUsedAt": None
    })

    return {
        "name": name,
        "prefix": prefix,
        "key": key
    }


@router.delete("/keys/{prefix}")
async def revoke_api_key(request: Request, prefix: str):


    db = get_database()
    result = await db.api_keys.delete_one({"prefix": prefix})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")

    return {"message": "API key revoked"}
