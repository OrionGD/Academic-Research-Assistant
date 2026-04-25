from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.gemini_client import gemini_client

router = APIRouter()


class SupportQuery(BaseModel):
    message: str


@router.post("/chat")
async def support_chat(payload: SupportQuery):
    """
    General AI support assistant (NO document context)
    """
    try:
        response = gemini_client.generate_content(
            model="gemini-2.5-flash",
            prompt=payload.message
        )

        return {
            "reply": response,
            "type": "support_ai"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
