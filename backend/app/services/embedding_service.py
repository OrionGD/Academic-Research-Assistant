"""
Embedding Service - Handles text-to-vector transformations.
Integrates with various embedding models, manages model caching, and provides batch processing.
"""

import logging
import time
from typing import List, Optional, Dict, Any, Union, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
import numpy as np

from sentence_transformers import SentenceTransformer
import openai
from transformers import AutoTokenizer, AutoModel
import torch

from app.models.embeddings import (
    EmbeddingConfig, EmbeddingResult, EmbeddingModel,
    normalize_vector
)
from app.core.config import settings
from app.utils.cache_manager import CacheManager

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing text embeddings"""
    
    def __init__(self, config: Optional[EmbeddingConfig] = None):
        self.config = config or EmbeddingConfig()
        self.cache = CacheManager(namespace="embeddings")
        self._models = {}  # Model cache
        self._tokenizers = {}  # Tokenizer cache
        
        # Initialize based on model type
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the embedding model based on configuration"""
        model_name = self.config.model_name.value
        
        try:
            if model_name.startswith("text-embedding"):
                # OpenAI embedding model
                self.model_type = "openai"
                self.model_name = model_name
                
                # Initialize OpenAI client
                if not settings.OPENAI_API_KEY:
                    raise ValueError("OPENAI_API_KEY is required for OpenAI embeddings")
                
                openai.api_key = settings.OPENAI_API_KEY
                logger.info(f"Initialized OpenAI embedding model: {model_name}")
                
            elif model_name in ["all-mpnet-base-v2", "all-MiniLM-L6-v2"]:
                # Sentence Transformers model
                self.model_type = "sentence_transformers"
                self.model = self._load_sentence_transformer(model_name)
                self.model_name = model_name
                logger.info(f"Initialized Sentence Transformer model: {model_name}")
                
            elif model_name.startswith("BAAI/"):
                # BGE model
                self.model_type = "bge"
                self.model = self._load_transformers_model(model_name)
                self.model_name = model_name
                logger.info(f"Initialized BGE model: {model_name}")
                
            elif model_name.startswith("hkunlp/"):
                # INSTRUCTOR model
                self.model_type = "instructor"
                self.model = self._load_instructor_model(model_name)
                self.model_name = model_name
                logger.info(f"Initialized INSTRUCTOR model: {model_name}")
                
            else:
                # Custom model
                self.model_type = "custom"
                self.model = self._load_custom_model(model_name)
                self.model_name = model_name
                logger.info(f"Initialized custom model: {model_name}")
                
        except Exception as e:
            logger.error(f"Failed to initialize embedding model {model_name}: {str(e)}")
            raise
    
    @lru_cache(maxsize=4)
    def _load_sentence_transformer(self, model_name: str) -> SentenceTransformer:
        """Load Sentence Transformer model with caching"""
        try:
            model = SentenceTransformer(
                model_name,
                device=self.config.device,
                cache_folder=self.config.cache_dir
            )
            
            # Warm up the model
            if torch.cuda.is_available():
                dummy_input = ["warmup"]
                _ = model.encode(dummy_input)
            
            return model
            
        except Exception as e:
            logger.error(f"Failed to load Sentence Transformer model {model_name}: {str(e)}")
            raise
    
    def _load_transformers_model(self, model_name: str) -> Tuple[AutoModel, AutoTokenizer]:
        """Load Hugging Face transformers model"""
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=self.config.cache_dir
            )
            model = AutoModel.from_pretrained(
                model_name,
                cache_dir=self.config.cache_dir,
                device_map=self.config.device
            )
            
            # Set model to evaluation mode
            model.eval()
            
            return model, tokenizer
            
        except Exception as e:
            logger.error(f"Failed to load transformers model {model_name}: {str(e)}")
            raise
    
    def _load_instructor_model(self, model_name: str):
        """Load INSTRUCTOR model"""
        try:
            from InstructorEmbedding import INSTRUCTOR
            
            model = INSTRUCTOR(
                model_name,
                cache_folder=self.config.cache_dir,
                device=self.config.device
            )
            return model
            
        except ImportError:
            logger.error("INSTRUCTOR package not installed. Install with: pip install InstructorEmbedding")
            raise
        except Exception as e:
            logger.error(f"Failed to load INSTRUCTOR model {model_name}: {str(e)}")
            raise
    
    def _load_custom_model(self, model_name: str):
        """Load custom embedding model"""
        # This can be extended to load custom models
        raise NotImplementedError(f"Custom model loading not implemented for: {model_name}")
    
    def generate_embedding(
        self,
        text: str,
        cache_key: Optional[str] = None,
        **kwargs
    ) -> EmbeddingResult:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text
            cache_key: Optional cache key for caching embeddings
            **kwargs: Additional model-specific parameters
            
        Returns:
            EmbeddingResult object
        """
        # Check cache
        if cache_key:
            cached = self.cache.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for embedding: {cache_key}")
                return EmbeddingResult(**cached)
        
        start_time = time.time()
        
        try:
            if self.model_type == "openai":
                embedding = self._generate_openai_embedding(text, **kwargs)
            elif self.model_type == "sentence_transformers":
                embedding = self._generate_sentence_transformer_embedding(text, **kwargs)
            elif self.model_type == "bge":
                embedding = self._generate_bge_embedding(text, **kwargs)
            elif self.model_type == "instructor":
                embedding = self._generate_instructor_embedding(text, **kwargs)
            else:
                embedding = self._generate_custom_embedding(text, **kwargs)
            
            # Normalize if configured
            if self.config.normalize:
                embedding = normalize_vector(np.array(embedding)).tolist()
            
            # Create result
            processing_time = (time.time() - start_time) * 1000  # Convert to ms
            result = EmbeddingResult(
                text=text,
                embedding=embedding,
                model_name=self.model_name,
                token_count=self._count_tokens(text),
                metadata={
                    'processing_time_ms': processing_time,
                    'model_type': self.model_type,
                    **kwargs
                }
            )
            
            # Cache result
            if cache_key:
                self.cache.set(cache_key, result.__dict__, ttl=3600)  # Cache for 1 hour
            
            logger.debug(f"Generated embedding for {len(text)} chars in {processing_time:.2f}ms")
            return result
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings_batch(
        self,
        texts: List[str],
        cache_keys: Optional[List[str]] = None,
        batch_size: Optional[int] = None,
        **kwargs
    ) -> List[EmbeddingResult]:
        """
        Generate embeddings for a batch of texts.
        
        Args:
            texts: List of input texts
            cache_keys: Optional cache keys for each text
            batch_size: Batch size for processing (defaults to config)
            **kwargs: Additional model-specific parameters
            
        Returns:
            List of EmbeddingResult objects
        """
        batch_size = batch_size or self.config.batch_size
        results = []
        
        # Check cache for all texts first
        cached_results = {}
        texts_to_process = []
        indices_to_process = []
        
        if cache_keys:
            for i, (text, cache_key) in enumerate(zip(texts, cache_keys)):
                cached = self.cache.get(cache_key)
                if cached:
                    cached_results[i] = EmbeddingResult(**cached)
                else:
                    texts_to_process.append(text)
                    indices_to_process.append(i)
        else:
            texts_to_process = texts
            indices_to_process = list(range(len(texts)))
        
        # Generate embeddings for non-cached texts
        if texts_to_process:
            if self.model_type == "openai":
                batch_results = self._generate_openai_embeddings_batch(texts_to_process, batch_size, **kwargs)
            elif self.model_type == "sentence_transformers":
                batch_results = self._generate_sentence_transformer_embeddings_batch(texts_to_process, batch_size, **kwargs)
            elif self.model_type == "bge":
                batch_results = self._generate_bge_embeddings_batch(texts_to_process, batch_size, **kwargs)
            elif self.model_type == "instructor":
                batch_results = self._generate_instructor_embeddings_batch(texts_to_process, batch_size, **kwargs)
            else:
                batch_results = self._generate_custom_embeddings_batch(texts_to_process, batch_size, **kwargs)
            
            # Cache results and assign to output
            for idx, result in zip(indices_to_process, batch_results):
                if cache_keys:
                    cache_key = cache_keys[idx]
                    self.cache.set(cache_key, result.__dict__, ttl=3600)
                cached_results[idx] = result
        
        # Reconstruct results in original order
        for i in range(len(texts)):
            if i in cached_results:
                results.append(cached_results[i])
            else:
                # Should not happen, but handle gracefully
                logger.warning(f"No embedding found for text at index {i}")
                results.append(EmbeddingResult(
                    text=texts[i],
                    embedding=[],
                    model_name=self.model_name,
                    token_count=0,
                    metadata={'error': 'embedding_generation_failed'}
                ))
        
        return results
    
    def _generate_openai_embedding(self, text: str, **kwargs) -> List[float]:
        """Generate embedding using OpenAI API"""
        try:
            response = openai.Embedding.create(
                model=self.model_name,
                input=text,
                **kwargs
            )
            return response['data'][0]['embedding']
        except openai.error.RateLimitError:
            logger.error("OpenAI rate limit exceeded")
            raise
        except openai.error.OpenAIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    def _generate_openai_embeddings_batch(self, texts: List[str], batch_size: int, **kwargs) -> List[EmbeddingResult]:
        """Generate embeddings in batch using OpenAI API"""
        results = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                response = openai.Embedding.create(
                    model=self.model_name,
                    input=batch,
                    **kwargs
                )
                
                for j, embedding_data in enumerate(response['data']):
                    result = EmbeddingResult(
                        text=batch[j],
                        embedding=embedding_data['embedding'],
                        model_name=self.model_name,
                        token_count=self._count_tokens(batch[j]),
                        metadata={
                            'batch_index': i + j,
                            'total_batches': (len(texts) + batch_size - 1) // batch_size
                        }
                    )
                    results.append(result)
                    
            except openai.error.RateLimitError:
                logger.warning("OpenAI rate limit hit, implementing exponential backoff")
                time.sleep(2 ** (i // batch_size))  # Exponential backoff
                continue
            except Exception as e:
                logger.error(f"Error in OpenAI batch embedding: {str(e)}")
                raise
        
        return results
    
    def _generate_sentence_transformer_embedding(self, text: str, **kwargs) -> List[float]:
        """Generate embedding using Sentence Transformer"""
        try:
            embedding = self.model.encode(
                text,
                normalize_embeddings=self.config.normalize,
                show_progress_bar=False,
                **kwargs
            )
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Sentence Transformer error: {str(e)}")
            raise
    
    def _generate_sentence_transformer_embeddings_batch(self, texts: List[str], batch_size: int, **kwargs) -> List[EmbeddingResult]:
        """Generate embeddings in batch using Sentence Transformer"""
        results = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                embeddings = self.model.encode(
                    batch,
                    batch_size=batch_size,
                    normalize_embeddings=self.config.normalize,
                    show_progress_bar=False,
                    **kwargs
                )
                
                for j, embedding in enumerate(embeddings):
                    result = EmbeddingResult(
                        text=batch[j],
                        embedding=embedding.tolist(),
                        model_name=self.model_name,
                        token_count=self._count_tokens(batch[j]),
                        metadata={
                            'batch_index': i + j
                        }
                    )
                    results.append(result)
                    
            except Exception as e:
                logger.error(f"Error in Sentence Transformer batch embedding: {str(e)}")
                raise
        
        return results
    
    def _generate_bge_embedding(self, text: str, **kwargs) -> List[float]:
        """Generate embedding using BGE model"""
        model, tokenizer = self.model
        
        try:
            # Tokenize
            inputs = tokenizer(
                text,
                padding=True,
                truncation=True,
                max_length=self.config.max_length,
                return_tensors="pt"
            )
            
            # Move to device
            inputs = {k: v.to(self.config.device) for k, v in inputs.items()}
            
            # Generate embedding
            with torch.no_grad():
                outputs = model(**inputs)
                # Use mean pooling
                embeddings = outputs.last_hidden_state.mean(dim=1)
                
                if self.config.normalize:
                    embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
                
                return embeddings[0].cpu().numpy().tolist()
                
        except Exception as e:
            logger.error(f"BGE model error: {str(e)}")
            raise
    
    def _generate_bge_embeddings_batch(self, texts: List[str], batch_size: int, **kwargs) -> List[EmbeddingResult]:
        """Generate embeddings in batch using BGE model"""
        model, tokenizer = self.model
        results = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                # Tokenize batch
                inputs = tokenizer(
                    batch,
                    padding=True,
                    truncation=True,
                    max_length=self.config.max_length,
                    return_tensors="pt"
                )
                
                # Move to device
                inputs = {k: v.to(self.config.device) for k, v in inputs.items()}
                
                # Generate embeddings
                with torch.no_grad():
                    outputs = model(**inputs)
                    embeddings = outputs.last_hidden_state.mean(dim=1)
                    
                    if self.config.normalize:
                        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
                    
                    embeddings_np = embeddings.cpu().numpy()
                    
                    for j, embedding in enumerate(embeddings_np):
                        result = EmbeddingResult(
                            text=batch[j],
                            embedding=embedding.tolist(),
                            model_name=self.model_name,
                            token_count=self._count_tokens(batch[j]),
                            metadata={
                                'batch_index': i + j
                            }
                        )
                        results.append(result)
                        
            except Exception as e:
                logger.error(f"Error in BGE batch embedding: {str(e)}")
                raise
        
        return results
    
    def _generate_instructor_embedding(self, text: str, **kwargs) -> List[float]:
        """Generate embedding using INSTRUCTOR model"""
        try:
            # INSTRUCTOR requires task instruction
            instruction = kwargs.get('instruction', 'Represent the document for retrieval:')
            embedding = self.model.encode([[instruction, text]])
            return embedding[0].tolist()
        except Exception as e:
            logger.error(f"INSTRUCTOR model error: {str(e)}")
            raise
    
    def _generate_instructor_embeddings_batch(self, texts: List[str], batch_size: int, **kwargs) -> List[EmbeddingResult]:
        """Generate embeddings in batch using INSTRUCTOR model"""
        results = []
        instruction = kwargs.get('instruction', 'Represent the document for retrieval:')
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                # Prepare inputs with instructions
                inputs = [[instruction, text] for text in batch]
                
                embeddings = self.model.encode(
                    inputs,
                    batch_size=batch_size,
                    show_progress_bar=False,
                    **kwargs
                )
                
                for j, embedding in enumerate(embeddings):
                    result = EmbeddingResult(
                        text=batch[j],
                        embedding=embedding.tolist(),
                        model_name=self.model_name,
                        token_count=self._count_tokens(batch[j]),
                        metadata={
                            'batch_index': i + j,
                            'instruction': instruction
                        }
                    )
                    results.append(result)
                    
            except Exception as e:
                logger.error(f"Error in INSTRUCTOR batch embedding: {str(e)}")
                raise
        
        return results
    
    def _generate_custom_embedding(self, text: str, **kwargs) -> List[float]:
        """Generate embedding using custom model"""
        # Implement based on custom model
        raise NotImplementedError("Custom embedding generation not implemented")
    
    def _generate_custom_embeddings_batch(self, texts: List[str], batch_size: int, **kwargs) -> List[EmbeddingResult]:
        """Generate embeddings in batch using custom model"""
        # Implement based on custom model
        raise NotImplementedError("Custom batch embedding generation not implemented")
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        try:
            if self.model_type == "openai":
                import tiktoken
                encoding = tiktoken.encoding_for_model(self.model_name)
                return len(encoding.encode(text))
            elif self.model_type in ["sentence_transformers", "bge", "instructor"]:
                # Approximate token count for non-OpenAI models
                return len(text.split())  # Rough approximation
            else:
                return len(text.split())  # Default approximation
        except Exception:
            return len(text.split())  # Fallback
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings generated by this model"""
        # Generate a dummy embedding to determine dimension
        dummy_text = "test"
        embedding = self.generate_embedding(dummy_text)
        return len(embedding.embedding)
    
    def compare_embeddings(
        self,
        embedding1: List[float],
        embedding2: List[float],
        metric: str = "cosine"
    ) -> float:
        """
        Compare two embeddings using specified metric.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            metric: Comparison metric (cosine, euclidean, dot)
            
        Returns:
            Similarity score
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        if metric == "cosine":
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            return dot_product / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0.0
        
        elif metric == "euclidean":
            distance = np.linalg.norm(vec1 - vec2)
            return 1.0 / (1.0 + distance)  # Convert distance to similarity
        
        elif metric == "dot":
            return float(np.dot(vec1, vec2))
        
        else:
            raise ValueError(f"Unsupported metric: {metric}")
    
    def clear_cache(self) -> int:
        """Clear the embedding cache"""
        return self.cache.clear()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current embedding model"""
        return {
            'model_name': self.model_name,
            'model_type': self.model_type,
            'embedding_dimension': self.get_embedding_dimension(),
            'normalize': self.config.normalize,
            'batch_size': self.config.batch_size,
            'device': self.config.device
        }