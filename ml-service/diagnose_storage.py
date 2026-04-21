import asyncio
import os
import structlog
from services.db import connect_to_mongo, get_db
from services.redis_service import redis_service

async def diagnose():
    print("--- ML SERVICE DIAGNOSTICS ---")
    
    # 1. MongoDB
    try:
        print("Checking MongoDB...")
        await connect_to_mongo()
        db = get_db()
        stats = await db.command("dbStats")
        print(f"✓ MongoDB Connected. DB: {stats.get('db')}, Objects: {stats.get('objects')}")
        
        # Check for vector index (just a guess at collection name)
        indices = await db.document_chunks.list_indexes().to_list(length=10)
        print(f"✓ document_chunks indexes: {[i['name'] for i in indices]}")
    except Exception as e:
        print(f"✗ MongoDB Error: {e}")

    # 2. Redis
    try:
        print("\nChecking Redis...")
        if await redis_service.check_health():
            print("✓ Redis Healthy (PONG)")
        else:
            print("✗ Redis Unhealthy")
    except Exception as e:
        print(f"✗ Redis Error: {e}")
        
    print("\n--- END DIAGNOSTICS ---")

if __name__ == "__main__":
    asyncio.run(diagnose())
