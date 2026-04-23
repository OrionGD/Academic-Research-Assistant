"""
Retrieval service - handles context retrieval and building
"""
import logging
from typing import List, Dict, Any
from app.core.chroma_client import chroma_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class RetrievalService:
    """Service for retrieving and managing context"""
    
    async def retrieve_context(
        self,
        document_id: str,
        query_embedding: List[float],
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks for a query
        
        Args:
            document_id: Document identifier
            query_embedding: Embedding vector of the query
            top_k: Number of chunks to retrieve
            
        Returns:
            List of relevant chunks with scores
        """
        try:
            if top_k is None:
                top_k = settings.vector_top_k
            
            chunks = chroma_client.retrieve_similar_chunks(
                document_id=document_id,
                query_embedding=query_embedding,
                top_k=top_k
            )
            
            logger.info(f"Retrieved {len(chunks)} chunks for query")
            return chunks
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return []
    
    @staticmethod
    def build_context_prompt(
        chunks: List[Dict[str, Any]],
        summary: str = "",
        keywords: List[str] = None
    ) -> str:
        """
        Build context for AI response
        
        Args:
            chunks: Retrieved relevant chunks
            summary: Document summary
            keywords: Document keywords
            
        Returns:
            Formatted context prompt
        """
        try:
            context_parts = []
            
            # Add summary
            if summary:
                context_parts.append(f"Document Summary:\n{summary}\n")
            
            # Add keywords
            if keywords:
                keywords_text = ", ".join(keywords[:10])
                context_parts.append(f"Keywords: {keywords_text}\n")
            
            # Add relevant chunks
            if chunks:
                context_parts.append("Relevant Content:")
                for i, chunk in enumerate(chunks[:5], 1):  # Limit to 5 chunks
                    score = chunk.get("similarity_score", 0)
                    text = chunk.get("text", "")
                    context_parts.append(
                        f"\n[Chunk {i} - Relevance: {score:.2%}]\n{text}"
                    )
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Error building context prompt: {str(e)}")
            return ""


retrieval_service = RetrievalService()
