import os
import logging
import chromadb
from chromadb.config import Settings
from ..config.settings import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
if settings.ENABLE_REMOTE_EMBEDDINGS:
    EXPECTED_EMBEDDING_DIM = 768
    COLLECTION_VERSION = "v2"
else:
    EXPECTED_EMBEDDING_DIM = 384
    COLLECTION_VERSION = "v3_local"  # Local-first dimension set

# Note: We initialize a persistent ChromaDB client
_client = None
_collection = None
COLLECTION_NAME = f"document_chunks_collection_{COLLECTION_VERSION}"

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

def _check_collection_dimension(client: chromadb.ClientAPI, collection_name: str) -> bool:
    """
    Check if an existing collection has the expected embedding dimension.
    Returns True if compatible or collection does not exist yet.
    Returns False if dimension mismatch is detected.
    """
    try:
        existing = client.get_collection(name=collection_name)
        # Probe dimension by fetching a sample embedding (if any data exists)
        sample = existing.get(limit=1, include=["embeddings"])
        if sample and sample.get("embeddings") and len(sample["embeddings"]) > 0:
            emb = sample["embeddings"][0]
            if emb and len(emb) != EXPECTED_EMBEDDING_DIM:
                logger.error(
                    f"CRITICAL: Collection '{collection_name}' has dimension {len(emb)}, "
                    f"but expected {EXPECTED_EMBEDDING_DIM}. "
                    f"This usually happens when the embedding model changed. "
                    f"To fix: manually delete the ChromaDB directory ({settings.CHROMA_DB_PATH}) and restart."
                )
                return False
        return True
    except Exception:
        # Collection doesn't exist yet — that's fine
        return True

def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        client = get_chroma_client()

        # Startup validation: detect dimension mismatch before using collection
        compatible = _check_collection_dimension(client, COLLECTION_NAME)
        if not compatible:
            raise RuntimeError(
                f"ChromaDB collection dimension mismatch detected. "
                f"Please delete '{settings.CHROMA_DB_PATH}' and restart the server."
            )

        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine", "embedding_dim": EXPECTED_EMBEDDING_DIM}
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
    Validates dimensions strictly before insertion.
    """
    if not chunks_data or not embeddings:
        return

    # Guard against length mismatch between chunks and embeddings
    if len(chunks_data) != len(embeddings):
        logger.error(
            f"Cannot store chunks for doc={document_id}: "
            f"chunks_data ({len(chunks_data)}) != embeddings ({len(embeddings)}). Skipping vector storage."
        )
        return

    # Guard against None, empty, or dimension-mismatched embedding vectors
    for i, emb in enumerate(embeddings):
        if emb is None or len(emb) == 0:
            logger.error(
                f"Invalid embedding at index {i} for doc={document_id}: "
                f"embedding is None or empty. Skipping vector storage."
            )
            return
        if len(emb) != EXPECTED_EMBEDDING_DIM:
            logger.error(
                f"Embedding dimension mismatch at index {i} for doc={document_id}: "
                f"expected {EXPECTED_EMBEDDING_DIM}, got {len(emb)}. Skipping vector storage."
            )
            return

    collection = get_collection()

    ids = []
    documents = []
    metadatas = []

    for c in chunks_data:
        chunk_id = f"{document_id}_{c['index']}"
        ids.append(chunk_id)
        documents.append(c["text"])
        meta = {
            "documentId": document_id,
            "userId": user_id,
            "chunkIndex": c["index"],
            "section": c["section"],
            "tokenCount": c.get("token_count", 0),
        }
        # Include page number if available
        if "pageNumber" in c and c["pageNumber"] is not None:
            meta["pageNumber"] = c["pageNumber"]
        if "charStart" in c:
            meta["charStart"] = c["charStart"]
        metadatas.append(meta)

    # Delete any existing chunks for this document to make ingestion idempotent
    try:
        collection.delete(where={"documentId": document_id})
    except Exception as e:
        logger.warning(f"Failed to delete existing chunks for {document_id}: {e}")

    try:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Stored {len(ids)} chunks in ChromaDB for doc={document_id}")
    except Exception as e:
        logger.error(f"Failed to store chunks in ChromaDB for doc={document_id}: {e}")

async def delete_document_chunks(document_id: str):
    """Delete all chunks for a document from ChromaDB."""
    try:
        collection = get_collection()
        collection.delete(where={"documentId": document_id})
        logger.info(f"Deleted chunks from ChromaDB for doc={document_id}")
    except Exception as e:
        logger.warning(f"Failed to delete chunks for {document_id}: {e}")

async def query_similar_chunks(
    query_embedding: list[float],
    limit: int = 5,
    user_id: str = "",
    document_ids: list[str] = None
) -> list[dict]:
    """
    Perform similarity search in ChromaDB.
    Validates query embedding dimension before querying.
    """
    # Guard query dimension
    if len(query_embedding) != EXPECTED_EMBEDDING_DIM:
        logger.error(
            f"Query embedding dimension mismatch: expected {EXPECTED_EMBEDDING_DIM}, "
            f"got {len(query_embedding)}. Aborting search."
        )
        return []

    try:
        collection = get_collection()

        # Open access: do not enforce per-user filtering.
        where_filter = {}

        if document_ids and len(document_ids) > 0:
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
                "score": similarity,
                "pageNumber": metas[i].get("pageNumber"),
            })

        return formatted_results
    except Exception as e:
        logger.error(f"ChromaDB query failed: {e}")
        return []

