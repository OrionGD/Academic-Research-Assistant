"""
Search service implementation
"""
from typing import List, Optional, Dict, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.services.embedding_service import EmbeddingService
from app.db.mongodb import chunks, documents
from app.services.vector_store import VectorStoreService


class SearchService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()
    
    async def vector_search(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 10,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Vector similarity search"""
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_embeddings([query])
        
        if not query_embedding:
            return []
        
        # Search in vector store
        results = await self.vector_store.search(
            query_embedding=query_embedding[0],
            user_id=user_id,
            document_ids=document_ids,
            top_k=top_k
        )
        
        # Filter by similarity threshold
        filtered_results = [
            result for result in results
            if result.get("similarity", 0) >= similarity_threshold
        ]
        
        return filtered_results
    
    async def keyword_search(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Keyword/text search"""
        from bson import ObjectId
        
        # Build query
        search_query = {
            "user_id": ObjectId(user_id),
            "$text": {"$search": query}
        }
        
        if document_ids:
            search_query["document_id"] = {"$in": [ObjectId(doc_id) for doc_id in document_ids]}
        
        # Search in MongoDB
        cursor = chunks.find(search_query) \
            .skip(skip) \
            .limit(limit) \
            .sort([("score", {"$meta": "textScore"})])
        
        results = await cursor.to_list(length=limit)
        
        # Get document titles
        doc_ids = list(set([str(r["document_id"]) for r in results]))
        docs = {}
        for doc_id in doc_ids:
            doc = await documents.find_one({"_id": ObjectId(doc_id)})
            if doc:
                docs[doc_id] = doc["title"]
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "chunk_id": str(result["_id"]),
                "content": result["content"],
                "document_id": str(result["document_id"]),
                "document_title": docs.get(str(result["document_id"]), "Unknown"),
                "chunk_index": result["chunk_index"],
                "metadata": result.get("metadata", {}),
                "score": result.get("score", 0)
            })
        
        return formatted_results
    
    async def hybrid_search(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 10,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Hybrid vector + keyword search"""
        # Perform both searches
        vector_results = await self.vector_search(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            top_k=top_k * 2,
            similarity_threshold=0.5  # Lower threshold for hybrid
        )
        
        keyword_results = await self.keyword_search(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            skip=0,
            limit=top_k * 2
        )
        
        # Combine results
        combined = {}
        
        # Add vector results
        for result in vector_results:
            chunk_id = result.get("chunk_id")
            if chunk_id:
                combined[chunk_id] = {
                    **result,
                    "vector_score": result.get("similarity", 0),
                    "keyword_score": 0,
                    "combined_score": result.get("similarity", 0) * vector_weight
                }
        
        # Add keyword results
        for result in keyword_results:
            chunk_id = result.get("chunk_id")
            keyword_score = result.get("score", 0) / 100  # Normalize
            
            if chunk_id in combined:
                # Update existing entry
                combined[chunk_id]["keyword_score"] = keyword_score
                combined[chunk_id]["combined_score"] = (
                    combined[chunk_id]["vector_score"] * vector_weight +
                    keyword_score * keyword_weight
                )
            else:
                # Add new entry
                combined[chunk_id] = {
                    **result,
                    "vector_score": 0,
                    "keyword_score": keyword_score,
                    "combined_score": keyword_score * keyword_weight,
                    "similarity": 0
                }
        
        # Sort by combined score
        sorted_results = sorted(
            combined.values(),
            key=lambda x: x["combined_score"],
            reverse=True
        )
        
        return sorted_results[:top_k]