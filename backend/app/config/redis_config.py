import redis.asyncio as redis
from .settings import settings

redis_client = None

async def connect_to_redis():
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # print("Connected to Redis")

async def close_redis_connection():
    if redis_client:
        await redis_client.close()
        print("Closed Redis connection")

def get_redis():
    return redis_client
