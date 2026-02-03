"""
Data structures for vector embeddings.
Defines embedding models, similarity metrics, and ranking algorithms.
"""

from typing import List, Tuple, Dict, Any, Optional, Union
import numpy as np
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import math


# ============ Embedding Models ============
class EmbeddingModel(str, Enum):
    """Supported embedding models"""
    OPENAI_ADA_002 = "text-embedding-ada-002"
    SENTENCE_TRANSFORMERS_ALL_MPNET = "all-mpnet-base-v2"
    SENTENCE_TRANSFORMERS_MINI = "all-MiniLM-L6-v2"
    BGE_SMALL_EN = "BAAI/bge-small-en"
    INSTRUCTOR_LARGE = "hkunlp/instructor-large"
    CUSTOM_MODEL = "custom"


class DistanceMetric(str, Enum):
    """Supported distance/similarity metrics"""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dot_product"
    MANHATTAN = "manhattan"


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation"""
    model_name: EmbeddingModel = EmbeddingModel.SENTENCE_TRANSFORMERS_ALL_MPNET
    batch_size: int = 32
    max_length: int = 512  # Maximum token length
    normalize: bool = True  # Normalize vectors to unit length
    device: str = "cpu"  # cpu or cuda
    cache_dir: Optional[str] = None


@dataclass
class EmbeddingResult:
    """Result of embedding generation"""
    text: str
    embedding: List[float]
    model_name: str
    token_count: int
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============ Similarity Calculations ============
class SimilarityCalculator(ABC):
    """Abstract base class for similarity calculations"""
    
    @abstractmethod
    def calculate(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate similarity between two vectors"""
        pass
    
    @abstractmethod
    def calculate_batch(self, query_vec: np.ndarray, target_vecs: np.ndarray) -> np.ndarray:
        """Calculate similarities between query and multiple target vectors"""
        pass


class CosineSimilarity(SimilarityCalculator):
    """Cosine similarity calculator"""
    
    def calculate(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        # Clamp to [-1, 1] to handle floating point errors
        return max(-1.0, min(1.0, similarity))
    
    def calculate_batch(self, query_vec: np.ndarray, target_vecs: np.ndarray) -> np.ndarray:
        """Calculate cosine similarities between query and multiple targets"""
        # Normalize vectors
        query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)
        target_norms = target_vecs / (np.linalg.norm(target_vecs, axis=1, keepdims=True) + 1e-10)
        
        # Calculate cosine similarities
        similarities = np.dot(target_norms, query_norm)
        
        # Clamp values
        similarities = np.clip(similarities, -1.0, 1.0)
        
        return similarities


