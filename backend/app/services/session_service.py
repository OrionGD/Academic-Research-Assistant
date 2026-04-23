import json
import uuid
from typing import Optional, Dict, Any
from ..config.redis_config import get_redis
from ..config.settings import settings

class SessionService:
    @staticmethod
    async def create_session(user_data: Dict[str, Any]) -> str:
        redis = get_redis()
        session_id = str(uuid.uuid4())
        await redis.setex(
            f"session:{session_id}",
            settings.SESSION_EXPIRE_SECONDS,
            json.dumps(user_data)
        )
        return session_id

    @staticmethod
    async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        redis = get_redis()
        data = await redis.get(f"session:{session_id}")
        if data:
            return json.loads(data)
        return None

    @staticmethod
    async def delete_session(session_id: str):
        redis = get_redis()
        await redis.delete(f"session:{session_id}")

    @staticmethod
    async def update_session(session_id: str, updates: Dict[str, Any]):
        redis = get_redis()
        current = await SessionService.get_session(session_id)
        if current:
            current.update(updates)
            await redis.setex(
                f"session:{session_id}",
                settings.SESSION_EXPIRE_SECONDS,
                json.dumps(current)
            )
