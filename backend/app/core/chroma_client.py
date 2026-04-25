"""
ChromaDB client for vector storage and retrieval
Uses per-document collections with strict embedding-dimension validation.
"""
import logging
import os
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
if settings.ENABLE_REMOTE_EMBEDDINGS:
    EXPECTED_EMBEDDING_DIM = 768
    COLLECTION_VERSION_SUFFIX = "_v2"  # bump when changing dimensions intentionally
else:
    EXPECTED_EMBEDDING_DIM = 384
    COLLECTION_VERSION_SUFFIX = "_v3_local"


class ChromaDBClient:
    """Client for ChromaDB operations"""

    def __init__(self):
        # Ensure persist directory exists
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)

        # Initialize ChromaDB with persistent storage (modern API)
        self.client = chromadb.PersistentClient(path=settings.chroma_persist_dir)

    def _collection_name(self, document_id: str) -> str:
        """Generate a versioned, safe collection name."""
        base = f"doc_{document_id}".replace("-", "_").lower()
        return f"{base}{COLLECTION_VERSION_SUFFIX}"

    def _validate_collection_dim(self, collection_name: str) -> bool:
        """
        Check if an existing collection has the expected embedding dimension.
        Returns True if compatible or collection does not exist yet.
        Returns False if dimension mismatch is detected.
        """
        try:
            existing = self.client.get_collection(name=collection_name)
            sample = existing.get(limit=1, include=["embeddings"])
            if sample and sample.get("embeddings") and len(sample["embeddings"]) > 0:
                emb = sample["embeddings"][0]
                if emb and len(emb) != EXPECTED_EMBEDDING_DIM:
                    logger.error(
                        f"CRITICAL: Collection '{collection_name}' has dimension {len(emb)}, "
                        f"but expected {EXPECTED_EMBEDDING_DIM}. "
                        f"To fix: delete ChromaDB directory ({settings.chroma_persist_dir}) and restart."
                    )
                    return False
            return True
        except Exception:
            # Collection doesn't exist yet — that's fine
            return True

    def get_or_create_collection(self, document_id: str) -> chromadb.Collection:
        """
        Get or create a collection for a document

        Returns:
            ChromaDB collection
        """
        try:
            collection_name = self._collection_name(document_id)

            # Startup-style validation for this collection
            compatible = self._validate_collection_dim(collection_name)
            if not compatible:
                raise RuntimeError(
                    f"ChromaDB collection dimension mismatch for '{collection_name}'. "
                    f"Delete '{settings.chroma_persist_dir}' and restart."
                )

            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={
                    "source": "aras",
                    "document_id": document_id,
                    "embedding_dim": EXPECTED_EMBEDDING_DIM,
                }
            )
            return collection
        except Exception as e:
            logger.error(f"Error getting/creating collection: {str(e)}")
            raise

    def store_embeddings(
        self,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Store embeddings in ChromaDB with dimension validation.
        """
        try:
            # Guard against length mismatch
            if len(chunks) != len(embeddings):
                logger.error(
                    f"Cannot store embeddings for doc={document_id}: "
                    f"chunks ({len(chunks)}) != embeddings ({len(embeddings)})"
                )
                return False

            # Guard against dimension mismatch
            for i, emb in enumerate(embeddings):
                if emb is None or len(emb) == 0:
                    logger.error(f"Invalid embedding at index {i} for doc={document_id}: None or empty")
                    return False
                if len(emb) != EXPECTED_EMBEDDING_DIM:
                    logger.error(
                        f"Embedding dimension mismatch at index {i} for doc={document_id}: "
                        f"expected {EXPECTED_EMBEDDING_DIM}, got {len(emb)}"
                    )
                    return False

            collection = self.get_or_create_collection(document_id)

            # Prepare documents and metadata
            ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = []

            for i, chunk in enumerate(chunks):
                chunk_metadata = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "chunk_text": chunk[:500],  # Store first 500 chars for reference
                }
                if metadata:
                    chunk_metadata.update(metadata)
                metadatas.append(chunk_metadata)

            # Add to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas
            )

            logger.info(f"Stored {len(chunks)} embeddings for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error storing embeddings: {str(e)}")
            return False

    def retrieve_similar_chunks(
        self,
        document_id: str,
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar chunks from ChromaDB with query-dimension validation.
        """
        # Validate query embedding dimension
        if len(query_embedding) != EXPECTED_EMBEDDING_DIM:
            logger.error(
                f"Query embedding dimension mismatch for doc={document_id}: "
                f"expected {EXPECTED_EMBEDDING_DIM}, got {len(query_embedding)}"
            )
            return []

        try:
            collection = self.get_or_create_collection(document_id)

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "distances", "metadatas"]
            )

            # Format results
            retrieved_chunks = []
            if results and results["documents"] and len(results["documents"]) > 0:
                for i, doc in enumerate(results["documents"][0]):
                    # ChromaDB returns distances, convert to similarity (higher is better)
                    distance = results["distances"][0][i]
                    similarity = 1 / (1 + distance)  # Convert distance to similarity

                    retrieved_chunks.append({
                        "text": doc,
                        "similarity_score": float(similarity),
                        "chunk_index": results["metadatas"][0][i].get("chunk_index", i),
                        "metadata": results["metadatas"][0][i]
                    })

            return retrieved_chunks
        except Exception as e:
            logger.error(f"Error retrieving similar chunks: {str(e)}")
            return []

    def delete_document_embeddings(self, document_id: str) -> bool:
        """
        Delete all embeddings for a document
        """
        try:
            collection_name = self._collection_name(document_id)
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted embeddings for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document embeddings: {str(e)}")
            return False

    def persist(self):
        """Persistence is handled automatically by PersistentClient"""
        pass


chroma_client = ChromaDBClient()

