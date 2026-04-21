
import asyncio
import os
import sys
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load Root .env
load_dotenv(dotenv_path="../.env")

async def check_db():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DATABASE_NAME", "aras_db")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Check chunks collection (assuming that's where embeddings are)
    # Looking for a document with an embedding field
    doc = await db.chunks.find_one({"embedding": {"$exists": True}})
    
    if doc:
        dim = len(doc["embedding"])
        print(f"Found document in 'chunks' collection.")
        print(f"Stored embedding dimension: {dim}")
    else:
        print("No documents with embeddings found in 'chunks' collection.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
