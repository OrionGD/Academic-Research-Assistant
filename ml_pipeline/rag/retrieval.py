"""
Advanced retrieval strategies for RAG pipeline.
Provides dense, sparse, and hybrid retrieval methods with context optimization.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RetrievalMethod(Enum):
    """Supported retrieval methods."""
    DENSE = "dense"
    SPARSE = "sparse"
    HYBRID = "hybrid"
    MULTI_VECTOR = "multi_vector"
    CONTEXTUAL = "contextual"


@dataclass
class RetrievalResult:
    """Retrieval result with metadata."""
    document_id: str
    chunk_id: str
    text: str
    score: float
    method: str
    metadata: Dict[str, Any]
    position: int = 0


class Retriever:
    """
    Advanced retriever with multiple retrieval strategies.
    Supports dense, sparse, hybrid, and contextual retrieval.
    """
    
    def __init__(
        self,
        vector_search,
        mongodb_client,
        embedding_generator,
        default_method: RetrievalMethod = RetrievalMethod.HYBRID,
        dense_weight: float = 0.7,
        sparse_weight: float = 0.3,
        max_context_length: int = 4096,
        cache_results: bool = True
    ):
        """
        Initialize retriever.
        
        Args:
            vector_search: Vector search instance
            mongodb_client: MongoDB client for metadata
            embedding_generator: Embedding generator instance
            default_method: Default retrieval method
            dense_weight: Weight for dense retrieval in hybrid mode
            sparse_weight: Weight for sparse retrieval in hybrid mode
            max_context_length: Maximum context length in tokens
            cache_results: Whether to cache retrieval results
        """
        self.vector_search = vector_search
        self.mongodb = mongodb_client
        self.embedding_generator = embedding_generator
        self.default_method = default_method
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight
        self.max_context_length = max_context_length
        self.cache_results = cache_results
        
        # Initialize cache
        self.retrieval_cache = {}
        
        logger.info(f"Initialized Retriever with default method: {default_method.value}")
    
    async def retrieve(
        self,
        query: str,
        method: Optional[RetrievalMethod] = None,
        top_k: int = 10,
        filter_criteria: Optional[Dict[str, Any]] = None,
        return_scores: bool = True,
        use_cache: bool = True
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: User query
            method: Retrieval method (defaults to self.default_method)
            top_k: Number of results to return
            filter_criteria: Additional filters
            return_scores: Whether to return scores
            use_cache: Whether to use cache
            
        Returns:
            List of retrieval results
        """
        method = method or self.default_method
        
        # Check cache
        if use_cache and self.cache_results:
            cache_key = self._generate_cache_key(query, method, top_k, filter_criteria)
            cached = self.retrieval_cache.get(cache_key)
            if cached:
                logger.info(f"Cache hit for query: {query[:50]}...")
                return cached
        
        # Perform retrieval based on method
        if method == RetrievalMethod.DENSE:
            results = await self._dense_retrieval(query, top_k, filter_criteria)
        elif method == RetrievalMethod.SPARSE:
            results = await self._sparse_retrieval(query, top_k, filter_criteria)
        elif method == RetrievalMethod.HYBRID:
            results = await self._hybrid_retrieval(query, top_k, filter_criteria)
        elif method == RetrievalMethod.MULTI_VECTOR:
            results = await self._multi_vector_retrieval(query, top_k, filter_criteria)
        elif method == RetrievalMethod.CONTEXTUAL:
            results = await self._contextual_retrieval(query, top_k, filter_criteria)
        else:
            raise ValueError(f"Unsupported retrieval method: {method}")
        
        # Add position information
        for i, result in enumerate(results):
            result.position = i
        
        # Cache results
        if self.cache_results and use_cache:
            self.retrieval_cache[cache_key] = results
        
        logger.info(f"Retrieved {len(results)} results using {method.value}")
        return results
    
    async def _dense_retrieval(
        self,
        query: str,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Perform dense retrieval using embeddings.
        """
        # Generate query embedding
        query_embedding = await self.embedding_generator.generate_embedding_async(query)
        
        # Perform vector search
        vector_results = self.vector_search.semantic_search(
            query_embedding=query_embedding,
            filter_criteria=filter_criteria,
            limit=top_k
        )
        
        # Convert to RetrievalResult objects
        results = []
        for res in vector_results:
            results.append(RetrievalResult(
                document_id=res.get("document_id"),
                chunk_id=res.get("chunk_id"),
                text=res.get("text", ""),
                score=res.get("similarity_score", 0),
                method="dense",
                metadata=res.get("metadata", {})
            ))
        
        return results
    
    async def _sparse_retrieval(
        self,
        query: str,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Perform sparse retrieval using BM25/text search.
        """
        # Use MongoDB text search
        pipeline = [
            {
                "$search": {
                    "index": "text_index",
                    "text": {
                        "query": query,
                        "path": "text",
                        "fuzzy": {"maxEdits": 1}
                    }
                }
            },
            {
                "$addFields": {
                    "text_score": {"$meta": "searchScore"}
                }
            }
        ]
        
        if filter_criteria:
            pipeline.append({"$match": filter_criteria})
        
        pipeline.append({"$limit": top_k})
        
        # Execute search
        collection = self.mongodb[self.vector_search.collection_name]
        cursor = collection.aggregate(pipeline)
        
        results = []
        async for doc in cursor:
            results.append(RetrievalResult(
                document_id=doc.get("document_id"),
                chunk_id=doc.get("chunk_id"),
                text=doc.get("text", ""),
                score=doc.get("text_score", 0),
                method="sparse",
                metadata=doc.get("metadata", {})
            ))
        
        return results
    
    async def _hybrid_retrieval(
        self,
        query: str,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Perform hybrid retrieval combining dense and sparse methods.
        """
        # Get dense results
        dense_results = await self._dense_retrieval(query, top_k * 2, filter_criteria)
        
        # Get sparse results
        sparse_results = await self._sparse_retrieval(query, top_k * 2, filter_criteria)
        
        # Combine using Reciprocal Rank Fusion
        combined = self._reciprocal_rank_fusion(
            [dense_results, sparse_results],
            [self.dense_weight, self.sparse_weight],
            top_k
        )
        
        return combined
    
    async def _multi_vector_retrieval(
        self,
        query: str,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Perform multi-vector retrieval using multiple query representations.
        """
        # Generate multiple query representations
        query_variations = self._generate_query_variations(query)
        
        # Generate embeddings for each variation
        embeddings = []
        for q in query_variations:
            emb = await self.embedding_generator.generate_embedding_async(q)
            embeddings.append(emb)
        
        # Perform multi-vector search
        results = self.vector_search.multi_vector_search(
            query_embeddings=embeddings,
            filter_criteria=filter_criteria,
            limit=top_k,
            combination_method="weighted_avg"
        )
        
        # Convert to RetrievalResult objects
        retrieval_results = []
        for res in results:
            retrieval_results.append(RetrievalResult(
                document_id=res.get("document_id"),
                chunk_id=res.get("chunk_id"),
                text=res.get("text", ""),
                score=res.get("combined_score", 0),
                method="multi_vector",
                metadata=res.get("metadata", {})
            ))
        
        return retrieval_results
    
    async def _contextual_retrieval(
        self,
        query: str,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[RetrievalResult]:
        """
        Perform contextual retrieval considering conversation history.
        """
        # For now, use hybrid retrieval with expanded context
        # In a full implementation, this would consider conversation history
        
        # Expand query with context (simplified)
        expanded_query = f"context: {query}"
        
        # Use hybrid retrieval
        return await self._hybrid_retrieval(expanded_query, top_k, filter_criteria)
    
    def _reciprocal_rank_fusion(
        self,
        result_lists: List[List[RetrievalResult]],
        weights: List[float],
        top_k: int
    ) -> List[RetrievalResult]:
        """
        Combine multiple result lists using Reciprocal Rank Fusion.
        
        Args:
            result_lists: Lists of results from different methods
            weights: Weights for each method
            top_k: Number of results to return
            
        Returns:
            Combined and reranked results
        """
        k = 60  # RRF constant
        fused_scores = {}
        
        # Calculate RRF scores
        for method_idx, results in enumerate(result_lists):
            weight = weights[method_idx]
            
            for rank, result in enumerate(results):
                doc_id = f"{result.document_id}_{result.chunk_id}"
                
                if doc_id not in fused_scores:
                    fused_scores[doc_id] = {
                        "result": result,
                        "score": 0,
                        "methods": []
                    }
                
                # Add RRF score
                rrf_score = weight * (1.0 / (k + rank + 1))
                fused_scores[doc_id]["score"] += rrf_score
                fused_scores[doc_id]["methods"].append(result.method)
        
        # Sort by fused score
        sorted_results = sorted(
            fused_scores.values(),
            key=lambda x: x["score"],
            reverse=True
        )[:top_k]
        
        # Update results with fused score and methods
        for item in sorted_results:
            item["result"].score = item["score"]
            item["result"].metadata["fusion_methods"] = item["methods"]
        
        return [item["result"] for item in sorted_results]
    
    def _generate_query_variations(self, query: str) -> List[str]:
        """
        Generate variations of the query for multi-vector retrieval.
        
        Args:
            query: Original query
            
        Returns:
            List of query variations
        """
        variations = [query]
        
        # Add lowercase version
        variations.append(query.lower())
        
        # Add keyword-focused version (simplified)
        # In production, use NLP techniques for better variations
        keywords = query.split()[:5]
        if len(keywords) > 1:
            variations.append(" ".join(keywords))
        
        # Add question-focused version if applicable
        if query.endswith("?"):
            variations.append(query[:-1])
        
        return variations
    
    def _generate_cache_key(
        self,
        query: str,
        method: RetrievalMethod,
        top_k: int,
        filter_criteria: Optional[Dict[str, Any]]
    ) -> str:
        """
        Generate cache key for retrieval results.
        
        Args:
            query: Query string
            method: Retrieval method
            top_k: Number of results
            filter_criteria: Filter criteria
            
        Returns:
            Cache key
        """
        key_data = {
            "query": query,
            "method": method.value,
            "top_k": top_k,
            "filters": filter_criteria
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def expand_context(
        self,
        results: List[RetrievalResult],
        max_length: int = None
    ) -> str:
        """
        Expand retrieved chunks into a coherent context string.
        
        Args:
            results: Retrieved results
            max_length: Maximum context length
            
        Returns:
            Expanded context string
        """
        max_length = max_length or self.max_context_length
        
        context_parts = []
        current_length = 0
        
        for result in results:
            chunk_text = f"[Document {result.position + 1}] {result.text}\n\n"
            chunk_length = len(chunk_text)
            
            if current_length + chunk_length <= max_length:
                context_parts.append(chunk_text)
                current_length += chunk_length
            else:
                # Truncate the last chunk if needed
                remaining = max_length - current_length
                if remaining > 100:  # Only add if we can include meaningful content
                    truncated = chunk_text[:remaining] + "..."
                    context_parts.append(truncated)
                break
        
        return "".join(context_parts)
    
    def clear_cache(self):
        """Clear retrieval cache."""
        self.retrieval_cache.clear()
        logger.info("Cleared retrieval cache")


