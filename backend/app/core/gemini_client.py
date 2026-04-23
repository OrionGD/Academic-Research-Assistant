"""
Gemini API client for embeddings and analytics
"""
import logging
from typing import List, Dict, Any
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=settings.gemini_api_key)


class GeminiClient:
    """Client for Gemini API operations"""
    
    def __init__(self):
        self.embedding_model = settings.gemini_embedding_model
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using Gemini API
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector as list of floats
        """
        try:
            response = genai.embed_content(
                model=self.embedding_model,
                content=text
            )
            return response['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        for text in texts:
            try:
                embedding = self.generate_embedding(text)
                embeddings.append(embedding)
            except Exception as e:
                logger.error(f"Error embedding text: {str(e)}")
                embeddings.append(None)
        return embeddings
    
    def analyze_document(self, chunks: List[str], title: str = "Document") -> Dict[str, Any]:
        """
        Analyze document and generate summary, keywords, and topics
        
        Args:
            chunks: List of text chunks from the document
            title: Document title
            
        Returns:
            Dictionary with analytics data
        """
        try:
            # Combine chunks for analysis
            combined_text = " ".join(chunks[:10])  # Use first 10 chunks
            
            # Generate summary
            summary_prompt = f"""
            Please analyze this academic document and provide a concise summary (2-3 sentences):
            
            {combined_text[:2000]}
            """
            
            summary_response = self.model.generate_content(summary_prompt)
            summary = summary_response.text if summary_response else "Summary not available"
            
            # Extract keywords
            keywords_prompt = f"""
            Extract the top 10 keywords from this academic document. Return only the keywords separated by commas:
            
            {combined_text[:2000]}
            """
            
            keywords_response = self.model.generate_content(keywords_prompt)
            keywords = [kw.strip() for kw in keywords_response.text.split(",")] if keywords_response else []
            
            # Extract topics
            topics_prompt = f"""
            What are the main topics covered in this academic document? List them as separate items:
            
            {combined_text[:2000]}
            """
            
            topics_response = self.model.generate_content(topics_prompt)
            topics = topics_response.text.split("\n") if topics_response else []
            
            # Calculate reading time (rough estimate: 200 words per minute)
            total_words = sum(len(chunk.split()) for chunk in chunks)
            reading_time = max(1, round(total_words / 200))
            
            return {
                "summary": summary,
                "keywords": keywords[:10],
                "topics": [t.strip() for t in topics if t.strip()][:5],
                "reading_time": reading_time,
                "chunk_count": len(chunks),
                "total_words": total_words
            }
        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            return {
                "summary": "Analysis failed",
                "keywords": [],
                "topics": [],
                "reading_time": 0,
                "chunk_count": len(chunks),
                "total_words": sum(len(chunk.split()) for chunk in chunks)
            }


gemini_client = GeminiClient()
