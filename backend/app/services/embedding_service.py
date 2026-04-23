"""
Embedding service - handles generating and managing embeddings
"""
import logging
from typing import List, Dict, Any
from app.core.gemini_client import gemini_client
from app.core.chroma_client import chroma_client

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for managing embeddings"""
    
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
            embeddings = gemini_client.generate_embeddings_batch(chunks)
            
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
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query
        
        Args:
            query: Query text
            
        Returns:
            Embedding vector
        """
        try:
            embedding = gemini_client.generate_embedding(query)
            return embedding
        except Exception as e:
            logger.error(f"Error generating query embedding: {str(e)}")
            raise


embedding_service = EmbeddingService()

