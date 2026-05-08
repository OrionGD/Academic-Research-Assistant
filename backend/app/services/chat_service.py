"""
Chat service - handles conversation and response generation
"""
import logging
from typing import Dict, Any, List
from app.core.groq_client import groq_client
from app.services.retrieval_service import retrieval_service

logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat and responses"""
    
    async def generate_response(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        summary: str = "",
        keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate response using Groq API
        
        Args:
            query: User's question
            chunks: Retrieved relevant chunks
            summary: Document summary
            keywords: Document keywords
            
        Returns:
            Response with answer and metadata
        """
        try:
            # Build context
            context = retrieval_service.build_context_prompt(
                chunks=chunks,
                summary=summary,
                keywords=keywords
            )
            
            # Generate answer with Groq
            result = groq_client.generate_answer(
                query=query,
                context=context,
                summary=summary,
                keywords=keywords
            )
            
            # Format response
            response = {
                "answer": result["answer"],
                "sources": self._extract_sources(chunks),
                "similarity_scores": [c.get("similarity_score", 0) for c in chunks],
                "model": result.get("model", ""),
                "tokens_used": result.get("tokens_used", 0)
            }
            
            return response
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise
    
    @staticmethod
    def _extract_sources(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract source information from chunks
        
        Args:
            chunks: Retrieved chunks
            
        Returns:
            List of source information
        """
        sources = []
        for chunk in chunks[:3]:  # Limit to top 3 sources
            sources.append({
                "text": chunk.get("text", "")[:200],  # First 200 chars
                "score": chunk.get("similarity_score", 0),
                "chunk_index": chunk.get("chunk_index", 0)
            })
        return sources


chat_service = ChatService()
