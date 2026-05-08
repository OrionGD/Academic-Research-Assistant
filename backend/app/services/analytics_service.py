"""
Analytics service - handles document analysis and insights
"""
import logging
from typing import Dict, Any, List
from app.core.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for document analytics"""
    
    async def analyze_document(
        self,
        chunks: List[str],
        document_title: str = "Document"
    ) -> Dict[str, Any]:
        """
        Generate analytics for document
        
        Args:
            chunks: List of document chunks
            document_title: Document title
            
        Returns:
            Analytics dictionary
        """
        try:
            analytics = gemini_client.analyze_document(chunks, document_title)
            return analytics
        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            return {
                "summary": "Analysis unavailable",
                "keywords": [],
                "topics": [],
                "reading_time": 0,
                "chunk_count": len(chunks),
                "total_words": sum(len(chunk.split()) for chunk in chunks)
            }


analytics_service = AnalyticsService()
