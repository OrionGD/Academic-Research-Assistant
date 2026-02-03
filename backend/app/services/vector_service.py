"""
Vector Service - Manages vector database operations.
Provides CRUD operations for vector indices, similarity searches, and maintenance tasks.
"""

import logging
import time
from typing import List, Optional, Dict, Any, Tuple, Union
from datetime import datetime
import numpy as np
import faiss
import pickle
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.database import DocumentChunk, Document
from app.models.embeddings import (
    DistanceMetric, get_similarity_calculator,
    SearchResultItem, ResultRanker, SearchMetrics
)
from app.core.config import settings
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class VectorIndex:
    """Wrapper for FAISS index with metadata"""
    
    def __init__(self, dimension: int, metric: DistanceMetric = DistanceMetric.COSINE):
        self.dimension = dimension
        self.metric = metric
        self.index = self._create_faiss_index(dimension, metric)
        self.metadata = {}  # Map index position to chunk metadata
        self.chunk_ids = []  # Map index position to chunk ID
        self.document_ids = []  # Map index position to document ID
        self.is_trained = False
    
    def _create_faiss_index(self, dimension: int, metric: DistanceMetric):
        """Create FAISS index based on metric"""
        if metric == DistanceMetric.COSINE:
            # For cosine similarity, we use inner product on normalized vectors
            index = faiss.IndexFlatIP(dimension)
        elif metric == DistanceMetric.EUCLIDEAN:
            index = faiss.IndexFlatL2(dimension)
        else:
            # Default to inner product
            index = faiss.IndexFlatIP(dimension)
        
        return index
    
    def add_vectors(
        self,
        vectors: np.ndarray,
        chunk_ids: List[int],
        document_ids: List[int],
        metadata_list: List[Dict[str, Any]]
    ):
        """Add vectors to index with associated metadata"""
        if len(vectors) == 0:
            return
        
        # Normalize vectors for cosine similarity
        if self.metric == DistanceMetric.COSINE:
            faiss.normalize_L2(vectors)
        
        # Add to FAISS index
        self.index.add(vectors)
        
        # Store metadata
        start_idx = len(self.chunk_ids)
        for i, (chunk_id, doc_id, metadata) in enumerate(zip(chunk_ids, document_ids, metadata_list)):
            idx = start_idx + i
            self.chunk_ids.append(chunk_id)
            self.document_ids.append(doc_id)
            self.metadata[idx] = metadata
        
        logger.info(f"Added {len(vectors)} vectors to index, total: {self.index.ntotal}")
    
    def search(
        self,
        query_vector: np.ndarray,
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: Query embedding vector
            k: Number of results to return
            filters: Optional filters (document_ids, etc.)
            
        Returns:
            Tuple of (distances, indices, metadata)
        """
        if self.index.ntotal == 0:
            return np.array([]), np.array([]), []
        
        # Prepare query vector
        query_vector = query_vector.reshape(1, -1).astype(np.float32)
        
        if self.metric == DistanceMetric.COSINE:
            faiss.normalize_L2(query_vector)
        
        # Search
        distances, indices = self.index.search(query_vector, min(k, self.index.ntotal))
        
        # Apply filters if specified
        if filters:
            filtered_indices = []
            filtered_distances = []
            filtered_metadata = []
            
            for i, idx in enumerate(indices[0]):
                if idx < 0:  # FAISS returns -1 for empty slots
                    continue
                
                metadata = self.metadata.get(idx, {})
                if self._passes_filter(metadata, filters):
                    filtered_indices.append(idx)
                    filtered_distances.append(distances[0][i])
                    filtered_metadata.append(metadata)
            
            # Convert to arrays
            indices = np.array([filtered_indices])
            distances = np.array([filtered_distances])
            metadata_list = filtered_metadata
        else:
            # Get metadata for all results
            metadata_list = [self.metadata.get(idx, {}) for idx in indices[0] if idx >= 0]
        
        return distances, indices, metadata_list
    
    def _passes_filter(self, metadata: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if metadata passes filter criteria"""
        if 'document_ids' in filters:
            document_id = metadata.get('document_id')
            if document_id not in filters['document_ids']:
                return False
        
        if 'date_from' in filters:
            chunk_date = metadata.get('created_at')
            if chunk_date and chunk_date < filters['date_from']:
                return False
        
        if 'date_to' in filters:
            chunk_date = metadata.get('created_at')
            if chunk_date and chunk_date > filters['date_to']:
                return False
        
        return True
    
    def remove_by_document(self, document_id: int) -> int:
        """Remove all vectors for a specific document"""
        indices_to_remove = []
        
        for idx, metadata in self.metadata.items():
            if metadata.get('document_id') == document_id:
                indices_to_remove.append(idx)
        
        # Remove from index (FAISS doesn't support direct removal, so we rebuild)
        if indices_to_remove:
            self._rebuild_without_indices(indices_to_remove)
        
        return len(indices_to_remove)
    
    def _rebuild_without_indices(self, indices_to_remove: List[int]):
        """Rebuild index without specified indices"""
        # This is inefficient but FAISS doesn't support removal
        # In production, consider using a different vector DB that supports deletion
        logger.warning(f"Rebuilding index to remove {len(indices_to_remove)} vectors")
        
        # Get all current vectors and metadata
        all_vectors = self.index.reconstruct_n(0, self.index.ntotal)
        
        # Filter out removed indices
        keep_mask = np.ones(self.index.ntotal, dtype=bool)
        keep_mask[indices_to_remove] = False
        
        kept_vectors = all_vectors[keep_mask]
        kept_chunk_ids = [self.chunk_ids[i] for i in range(len(self.chunk_ids)) if keep_mask[i]]
        kept_document_ids = [self.document_ids[i] for i in range(len(self.document_ids)) if keep_mask[i]]
        kept_metadata = {new_idx: self.metadata[old_idx] 
                        for new_idx, old_idx in enumerate(np.where(keep_mask)[0])}
        
        # Create new index
        self.index = self._create_faiss_index(self.dimension, self.metric)
        self.metadata = kept_metadata
        self.chunk_ids = kept_chunk_ids
        self.document_ids = kept_document_ids
        
        # Add kept vectors back
        if len(kept_vectors) > 0:
            self.index.add(kept_vectors)
    
    def save(self, filepath: Path):
        """Save index to disk"""
        # Save FAISS index
        faiss.write_index(self.index, str(filepath))
        
        # Save metadata
        metadata_file = filepath.with_suffix('.meta')
        with open(metadata_file, 'wb') as f:
            pickle.dump({
                'dimension': self.dimension,
                'metric': self.metric.value,
                'chunk_ids': self.chunk_ids,
                'document_ids': self.document_ids,
                'metadata': self.metadata,
                'is_trained': self.is_trained
            }, f)
        
        logger.info(f"Saved vector index to {filepath}")
    
    @classmethod
    def load(cls, filepath: Path) -> 'VectorIndex':
        """Load index from disk"""
        # Load FAISS index
        index = faiss.read_index(str(filepath))
        
        # Load metadata
        metadata_file = filepath.with_suffix('.meta')
        with open(metadata_file, 'rb') as f:
            metadata_dict = pickle.load(f)
        
        # Create VectorIndex instance
        vector_index = cls(metadata_dict['dimension'], DistanceMetric(metadata_dict['metric']))
        vector_index.index = index
        vector_index.chunk_ids = metadata_dict['chunk_ids']
        vector_index.document_ids = metadata_dict['document_ids']
        vector_index.metadata = metadata_dict['metadata']
        vector_index.is_trained = metadata_dict['is_trained']
        
        logger.info(f"Loaded vector index from {filepath} with {index.ntotal} vectors")
        return vector_index
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            'total_vectors': self.index.ntotal,
            'dimension': self.dimension,
            'metric': self.metric.value,
            'unique_documents': len(set(self.document_ids)),
            'is_trained': self.is_trained
        }


