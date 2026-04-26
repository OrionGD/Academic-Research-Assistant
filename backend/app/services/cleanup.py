import logging
import os
import time
from datetime import datetime, timedelta, timezone
from ..config.database import get_database

logger = logging.getLogger(__name__)

async def cleanup_stale_documents(max_age_hours: int = 2):
    """
    Delete documents that are older than max_age_hours.
    This serves as a safety net if session cleanup fails.
    """
    db = get_database()
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    
    # We use uploadDate to determine age
    query = {
        "uploadDate": {"$lt": cutoff_time.isoformat()},
        "sessionId": {"$ne": "public"} # Don't delete public docs if any exist
    }
    
    docs = await db.documents.find(query).to_list(length=1000)
    if not docs:
        return
        
    logger.info(f"Found {len(docs)} stale documents for cleanup.")
    
    UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
    
    for doc in docs:
        doc_id = doc["documentId"]
        
        # 1. Delete File
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.error(f"Failed to delete file {file_path}: {e}")
                
        # 2. Delete Vector Chunks
        try:
            from ..services.chroma_db import delete_document_chunks
            await delete_document_chunks(doc_id)
        except Exception:
            pass
            
    # 3. Delete from DB
    await db.documents.delete_many(query)
    logger.info(f"Successfully cleaned up {len(docs)} stale documents.")
