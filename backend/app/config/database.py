from motor.motor_asyncio import AsyncIOMotorClient
from .settings import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

class DatabaseProxy:
    def __getattr__(self, name):
        if db_instance.db is None:
            # During module import, we might hit this if something tries to access db immediately.
            # But usually it's used inside async functions.
            return None
        return getattr(db_instance.db, name)

    def __getitem__(self, name):
        if db_instance.db is None:
            return None
        return db_instance.db[name]

db = DatabaseProxy()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    # print(f"Connected to MongoDB Atlas: {settings.DATABASE_NAME}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("Closed MongoDB connection")

def get_database():
    return db_instance.db
