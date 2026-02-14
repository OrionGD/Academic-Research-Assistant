"""
MongoDB Vector Search integration for ARAS.
Provides vector search capabilities using MongoDB Atlas Vector Search.
"""

import os
from typing import List, Dict, Any, Optional, Union, Tuple
import numpy as np
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
import logging
from datetime import datetime
import json
from bson import ObjectId
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MongoDBVectorSearch:
    """
    MongoDB Atlas Vector Search integration.
    Handles storing and searching vectors in MongoDB.
    """
    
    def __init__(
        self,
        connection_string: str,
        database_name: str,
        collection_name: str = "embeddings",
        vector_index_name: str = "vector_index",
        embedding_dimension: int = 1536
    ):
        """
        Initialize MongoDB vector search.
        
        Args:
            connection_string: MongoDB connection string
            database_name: Database name
            collection_name: Collection name for embeddings
            vector_index_name: Name of the vector search index
            embedding_dimension: Dimension of embeddings
        """
        self.connection_string = connection_string
        self.database_name = database_name
        self.collection_name = collection_name
        self.vector_index_name = vector_index_name
        self.embedding_dimension = embedding_dimension
        
        # Connect to MongoDB
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        self.collection = self.db[collection_name]
        
        # Ensure indexes
        self._ensure_indexes()
        
        logger.info(f"Connected to MongoDB: {database_name}.{collection_name}")
    
    def _ensure_indexes(self):
        """Ensure necessary indexes exist."""
        # Create standard indexes for filtering
        self.collection.create_index("document_id", background=True)
        self.collection.create_index("chunk_id", background=True)
        self.collection.create_index("user_id", background=True)
        self.collection.create_index("created_at", background=True)
        self.collection.create_index([("metadata.type", 1)], background=True)
        
        # Note: Vector search index must be created in MongoDB Atlas UI or via API
        logger.info(f"Ensure vector search index '{self.vector_index_name}' exists in Atlas UI")
    
    def insert_embedding(
        self,
        embedding: List[float],
        text: str,
        document_id: str,
        chunk_id: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Insert a single embedding into MongoDB.
        
        Args:
            embedding: Vector embedding
            text: Original text
            document_id: Document ID
            chunk_id: Chunk ID
            user_id: User ID (optional)
            metadata: Additional metadata
            
        Returns:
            Inserted document ID
        """
        # Validate embedding dimension
        if len(embedding) != self.embedding_dimension:
            raise ValueError(f"Embedding dimension {len(embedding)} does not match expected {self.embedding_dimension}")
        
        # Prepare document
        doc = {
            "embedding": embedding,
            "text": text,
            "document_id": document_id,
            "chunk_id": chunk_id,
            "user_id": user_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert
        result = self.collection.insert_one(doc)
        logger.debug(f"Inserted embedding with ID: {result.inserted_id}")
        
        return str(result.inserted_id)
    
    def insert_embeddings(
        self,
        embeddings: List[List[float]],
        texts: List[str],
        document_ids: List[str],
        chunk_ids: List[str],
        user_ids: Optional[List[Optional[str]]] = None,
        metadatas: Optional[List[Optional[Dict[str, Any]]]] = None
    ) -> List[str]:
        """
        Insert multiple embeddings into MongoDB.
        
        Args:
            embeddings: List of vector embeddings
            texts: List of original texts
            document_ids: List of document IDs
            chunk_ids: List of chunk IDs
            user_ids: List of user IDs (optional)
            metadatas: List of metadata dicts (optional)
            
        Returns:
            List of inserted document IDs
        """
        if not (len(embeddings) == len(texts) == len(document_ids) == len(chunk_ids)):
            raise ValueError("All input lists must have the same length")
        
        # Prepare documents
        documents = []
        for i, (embedding, text, doc_id, chunk_id) in enumerate(
            zip(embeddings, texts, document_ids, chunk_ids)
        ):
            # Validate dimension
            if len(embedding) != self.embedding_dimension:
                raise ValueError(f"Embedding at index {i} has wrong dimension")
            
            doc = {
                "embedding": embedding,
                "text": text,
                "document_id": doc_id,
                "chunk_id": chunk_id,
                "user_id": user_ids[i] if user_ids else None,
                "metadata": metadatas[i] if metadatas else {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            documents.append(doc)
        
        # Insert many
        if documents:
            result = self.collection.insert_many(documents)
            logger.info(f"Inserted {len(result.inserted_ids)} embeddings")
            return [str(id) for id in result.inserted_ids]
        
        return []
    
    def vector_search(
        self,
        query_embedding: List[float],
        num_candidates: int = 100,
        limit: int = 10,
        filter_criteria: Optional[Dict[str, Any]] = None,
        min_score: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform vector search using MongoDB Atlas Vector Search.
        
        Args:
            query_embedding: Query vector
            num_candidates: Number of candidates to consider
            limit: Number of results to return
            filter_criteria: Additional filters (e.g., {"user_id": "123"})
            min_score: Minimum similarity score
            
        Returns:
            List of search results with scores
        """
        # Prepare the aggregation pipeline
        pipeline = [
            {
                "$vectorSearch": {
                    "index": self.vector_index_name,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": num_candidates,
                    "limit": limit
                }
            },
            {
                "$addFields": {
                    "score": {
                        "$meta": "vectorSearchScore"
                    }
                }
            },
            {
                "$match": {
                    "score": {"$gte": min_score}
                }
            }
        ]
        
        # Add filters if provided
        if filter_criteria:
            pipeline.insert(1, {"$match": filter_criteria})
        
        # Execute search
        results = list(self.collection.aggregate(pipeline))
        
        # Convert ObjectId to string
        for result in results:
            result["_id"] = str(result["_id"])
        
        logger.info(f"Vector search returned {len(results)} results")
        return results
    
    def hybrid_search(
        self,
        query_embedding: List[float],
        text_query: Optional[str] = None,
        num_candidates: int = 100,
        limit: int = 10,
        filter_criteria: Optional[Dict[str, Any]] = None,
        text_weight: float = 0.3,
        vector_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining vector and text search.
        
        Args:
            query_embedding: Query vector
            text_query: Text query for keyword search
            num_candidates: Number of vector candidates
            limit: Number of results to return
            filter_criteria: Additional filters
            text_weight: Weight for text search score
            vector_weight: Weight for vector search score
            
        Returns:
            Combined search results
        """
        if not text_query:
            # Vector search only
            return self.vector_search(
                query_embedding,
                num_candidates,
                limit,
                filter_criteria
            )
        
        # Text search stage
        text_pipeline = [
            {
                "$search": {
                    "index": "default",  # Assume text search index exists
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
        
        # Vector search stage
        vector_pipeline = [
            {
                "$vectorSearch": {
                    "index": self.vector_index_name,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": num_candidates,
                    "limit": limit
                }
            },
            {
                "$addFields": {
                    "vector_score": {
                        "$meta": "vectorSearchScore"
                    }
                }
            }
        ]
        
        # Execute both searches
        text_results = list(self.collection.aggregate(text_pipeline + [
            {"$limit": limit}
        ])) if text_query else []
        
        vector_results = list(self.collection.aggregate(vector_pipeline + [
            {"$limit": limit}
        ]))
        
        # Combine and score results
        combined_scores = {}
        
        # Process text results
        for i, result in enumerate(text_results):
            doc_id = str(result["_id"])
            # Normalize text score to 0-1 range
            normalized_score = 1.0 / (i + 1)  # Simple rank-based normalization
            combined_scores[doc_id] = {
                "doc": result,
                "text_score": normalized_score,
                "vector_score": 0.0
            }
        
        # Process vector results
        for result in vector_results:
            doc_id = str(result["_id"])
            vector_score = result.get("vector_score", 0)
            
            if doc_id in combined_scores:
                combined_scores[doc_id]["vector_score"] = vector_score
            else:
                combined_scores[doc_id] = {
                    "doc": result,
                    "text_score": 0.0,
                    "vector_score": vector_score
                }
        
        # Calculate combined scores
        results = []
        for doc_id, scores in combined_scores.items():
            combined_score = (
                text_weight * scores["text_score"] +
                vector_weight * scores["vector_score"]
            )
            
            doc = scores["doc"]
            doc["_id"] = str(doc["_id"])
            doc["combined_score"] = combined_score
            doc["text_score"] = scores["text_score"]
            doc["vector_score"] = scores["vector_score"]
            
            results.append(doc)
        
        # Sort by combined score and limit
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        results = results[:limit]
        
        logger.info(f"Hybrid search returned {len(results)} results")
        return results
    
    def delete_document_embeddings(self, document_id: str) -> int:
        """
        Delete all embeddings for a document.
        
        Args:
            document_id: Document ID
            
        Returns:
            Number of deleted documents
        """
        result = self.collection.delete_many({"document_id": document_id})
        logger.info(f"Deleted {result.deleted_count} embeddings for document {document_id}")
        return result.deleted_count
    
    def delete_user_embeddings(self, user_id: str) -> int:
        """
        Delete all embeddings for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of deleted documents
        """
        result = self.collection.delete_many({"user_id": user_id})
        logger.info(f"Deleted {result.deleted_count} embeddings for user {user_id}")
        return result.deleted_count
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the embeddings collection.
        
        Returns:
            Dictionary with collection statistics
        """
        stats = self.db.command("collstats", self.collection_name)
        
        # Get additional stats
        total_docs = self.collection.count_documents({})
        unique_documents = len(self.collection.distinct("document_id"))
        unique_users = len(self.collection.distinct("user_id"))
        
        return {
            "total_documents": total_docs,
            "unique_documents": unique_documents,
            "unique_users": unique_users,
            "storage_size_mb": stats.get("size", 0) / (1024 * 1024),
            "index_size_mb": stats.get("totalIndexSize", 0) / (1024 * 1024),
            "avg_doc_size_bytes": stats.get("avgObjSize", 0),
            "vector_index_exists": self._check_vector_index()
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
    
    def create_vector_search_index(self) -> Dict[str, Any]:
        """
        Create vector search index (requires Atlas).
        
        Returns:
            Index creation response
        """
        index_definition = {
            "name": self.vector_index_name,
            "type": "vectorSearch",
            "definition": {
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": self.embedding_dimension,
                        "similarity": "cosine"
                    }
                ]
            }
        }
        
        try:
            result = self.collection.create_search_index(index_definition)
            logger.info(f"Created vector search index: {self.vector_index_name}")
            return result
        except Exception as e:
            logger.error(f"Error creating vector index: {e}")
            raise
    
    def close(self):
        """Close MongoDB connection."""
        self.client.close()
        logger.info("Closed MongoDB connection")
