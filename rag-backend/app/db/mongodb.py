"""
MongoDB database connection
"""
from typing import Optional
import motor.motor_asyncio
from pymongo import ASCENDING, DESCENDING
from app.core.config import settings


class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


db_instance = Database()


async def connect_to_mongo():
    """Connect to MongoDB"""
    db_instance.client = motor.motor_asyncio.AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=100,
        minPoolSize=10,
    )
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
    print("Connected to MongoDB")


async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_instance.client:
        db_instance.client.close()
        print("Disconnected from MongoDB")


# Database collections
def get_collection(collection_name: str):
    """Get a MongoDB collection"""
    if not db_instance.db:
        raise RuntimeError("Database not initialized")
    return db_instance.db[collection_name]


# Collection references
users = get_collection("users")
documents = get_collection("documents")
chunks = get_collection("chunks")
conversations = get_collection("conversations")
search_history = get_collection("search_history")

# Export
db = db_instance.db
