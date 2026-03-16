from motor.motor_asyncio import AsyncIOMotorClient
from services.config import MONGODB_URI, DATABASE_NAME
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        await client.admin.command('ping')
        db = client[DATABASE_NAME]
        logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_db():
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db
