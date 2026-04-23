"""
Groq API client for conversational responses
"""
import logging
from typing import Dict, Any
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Client for Groq API operations"""
    
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_chat_model
    
    def generate_answer(
        self,
        query: str,
        context: str,
        summary: str = "",
        keywords: list = None
    ) -> Dict[str, Any]:
        """
        Generate answer using Groq API
        
        Args:
            query: User's question
            context: Relevant chunks from ChromaDB
            summary: Document summary
            keywords: Document keywords
            
        Returns:
            Dictionary with answer and metadata
        """
        try:
            keywords_text = ", ".join(keywords) if keywords else ""
            
            system_prompt = """You are an expert academic AI assistant. You analyze documents and provide 
            accurate, well-researched answers based on the provided context. Always cite the source 
            material and maintain academic rigor. Be concise but thorough."""
            
            user_message = f"""
Based on the following document context, please answer the user's question:

Document Summary:
{summary}

Keywords:
{keywords_text}

Relevant Content:
{context}

User Question:
{query}

Please provide a comprehensive answer based on the document content.
"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            
            answer = response.choices[0].message.content if response.choices else "No answer generated"
            
            return {
                "answer": answer,
                "model": self.model,
                "tokens_used": response.usage.completion_tokens if hasattr(response, 'usage') else 0
            }
        except Exception as e:
            logger.error(f"Error generating answer with Groq: {str(e)}")
            raise
    
    def generate_chat_response(
        self,
        messages: list,
        system_prompt: str = None
    ) -> str:
        """
        Generate response for multi-turn chat
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            system_prompt: Optional system prompt
            
        Returns:
            Generated response text
        """
        try:
            if system_prompt is None:
                system_prompt = """You are a helpful academic assistant. Provide accurate, 
                insightful responses based on the document context provided."""
            
            # Build messages with system prompt
            all_messages = [{"role": "system", "content": system_prompt}] + messages
            
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=1024,
                messages=all_messages
            )
            
            return response.choices[0].message.content if response.choices else "No response generated"
        except Exception as e:
            logger.error(f"Error in chat response: {str(e)}")
            raise


groq_client = GroqClient()
