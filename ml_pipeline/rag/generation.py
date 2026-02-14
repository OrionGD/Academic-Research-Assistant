## `ml_pipeline/rag/generation.py`

"""
Response generation with context integration and academic tone.
Handles LLM-based generation with proper citation and formatting.
"""

from typing import List, Dict, Any, Optional, Union, AsyncGenerator
from dataclasses import dataclass
import logging
import json
import asyncio
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    """Generation result with metadata."""
    response: str
    citations: List[Dict[str, Any]]
    confidence: float
    processing_time: float
    token_usage: Dict[str, int]
    model_used: str


class Generator:
    """
    Response generator for RAG pipeline.
    Handles context integration, citation tracking, and academic tone.
    """
    
    # Academic tone prompts
    ACADEMIC_SYSTEM_PROMPT = """You are an academic research assistant providing scholarly responses. 
    Your answers should:
    1. Be precise and well-structured with clear sections
    2. Use formal academic language
    3. Cite sources using [Document X] notation
    4. Acknowledge limitations and uncertainties
    5. Avoid speculation beyond the provided context
    6. Use appropriate academic terminology
    7. Provide balanced perspectives when multiple viewpoints exist
    8. Include references to specific parts of the source material"""
    
    def __init__(
        self,
        llm,
        citation_extractor,
        max_response_length: int = 2048,
        temperature: float = 0.3,  # Lower temperature for academic precision
        include_citations: bool = True,
        academic_tone: bool = True
    ):
        """
        Initialize generator.
        
        Args:
            llm: LLM instance for generation
            citation_extractor: Citation extractor instance
            max_response_length: Maximum response length
            temperature: Generation temperature
            include_citations: Whether to include citations
            academic_tone: Whether to use academic tone
        """
        self.llm = llm
        self.citation_extractor = citation_extractor
        self.max_response_length = max_response_length
        self.temperature = temperature
        self.include_citations = include_citations
        self.academic_tone = academic_tone
        
        logger.info("Initialized Generator")
    
    async def generate(
        self,
        query: str,
        retrieved_docs: List,
        conversation_history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        **kwargs
    ) -> GenerationResult:
        """
        Generate response based on retrieved documents.
        
        Args:
            query: User query
            retrieved_docs: Retrieved documents
            conversation_history: Optional conversation history
            system_prompt: Optional custom system prompt
            **kwargs: Additional parameters
            
        Returns:
            Generation result with response and citations
        """
        start_time = datetime.now()
        
        # Prepare context
        context = self._prepare_context(retrieved_docs)
        
        # Prepare messages
        messages = self._prepare_messages(
            query=query,
            context=context,
            conversation_history=conversation_history,
            system_prompt=system_prompt
        )
        
        # Estimate token usage
        input_tokens = self.llm.count_message_tokens(messages)
        
        # Generate response
        response_text = await self.llm.chat_async(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_response_length,
            **kwargs
        )
        
        # Extract citations
        citations = []
        if self.include_citations:
            citations = await self.citation_extractor.extract_citations(
                response_text,
                retrieved_docs
            )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Estimate output tokens
        output_tokens = self.llm.count_tokens(response_text)
        
        # Create result
        result = GenerationResult(
            response=response_text,
            citations=citations,
            confidence=self._calculate_confidence(response_text, retrieved_docs),
            processing_time=processing_time,
            token_usage={
                "input": input_tokens,
                "output": output_tokens,
                "total": input_tokens + output_tokens
            },
            model_used=getattr(self.llm, "model", "unknown")
        )
        
        logger.info(f"Generated response in {processing_time:.2f}s with {len(citations)} citations")
        return result
    
    async def stream_generate(
        self,
        query: str,
        retrieved_docs: List,
        conversation_history: Optional[List[Dict]] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream generation with real-time output.
        
        Args:
            query: User query
            retrieved_docs: Retrieved documents
            conversation_history: Optional conversation history
            **kwargs: Additional parameters
            
        Yields:
            Response chunks
        """
        # Prepare context
        context = self._prepare_context(retrieved_docs)
        
        # Prepare messages
        messages = self._prepare_messages(
            query=query,
            context=context,
            conversation_history=conversation_history
        )
        
        # Stream response
        async for chunk in self.llm.stream_chat(
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_response_length,
            **kwargs
        ):
            yield chunk
    
    def _prepare_context(self, retrieved_docs: List) -> str:
        """
        Prepare context string from retrieved documents.
        
        Args:
            retrieved_docs: Retrieved documents
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        for i, doc in enumerate(retrieved_docs, 1):
            # Extract document info
            doc_text = doc.text if hasattr(doc, 'text') else doc.get('text', '')
            doc_id = doc.document_id if hasattr(doc, 'document_id') else doc.get('document_id', f'doc_{i}')
            
            # Format with document marker
            context_parts.append(f"[Document {i} - ID: {doc_id}]")
            context_parts.append(doc_text)
            context_parts.append("")  # Empty line for separation
        
        return "\n".join(context_parts)
    
    def _prepare_messages(
        self,
        query: str,
        context: str,
        conversation_history: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """
        Prepare messages for LLM.
        
        Args:
            query: User query
            context: Context string
            conversation_history: Optional conversation history
            system_prompt: Optional custom system prompt
            
        Returns:
            List of messages
        """
        messages = []
        
        # System message
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        elif self.academic_tone:
            messages.append({"role": "system", "content": self.ACADEMIC_SYSTEM_PROMPT})
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Construct user message with context and query
        user_message = self._construct_user_message(query, context)
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def _construct_user_message(self, query: str, context: str) -> str:
        """
        Construct user message with context and instructions.
        
        Args:
            query: User query
            context: Context string
            
        Returns:
            Formatted user message
        """
        message_parts = [
            "Please answer the following question based on the provided context documents.",
            "",
            "Context:",
            context,
            "",
            "Question:",
            query,
            "",
            "Instructions:",
            "- Base your answer only on the information in the context documents",
            "- If the context doesn't contain the answer, say so clearly",
            "- Cite the relevant document numbers using [Document X] notation",
            "- Provide a comprehensive and well-structured answer",
            "- Use academic language and maintain objectivity"
        ]
        
        if self.include_citations:
            message_parts.append("- Ensure proper citation of sources")
        
        return "\n".join(message_parts)
    
    def _calculate_confidence(self, response: str, retrieved_docs: List) -> float:
        """
        Calculate confidence score for the generated response.
        
        Args:
            response: Generated response
            retrieved_docs: Retrieved documents
            
        Returns:
            Confidence score between 0 and 1
        """
        confidence = 1.0
        
        # Check for uncertainty indicators
        uncertainty_phrases = [
            "i'm not sure", "i don't know", "uncertain",
            "may not be accurate", "might be", "possibly",
            "could be", "perhaps", "i think"
        ]
        
        response_lower = response.lower()
        for phrase in uncertainty_phrases:
            if phrase in response_lower:
                confidence *= 0.9
        
        # Check if response acknowledges missing information
        if "doesn't contain the answer" in response_lower:
            confidence *= 0.7
        
        # Check citation coverage
        citation_count = len(re.findall(r'\[Document \d+\]', response))
        if citation_count == 0 and len(retrieved_docs) > 0:
            confidence *= 0.8
        
        return round(confidence, 2)
    
    def format_academic_response(
        self,
        response: str,
        citations: List[Dict],
        include_metadata: bool = True
    ) -> str:
        """
        Format response with academic styling and metadata.
        
        Args:
            response: Generated response
            citations: Extracted citations
            include_metadata: Whether to include metadata
            
        Returns:
            Formatted academic response
        """
        formatted = response
        
        if include_metadata and citations:
            # Add references section
            formatted += "\n\n## References\n"
            
            for i, citation in enumerate(citations, 1):
                doc_info = citation.get('document', {})
                formatted += f"{i}. {doc_info.get('title', 'Unknown')} "
                formatted += f"[{citation.get('relevance', 'general')}]"
                formatted += "\n"
        
        return formatted