class VectorService:
    """Service for vector database operations"""
    
    def __init__(self, db: Session, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service
        self.index: Optional[VectorIndex] = None
        self.index_path = Path(settings.VECTOR_INDEX_DIR) / "main_index.faiss"
        
        # Load or create index
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize vector index"""
        try:
            if self.index_path.exists():
                logger.info(f"Loading existing vector index from {self.index_path}")
                self.index = VectorIndex.load(self.index_path)
            else:
                logger.info("Creating new vector index")
                dimension = self.embedding_service.get_embedding_dimension()
                self.index = VectorIndex(dimension, DistanceMetric.COSINE)
                
                # Build initial index from database
                self.rebuild_index()
        except Exception as e:
            logger.error(f"Failed to initialize vector index: {str(e)}")
            raise
    
    def rebuild_index(self, document_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Rebuild vector index from database.
        
        Args:
            document_ids: Optional list of document IDs to index
                        (if None, index all processed documents)
        
        Returns:
            Statistics about the rebuild operation
        """
        start_time = time.time()
        logger.info(f"Starting index rebuild for documents: {document_ids or 'all'}")
        
        # Query chunks from database
        query = self.db.query(
            DocumentChunk.id,
            DocumentChunk.document_id,
            DocumentChunk.content,
            DocumentChunk.embedding,
            DocumentChunk.metadata,
            Document.title.label('document_title')
        ).join(Document, DocumentChunk.document_id == Document.id)
        
        if document_ids:
            query = query.filter(DocumentChunk.document_id.in_(document_ids))
        
        query = query.filter(
            DocumentChunk.embedding.isnot(None),
            Document.processed.is_(True)
        )
        
        chunks = query.all()
        
        if not chunks:
            logger.warning("No chunks with embeddings found for indexing")
            return {'total_chunks': 0, 'status': 'no_data'}
        
        # Prepare data for indexing
        vectors = []
        chunk_ids = []
        document_ids_list = []
        metadata_list = []
        
        for chunk in chunks:
            if chunk.embedding:
                vectors.append(chunk.embedding)
                chunk_ids.append(chunk.id)
                document_ids_list.append(chunk.document_id)
                
                metadata = chunk.metadata or {}
                metadata.update({
                    'document_id': chunk.document_id,
                    'document_title': chunk.document_title,
                    'chunk_index': chunk.metadata.get('chunk_index', 0) if chunk.metadata else 0
                })
                metadata_list.append(metadata)
        
        if not vectors:
            logger.warning("No valid embeddings found")
            return {'total_chunks': 0, 'status': 'no_valid_embeddings'}
        
        # Create new index
        dimension = len(vectors[0])
        self.index = VectorIndex(dimension, DistanceMetric.COSINE)
        
        # Add vectors to index
        vectors_np = np.array(vectors, dtype=np.float32)
        self.index.add_vectors(vectors_np, chunk_ids, document_ids_list, metadata_list)
        
        # Save index
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        self.index.save(self.index_path)
        
        processing_time = time.time() - start_time
        stats = self.index.get_stats()
        stats.update({
            'rebuild_time_seconds': round(processing_time, 2),
            'chunks_processed': len(chunks),
            'vectors_indexed': len(vectors)
        })
        
        logger.info(f"Index rebuild completed: {stats}")
        return stats
    
    def search_similar(
        self,
        query_embedding: List[float],
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        min_similarity: float = 0.0,
        ranking_algorithm: str = "similarity"
    ) -> Tuple[List[SearchResultItem], SearchMetrics]:
        """
        Search for similar vectors in the index.
        
        Args:
            query_embedding: Query embedding vector
            k: Number of results to return
            filters: Optional search filters
            min_similarity: Minimum similarity threshold
            ranking_algorithm: Ranking algorithm to use
        
        Returns:
            Tuple of (results, metrics)
        """
        search_start = time.time()
        
        if not self.index or self.index.index.ntotal == 0:
            return [], SearchMetrics(
                query_time_ms=0,
                embedding_time_ms=0,
                similarity_calc_time_ms=0,
                ranking_time_ms=0,
                total_results=0,
                returned_results=0,
                average_similarity=0,
                min_similarity=0,
                max_similarity=0
            )
        
        # Convert query embedding to numpy array
        query_vector = np.array(query_embedding, dtype=np.float32).reshape(1, -1)
        
        # Search in index
        search_start_time = time.time()
        distances, indices, metadata_list = self.index.search(query_vector, k, filters)
        search_time = (time.time() - search_start_time) * 1000
        
        if len(indices[0]) == 0:
            return [], SearchMetrics(
                query_time_ms=(time.time() - search_start) * 1000,
                embedding_time_ms=0,
                similarity_calc_time_ms=search_time,
                ranking_time_ms=0,
                total_results=0,
                returned_results=0,
                average_similarity=0,
                min_similarity=0,
                max_similarity=0
            )
        
        # Get chunk details from database
        chunk_ids = [self.index.chunk_ids[idx] for idx in indices[0] if idx >= 0]
        chunks = self.db.query(DocumentChunk).filter(DocumentChunk.id.in_(chunk_ids)).all()
        
        # Map chunk ID to chunk object
        chunk_map = {chunk.id: chunk for chunk in chunks}
        
        # Create search results
        results = []
        similarities = []
        
        for i, idx in enumerate(indices[0]):
            if idx < 0:
                continue
            
            chunk_id = self.index.chunk_ids[idx]
            chunk = chunk_map.get(chunk_id)
            
            if not chunk:
                continue
            
            # Calculate similarity score from distance
            distance = distances[0][i]
            if self.index.metric == DistanceMetric.COSINE:
                # For cosine similarity, distance is actually similarity (higher is better)
                similarity = float(distance)
            else:
                # For Euclidean, convert distance to similarity
                similarity = 1.0 / (1.0 + float(distance))
            
            # Apply minimum similarity threshold
            if similarity < min_similarity:
                continue
            
            # Create result item
            metadata = metadata_list[i] if i < len(metadata_list) else {}
            result = SearchResultItem(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_title=metadata.get('document_title', 'Unknown'),
                content=chunk.content,
                raw_score=similarity,
                chunk_index=metadata.get('chunk_index', 0),
                metadata=metadata
            )
            
            results.append(result)
            similarities.append(similarity)
        
        # Rank results
        ranking_start = time.time()
        ranker = ResultRanker(ranking_algorithm=ranking_algorithm)
        ranked_results = ranker.rank_results(
            query_vector.flatten(),
            [(r.chunk_id, r.document_id, r.document_title, r.content, 
              np.array(query_embedding), r.metadata) for r in results],
            k
        )
        ranking_time = (time.time() - ranking_start) * 1000
        
        # Calculate metrics
        total_time = (time.time() - search_start) * 1000
        metrics = SearchMetrics(
            query_time_ms=total_time - search_time - ranking_time,
            embedding_time_ms=0,  # Embedding generation time is tracked elsewhere
            similarity_calc_time_ms=search_time,
            ranking_time_ms=ranking_time,
            total_results=len(results),
            returned_results=len(ranked_results),
            average_similarity=np.mean(similarities) if similarities else 0,
            min_similarity=min(similarities) if similarities else 0,
            max_similarity=max(similarities) if similarities else 0
        )
        
        return ranked_results, metrics
    
    def add_document_to_index(self, document_id: int) -> Dict[str, Any]:
        """
        Add document chunks to vector index.
        
        Args:
            document_id: Document ID to add
        
        Returns:
            Statistics about the operation
        """
        start_time = time.time()
        
        # Get document chunks with embeddings
        chunks = self.db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id,
            DocumentChunk.embedding.isnot(None)
        ).all()
        
        if not chunks:
            return {'added_vectors': 0, 'status': 'no_embeddings'}
        
        # Prepare data
        vectors = []
        chunk_ids = []
        document_ids = []
        metadata_list = []
        
        document = self.db.query(Document).filter(Document.id == document_id).first()
        
        for chunk in chunks:
            vectors.append(chunk.embedding)
            chunk_ids.append(chunk.id)
            document_ids.append(document_id)
            
            metadata = chunk.metadata or {}
            metadata.update({
                'document_id': document_id,
                'document_title': document.title if document else 'Unknown',
                'chunk_index': metadata.get('chunk_index', 0)
            })
            metadata_list.append(metadata)
        
        # Add to index
        vectors_np = np.array(vectors, dtype=np.float32)
        self.index.add_vectors(vectors_np, chunk_ids, document_ids, metadata_list)
        
        # Save updated index
        self.index.save(self.index_path)
        
        processing_time = time.time() - start_time
        return {
            'added_vectors': len(chunks),
            'processing_time_seconds': round(processing_time, 2),
            'document_id': document_id,
            'status': 'success'
        }
    
    def remove_document_from_index(self, document_id: int) -> Dict[str, Any]:
        """
        Remove document chunks from vector index.
        
        Args:
            document_id: Document ID to remove
        
        Returns:
            Statistics about the operation
        """
        if not self.index:
            return {'removed_vectors': 0, 'status': 'index_not_initialized'}
        
        start_time = time.time()
        
        # Remove from index
        removed_count = self.index.remove_by_document(document_id)
        
        if removed_count > 0:
            # Save updated index
            self.index.save(self.index_path)
        
        processing_time = time.time() - start_time
        return {
            'removed_vectors': removed_count,
            'processing_time_seconds': round(processing_time, 2),
            'document_id': document_id,
            'status': 'success' if removed_count > 0 else 'no_vectors_found'
        }
    
    def update_chunk_embedding(
        self,
        chunk_id: int,
        new_embedding: List[float]
    ) -> bool:
        """
        Update embedding for a specific chunk.
        
        Note: FAISS doesn't support direct updates, so we need to rebuild.
        This is inefficient and should be used sparingly.
        
        Args:
            chunk_id: Chunk ID
            new_embedding: New embedding vector
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get chunk
            chunk = self.db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
            if not chunk:
                return False
            
            # Update in database
            chunk.embedding = new_embedding
            self.db.commit()
            
            # Rebuild index for this document
            self.rebuild_index([chunk.document_id])
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating chunk embedding: {str(e)}")
            self.db.rollback()
            return False
    
    def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector index"""
        if not self.index:
            return {'status': 'index_not_initialized'}
        
        stats = self.index.get_stats()
        stats.update({
            'index_path': str(self.index_path),
            'index_exists': self.index_path.exists(),
            'last_modified': datetime.fromtimestamp(self.index_path.stat().st_mtime).isoformat() 
                           if self.index_path.exists() else None
        })
        
        return stats
    
    def health_check(self) -> Dict[str, Any]:
        """Check health of vector service"""
        try:
            stats = self.get_index_stats()
            
            # Test search with dummy query
            if self.index and self.index.index.ntotal > 0:
                dummy_embedding = np.random.randn(self.index.dimension).astype(np.float32)
                _, _, _ = self.index.search(dummy_embedding.reshape(1, -1), 1)
                stats['search_test'] = 'passed'
            else:
                stats['search_test'] = 'skipped'
            
            stats['status'] = 'healthy'
            return stats
            
        except Exception as e:
            logger.error(f"Vector service health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }