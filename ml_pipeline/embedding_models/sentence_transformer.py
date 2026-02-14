"""
Sentence Transformers embeddings for ARAS.
Provides local embedding generation using HuggingFace sentence-transformers.
"""

import os
import numpy as np
from typing import List, Dict, Any, Optional, Union, Tuple
from sentence_transformers import SentenceTransformer
import torch
import logging
from pathlib import Path
import json
from tqdm import tqdm
import hashlib
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SentenceTransformerGenerator:
    """
    Generate embeddings using Sentence Transformers models.
    Supports various pre-trained models and caching.
    """
    
    # Available models with their properties
    AVAILABLE_MODELS = {
        "all-MiniLM-L6-v2": {
            "dimension": 384,
            "max_seq_length": 256,
            "description": "Small, fast model good for general use",
            "performance": "fast"
        },
        "all-mpnet-base-v2": {
            "dimension": 768,
            "max_seq_length": 384,
            "description": "Best quality, slower but more accurate",
            "performance": "balanced"
        },
        "multi-qa-mpnet-base-dot-v1": {
            "dimension": 768,
            "max_seq_length": 512,
            "description": "Optimized for question-answering",
            "performance": "balanced"
        },
        "BAAI/bge-large-en-v1.5": {
            "dimension": 1024,
            "max_seq_length": 512,
            "description": "High performance for retrieval tasks",
            "performance": "slow"
        },
        "intfloat/e5-large-v2": {
            "dimension": 1024,
            "max_seq_length": 512,
            "description": "Excellent for retrieval and RAG",
            "performance": "slow"
        },
        "sentence-transformers/gtr-t5-large": {
            "dimension": 768,
            "max_seq_length": 512,
            "description": "T5-based model, good for long texts",
            "performance": "slow"
        }
    }
    
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        device: Optional[str] = None,
        cache_dir: Optional[str] = None,
        use_cache: bool = True,
        batch_size: int = 32,
        normalize_embeddings: bool = True,
        max_length: Optional[int] = None
    ):
        """
        Initialize the Sentence Transformer embedding generator.
        
        Args:
            model_name: Name of the sentence-transformers model
            device: Device to use ('cuda', 'cpu', or None for auto-detect)
            cache_dir: Directory to cache embeddings
            use_cache: Whether to cache embeddings
            batch_size: Batch size for processing
            normalize_embeddings: Whether to L2-normalize embeddings
            max_length: Maximum sequence length
        """
        self.model_name = model_name
        
        # Set device
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
        
        # Set cache directory
        if cache_dir is None:
            cache_dir = Path.home() / '.cache' / 'aras' / 'embeddings'
        else:
            cache_dir = Path(cache_dir)
        
        self.cache_dir = cache_dir / model_name.replace('/', '_')
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.use_cache = use_cache
        self.batch_size = batch_size
        self.normalize_embeddings = normalize_embeddings
        
        # Load model
        logger.info(f"Loading model {model_name} on {self.device}")
        self.model = SentenceTransformer(model_name, device=self.device)
        
        # Set max length if specified
        if max_length:
            self.model.max_seq_length = max_length
        
        # Model info
        self.model_info = self.AVAILABLE_MODELS.get(
            model_name,
            {
                "dimension": self.model.get_sentence_embedding_dimension(),
                "max_seq_length": self.model.max_seq_length,
                "description": "Custom model",
                "performance": "unknown"
            }
        )
        
        logger.info(f"Model loaded. Dimension: {self.get_embedding_dimension()}, "
                   f"Max length: {self.model.max_seq_length}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        # Check cache
        if self.use_cache:
            cached = self._get_cached_embedding(text)
            if cached is not None:
                return cached
        
        # Generate embedding
        embedding = self.model.encode(
            text,
            normalize_embeddings=self.normalize_embeddings,
            convert_to_numpy=True
        )
        
        # Convert to list
        embedding_list = embedding.tolist()
        
        # Cache if enabled
        if self.use_cache:
            self._cache_embedding(text, embedding_list)
        
        return embedding_list
    
    def generate_embeddings(
        self,
        texts: List[str],
        show_progress: bool = True,
        return_numpy: bool = False
    ) -> Union[List[List[float]], np.ndarray]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            show_progress: Whether to show progress bar
            return_numpy: Whether to return numpy array instead of list
            
        Returns:
            List or array of embeddings
        """
        if not texts:
            return [] if not return_numpy else np.array([])
        
        # Check cache for all texts
        if self.use_cache:
            embeddings = []
            texts_to_process = []
            indices_to_process = []
            
            for i, text in enumerate(texts):
                cached = self._get_cached_embedding(text)
                if cached is not None:
                    embeddings.append((i, cached))
                else:
                    texts_to_process.append(text)
                    indices_to_process.append(i)
            
            # Process uncached texts
            if texts_to_process:
                logger.info(f"Processing {len(texts_to_process)} uncached texts")
                new_embeddings = self._encode_batch(
                    texts_to_process,
                    show_progress=show_progress
                )
                
                # Cache new embeddings
                for text, emb in zip(texts_to_process, new_embeddings):
                    self._cache_embedding(text, emb.tolist())
                
                # Combine results
                all_embeddings = [None] * len(texts)
                for idx, emb in embeddings:
                    all_embeddings[idx] = emb
                for idx, emb in zip(indices_to_process, new_embeddings):
                    all_embeddings[idx] = emb.tolist()
            else:
                # All from cache
                all_embeddings = [emb for _, emb in sorted(embeddings)]
        else:
            # No caching, process all
            embeddings_array = self._encode_batch(
                texts,
                show_progress=show_progress
            )
            all_embeddings = [emb.tolist() for emb in embeddings_array]
        
        if return_numpy:
            return np.array(all_embeddings)
        
        return all_embeddings
    
    def _encode_batch(
        self,
        texts: List[str],
        show_progress: bool = True
    ) -> np.ndarray:
        """
        Encode texts in batches.
        
        Args:
            texts: List of texts
            show_progress: Whether to show progress
            
        Returns:
            Numpy array of embeddings
        """
        if show_progress:
            texts = tqdm(texts, desc="Generating embeddings")
        
        return self.model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=self.normalize_embeddings,
            show_progress_bar=False,  # We handle progress separately
            convert_to_numpy=True
        )
    
    def _get_cached_embedding(self, text: str) -> Optional[List[float]]:
        """
        Get cached embedding for text.
        
        Args:
            text: Input text
            
        Returns:
            Cached embedding or None
        """
        try:
            cache_key = self._get_cache_key(text)
            cache_file = self.cache_dir / f"{cache_key}.pkl"
            
            if cache_file.exists():
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
        except Exception as e:
            logger.debug(f"Error reading cache: {e}")
        
        return None
    
    def _cache_embedding(self, text: str, embedding: List[float]):
        """
        Cache embedding for text.
        
        Args:
            text: Input text
            embedding: Generated embedding
        """
        try:
            cache_key = self._get_cache_key(text)
            cache_file = self.cache_dir / f"{cache_key}.pkl"
            
            with open(cache_file, 'wb') as f:
                pickle.dump(embedding, f)
        except Exception as e:
            logger.debug(f"Error writing cache: {e}")
    
    def _get_cache_key(self, text: str) -> str:
        """
        Generate cache key for text.
        
        Args:
            text: Input text
            
        Returns:
            Cache key string
        """
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding optimized for queries.
        Some models have specific prefixes for queries.
        
        Args:
            query: Input query
            
        Returns:
            Query embedding
        """
        # Add query prefix for models that need it
        if "e5" in self.model_name.lower():
            query = f"query: {query}"
        elif "bge" in self.model_name.lower():
            # BGE models don't need prefix for queries
            pass
        
        return self.generate_embedding(query)
    
    def generate_document_embedding(self, document: str) -> List[float]:
        """
        Generate embedding optimized for documents.
        Some models have specific prefixes for documents.
        
        Args:
            document: Input document
            
        Returns:
            Document embedding
        """
        # Add document prefix for models that need it
        if "e5" in self.model_name.lower():
            document = f"passage: {document}"
        
        return self.generate_embedding(document)
    
    def get_embedding_dimension(self) -> int:
        """
        Get the dimension of the embedding vectors.
        
        Returns:
            Embedding dimension
        """
        return self.model.get_sentence_embedding_dimension()
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dictionary with model information
        """
        return {
            "model_name": self.model_name,
            "device": self.device,
            "dimension": self.get_embedding_dimension(),
            "max_seq_length": self.model.max_seq_length,
            "normalize_embeddings": self.normalize_embeddings,
            "batch_size": self.batch_size,
            "cache_dir": str(self.cache_dir),
            "model_info": self.model_info
        }
    
    def clear_cache(self):
        """Clear the embedding cache."""
        import shutil
        shutil.rmtree(self.cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Cleared cache for {self.model_name}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the cache.
        
        Returns:
            Dictionary with cache statistics
        """
        cache_files = list(self.cache_dir.glob("*.pkl"))
        
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "num_cached": len(cache_files),
            "cache_size_mb": total_size / (1024 * 1024),
            "cache_dir": str(self.cache_dir)
        }