from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
from ..config.database import get_database

router = APIRouter()


@router.post("/upgrade/request")
async def create_upgrade_request(request: Request, body: dict):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    transaction_id = (body.get("transactionId") or "").strip()
    message = (body.get("message") or "").strip()
    if not transaction_id:
        raise HTTPException(status_code=400, detail="transactionId is required")

    db = get_database()
    request_data = {
        "userId": user["user_id"],
        "userData": {
            "_id": user["user_id"],
            "email": user.get("email"),
            "name": user.get("name"),
            "plan": user.get("plan")
        },
        "transactionId": transaction_id,
        "message": message,
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    result = await db.upgrade_requests.insert_one(request_data)
    return {"status": "pending", "requestId": str(result.inserted_id)}
