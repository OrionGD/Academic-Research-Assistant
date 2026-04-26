"""
Embedding service - handles generating and managing embeddings
"""
import logging
from typing import List, Dict, Any
from app.core.gemini_client import gemini_client
from app.core.chroma_client import chroma_client

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for managing embeddings"""
    
    def __init__(self):
        self.use_remote = settings.ENABLE_REMOTE_EMBEDDINGS
        self.local_model = None
        if not self.use_remote:
            logger.info(f"Initializing local embeddings with {settings.LOCAL_EMBEDDING_MODEL}")
            try:
                if settings.hf_token:
                    try:
                        from huggingface_hub import login
                        login(token=settings.hf_token)
                        logger.info("Authenticated with HuggingFace Hub")
                    except Exception as e:
                        logger.warning(f"HuggingFace login failed (non-fatal for public models): {e}")
                from sentence_transformers import SentenceTransformer
                self.local_model = SentenceTransformer(
                    settings.LOCAL_EMBEDDING_MODEL
                )
                logger.info("Local embedding model loaded successfully")
            except ImportError:
                logger.error("sentence-transformers not installed. Fallback failed.")
                raise

    async def generate_embeddings_for_document(
        self,
        document_id: str,
        chunks: List[str],
        metadata: Dict[str, Any] = None
    ) -> bool:
        """
        Generate embeddings for all chunks and store in ChromaDB
        
        Args:
            document_id: Document identifier
            chunks: List of text chunks
            metadata: Additional metadata
            
        Returns:
            Success status
        """
        try:
            logger.info(f"Generating embeddings for {len(chunks)} chunks")
            
            # Generate embeddings
            if self.use_remote:
                embeddings = gemini_client.generate_embeddings_batch(chunks)
            else:
                embeddings = self.local_model.encode(chunks).tolist()
            
            # Filter out None values
            valid_embeddings = []
            valid_chunks = []
            for chunk, embedding in zip(chunks, embeddings):
                if embedding is not None:
                    valid_chunks.append(chunk)
                    valid_embeddings.append(embedding)
            
            logger.info(f"Generated {len(valid_embeddings)} valid embeddings")
            
            # Store in ChromaDB
            success = chroma_client.store_embeddings(
                document_id=document_id,
                chunks=valid_chunks,
                embeddings=valid_embeddings,
                metadata=metadata
            )
            
            return success
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts
        
        Args:
            texts: List of strings to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            if self.use_remote:
                return gemini_client.generate_embeddings_batch(texts)
            else:
                return self.local_model.encode(texts).tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise

    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query
        
        Args:
            query: Query text
            
        Returns:
            Embedding vector
        """
        try:
            if self.use_remote:
                embedding = gemini_client.generate_embedding(query)
            else:
                embedding = self.local_model.encode([query])[0].tolist()
            return embedding
        except Exception as e:
            logger.error(f"Error generating query embedding: {str(e)}")
            raise


embedding_service = EmbeddingService()

