import redis.asyncio as redis
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class RedisService:
    _instance: Optional[redis.Redis] = None

    @classmethod
    async def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            cls._instance = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
            logger.info(f"Connected to Redis pool: {redis_url}")
        return cls._instance

    @classmethod
    async def check_health(cls) -> bool:
        try:
            client = await cls.get_client()
            return await client.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None
            logger.info("Redis connection closed")

redis_service = RedisService()
