"""
OpenAI Embeddings integration for ARAS.
Handles embedding generation using OpenAI's embedding models.
"""

import os
import numpy as np
from typing import List, Dict, Any, Optional, Union
from tenacity import retry, stop_after_attempt, wait_exponential
import openai
from openai import OpenAI
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenAIEmbeddingGenerator:
    """
    Generate embeddings using OpenAI's API.
    Supports both synchronous and asynchronous embedding generation.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "text-embedding-3-small",
        dimensions: Optional[int] = None,
        max_retries: int = 3,
        batch_size: int = 100
    ):
        """
        Initialize the OpenAI embedding generator.
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            model: Embedding model name
            dimensions: Number of dimensions (for text-embedding-3 models)
            max_retries: Maximum number of retries for failed requests
            batch_size: Batch size for embedding generation
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        self.dimensions = dimensions
        self.max_retries = max_retries
        self.batch_size = batch_size
        
        # Model configurations
        self.model_configs = {
            "text-embedding-3-small": {
                "max_tokens": 8191,
                "dimensions": 1536,
                "cost_per_1k_tokens": 0.00002
            },
            "text-embedding-3-large": {
                "max_tokens": 8191,
                "dimensions": 3072,
                "cost_per_1k_tokens": 0.00013
            },
            "text-embedding-ada-002": {
                "max_tokens": 8191,
                "dimensions": 1536,
                "cost_per_1k_tokens": 0.00010
            }
        }
        
        if model not in self.model_configs:
            logger.warning(f"Unknown model {model}. Using default configuration.")
        
        logger.info(f"Initialized OpenAI embedding generator with model: {model}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        try:
            # Truncate text if necessary
            text = self._truncate_text(text)
            
            # Prepare request parameters
            kwargs = {
                "model": self.model,
                "input": text
            }
            
            if self.dimensions and self.model.startswith("text-embedding-3"):
                kwargs["dimensions"] = self.dimensions
            
            response = self.client.embeddings.create(**kwargs)
            embedding = response.data[0].embedding
            
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embeddings
        """
        if not texts:
            return []
        
        all_embeddings = []
        
        # Process in batches
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            
            try:
                # Truncate texts if necessary
                batch = [self._truncate_text(text) for text in batch]
                
                # Prepare request
                kwargs = {
                    "model": self.model,
                    "input": batch
                }
                
                if self.dimensions and self.model.startswith("text-embedding-3"):
                    kwargs["dimensions"] = self.dimensions
                
                response = self.client.embeddings.create(**kwargs)
                
                # Sort embeddings by index to maintain order
                batch_embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
                all_embeddings.extend(batch_embeddings)
                
                logger.info(f"Processed batch {i//self.batch_size + 1}/{(len(texts)-1)//self.batch_size + 1}")
                
            except Exception as e:
                logger.error(f"Error processing batch starting at index {i}: {str(e)}")
                # Add None for failed embeddings
                all_embeddings.extend([None] * len(batch))
        
        return all_embeddings
    
    async def generate_embedding_async(self, text: str) -> List[float]:
        """
        Asynchronously generate embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            embedding = await loop.run_in_executor(
                executor,
                self.generate_embedding,
                text
            )
        return embedding
    
    async def generate_embeddings_async(self, texts: List[str]) -> List[List[float]]:
        """
        Asynchronously generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embeddings
        """
        tasks = [self.generate_embedding_async(text) for text in texts]
        embeddings = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        results = []
        for emb in embeddings:
            if isinstance(emb, Exception):
                logger.error(f"Error in async embedding: {str(emb)}")
                results.append(None)
            else:
                results.append(emb)
        
        return results
    
    def _truncate_text(self, text: str) -> str:
        """
        Truncate text to model's maximum token limit.
        Approximate truncation by character count.
        
        Args:
            text: Input text
            
        Returns:
            Truncated text
        """
        config = self.model_configs.get(self.model, self.model_configs["text-embedding-3-small"])
        max_tokens = config["max_tokens"]
        
        # Rough estimate: 1 token ≈ 4 characters for English text
        max_chars = max_tokens * 4
        
        if len(text) > max_chars:
            logger.warning(f"Truncating text from {len(text)} to {max_chars} characters")
            return text[:max_chars]
        
        return text
    
    def estimate_cost(self, texts: List[str]) -> Dict[str, float]:
        """
        Estimate the cost of generating embeddings.
        
        Args:
            texts: List of input texts
            
        Returns:
            Dictionary with cost estimates
        """
        config = self.model_configs.get(self.model, self.model_configs["text-embedding-3-small"])
        
        # Estimate tokens (rough approximation)
        total_chars = sum(len(text) for text in texts)
        estimated_tokens = total_chars / 4  # Rough estimate
        
        cost = (estimated_tokens / 1000) * config["cost_per_1k_tokens"]
        
        return {
            "model": self.model,
            "estimated_tokens": estimated_tokens,
            "cost_per_1k_tokens": config["cost_per_1k_tokens"],
            "estimated_cost_usd": cost,
            "num_texts": len(texts)
        }
    
    def get_embedding_dimension(self) -> int:
        """
        Get the dimension of the embedding vectors.
        
        Returns:
            Embedding dimension
        """
        if self.dimensions:
            return self.dimensions
        
        config = self.model_configs.get(self.model)
        if config:
            return config["dimensions"]
        
        # Default to generating a test embedding to get dimension
        test_embedding = self.generate_embedding("test")
        return len(test_embedding)
