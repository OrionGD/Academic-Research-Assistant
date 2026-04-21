
import asyncio
import os
import dotenv
from motor.motor_asyncio import AsyncIOMotorClient

dotenv.load_dotenv('../.env')

async def clean_keys():
    uri = os.getenv('MONGODB_URI')
    db_name = os.getenv('DATABASE_NAME', 'aras_db')
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Deactivate or delete test keys
    result = await db.gemini_api_keys.delete_many({"key": {"$regex": "PLACEHOLDER"}})
    print(f"Deleted {result.deleted_count} placeholder keys from database.")
    
    # Also reset the valid key's lastUsedAt if necessary? We can leave it.
    
    # List remaining active
    cursor = db.gemini_api_keys.find({"isActive": True})
    keys = await cursor.to_list(length=10)
    for k in keys:
        masked = k['key'][:6] + '...' + k['key'][-4:]
        print(f"Remaining active key: {masked}")

if __name__ == "__main__":
    asyncio.run(clean_keys())