class EuclideanDistance(SimilarityCalculator):
    """Euclidean distance calculator (converted to similarity)"""
    
    def __init__(self, max_distance: float = 10.0):
        self.max_distance = max_distance
    
    def calculate(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate similarity from Euclidean distance"""
        distance = np.linalg.norm(vec1 - vec2)
        # Convert distance to similarity (inverse relationship)
        similarity = 1.0 / (1.0 + distance)
        return similarity
    
    def calculate_batch(self, query_vec: np.ndarray, target_vecs: np.ndarray) -> np.ndarray:
        """Calculate Euclidean-based similarities between query and multiple targets"""
        # Calculate Euclidean distances
        distances = np.linalg.norm(target_vecs - query_vec, axis=1)
        
        # Convert distances to similarities
        similarities = 1.0 / (1.0 + distances)
        
        return similarities


class DotProductSimilarity(SimilarityCalculator):
    """Dot product similarity calculator"""
    
    def calculate(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate dot product similarity"""
        return float(np.dot(vec1, vec2))
    
    def calculate_batch(self, query_vec: np.ndarray, target_vecs: np.ndarray) -> np.ndarray:
        """Calculate dot product similarities"""
        return np.dot(target_vecs, query_vec)


def get_similarity_calculator(metric: DistanceMetric = DistanceMetric.COSINE) -> SimilarityCalculator:
    """Factory function to get similarity calculator based on metric"""
    calculators = {
        DistanceMetric.COSINE: CosineSimilarity(),
        DistanceMetric.EUCLIDEAN: EuclideanDistance(),
        DistanceMetric.DOT_PRODUCT: DotProductSimilarity(),
    }
    
    return calculators.get(metric, CosineSimilarity())


# ============ Search Result Ranking ============
@dataclass
class SearchResultItem:
    """Individual search result item"""
    chunk_id: int
    document_id: int
    document_title: str
    content: str
    raw_score: float
    chunk_index: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def normalized_score(self) -> float:
        """Normalize score to [0, 1] range"""
        # Assuming raw_score is already in a reasonable range for similarity
        return max(0.0, min(1.0, self.raw_score))


class ResultRanker:
    """Rank search results using various algorithms"""
    
    def __init__(
        self,
        similarity_calculator: Optional[SimilarityCalculator] = None,
        ranking_algorithm: str = "similarity"
    ):
        self.similarity_calculator = similarity_calculator or CosineSimilarity()
        self.ranking_algorithm = ranking_algorithm
    
    def rank_results(
        self,
        query_embedding: np.ndarray,
        chunks: List[Tuple[int, int, str, str, np.ndarray, Dict[str, Any]]],
        limit: int = 10
    ) -> List[SearchResultItem]:
        """
        Rank chunks based on similarity to query embedding.
        
        Args:
            query_embedding: Query vector
            chunks: List of (chunk_id, document_id, document_title, content, embedding, metadata)
            limit: Maximum number of results to return
            
        Returns:
            List of ranked SearchResultItem
        """
        if not chunks:
            return []
        
        # Extract embeddings
        chunk_ids = [c[0] for c in chunks]
        document_ids = [c[1] for c in chunks]
        document_titles = [c[2] for c in chunks]
        contents = [c[3] for c in chunks]
        embeddings = np.array([c[4] for c in chunks])
        metadatas = [c[5] for c in chunks]
        
        # Calculate similarities
        similarities = self.similarity_calculator.calculate_batch(query_embedding, embeddings)
        
        # Create result items
        results = []
        for i in range(len(chunks)):
            result = SearchResultItem(
                chunk_id=chunk_ids[i],
                document_id=document_ids[i],
                document_title=document_titles[i],
                content=contents[i],
                raw_score=float(similarities[i]),
                chunk_index=metadatas[i].get('chunk_index', 0),
                metadata=metadatas[i]
            )
            results.append(result)
        
        # Apply ranking algorithm
        ranked_results = self._apply_ranking_algorithm(results)
        
        # Limit results
        return ranked_results[:limit]
    
    def _apply_ranking_algorithm(self, results: List[SearchResultItem]) -> List[SearchResultItem]:
        """Apply specific ranking algorithm to results"""
        if self.ranking_algorithm == "similarity":
            # Simple similarity-based ranking
            return sorted(results, key=lambda x: x.raw_score, reverse=True)
        
        elif self.ranking_algorithm == "hybrid":
            # Hybrid ranking considering multiple factors
            def hybrid_score(result: SearchResultItem) -> float:
                similarity_weight = 0.7
                # Example: Consider content length (prefer medium-length chunks)
                content_length = len(result.content)
                length_score = 1.0 - min(1.0, abs(content_length - 200) / 800)  # Prefer ~200 chars
                
                # Combine scores
                return (
                    similarity_weight * result.raw_score +
                    (1 - similarity_weight) * length_score
                )
            
            return sorted(results, key=hybrid_score, reverse=True)
        
        elif self.ranking_algorithm == "diversity":
            # Diversity-aware ranking (MMR - Maximal Marginal Relevance)
            return self._mmr_ranking(results)
        
        else:
            # Default to similarity ranking
            return sorted(results, key=lambda x: x.raw_score, reverse=True)
    
    def _mmr_ranking(
        self,
        results: List[SearchResultItem],
        lambda_param: float = 0.7,
        max_results: int = 20
    ) -> List[SearchResultItem]:
        """
        Maximal Marginal Relevance ranking for diversity.
        
        Args:
            results: Initial ranked results
            lambda_param: Balance between relevance (1.0) and diversity (0.0)
            max_results: Maximum number of results to return
            
        Returns:
            Diversity-ranked results
        """
        if not results:
            return []
        
        # Extract embeddings for diversity calculation
        # In practice, you would need to store embeddings with results
        # For this example, we'll use a simplified approach
        
        selected = []
        remaining = sorted(results, key=lambda x: x.raw_score, reverse=True)
        
        # Select first (most relevant) result
        if remaining:
            selected.append(remaining.pop(0))
        
        # Select remaining results with MMR
        while remaining and len(selected) < max_results:
            mmr_scores = []
            
            for i, result in enumerate(remaining):
                # Max similarity with already selected results
                max_sim = 0.0
                for sel in selected:
                    # In practice, calculate similarity between embeddings
                    # For now, use a placeholder
                    sim = 0.0  # Placeholder
                    max_sim = max(max_sim, sim)
                
                # MMR score
                mmr = lambda_param * result.raw_score - (1 - lambda_param) * max_sim
                mmr_scores.append((i, mmr))
            
            # Select result with highest MMR score
            mmr_scores.sort(key=lambda x: x[1], reverse=True)
            best_idx = mmr_scores[0][0]
            selected.append(remaining.pop(best_idx))
        
        return selected


# ============ Embedding Utilities ============
def normalize_vector(vector: np.ndarray) -> np.ndarray:
    """Normalize vector to unit length"""
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def calculate_average_embedding(embeddings: List[np.ndarray]) -> np.ndarray:
    """Calculate average of multiple embeddings"""
    if not embeddings:
        raise ValueError("Cannot calculate average of empty embedding list")
    
    avg_embedding = np.mean(embeddings, axis=0)
    return normalize_vector(avg_embedding)


def calculate_centroid(embeddings: List[np.ndarray]) -> np.ndarray:
    """Calculate centroid of embeddings (same as average for normalized vectors)"""
    return calculate_average_embedding(embeddings)


def calculate_similarity_matrix(embeddings: List[np.ndarray], metric: DistanceMetric = DistanceMetric.COSINE) -> np.ndarray:
    """Calculate pairwise similarity matrix for embeddings"""
    n = len(embeddings)
    matrix = np.zeros((n, n))
    calculator = get_similarity_calculator(metric)
    
    for i in range(n):
        for j in range(i, n):
            sim = calculator.calculate(embeddings[i], embeddings[j])
            matrix[i][j] = sim
            matrix[j][i] = sim
    
    return matrix


# ============ Performance Metrics ============
@dataclass
class SearchMetrics:
    """Metrics for search performance evaluation"""
    query_time_ms: float
    embedding_time_ms: float
    similarity_calc_time_ms: float
    ranking_time_ms: float
    total_results: int
    returned_results: int
    average_similarity: float
    min_similarity: float
    max_similarity: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary"""
        return {
            "query_time_ms": round(self.query_time_ms, 2),
            "embedding_time_ms": round(self.embedding_time_ms, 2),
            "similarity_calc_time_ms": round(self.similarity_calc_time_ms, 2),
            "ranking_time_ms": round(self.ranking_time_ms, 2),
            "total_time_ms": round(
                self.query_time_ms + 
                self.embedding_time_ms + 
                self.similarity_calc_time_ms + 
                self.ranking_time_ms, 2
            ),
            "total_results": self.total_results,
            "returned_results": self.returned_results,
            "average_similarity": round(self.average_similarity, 4),
            "min_similarity": round(self.min_similarity, 4),
            "max_similarity": round(self.max_similarity, 4),
        }