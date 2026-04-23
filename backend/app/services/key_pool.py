import logging
import random
import time
from typing import List, Optional
from ..config.database import get_database

logger = logging.getLogger(__name__)

class KeyManager:
    """
    Manages a pool of Gemini API keys with Round-Robin rotation.
    Specifically for Chat features to maximize quota.
    """
    
    _instance = None
    _last_index = -1
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KeyManager, cls).__new__(cls)
        return cls._instance

    async def get_key_for_chat(self) -> str:
        """
        Returns a Gemini API key for Chat rotation.
        Falls back to the environment GEMINI_API_KEY if pool is empty.
        """
        db = get_database()
        # Find all active keys for chat rotation
        cursor = db.gemini_api_keys.find({"isActive": True})
        keys = await cursor.to_list(length=10) # 5 keys expected
        
        if not keys:
            from ..config.settings import settings
            logger.warning("No API keys found in gemini_api_keys collection. Falling back to default.")
            return settings.GEMINI_API_KEY
            
        # Round-robin selection
        self._last_index = (self._last_index + 1) % len(keys)
        selected = keys[self._last_index]
        
        # Update last used timestamp (background-ish)
        await db.gemini_api_keys.update_one(
            {"_id": selected["_id"]},
            {"$set": {"lastUsedAt": time.time()}}
        )
        
        # Mask key for logging
        masked = selected["key"][:4] + "..." + selected["key"][-4:]
        logger.info(f"[KeyManager] Selected key: {masked} (Index: {self._last_index})")
        
        return selected["key"]

    async def initialize_default_pool(self, keys: List[str]):
        """
        Initializes the database with a set of free-tier keys.
        Only runs if the collection is empty.
        """
        db = get_database()
        count = await db.gemini_api_keys.count_documents({})
        if count == 0:
            logger.info(f"Initializing Gemini Key Pool with {len(keys)} keys...")
            documents = [
                {
                    "key": k,
                    "tier": "free",
                    "isActive": True,
                    "lastUsedAt": 0,
                    "createdAt": time.time()
                }
                for k in keys
            ]
            await db.gemini_api_keys.insert_many(documents)
            logger.info("Key Pool initialized ✓")
        else:
            logger.info("Key Pool already exists. Skipping initialization.")

key_manager = KeyManager()
