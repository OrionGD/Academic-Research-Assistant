"""
Abstract base class for vector database clients.
Provides a unified interface for all vector database implementations.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Union
import numpy as np
from dataclasses import dataclass
from enum import Enum

class DistanceMetric(Enum):
    """Supported distance metrics for vector similarity."""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean" 
    DOT_PRODUCT = "dot_product"


@dataclass
class VectorRecord:
    """Represents a vector record in the database."""
    id: str
    vector: List[float]
    metadata: Optional[Dict[str, Any]] = None
    score: Optional[float] = None


@dataclass
class SearchResult:
    """Represents a search result from vector similarity search."""
    id: str
    score: float
    metadata: Optional[Dict[str, Any]] = None
    vector: Optional[List[float]] = None


class BaseVectorClient(ABC):
    """Abstract base class for vector database clients."""
    
    def __init__(self, collection_name: str, dimension: int, **kwargs):
        """
        Initialize the vector database client.
        
        Args:
            collection_name: Name of the collection/index to use
            dimension: Dimensionality of vectors
            **kwargs: Additional provider-specific parameters
        """
        self.collection_name = collection_name
        self.dimension = dimension
        self._validate_dimension()
    
    def _validate_dimension(self):
        """Validate that dimension is positive."""
        if self.dimension <= 0:
            raise ValueError(f"Dimension must be positive, got {self.dimension}")
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the vector database."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Close connection to the vector database."""
        pass
    
    @abstractmethod
    async def create_collection(self, 
                               metric: DistanceMetric = DistanceMetric.COSINE,
                               **kwargs) -> bool:
        """Create a new collection/index."""
        pass
    
    @abstractmethod
    async def delete_collection(self) -> bool:
        """Delete the collection/index."""
        pass
    
    @abstractmethod
    async def upsert_vectors(self, 
                            records: List[VectorRecord],
                            batch_size: int = 100) -> int:
        """Insert or update vectors in the database."""
        pass
    
    @abstractmethod
    async def search_vectors(self,
                            query_vector: List[float],
                            top_k: int = 10,
                            filter: Optional[Dict[str, Any]] = None,
                            include_vectors: bool = False) -> List[SearchResult]:
        """Search for similar vectors."""
        pass
    
    @abstractmethod
    async def delete_vectors(self, ids: List[str]) -> bool:
        """Delete vectors by their IDs."""
        pass
    
    @abstractmethod
    async def fetch_vector(self, id: str) -> Optional[VectorRecord]:
        """Fetch a single vector by ID."""
        pass
    
    @abstractmethod
    async def count_vectors(self, filter: Optional[Dict[str, Any]] = None) -> int:
        """Count vectors in the collection."""
        pass