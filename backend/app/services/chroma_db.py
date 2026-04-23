import os
import logging
import chromadb
from chromadb.config import Settings
from ..config.settings import settings

logger = logging.getLogger(__name__)

# Note: We initialize a persistent ChromaDB client
_client = None
_collection = None
COLLECTION_NAME = "document_chunks_collection"

def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        try:
            # Create directory if it doesn't exist
            os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
            _client = chromadb.PersistentClient(
                path=settings.CHROMA_DB_PATH, 
                settings=Settings(anonymized_telemetry=False)
            )
            logger.info(f"Initialized ChromaDB PersistentClient at {settings.CHROMA_DB_PATH}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to initialize ChromaDB client: {error_msg}")
            if "DLL load failed" in error_msg or "chromadb_rust_bindings" in error_msg:
                logger.error("CRITICAL: ChromaDB binary bindings failed to load.")
                logger.error("Or ensure Microsoft Visual C++ Redistributable is installed globally.")
            raise RuntimeError(f"ChromaDB initialization failed: {error_msg}") from e
    return _client

def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        client = get_chroma_client()
        # Get or create collection
        # We don't provide an embedding function because we compute embeddings elsewhere via Gemini API
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection

async def add_document_chunks(
    document_id: str,
    user_id: str,
    chunks_data: list[dict],
    embeddings: list[list[float]]
):
    """
    Store chunks and pre-calculated embeddings in ChromaDB.
    """
    if not chunks_data or not embeddings:
        return
        
    collection = get_collection()
    
    ids = []
    documents = []
    metadatas = []
    
    for c in chunks_data:
        chunk_id = f"{document_id}_{c['index']}"
        ids.append(chunk_id)
        documents.append(c["text"])
        metadatas.append({
            "documentId": document_id,
            "userId": user_id,
            "chunkIndex": c["index"],
            "section": c["section"],
            "tokenCount": c.get("token_count", 0),
        })

    # Delete any existing chunks for this document to make ingestion idempotent
    try:
        collection.delete(where={"documentId": document_id})
    except Exception as e:
        logger.warning(f"Failed to delete existing chunks for {document_id}: {e}")

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    logger.info(f"Stored {len(ids)} chunks in ChromaDB for doc={document_id}")

async def query_similar_chunks(
    query_embedding: list[float],
    limit: int = 5,
    user_id: str = "",
    document_ids: list[str] = None
) -> list[dict]:
    """
    Perform similarity search in ChromaDB.
    """
    collection = get_collection()
    
    # Build metadata filters for multi-tenant isolation and document selection
    where_filter = {}
    
    if user_id and document_ids and len(document_ids) > 0:
        # If multiple document IDs, we must use an $and with $in
        where_filter = {
            "$and": [
                {"userId": user_id},
                {"documentId": {"$in": document_ids}} if len(document_ids) > 1 else {"documentId": document_ids[0]}
            ]
        }
    elif user_id:
        where_filter = {"userId": user_id}
    elif document_ids and len(document_ids) > 0:
        if len(document_ids) > 1:
            where_filter = {"documentId": {"$in": document_ids}}
        else:
            where_filter = {"documentId": document_ids[0]}

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=limit,
        where=where_filter if where_filter else None,
        include=["documents", "metadatas", "distances"]
    )
    
    if not results or not results["ids"] or not results["ids"][0]:
        return []
        
    formatted_results = []
    # Results is a dictionary with lists of lists since it can accept multiple query_embeddings
    ids = results["ids"][0]
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0] if "distances" in results and results["distances"] else [0]*len(ids)
    
    for i in range(len(ids)):
        # Normalize distance to relevance score (cosine distance where smaller is better)
        # Assuming HNSW cosine space, distance is 1 - similarity. So similarity = 1 - distance.
        similarity = 1.0 - distances[i] if distances[i] <= 1.0 else 0.0
        
        formatted_results.append({
            "id": ids[i],
            "documentId": metas[i].get("documentId"),
            "userId": metas[i].get("userId"),
            "chunkIndex": metas[i].get("chunkIndex"),
            "chunkText": docs[i],
            "metadata": metas[i],
            "score": similarity
        })
        
    return formatted_results
