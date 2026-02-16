#!/usr/bin/env python3
"""
Data Migration Script
Handles data migration between different versions of the application
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import json
from datetime import datetime
import hashlib

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/data_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataMigrator:
    def __init__(self):
        self.mongodb_uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_DB_NAME")
        self.client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(self.mongodb_uri)
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")
        
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")
            
    async def backup_collection(self, collection_name: str) -> str:
        """Backup a collection before migration"""
        backup_dir = Path("../backups/migrations")
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"{collection_name}_backup_{timestamp}.json"
        
        collection = self.db[collection_name]
        cursor = collection.find({})
        documents = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            doc["_id"] = str(doc["_id"])
        
        with open(backup_file, 'w') as f:
            json.dump(documents, f, default=str, indent=2)
            
        logger.info(f"Backed up {len(documents)} documents from {collection_name} to {backup_file}")
        return str(backup_file)
        
    async def migrate_v1_to_v2(self):
        """Migration from version 1 to version 2"""
        logger.info("Starting v1 to v2 migration...")
        
        # Backup collections
        await self.backup_collection("documents")
        await self.backup_collection("conversations")
        
        # Migrate documents collection
        documents = self.db["documents"]
        async for doc in documents.find({}):
            update_data = {}
            
            # Add new fields
            if "metadata" not in doc:
                update_data["metadata"] = {
                    "created_at": doc.get("created_at", datetime.utcnow()),
                    "updated_at": datetime.utcnow(),
                    "version": "2.0"
                }
                
            # Update embedding format if needed
            if "embedding" in doc and isinstance(doc["embedding"], list):
                # Ensure embedding is in correct format
                update_data["embedding"] = doc["embedding"]
                
            if update_data:
                await documents.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_data}
                )
                
        # Migrate conversations collection
        conversations = self.db["conversations"]
        async for conv in conversations.find({}):
            if "messages" in conv:
                for msg in conv["messages"]:
                    if "timestamp" not in msg:
                        msg["timestamp"] = datetime.utcnow()
                        
            await conversations.update_one(
                {"_id": conv["_id"]},
                {"$set": {
                    "updated_at": datetime.utcnow(),
                    "version": "2.0"
                }}
            )
            
        # Create indexes for new schema
        await documents.create_index("metadata.created_at")
        await conversations.create_index("updated_at")
        
        logger.info("v1 to v2 migration completed successfully")
        
    async def migrate_v2_to_v3(self):
        """Migration from version 2 to version 3"""
        logger.info("Starting v2 to v3 migration...")
        
        # Backup collections
        await self.backup_collection("documents")
        await self.backup_collection("conversations")
        await self.backup_collection("users")
        
        # Add user collection if it doesn't exist
        if "users" not in await self.db.list_collection_names():
            logger.info("Creating users collection...")
            await self.db.create_collection("users")
            
        # Migrate documents with chunking information
        documents = self.db["documents"]
        async for doc in documents.find({}):
            if "chunks" not in doc:
                # Add chunking metadata
                doc["chunks"] = []
                if "content" in doc and len(doc["content"]) > 1000:
                    # Create chunks for large documents
                    content = doc["content"]
                    chunk_size = 1000
                    chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
                    
                    for i, chunk in enumerate(chunks):
                        chunk_id = hashlib.md5(f"{doc['_id']}_{i}".encode()).hexdigest()
                        chunk_doc = {
                            "chunk_id": chunk_id,
                            "document_id": str(doc["_id"]),
                            "content": chunk,
                            "index": i,
                            "metadata": doc.get("metadata", {})
                        }
                        await self.db["chunks"].insert_one(chunk_doc)
                        doc["chunks"].append(chunk_id)
                        
                await documents.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"chunks": doc["chunks"], "version": "3.0"}}
                )
                
        logger.info("v2 to v3 migration completed successfully")
        
    async def validate_migration(self, version: str) -> bool:
        """Validate migration was successful"""
        logger.info(f"Validating migration to version {version}...")
        
        # Check collections exist
        collections = await self.db.list_collection_names()
        required_collections = ["documents", "conversations"]
        
        if version == "3.0":
            required_collections.extend(["users", "chunks"])
            
        for coll in required_collections:
            if coll not in collections:
                logger.error(f"Required collection '{coll}' not found")
                return False
                
        # Check document versions
        documents = self.db["documents"]
        count = await documents.count_documents({"version": version})
        total = await documents.count_documents({})
        
        if total > 0 and count < total:
            logger.warning(f"Only {count}/{total} documents have version {version}")
            
        logger.info("Migration validation completed")
        return True
        
    async def rollback(self, backup_file: str):
        """Rollback to previous version using backup"""
        logger.info(f"Rolling back using backup: {backup_file}")
        
        with open(backup_file, 'r') as f:
            documents = json.load(f)
            
        collection_name = Path(backup_file).stem.split('_backup_')[0]
        collection = self.db[collection_name]
        
        # Clear collection
        await collection.delete_many({})
        
        # Restore from backup
        if documents:
            await collection.insert_many(documents)
            
        logger.info(f"Rollback completed for {collection_name}")

async def main():
    """Main migration function"""
    migrator = DataMigrator()
    
    try:
        await migrator.connect()
        
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(description='Data Migration Tool')
        parser.add_argument('--from-version', required=True, help='Source version')
        parser.add_argument('--to-version', required=True, help='Target version')
        parser.add_argument('--rollback', help='Rollback using backup file')
        
        args = parser.parse_args()
        
        if args.rollback:
            await migrator.rollback(args.rollback)
            return
            
        # Perform migration based on versions
        if args.from_version == "v1" and args.to_version == "v2":
            await migrator.migrate_v1_to_v2()
        elif args.from_version == "v2" and args.to_version == "v3":
            await migrator.migrate_v2_to_v3()
        else:
            logger.error(f"Unsupported migration path: {args.from_version} -> {args.to_version}")
            sys.exit(1)
            
        # Validate migration
        success = await migrator.validate_migration(args.to_version)
        if not success:
            logger.error("Migration validation failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        await migrator.close()

if __name__ == "__main__":
    asyncio.run(main())