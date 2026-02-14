"""
Advanced vector search implementations using MongoDB Atlas Vector Search.
Provides hybrid search, multi-vector search, and semantic caching capabilities.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Union, Tuple
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
import logging
from datetime import datetime, timedelta
import hashlib
import json
from bson import ObjectId
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VectorSearch:
    """
    Advanced vector search operations for MongoDB.
    Supports multi-vector search, hybrid search, and semantic caching.
    """
    
    def __init__(
        self,
        connection_string: str,
        database_name: str,
        collection_name: str = "embeddings",
        cache_collection: str = "semantic_cache",
        vector_index_name: str = "vector_index",
        embedding_dimension: int = 1536
    ):
        """
        Initialize vector search.
        
        Args:
            connection_string: MongoDB connection string
            database_name: Database name
            collection_name: Collection name for embeddings
            cache_collection: Collection name for semantic cache
            vector_index_name: Name of vector search index
            embedding_dimension: Dimension of embeddings
        """
        self.connection_string = connection_string
        self.database_name = database_name
        self.collection_name = collection_name
        self.cache_collection = cache_collection
        self.vector_index_name = vector_index_name
        self.embedding_dimension = embedding_dimension
        
        # Connect to MongoDB
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        self.collection = self.db[collection_name]
        self.cache = self.db[cache_collection]
        
        # Create indexes for cache
        self._setup_cache()
        
        logger.info(f"Initialized VectorSearch for {database_name}.{collection_name}")
    
    def _setup_cache(self):
        """Setup indexes for semantic cache."""
        self.cache.create_index("query_hash", unique=True)
        self.cache.create_index("created_at", expireAfterSeconds=86400)  # Auto-expire after 24h
        self.cache.create_index([("query_embedding", "2d")])  # For approximate matching
    
    def semantic_search(
        self,
        query_embedding: List[float],
        filter_criteria: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        num_candidates: int = 100,
        min_score: float = 0.7,
        return_scores: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search using vector similarity.
        
        Args:
            query_embedding: Query vector
            filter_criteria: Additional filters
            limit: Number of results
            num_candidates: Number of candidates to consider
            min_score: Minimum similarity score
            return_scores: Whether to include similarity scores
            
        Returns:
            List of matching documents with scores
        """
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.vector_index_name,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": num_candidates,
                    "limit": limit
                }
            }
        ]
        
        # Add filters
        if filter_criteria:
            pipeline.append({"$match": filter_criteria})
        
        # Add score
        if return_scores:
            pipeline.append({
                "$addFields": {
                    "similarity_score": {
                        "$meta": "vectorSearchScore"
                    }
                }
            })
            pipeline.append({"$match": {"similarity_score": {"$gte": min_score}}})
        
        # Project fields
        pipeline.append({
            "$project": {
                "embedding": 0  # Exclude embedding from results
            }
        })
        
        results = list(self.collection.aggregate(pipeline))
        
        # Convert ObjectId to string
        for result in results:
            result["_id"] = str(result["_id"])
        
        logger.info(f"Semantic search returned {len(results)} results")
        return results
    
    def multi_vector_search(
        self,
        query_embeddings: List[List[float]],
        weights: Optional[List[float]] = None,
        filter_criteria: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        num_candidates: int = 100,
        combination_method: str = "weighted_avg"  # 'weighted_avg', 'max', 'min'
    ) -> List[Dict[str, Any]]:
        """
        Perform search using multiple query vectors.
        
        Args:
            query_embeddings: List of query vectors
            weights: Weights for each vector
            filter_criteria: Additional filters
            limit: Number of results
            num_candidates: Candidates per vector
            combination_method: How to combine scores
            
        Returns:
            Combined search results
        """
        if not query_embeddings:
            return []
        
        if weights is None:
            weights = [1.0 / len(query_embeddings)] * len(query_embeddings)
        elif len(weights) != len(query_embeddings):
            raise ValueError("Number of weights must match number of embeddings")
        
        # Perform separate searches
        all_results = []
        for emb, weight in zip(query_embeddings, weights):
            results = self.semantic_search(
                emb,
                filter_criteria=filter_criteria,
                limit=num_candidates,
                num_candidates=num_candidates,
                return_scores=True
            )
            
            # Store with weight
            for result in results:
                result["weighted_score"] = result["similarity_score"] * weight
                result["original_scores"] = [result["similarity_score"]]
                result["weights"] = [weight]
            
            all_results.append(results)
        
        # Combine results
        combined = self._combine_results(all_results, combination_method, limit)
        
        logger.info(f"Multi-vector search returned {len(combined)} results")
        return combined
    
    def _combine_results(
        self,
        all_results: List[List[Dict]],
        method: str,
        limit: int
    ) -> List[Dict]:
        """
        Combine results from multiple searches.
        
        Args:
            all_results: Results from each search
            method: Combination method
            limit: Maximum results
            
        Returns:
            Combined results
        """
        combined_dict = {}
        
        for search_results in all_results:
            for result in search_results:
                doc_id = result["_id"]
                
                if doc_id not in combined_dict:
                    combined_dict[doc_id] = result.copy()
                    combined_dict[doc_id]["original_scores"] = []
                    combined_dict[doc_id]["weights"] = []
                
                combined_dict[doc_id]["original_scores"].append(result["similarity_score"])
                combined_dict[doc_id]["weights"].append(result.get("weight", 1.0))
        
        # Calculate combined scores
        for doc_id, data in combined_dict.items():
            scores = data.pop("original_scores")
            weights = data.pop("weights")
            
            if method == "weighted_avg":
                data["combined_score"] = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
            elif method == "max":
                data["combined_score"] = max(scores)
            elif method == "min":
                data["combined_score"] = min(scores)
            else:
                data["combined_score"] = np.mean(scores)
        
        # Sort and limit
        sorted_results = sorted(
            combined_dict.values(),
            key=lambda x: x["combined_score"],
            reverse=True
        )
        
        return sorted_results[:limit]
    
    def hybrid_search(
        self,
        query_embedding: List[float],
        text_query: str,
        vector_weight: float = 0.7,
        text_weight: float = 0.3,
        filter_criteria: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining vector and text search.
        
        Args:
            query_embedding: Vector embedding
            text_query: Text query for keyword search
            vector_weight: Weight for vector similarity
            text_weight: Weight for text relevance
            filter_criteria: Additional filters
            limit: Number of results
            
        Returns:
            Combined search results
        """
        # Vector search
        vector_results = self.semantic_search(
            query_embedding,
            filter_criteria=filter_criteria,
            limit=limit * 2,
            return_scores=True
        )
        
        # Text search using MongoDB text index
        text_pipeline = [
            {
                "$search": {
                    "index": "text_search",
                    "text": {
                        "query": text_query,
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
            text_pipeline.append({"$match": filter_criteria})
        
        text_pipeline.append({"$limit": limit * 2})
        
        text_results = list(self.collection.aggregate(text_pipeline))
        
        # Combine scores
        combined = self._fuse_scores(
            vector_results,
            text_results,
            vector_weight,
            text_weight,
            limit
        )
        
        logger.info(f"Hybrid search returned {len(combined)} results")
        return combined
    
    def _fuse_scores(
        self,
        vector_results: List[Dict],
        text_results: List[Dict],
        vector_weight: float,
        text_weight: float,
        limit: int
    ) -> List[Dict]:
        """
        Fuse scores from vector and text search using Reciprocal Rank Fusion.
        
        Args:
            vector_results: Results from vector search
            text_results: Results from text search
            vector_weight: Weight for vector scores
            text_weight: Weight for text scores
            limit: Maximum results
            
        Returns:
            Fused results
        """
        fused_scores = {}
        k = 60  # RRF constant
        
        # Add vector results
        for rank, result in enumerate(vector_results):
            doc_id = result["_id"]
            score = 1.0 / (k + rank + 1)
            if doc_id not in fused_scores:
                fused_scores[doc_id] = {
                    "doc": result,
                    "vector_score": result.get("similarity_score", 0),
                    "text_score": 0,
                    "rrf_score": 0
                }
            fused_scores[doc_id]["rrf_score"] += vector_weight * score
        
        # Add text results
        for rank, result in enumerate(text_results):
            doc_id = result["_id"]
            score = 1.0 / (k + rank + 1)
            if doc_id not in fused_scores:
                fused_scores[doc_id] = {
                    "doc": result,
                    "vector_score": 0,
                    "text_score": result.get("text_score", 0),
                    "rrf_score": 0
                }
            fused_scores[doc_id]["rrf_score"] += text_weight * score
            fused_scores[doc_id]["text_score"] = result.get("text_score", 0)
        
        # Prepare results
        results = []
        for doc_id, data in fused_scores.items():
            doc = data["doc"]
            doc["_id"] = str(doc["_id"])
            doc["combined_score"] = data["rrf_score"]
            doc["vector_score"] = data["vector_score"]
            doc["text_score"] = data["text_score"]
            results.append(doc)
        
        # Sort by combined score
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return results[:limit]
    
    def semantic_cache(
        self,
        query: str,
        query_embedding: List[float],
        llm_response: Optional[str] = None,
        threshold: float = 0.95,
        ttl_seconds: int = 3600
    ) -> Optional[str]:
        """
        Semantic caching for LLM responses.
        
        Args:
            query: Original query
            query_embedding: Query embedding
            llm_response: LLM response to cache (if None, check cache)
            threshold: Similarity threshold for cache hit
            ttl_seconds: Time-to-live for cache entry
            
        Returns:
            Cached response if hit, None otherwise
        """
        query_hash = hashlib.md5(query.encode()).hexdigest()
        
        if llm_response is not None:
            # Cache the response
            cache_entry = {
                "query_hash": query_hash,
                "query": query,
                "query_embedding": query_embedding,
                "response": llm_response,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
                "hit_count": 0
            }
            
            self.cache.update_one(
                {"query_hash": query_hash},
                {"$set": cache_entry},
                upsert=True
            )
            
            logger.info(f"Cached response for query: {query[:50]}...")
            return None
        
        # Check cache for similar queries
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "query_embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 10,
                    "limit": 1
                }
            },
            {
                "$addFields": {
                    "similarity": {
                        "$meta": "vectorSearchScore"
                    }
                }
            },
            {
                "$match": {
                    "similarity": {"$gte": threshold},
                    "expires_at": {"$gt": datetime.utcnow()}
                }
            }
        ]
        
        results = list(self.cache.aggregate(pipeline))
        
        if results:
            # Cache hit
            self.cache.update_one(
                {"_id": results[0]["_id"]},
                {"$inc": {"hit_count": 1}}
            )
            logger.info(f"Cache hit with similarity: {results[0]['similarity']:.3f}")
            return results[0]["response"]
        
        logger.info("Cache miss")
        return None
    
    def find_similar_documents(
        self,
        document_id: str,
        limit: int = 10,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Find documents similar to a given document.
        
        Args:
            document_id: Source document ID
            limit: Number of similar documents to return
            filter_criteria: Additional filters
            
        Returns:
            List of similar documents
        """
        # Get the document's embeddings
        doc_embeddings = list(self.collection.find(
            {"document_id": document_id},
            {"embedding": 1}
        ).limit(1))
        
        if not doc_embeddings:
            logger.warning(f"No embeddings found for document {document_id}")
            return []
        
        query_embedding = doc_embeddings[0]["embedding"]
        
        # Search for similar documents
        filter_criteria = filter_criteria or {}
        filter_criteria["document_id"] = {"$ne": document_id}  # Exclude source document
        
        results = self.semantic_search(
            query_embedding,
            filter_criteria=filter_criteria,
            limit=limit
        )
        
        return results
    
    def batch_vector_search(
        self,
        query_embeddings: List[List[float]],
        batch_size: int = 10,
        **kwargs
    ) -> List[List[Dict[str, Any]]]:
        """
        Perform vector search for multiple queries in batches.
        
        Args:
            query_embeddings: List of query vectors
            batch_size: Batch size
            **kwargs: Additional arguments for semantic_search
            
        Returns:
            List of result lists for each query
        """
        all_results = []
        
        for i in range(0, len(query_embeddings), batch_size):
            batch = query_embeddings[i:i + batch_size]
            batch_results = []
            
            for query_emb in batch:
                results = self.semantic_search(query_emb, **kwargs)
                batch_results.append(results)
            
            all_results.extend(batch_results)
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(query_embeddings)-1)//batch_size + 1}")
        
        return all_results
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector collection.
        
        Returns:
            Collection statistics
        """
        stats = self.db.command("collstats", self.collection_name)
        
        # Get additional info
        total_docs = self.collection.count_documents({})
        avg_embedding_size = stats.get("avgObjSize", 0)
        
        # Check vector index status
        vector_index_exists = self._check_vector_index()
        
        return {
            "total_documents": total_docs,
            "storage_size_mb": stats.get("size", 0) / (1024 * 1024),
            "index_size_mb": stats.get("totalIndexSize", 0) / (1024 * 1024),
            "avg_document_size_bytes": avg_embedding_size,
            "vector_index_exists": vector_index_exists,
            "embedding_dimension": self.embedding_dimension
        }
    
    def _check_vector_index(self) -> bool:
        """
        Check if vector search index exists.
        
        Returns:
            True if index exists
        """
        try:
            indexes = self.collection.list_search_indexes()
            for index in indexes:
                if index["name"] == self.vector_index_name:
                    return True
        except:
            pass
        return False
    
    def close(self):
        """Close MongoDB connection."""
        self.client.close()
        logger.info("Closed MongoDB connection")