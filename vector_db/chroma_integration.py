"""
ChromaDB integration module.
Provides a client for interacting with ChromaDB vector database.
"""

import os
from typing import List, Dict, Any, Optional, Union
import chromadb
from chromadb.config import Settings
import numpy as np
from .base_client import BaseVectorClient, VectorRecord, SearchResult, DistanceMetric


class ChromaClient(BaseVectorClient):
    """ChromaDB vector database client implementation."""
    
    def __init__(self, 
                 collection_name: str,
                 dimension: int,
                 persist_directory: Optional[str] = None,
                 host: Optional[str] = None,
                 port: Optional[int] = None,
                 **kwargs):
        """
        Initialize ChromaDB client.
        
        Args:
            collection_name: Name of the collection
            dimension: Vector dimension
            persist_directory: Directory for persistent storage (for local mode)
            host: ChromaDB server host (for client/server mode)
            port: ChromaDB server port (for client/server mode)
            **kwargs: Additional ChromaDB settings
        """
        super().__init__(collection_name, dimension, **kwargs)
        self.persist_directory = persist_directory or "./chroma_data"
        self.host = host
        self.port = port
        self.client = None
        self.collection = None
        self.metric_mapping = {
            DistanceMetric.COSINE: "cosine",
            DistanceMetric.EUCLIDEAN: "l2",
            DistanceMetric.DOT_PRODUCT: "ip"
        }
    
    async def connect(self) -> bool:
        """Establish connection to ChromaDB."""
        try:
            if self.host and self.port:
                # Client/Server mode
                self.client = chromadb.HttpClient(
                    host=self.host,
                    port=self.port,
                    settings=Settings(anonymized_telemetry=False)
                )
            else:
                # Local persistent mode
                self.client = chromadb.PersistentClient(
                    path=self.persist_directory,
                    settings=Settings(anonymized_telemetry=False)
                )
            return True
        except Exception as e:
            print(f"Failed to connect to ChromaDB: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Close connection to ChromaDB."""
        try:
            # ChromaDB client doesn't require explicit disconnect
            self.client = None
            self.collection = None
            return True
        except Exception as e:
            print(f"Error disconnecting from ChromaDB: {e}")
            return False
    
    async def create_collection(self,
                               metric: DistanceMetric = DistanceMetric.COSINE,
                               **kwargs) -> bool:
        """Create a new collection in ChromaDB."""
        try:
            # Check if collection exists
            try:
                self.collection = self.client.get_collection(self.collection_name)
                print(f"Collection '{self.collection_name}' already exists")
                return True
            except:
                # Create new collection
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={
                        "hnsw:space": self.metric_mapping[metric],
                        "dimension": self.dimension,
                        **kwargs
                    }
                )
                return True
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    async def delete_collection(self) -> bool:
        """Delete the collection from ChromaDB."""
        try:
            self.client.delete_collection(self.collection_name)
            self.collection = None
            return True
        except Exception as e:
            print(f"Failed to delete collection: {e}")
            return False
    
    async def upsert_vectors(self,
                            records: List[VectorRecord],
                            batch_size: int = 100) -> int:
        """Insert or update vectors in ChromaDB."""
        if not self.collection:
            raise Exception("Collection not initialized. Call create_collection first.")
        
        try:
            # Prepare data for ChromaDB
            ids = [r.id for r in records]
            vectors = [r.vector for r in records]
            metadatas = [r.metadata or {} for r in records]
            
            # Upsert in batches
            total_upserted = 0
            for i in range(0, len(records), batch_size):
                batch_end = min(i + batch_size, len(records))
                
                self.collection.upsert(
                    ids=ids[i:batch_end],
                    embeddings=vectors[i:batch_end],
                    metadatas=metadatas[i:batch_end]
                )
                total_upserted += (batch_end - i)
            
            return total_upserted
        except Exception as e:
            print(f"Failed to upsert vectors: {e}")
            return 0
    
    async def search_vectors(self,
                            query_vector: List[float],
                            top_k: int = 10,
                            filter: Optional[Dict[str, Any]] = None,
                            include_vectors: bool = False) -> List[SearchResult]:
        """Search for similar vectors in ChromaDB."""
        if not self.collection:
            raise Exception("Collection not initialized. Call create_collection first.")
        
        try:
            # Convert filter to ChromaDB format
            where_filter = filter if filter else None
            
            # Execute query
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k,
                where=where_filter,
                include=["metadatas", "distances"] + (["embeddings"] if include_vectors else [])
            )
            
            # Format results
            search_results = []
            if results['ids'] and results['ids'][0]:
                for i, id in enumerate(results['ids'][0]):
                    search_results.append(SearchResult(
                        id=id,
                        score=1.0 - results['distances'][0][i],  # Convert distance to similarity
                        metadata=results['metadatas'][0][i] if results['metadatas'] else None,
                        vector=results['embeddings'][0][i] if include_vectors and results['embeddings'] else None
                    ))
            
            return search_results
        except Exception as e:
            print(f"Failed to search vectors: {e}")
            return []
    
    async def delete_vectors(self, ids: List[str]) -> bool:
        """Delete vectors by their IDs."""
        if not self.collection:
            raise Exception("Collection not initialized. Call create_collection first.")
        
        try:
            self.collection.delete(ids=ids)
            return True
        except Exception as e:
            print(f"Failed to delete vectors: {e}")
            return False
    
    async def fetch_vector(self, id: str) -> Optional[VectorRecord]:
        """Fetch a single vector by ID."""
        if not self.collection:
            raise Exception("Collection not initialized. Call create_collection first.")
        
        try:
            # ChromaDB doesn't have direct fetch, use get with IDs
            result = self.collection.get(
                ids=[id],
                include=["embeddings", "metadatas"]
            )
            
            if result['ids']:
                return VectorRecord(
                    id=result['ids'][0],
                    vector=result['embeddings'][0],
                    metadata=result['metadatas'][0] if result['metadatas'] else None
                )
            return None
        except Exception as e:
            print(f"Failed to fetch vector: {e}")
            return None
    
    async def count_vectors(self, filter: Optional[Dict[str, Any]] = None) -> int:
        """Count vectors in the collection."""
        if not self.collection:
            raise Exception("Collection not initialized. Call create_collection first.")
        
        try:
            # Use get with limit=0 to get count without fetching vectors
            result = self.collection.get(limit=0)
            return len(result['ids']) if result['ids'] else 0
        except Exception as e:
            print(f"Failed to count vectors: {e}")
            return 0