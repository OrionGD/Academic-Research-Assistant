"""
Vector store service for embedding storage and search
"""
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.db.mongodb import chunks
from app.core.config import settings


class VectorStoreService:
    def __init__(self):
        self.dimension = settings.EMBEDDING_DIMENSION
    
    async def add_chunk(
        self,
        chunk_id: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ):
        """Add chunk to vector store"""
        # In this implementation, we're storing embeddings in MongoDB
        # For production, you might want to use specialized vector databases
        # like Pinecone, Weaviate, or Qdrant
        pass
    
    async def search(
        self,
        query_embedding: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for similar chunks"""
        from bson import ObjectId
        
        # Build query
        query = {
            "user_id": ObjectId(user_id),
            "embedding_vector": {"$ne": None}
        }
        
        if document_ids:
            query["document_id"] = {"$in": [ObjectId(doc_id) for doc_id in document_ids]}
        
        # Get chunks with embeddings
        cursor = chunks.find(query)
        all_chunks = await cursor.to_list(length=1000)  # Limit for demo
        
        if not all_chunks:
            return []
        
        # Extract embeddings and calculate similarities
        chunk_embeddings = []
        valid_chunks = []
        
        for chunk in all_chunks:
            if chunk.get("embedding_vector"):
                chunk_embeddings.append(chunk["embedding_vector"])
                valid_chunks.append(chunk)
        
        if not chunk_embeddings:
            return []
        
        # Calculate cosine similarities
        similarities = cosine_similarity(
            [query_embedding],
            chunk_embeddings
        )[0]
        
        # Combine chunks with similarities
        results = []
        for i, chunk in enumerate(valid_chunks):
            results.append({
                "chunk_id": str(chunk["_id"]),
                "content": chunk["content"],
                "similarity": float(similarities[i]),
                "metadata": {
                    "document_id": str(chunk["document_id"]),
                    "chunk_index": chunk["chunk_index"],
                    "document_title": chunk.get("metadata", {}).get("document_title", "Unknown")
                }
            })
        
        # Sort by similarity and return top_k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
    
    async def delete_document_chunks(self, document_id: str):
        """Delete all chunks for a document from vector store"""
        # In MongoDB implementation, chunks are deleted directly
        # For external vector stores, implement deletion here
        pass