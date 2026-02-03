"""
Chat service for RAG conversations
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
import uuid
import json
from openai import OpenAI

from app.services.search_service import SearchService
from app.core.config import settings


class ChatService:
    def __init__(self):
        self.search_service = SearchService()
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.chat_model = settings.OPENAI_CHAT_MODEL
    
    async def process_chat_query(
        self,
        query: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Process chat query with RAG"""
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Search for relevant chunks
        search_results = await self.search_service.hybrid_search(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            top_k=5
        )
        
        # Prepare context from search results
        context = self._prepare_context(search_results)
        
        # Generate response using OpenAI
        response = await self._generate_response(query, context)
        
        # Extract sources
        sources = self._extract_sources(search_results)
        
        return {
            "conversation_id": conversation_id,
            "query": query,
            "response": response,
            "sources": sources,
            "context_chunks": [
                {
                    "content": result["content"][:200] + "...",
                    "similarity": result.get("similarity"),
                    "document_title": result.get("metadata", {}).get("document_title")
                }
                for result in search_results[:3]
            ]
        }
    
    async def stream_chat_response(
        self,
        query: str,
        user_id: str,
        conversation_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response"""
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Search for relevant chunks
        search_results = await self.search_service.hybrid_search(
            query=query,
            user_id=user_id,
            document_ids=document_ids,
            top_k=5
        )
        
        # Prepare context
        context = self._prepare_context(search_results)
        
        # Stream response
        messages = [
            {"role": "system", "content": self._get_system_prompt(context)},
            {"role": "user", "content": query}
        ]
        
        try:
            stream = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=1000
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
            
            # Send sources
            sources = self._extract_sources(search_results)
            yield f"data: {json.dumps({'sources': sources, 'conversation_id': conversation_id})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    def _prepare_context(self, search_results: List[Dict[str, Any]]) -> str:
        """Prepare context from search results"""
        context_parts = []
        
        for i, result in enumerate(search_results[:5]):  # Use top 5 results
            content = result.get("content", "")
            metadata = result.get("metadata", {})
            title = metadata.get("document_title", "Unknown")
            
            context_parts.append(f"[Source {i+1} from '{title}']:\n{content}\n")
        
        return "\n".join(context_parts)
    
    def _get_system_prompt(self, context: str) -> str:
        """Get system prompt for chat"""
        return f"""You are a helpful research assistant. Use the following context to answer the user's question. 
If the answer cannot be found in the context, say "I don't have enough information to answer that question based on the provided documents."

Context:
{context}

Guidelines:
1. Be precise and factual
2. Cite sources when possible (e.g., "According to Source 1...")
3. If the question is ambiguous, ask for clarification
4. Keep responses concise but informative"""
    
    async def _generate_response(self, query: str, context: str) -> str:
        """Generate response using OpenAI"""
        messages = [
            {"role": "system", "content": self._get_system_prompt(context)},
            {"role": "user", "content": query}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"
    
    def _extract_sources(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract source information from search results"""
        sources = []
        
        for result in search_results[:3]:  # Limit to top 3 sources
            metadata = result.get("metadata", {})
            sources.append({
                "document_title": metadata.get("document_title", "Unknown"),
                "content_preview": result.get("content", "")[:150] + "...",
                "similarity": result.get("similarity"),
                "chunk_index": metadata.get("chunk_index")
            })
        
        return sources