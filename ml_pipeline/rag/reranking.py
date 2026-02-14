"""
Result reranking algorithms for improving retrieval quality.
Provides multiple reranking strategies including cross-encoders and diversity-based methods.
"""

import numpy as np
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import asyncio
from collections import Counter
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RerankedResult:
    """Reranked result with metadata."""
    original_result: Any
    original_score: float
    reranked_score: float
    position: int
    diversity_score: Optional[float] = None


class Reranker:
    """
    Advanced reranker with multiple strategies.
    Supports cross-encoder reranking, diversity-based reranking, and hybrid approaches.
    """
    
    def __init__(
        self,
        cross_encoder_model: Optional[Any] = None,
        diversity_weight: float = 0.3,
        relevance_weight: float = 0.7,
        max_batch_size: int = 32
    ):
        """
        Initialize reranker.
        
        Args:
            cross_encoder_model: Optional cross-encoder model for neural reranking
            diversity_weight: Weight for diversity in hybrid reranking
            relevance_weight: Weight for relevance in hybrid reranking
            max_batch_size: Maximum batch size for processing
        """
        self.cross_encoder = cross_encoder_model
        self.diversity_weight = diversity_weight
        self.relevance_weight = relevance_weight
        self.max_batch_size = max_batch_size
        
        # Initialize TF-IDF vectorizer for diversity calculations
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        logger.info("Initialized Reranker")
    
    async def rerank(
        self,
        query: str,
        results: List[Any],
        method: str = "hybrid",
        top_k: Optional[int] = None,
        **kwargs
    ) -> List[RerankedResult]:
        """
        Rerank retrieval results.
        
        Args:
            query: Original query
            results: Initial retrieval results
            method: Reranking method ('relevance', 'diversity', 'hybrid', 'cross_encoder')
            top_k: Number of results to return after reranking
            **kwargs: Additional parameters
            
        Returns:
            Reranked results
        """
        if not results:
            return []
        
        top_k = top_k or len(results)
        
        if method == "relevance":
            reranked = await self._relevance_rerank(query, results)
        elif method == "diversity":
            reranked = await self._diversity_rerank(query, results)
        elif method == "hybrid":
            reranked = await self._hybrid_rerank(query, results, **kwargs)
        elif method == "cross_encoder":
            reranked = await self._cross_encoder_rerank(query, results)
        else:
            raise ValueError(f"Unsupported reranking method: {method}")
        
        # Limit to top_k
        reranked = reranked[:top_k]
        
        # Update positions
        for i, result in enumerate(reranked):
            result.position = i
        
        logger.info(f"Reranked {len(results)} results to {len(reranked)} using {method}")
        return reranked
    
    async def _relevance_rerank(
        self,
        query: str,
        results: List[Any]
    ) -> List[RerankedResult]:
        """
        Rerank by relevance score.
        
        Args:
            query: Query string
            results: Initial results
            
        Returns:
            Relevance-reranked results
        """
        reranked = []
        
        for result in results:
            original_score = self._get_original_score(result)
            reranked.append(RerankedResult(
                original_result=result,
                original_score=original_score,
                reranked_score=original_score,  # Keep original score
                position=0
            ))
        
        # Sort by original score
        reranked.sort(key=lambda x: x.original_score, reverse=True)
        
        return reranked
    
    async def _diversity_rerank(
        self,
        query: str,
        results: List[Any],
        lambda_param: float = 0.5
    ) -> List[RerankedResult]:
        """
        Rerank with diversity using MMR (Maximal Marginal Relevance).
        
        Args:
            query: Query string
            results: Initial results
            lambda_param: Trade-off parameter between relevance and diversity
            
        Returns:
            Diversity-reranked results
        """
        if not results:
            return []
        
        # Extract texts
        texts = [self._get_text(r) for r in results]
        
        # Fit vectorizer
        tfidf_matrix = self.vectorizer.fit_transform(texts)
        
        # Calculate query similarity
        query_vec = self.vectorizer.transform([query])
        query_similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        # MMR reranking
        selected = []
        remaining = list(range(len(results)))
        
        while remaining and len(selected) < len(results):
            mmr_scores = []
            
            for idx in remaining:
                # Relevance score
                relevance = query_similarities[idx]
                
                # Diversity score (max similarity to selected)
                if selected:
                    selected_sims = cosine_similarity(
                        tfidf_matrix[idx:idx+1],
                        tfidf_matrix[selected]
                    ).flatten()
                    diversity = 1 - max(selected_sims) if selected_sims.size > 0 else 1
                else:
                    diversity = 1
                
                # MMR score
                mmr = lambda_param * relevance + (1 - lambda_param) * diversity
                mmr_scores.append((idx, mmr, relevance))
            
            # Select best
            best_idx, best_mmr, best_relevance = max(mmr_scores, key=lambda x: x[1])
            selected.append(best_idx)
            remaining.remove(best_idx)
            
            # Create reranked result
            reranked = RerankedResult(
                original_result=results[best_idx],
                original_score=best_relevance,
                reranked_score=best_mmr,
                position=len(selected) - 1,
                diversity_score=1 - (best_mmr - best_relevance)  # Approximate diversity
            )
            reranked.append(reranked)
        
        return reranked
    
    async def _hybrid_rerank(
        self,
        query: str,
        results: List[Any],
        diversity_weight: Optional[float] = None
    ) -> List[RerankedResult]:
        """
        Hybrid reranking combining relevance and diversity.
        
        Args:
            query: Query string
            results: Initial results
            diversity_weight: Weight for diversity (overrides instance value)
            
        Returns:
            Hybrid-reranked results
        """
        div_weight = diversity_weight or self.diversity_weight
        rel_weight = self.relevance_weight
        
        # Get relevance-reranked
        relevance_results = await self._relevance_rerank(query, results)
        
        # Get diversity-reranked
        diversity_results = await self._diversity_rerank(query, results)
        
        # Combine scores
        combined = []
        result_dict = {self._get_id(r.original_result): r for r in relevance_results}
        
        for div_result in diversity_results:
            doc_id = self._get_id(div_result.original_result)
            rel_result = result_dict.get(doc_id)
            
            if rel_result:
                combined_score = (
                    rel_weight * rel_result.original_score +
                    div_weight * div_result.reranked_score
                )
                
                combined.append(RerankedResult(
                    original_result=div_result.original_result,
                    original_score=rel_result.original_score,
                    reranked_score=combined_score,
                    position=0,
                    diversity_score=div_result.diversity_score
                ))
        
        # Sort by combined score
        combined.sort(key=lambda x: x.reranked_score, reverse=True)
        
        return combined
    
    async def _cross_encoder_rerank(
        self,
        query: str,
        results: List[Any]
    ) -> List[RerankedResult]:
        """
        Rerank using cross-encoder for neural relevance scoring.
        
        Args:
            query: Query string
            results: Initial results
            
        Returns:
            Cross-encoder reranked results
        """
        if not self.cross_encoder:
            logger.warning("No cross-encoder model provided, using relevance reranking")
            return await self._relevance_rerank(query, results)
        
        reranked = []
        texts = [self._get_text(r) for r in results]
        
        # Process in batches
        for i in range(0, len(texts), self.max_batch_size):
            batch_texts = texts[i:i + self.max_batch_size]
            batch_results = results[i:i + self.max_batch_size]
            
            # Prepare pairs
            pairs = [(query, text) for text in batch_texts]
            
            # Get cross-encoder scores
            scores = self.cross_encoder.predict(pairs)
            
            for j, (score, result) in enumerate(zip(scores, batch_results)):
                original_score = self._get_original_score(result)
                reranked.append(RerankedResult(
                    original_result=result,
                    original_score=original_score,
                    reranked_score=float(score),
                    position=0
                ))
        
        # Sort by cross-encoder score
        reranked.sort(key=lambda x: x.reranked_score, reverse=True)
        
        return reranked
    
    def _get_original_score(self, result: Any) -> float:
        """Extract original score from result."""
        if hasattr(result, 'score'):
            return result.score
        elif isinstance(result, dict):
            return result.get('score', 0) or result.get('similarity_score', 0)
        return 0
    
    def _get_text(self, result: Any) -> str:
        """Extract text from result."""
        if hasattr(result, 'text'):
            return result.text
        elif isinstance(result, dict):
            return result.get('text', '')
        return str(result)
    
    def _get_id(self, result: Any) -> str:
        """Get unique identifier for result."""
        if hasattr(result, 'document_id') and hasattr(result, 'chunk_id'):
            return f"{result.document_id}_{result.chunk_id}"
        elif isinstance(result, dict):
            doc_id = result.get('document_id', '')
            chunk_id = result.get('chunk_id', '')
            return f"{doc_id}_{chunk_id}"
        return str(id(result))
