"""
Qdrant integration module.
Provides a client for interacting with Qdrant vector database.
"""

import os
from typing import List, Dict, Any, Optional, Union
from qdrant_client import QdrantClient as QdrantHTTPClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import numpy as np
from .base_client import BaseVectorClient, VectorRecord, SearchResult, DistanceMetric


class QdrantClient(BaseVectorClient):
    """Qdrant vector database client implementation."""
    
    def __init__(self,
                 collection_name: str,
                 dimension: int,
                 host: Optional[str] = None,
                 port: Optional[int] = None,
                 api_key: Optional[str] = None,
                 path: Optional[str] = None,
                 **kwargs):
        """
        Initialize Qdrant client.
        
        Args:
            collection_name: Name of the collection
            dimension: Vector dimension
            host: Qdrant server host
            port: Qdrant server port
            api_key: Qdrant API key for cloud
            path: Local path for persistent storage
            **kwargs: Additional Qdrant settings
        """
        super().__init__(collection_name, dimension, **kwargs)
        self.host = host
        self.port = port
        self.api_key = api_key
        self.path = path
        self.client = None
        
        self.metric_mapping = {
            DistanceMetric.COSINE: Distance.COSINE,
            DistanceMetric.EUCLIDEAN: Distance.EUCLID,
            DistanceMetric.DOT_PRODUCT: Distance.DOT
        }
    
    async def connect(self) -> bool:
        """Establish connection to Qdrant."""
        try:
            if self.host and self.port:
                # Connect to Qdrant server
                if self.api_key:
                    self.client = QdrantHTTPClient(
                        host=self.host,
                        port=self.port,
                        api_key=self.api_key,
                        https=True
                    )
                else:
                    self.client = QdrantHTTPClient(
                        host=self.host,
                        port=self.port
                    )
            elif self.path:
                # Local persistent mode
                self.client = QdrantHTTPClient(path=self.path)
            else:
                # In-memory mode
                self.client = QdrantHTTPClient(":memory:")
            
            # Test connection
            self.client.get_collections()
            return True
        except Exception as e:
            print(f"Failed to connect to Qdrant: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Close connection to Qdrant."""
        try:
            # Qdrant client doesn't require explicit disconnect
            self.client = None
            return True
        except Exception as e:
            print(f"Error disconnecting from Qdrant: {e}")
            return False
    
    async def create_collection(self,
                               metric: DistanceMetric = DistanceMetric.COSINE,
                               **kwargs) -> bool:
        """Create a new collection in Qdrant."""
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name in collection_names:
                print(f"Collection '{self.collection_name}' already exists")
                return True
            
            # Create new collection
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.dimension,
                    distance=self.metric_mapping[metric],
                    **kwargs
                )
            )
            return True
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    async def delete_collection(self) -> bool:
        """Delete the collection from Qdrant."""
        try:
            self.client.delete_collection(self.collection_name)
            return True
        except Exception as e:
            print(f"Failed to delete collection: {e}")
            return False
    
    async def upsert_vectors(self,
                            records: List[VectorRecord],
                            batch_size: int = 100) -> int:
        """Insert or update vectors in Qdrant."""
        try:
            # Prepare points
            points = []
            for record in records:
                points.append(PointStruct(
                    id=record.id,
                    vector=record.vector,
                    payload=record.metadata or {}
                ))
            
            # Upsert in batches
            total_upserted = 0
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                result = self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch
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
        """Search for similar vectors in Qdrant."""
        try:
            # Convert filter to Qdrant format
            qdrant_filter = None
            if filter:
                conditions = []
                for key, value in filter.items():
                    if isinstance(value, dict):
                        # Handle range conditions
                        if "gt" in value or "lt" in value:
                            conditions.append(
                                models.FieldCondition(
                                    key=key,
                                    range=models.Range(
                                        gt=value.get("gt"),
                                        lt=value.get("lt"),
                                        gte=value.get("gte"),
                                        lte=value.get("lte")
                                    )
                                )
                            )
                    else:
                        # Handle exact match
                        conditions.append(
                            models.FieldCondition(
                                key=key,
                                match=models.MatchValue(value=value)
                            )
                        )
                
                if conditions:
                    qdrant_filter = models.Filter(
                        must=conditions
                    )
            
            # Execute search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                query_filter=qdrant_filter,
                with_payload=True,
                with_vector=include_vectors
            )
            
            # Format results
            search_results = []
            for scored_point in results:
                search_results.append(SearchResult(
                    id=str(scored_point.id),
                    score=scored_point.score,
                    metadata=scored_point.payload,
                    vector=scored_point.vector if include_vectors else None
                ))
            
            return search_results
        except Exception as e:
            print(f"Failed to search vectors: {e}")
            return []
    
    async def delete_vectors(self, ids: List[str]) -> bool:
        """Delete vectors by their IDs."""
        try:
            # Convert string IDs to appropriate format
            point_ids = []
            for id_str in ids:
                try:
                    point_ids.append(int(id_str))
                except ValueError:
                    point_ids.append(id_str)
            
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(
                    points=point_ids
                )
            )
            return True
        except Exception as e:
            print(f"Failed to delete vectors: {e}")
            return False
    
    async def fetch_vector(self, id: str) -> Optional[VectorRecord]:
        """Fetch a single vector by ID."""
        try:
            # Convert ID to appropriate format
            try:
                point_id = int(id)
            except ValueError:
                point_id = id
            
            result = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[point_id],
                with_payload=True,
                with_vectors=True
            )
            
            if result:
                point = result[0]
                return VectorRecord(
                    id=str(point.id),
                    vector=point.vector,
                    metadata=point.payload
                )
            return None
        except Exception as e:
            print(f"Failed to fetch vector: {e}")
            return None
    
    async def count_vectors(self, filter: Optional[Dict[str, Any]] = None) -> int:
        """Count vectors in the collection."""
        try:
            result = self.client.count(
                collection_name=self.collection_name,
                count_filter=None  # Qdrant doesn't support filtered counts in basic version
            )
            return result.count
        except Exception as e:
            print(f"Failed to count vectors: {e}")
            return 0