"""
ChromaDB client for vector storage and retrieval
"""
import logging
import os
from typing import List, Dict, Any, Tuple
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChromaDBClient:
    """Client for ChromaDB operations"""
    
    def __init__(self):
        # Ensure persist directory exists
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        
        # Initialize ChromaDB with persistent storage
        chroma_settings = ChromaSettings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.chroma_persist_dir,
            anonymized_telemetry=False
        )
        self.client = chromadb.Client(chroma_settings)
    
    def get_or_create_collection(self, document_id: str) -> chromadb.Collection:
        """
        Get or create a collection for a document
        
        Args:
            document_id: Unique document identifier
            
        Returns:
            ChromaDB collection
        """
        try:
            # Collection name must be valid
            collection_name = f"doc_{document_id}".replace("-", "_").lower()
            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"source": "aras", "document_id": document_id}
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
        Store embeddings in ChromaDB
        
        Args:
            document_id: Document identifier
            chunks: List of text chunks
            embeddings: List of embedding vectors
            metadata: Additional metadata
            
        Returns:
            Success status
        """
        try:
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
        Retrieve similar chunks from ChromaDB
        
        Args:
            document_id: Document identifier
            query_embedding: Embedding vector of the query
            top_k: Number of top results to return
            
        Returns:
            List of retrieved chunks with similarity scores
        """
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
        
        Args:
            document_id: Document identifier
            
        Returns:
            Success status
        """
        try:
            collection_name = f"doc_{document_id}".replace("-", "_").lower()
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted embeddings for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document embeddings: {str(e)}")
            return False
    
    def persist(self):
        """Persist ChromaDB data to disk"""
        try:
            self.client.persist()
            logger.info("ChromaDB data persisted")
        except Exception as e:
            logger.warning(f"Error persisting ChromaDB: {str(e)}")


chroma_client = ChromaDBClient()
