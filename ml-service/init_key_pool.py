import asyncio
import os
from services.db import connect_to_mongo, close_mongo_connection, get_db
from services.key_pool import key_manager
from dotenv import load_dotenv

load_dotenv()

async def init():
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    
    # 5 Placeholder keys for Free tier
    # User can update these in MongoDB manually or via this script
    keys = [
        "FREE_KEY_1_PLACEHOLDER",
        "FREE_KEY_2_PLACEHOLDER",
        "FREE_KEY_3_PLACEHOLDER",
        "FREE_KEY_4_PLACEHOLDER",
        "FREE_KEY_5_PLACEHOLDER"
    ]
    
    # Use real key from env as first member if available
    real_key = os.getenv("GEMINI_API_KEY")
    if real_key and real_key != "your-gemini-api-key":
        keys[0] = real_key
        print(f"Using real key from .env as first slot: {real_key[:4]}...{real_key[-4:]}")

    await key_manager.initialize_default_pool(keys)
    
    await close_mongo_connection()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(init())
