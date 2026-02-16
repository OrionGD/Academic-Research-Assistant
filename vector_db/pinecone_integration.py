"""
Pinecone integration module.
Provides a client for interacting with Pinecone vector database.
"""

import os
import time
from typing import List, Dict, Any, Optional, Union
import pinecone
from pinecone import Pinecone
import numpy as np
from .base_client import BaseVectorClient, VectorRecord, SearchResult, DistanceMetric


class PineconeClient(BaseVectorClient):
    """Pinecone vector database client implementation."""
    
    def __init__(self,
                 collection_name: str,
                 dimension: int,
                 api_key: Optional[str] = None,
                 environment: Optional[str] = None,
                 **kwargs):
        """
        Initialize Pinecone client.
        
        Args:
            collection_name: Name of the index
            dimension: Vector dimension
            api_key: Pinecone API key
            environment: Pinecone environment
            **kwargs: Additional Pinecone settings
        """
        super().__init__(collection_name, dimension, **kwargs)
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        self.environment = environment or os.getenv("PINECONE_ENVIRONMENT", "gcp-starter")
        self.pc = None
        self.index = None
        
        self.metric_mapping = {
            DistanceMetric.COSINE: "cosine",
            DistanceMetric.EUCLIDEAN: "euclidean",
            DistanceMetric.DOT_PRODUCT: "dotproduct"
        }
    
    async def connect(self) -> bool:
        """Establish connection to Pinecone."""
        try:
            if not self.api_key:
                raise ValueError("Pinecone API key is required")
            
            # Initialize Pinecone
            self.pc = Pinecone(api_key=self.api_key)
            
            # Test connection
            self.pc.list_indexes()
            return True
        except Exception as e:
            print(f"Failed to connect to Pinecone: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Close connection to Pinecone."""
        try:
            # Pinecone client doesn't require explicit disconnect
            self.pc = None
            self.index = None
            return True
        except Exception as e:
            print(f"Error disconnecting from Pinecone: {e}")
            return False
    
    async def create_collection(self,
                               metric: DistanceMetric = DistanceMetric.COSINE,
                               **kwargs) -> bool:
        """Create a new index in Pinecone."""
        try:
            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            index_names = [idx.name for idx in existing_indexes]
            
            if self.collection_name in index_names:
                # Connect to existing index
                self.index = self.pc.Index(self.collection_name)
                return True
            
            # Create new index
            self.pc.create_index(
                name=self.collection_name,
                dimension=self.dimension,
                metric=self.metric_mapping[metric],
                spec={
                    "serverless": {
                        "cloud": kwargs.get("cloud", "aws"),
                        "region": kwargs.get("region", "us-east-1")
                    }
                } if kwargs.get("serverless", True) else {
                    "pod": {
                        "environment": self.environment,
                        "pod_type": kwargs.get("pod_type", "p1.x1"),
                        "replicas": kwargs.get("replicas", 1)
                    }
                }
            )
            
            # Wait for index to be ready
            while not self.pc.describe_index(self.collection_name).status.ready:
                time.sleep(1)
            
            # Connect to the index
            self.index = self.pc.Index(self.collection_name)
            return True
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    async def delete_collection(self) -> bool:
        """Delete the index from Pinecone."""
        try:
            self.pc.delete_index(self.collection_name)
            self.index = None
            return True
        except Exception as e:
            print(f"Failed to delete collection: {e}")
            return False
    
    async def upsert_vectors(self,
                            records: List[VectorRecord],
                            batch_size: int = 100) -> int:
        """Insert or update vectors in Pinecone."""
        if not self.index:
            raise Exception("Index not initialized. Call create_collection first.")
        
        try:
            # Prepare vectors in Pinecone format
            vectors = []
            for record in records:
                vectors.append({
                    "id": record.id,
                    "values": record.vector,
                    "metadata": record.metadata or {}
                })
            
            # Upsert in batches
            total_upserted = 0
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                result = self.index.upsert(vectors=batch)
                total_upserted += result.upserted_count
            
            return total_upserted
        except Exception as e:
            print(f"Failed to upsert vectors: {e}")
            return 0
    
    async def search_vectors(self,
                            query_vector: List[float],
                            top_k: int = 10,
                            filter: Optional[Dict[str, Any]] = None,
                            include_vectors: bool = False) -> List[SearchResult]:
        """Search for similar vectors in Pinecone."""
        if not self.index:
            raise Exception("Index not initialized. Call create_collection first.")
        
        try:
            # Execute query
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                filter=filter,
                include_metadata=True,
                include_values=include_vectors
            )
            
            # Format results
            search_results = []
            for match in results.matches:
                search_results.append(SearchResult(
                    id=match.id,
                    score=match.score,
                    metadata=match.metadata,
                    vector=match.values if include_vectors else None
                ))
            
            return search_results
        except Exception as e:
            print(f"Failed to search vectors: {e}")
            return []
    
    async def delete_vectors(self, ids: List[str]) -> bool:
        """Delete vectors by their IDs."""
        if not self.index:
            raise Exception("Index not initialized. Call create_collection first.")
        
        try:
            self.index.delete(ids=ids)
            return True
        except Exception as e:
            print(f"Failed to delete vectors: {e}")
            return False
    
    async def fetch_vector(self, id: str) -> Optional[VectorRecord]:
        """Fetch a single vector by ID."""
        if not self.index:
            raise Exception("Index not initialized. Call create_collection first.")
        
        try:
            # Pinecone doesn't have direct fetch, use fetch with IDs
            result = self.index.fetch(ids=[id])
            
            if id in result.vectors:
                vector_data = result.vectors[id]
                return VectorRecord(
                    id=id,
                    vector=vector_data.values,
                    metadata=vector_data.metadata
                )
            return None
        except Exception as e:
            print(f"Failed to fetch vector: {e}")
            return None
    
    async def count_vectors(self, filter: Optional[Dict[str, Any]] = None) -> int:
        """Count vectors in the index."""
        if not self.index:
            raise Exception("Index not initialized. Call create_collection first.")
        
        try:
            # Pinecone doesn't have a direct count method
            # This is a workaround using describe_index_stats
            stats = self.index.describe_index_stats()
            
            if filter:
                # If filter is provided, we need to estimate count
                # This is not accurate, but gives a rough estimate
                result = self.index.query(
                    vector=[0] * self.dimension,
                    top_k=1,
                    filter=filter,
                    include_metadata=False
                )
                return len(result.matches) if result.matches else 0
            
            return stats.total_vector_count
        except Exception as e:
            print(f"Failed to count vectors: {e}")
            return 0