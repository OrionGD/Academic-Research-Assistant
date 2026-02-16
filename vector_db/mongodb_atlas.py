"""
MongoDB Atlas Vector Search integration module.
Provides a client for MongoDB Atlas vector search capabilities.
"""

import os
from typing import List, Dict, Any, Optional, Union
import pymongo
from pymongo import MongoClient
import numpy as np
from .base_client import BaseVectorClient, VectorRecord, SearchResult, DistanceMetric


class MongoAtlasClient(BaseVectorClient):
    """MongoDB Atlas Vector Search client implementation."""
    
    def __init__(self,
                 collection_name: str,
                 dimension: int,
                 connection_string: Optional[str] = None,
                 database_name: str = "vector_db",
                 **kwargs):
        """
        Initialize MongoDB Atlas client.
        
        Args:
            collection_name: Name of the collection
            dimension: Vector dimension
            connection_string: MongoDB connection string
            database_name: Name of the database
            **kwargs: Additional MongoDB settings
        """
        super().__init__(collection_name, dimension, **kwargs)
        self.connection_string = connection_string or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.database_name = database_name
        self.client = None
        self.database = None
        self.collection = None
        
        # Atlas Vector Search index name
        self.index_name = f"{collection_name}_vector_index"
        
        self.metric_mapping = {
            DistanceMetric.COSINE: "cosine",
            DistanceMetric.EUCLIDEAN: "euclidean",
            DistanceMetric.DOT_PRODUCT: "dotProduct"
        }
    
    async def connect(self) -> bool:
        """Establish connection to MongoDB Atlas."""
        try:
            self.client = MongoClient(self.connection_string)
            self.database = self.client[self.database_name]
            self.collection = self.database[self.collection_name]
            
            # Test connection
            self.client.admin.command('ping')
            return True
        except Exception as e:
            print(f"Failed to connect to MongoDB Atlas: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Close connection to MongoDB Atlas."""
        try:
            if self.client:
                self.client.close()
            return True
        except Exception as e:
            print(f"Error disconnecting from MongoDB Atlas: {e}")
            return False
    
    async def create_collection(self,
                               metric: DistanceMetric = DistanceMetric.COSINE,
                               **kwargs) -> bool:
        """Create a new collection with vector search index."""
        try:
            # Create collection if it doesn't exist
            if self.collection_name not in self.database.list_collection_names():
                self.database.create_collection(self.collection_name)
            
            # Create vector search index
            index_definition = {
                "name": self.index_name,
                "type": "vectorSearch",
                "fields": [{
                    "type": "vector",
                    "path": "vector",
                    "numDimensions": self.dimension,
                    "similarity": self.metric_mapping[metric]
                }]
            }
            
            # Add additional fields for filtering if specified
            if kwargs.get("filter_fields"):
                for field in kwargs["filter_fields"]:
                    index_definition["fields"].append({
                        "type": "filter",
                        "path": field
                    })
            
            # Create the index
            self.database.command({
                "createSearchIndexes": self.collection_name,
                "indexes": [index_definition]
            })
            
            return True
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    async def delete_collection(self) -> bool:
        """Delete the collection."""
        try:
            self.collection.drop()
            return True
        except Exception as e:
            print(f"Failed to delete collection: {e}")
            return False
    
    async def upsert_vectors(self,
                            records: List[VectorRecord],
                            batch_size: int = 100) -> int:
        """Insert or update vectors in MongoDB."""
        try:
            # Convert records to MongoDB documents
            documents = []
            for record in records:
                doc = {
                    "_id": record.id,
                    "vector": record.vector,
                    **record.metadata
                }
                documents.append(doc)
            
            # Upsert in batches
            total_upserted = 0
            for i in range(0, len(documents), batch_size):
                batch = documents[i:i + batch_size]
                
                for doc in batch:
                    self.collection.update_one(
                        {"_id": doc["_id"]},
                        {"$set": doc},
                        upsert=True
                    )
                total_upserted += len(batch)
            
            return total_upserted
        except Exception as e:
            print(f"Failed to upsert vectors: {e}")
            return 0
    
    async def search_vectors(self,
                            query_vector: List[float],
                            top_k: int = 10,
                            filter: Optional[Dict[str, Any]] = None,
                            include_vectors: bool = False) -> List[SearchResult]:
        """Search for similar vectors using Atlas Vector Search."""
        try:
            # Prepare the aggregation pipeline
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": self.index_name,
                        "path": "vector",
                        "queryVector": query_vector,
                        "numCandidates": top_k * 10,
                        "limit": top_k
                    }
                }
            ]
            
            # Add filter if provided
            if filter:
                pipeline[0]["$vectorSearch"]["filter"] = filter
            
            # Add projection
            project_stage = {
                "$project": {
                    "score": {"$meta": "vectorSearchScore"},
                    "vector" if include_vectors else "_id": 1 if include_vectors else 0
                }
            }
            
            # Add all metadata fields to projection
            if not include_vectors:
                # Include all fields except vector
                project_stage["$project"]["_id"] = 1
                project_stage["$project"]["vector"] = 0
            else:
                project_stage["$project"]["_id"] = 1
                project_stage["$project"]["vector"] = 1
            
            pipeline.append(project_stage)
            
            # Execute search
            results = self.collection.aggregate(pipeline)
            
            # Format results
            search_results = []
            async for doc in results:
                search_results.append(SearchResult(
                    id=str(doc["_id"]),
                    score=doc.get("score", 0.0),
                    metadata={k: v for k, v in doc.items() if k not in ["_id", "vector", "score"]},
                    vector=doc.get("vector") if include_vectors else None
                ))
            
            return search_results
        except Exception as e:
            print(f"Failed to search vectors: {e}")
            return []
    
    async def delete_vectors(self, ids: List[str]) -> bool:
        """Delete vectors by their IDs."""
        try:
            result = self.collection.delete_many({"_id": {"$in": ids}})
            return result.deleted_count == len(ids)
        except Exception as e:
            print(f"Failed to delete vectors: {e}")
            return False
    
    async def fetch_vector(self, id: str) -> Optional[VectorRecord]:
        """Fetch a single vector by ID."""
        try:
            doc = self.collection.find_one({"_id": id})
            if doc:
                return VectorRecord(
                    id=str(doc["_id"]),
                    vector=doc.get("vector", []),
                    metadata={k: v for k, v in doc.items() if k not in ["_id", "vector"]}
                )
            return None
        except Exception as e:
            print(f"Failed to fetch vector: {e}")
            return None
    
    async def count_vectors(self, filter: Optional[Dict[str, Any]] = None) -> int:
        """Count vectors in the collection."""
        try:
            return self.collection.count_documents(filter or {})
        except Exception as e:
            print(f"Failed to count vectors: {e}")
            return 0