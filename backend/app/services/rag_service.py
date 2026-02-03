"""
RAG Service - Implements Retrieval-Augmented Generation pipeline.
Coordinates document retrieval, context assembly, prompt engineering, and response generation.
"""

import logging
import re
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.database import Document, DocumentChunk
from app.models.schemas import SearchRequest, SearchResult, MessageRole
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.llm_service import LLMService
from app.utils.text_utils import TextUtils

logger = logging.getLogger(__name__)


@dataclass
class RAGConfig:
    """Configuration for RAG pipeline"""
    top_k: int = 5
    min_similarity: float = 0.7
    context_window_tokens: int = 4000
    max_context_chunks: int = 10
    include_sources: bool = True
    include_similarity_scores: bool = False
    rerank_results: bool = True
    temperature: float = 0.7
    max_tokens: int = 1000


@dataclass
class RAGResponse:
    """RAG pipeline response"""
    answer: str
    sources: List[Dict[str, Any]]
    context: str
    metadata: Dict[str, Any]
    search_results: List[SearchResult]
    processing_time_ms: float


class PromptTemplates:
    """Collection of prompt templates for different tasks"""
    
    @staticmethod
    def get_qa_template(context: str, question: str, include_sources: bool = True) -> str:
        """Get template for Q&A task"""
        source_instruction = ""
        if include_sources:
            source_instruction = """
IMPORTANT: You MUST cite your sources at the end of your answer. 
For each piece of information, include the source number in brackets like [1], [2], etc.
If you're combining information from multiple sources, cite all relevant sources like [1][2].
Only cite sources that you actually used in your answer.
"""
        
        return f"""You are a helpful assistant that answers questions based on the provided context.
{source_instruction}

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information, say "I don't have enough information to answer this question based on the provided documents."
3. Do not make up information or use outside knowledge
4. Provide a clear, concise answer
5. Format your answer in a readable way
6. If applicable, break down complex answers into bullet points or numbered steps

ANSWER:"""
    
    @staticmethod
    def get_summarization_template(context: str, query: Optional[str] = None) -> str:
        """Get template for summarization task"""
        if query:
            return f"""Based on the following documents, provide a summary that addresses: {query}

DOCUMENTS:
{context}

Provide a comprehensive summary that:
1. Covers the main points from all relevant documents
2. Organizes information logically
3. Highlights key findings or conclusions
4. Is concise but thorough

SUMMARY:"""
        else:
            return f"""Please provide a comprehensive summary of the following documents:

DOCUMENTS:
{context}

SUMMARY GUIDELINES:
1. Identify the main topic or purpose
2. Extract key points and supporting details
3. Note any conclusions or recommendations
4. Organize information in a logical flow
5. Keep the summary concise but informative

SUMMARY:"""
    
    @staticmethod
    def get_comparison_template(context: str, items_to_compare: List[str]) -> str:
        """Get template for comparison task"""
        items_str = ", ".join(items_to_compare)
        return f"""Compare and contrast the following items based on the provided documents: {items_str}

DOCUMENTS:
{context}

Provide a comparison that:
1. Identifies similarities between the items
2. Highlights differences
3. Organizes information in a clear structure (e.g., table or bullet points)
4. Cites specific details from the documents

COMPARISON:"""
    
    @staticmethod
    def get_extraction_template(context: str, extraction_type: str) -> str:
        """Get template for information extraction task"""
        return f"""Extract {extraction_type} from the following documents:

DOCUMENTS:
{context}

Extract all relevant {extraction_type} and present them in a structured format (e.g., list, table, or JSON).
Include only information that is explicitly stated in the documents.

EXTRACTED {extraction_type.upper()}:"""


class RAGService:
    """Service for Retrieval-Augmented Generation operations"""
    
    def __init__(
        self,
        db: Session,
        embedding_service: EmbeddingService,
        vector_service: VectorService,
        llm_service: LLMService,
        config: Optional[RAGConfig] = None
    ):
        self.db = db
        self.embedding_service = embedding_service
        self.vector_service = vector_service
        self.llm_service = llm_service
        self.config = config or RAGConfig()
        self.text_utils = TextUtils()
        
    async def query(
        self,
        question: str,
        user_id: Optional[int] = None,
        document_ids: Optional[List[int]] = None,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> RAGResponse:
        """
        Main RAG pipeline: retrieve relevant documents and generate answer.
        
        Args:
            question: User's question
            user_id: Optional user ID for filtering documents
            document_ids: Optional list of specific document IDs to search
            conversation_context: Optional previous messages for context
            **kwargs: Additional parameters to override config
        
        Returns:
            RAGResponse with answer and sources
        """
        import time
        start_time = time.time()
        
        # Override config with kwargs
        config = self._merge_config_with_kwargs(kwargs)
        
        try:
            # Step 1: Generate query embedding
            embedding_start = time.time()
            query_embedding_result = self.embedding_service.generate_embedding(question)
            embedding_time = (time.time() - embedding_start) * 1000
            
            # Step 2: Retrieve relevant chunks
            retrieval_start = time.time()
            search_filters = {}
            if document_ids:
                search_filters['document_ids'] = document_ids
            if user_id:
                # Get user's accessible documents
                user_docs = self.db.query(Document.id).filter(
                    Document.user_id == user_id,
                    Document.processed.is_(True)
                ).all()
                doc_ids = [doc.id for doc in user_docs]
                if 'document_ids' in search_filters:
                    # Intersection of provided IDs and user's accessible IDs
                    search_filters['document_ids'] = list(
                        set(search_filters['document_ids']) & set(doc_ids)
                    )
                else:
                    search_filters['document_ids'] = doc_ids
            
            search_results, search_metrics = self.vector_service.search_similar(
                query_embedding=query_embedding_result.embedding,
                k=config.top_k,
                filters=search_filters if search_filters else None,
                min_similarity=config.min_similarity,
                ranking_algorithm="hybrid" if config.rerank_results else "similarity"
            )
            retrieval_time = (time.time() - retrieval_start) * 1000
            
            # Convert to SearchResult objects
            search_result_objects = []
            for result in search_results:
                search_result_objects.append(SearchResult(
                    chunk_id=result.chunk_id,
                    document_id=result.document_id,
                    document_title=result.document_title,
                    content=result.content,
                    similarity_score=result.normalized_score,
                    chunk_index=result.chunk_index,
                    metadata=result.metadata
                ))
            
            # Step 3: Assemble context
            context_start = time.time()
            context, sources = self._assemble_context(
                search_result_objects,
                config.context_window_tokens,
                config.max_context_chunks
            )
            context_time = (time.time() - context_start) * 1000
            
            # Step 4: Generate answer using LLM
            generation_start = time.time()
            
            # Prepare prompt
            prompt = PromptTemplates.get_qa_template(
                context=context,
                question=question,
                include_sources=config.include_sources
            )
            
            # Add conversation context if provided
            if conversation_context:
                conversation_text = self._format_conversation_context(conversation_context)
                prompt = f"Previous conversation:\n{conversation_text}\n\n{prompt}"
            
            # Generate response
            llm_response = await self.llm_service.generate_response(
                prompt=prompt,
                temperature=config.temperature,
                max_tokens=config.max_tokens
            )
            generation_time = (time.time() - generation_start) * 1000
            
            # Extract answer and ensure source citations
            answer = self._extract_answer(llm_response, sources if config.include_sources else [])
            
            # Step 5: Prepare response
            total_time = (time.time() - start_time) * 1000
            
            metadata = {
                'query_embedding_time_ms': embedding_time,
                'retrieval_time_ms': retrieval_time,
                'context_assembly_time_ms': context_time,
                'generation_time_ms': generation_time,
                'total_time_ms': total_time,
                'config': {
                    'top_k': config.top_k,
                    'min_similarity': config.min_similarity,
                    'context_window_tokens': config.context_window_tokens,
                    'max_context_chunks': config.max_context_chunks,
                    'rerank_results': config.rerank_results
                },
                'search_metrics': search_metrics.to_dict()
            }
            
            response = RAGResponse(
                answer=answer,
                sources=sources,
                context=context,
                metadata=metadata,
                search_results=search_result_objects,
                processing_time_ms=total_time
            )
            
            logger.info(f"RAG query completed in {total_time:.2f}ms")
            return response
            
        except Exception as e:
            logger.error(f"Error in RAG pipeline: {str(e)}")
            raise
    
    def _merge_config_with_kwargs(self, kwargs: Dict[str, Any]) -> RAGConfig:
        """Merge config with override kwargs"""
        config_dict = self.config.__dict__.copy()
        
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                config_dict[key] = value
        
        return RAGConfig(**config_dict)
    
    def _assemble_context(
        self,
        search_results: List[SearchResult],
        max_tokens: int,
        max_chunks: int
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Assemble context from search results, respecting token limits.
        
        Args:
            search_results: List of search results
            max_tokens: Maximum tokens for context
            max_chunks: Maximum number of chunks to include
        
        Returns:
            Tuple of (context string, sources list)
        """
        if not search_results:
            return "No relevant documents found.", []
        
        # Sort by similarity score (higher is better)
        sorted_results = sorted(search_results, key=lambda x: x.similarity_score, reverse=True)
        
        context_parts = []
        sources = []
        total_tokens = 0
        
        for i, result in enumerate(sorted_results[:max_chunks]):
            # Estimate tokens for this chunk
            chunk_tokens = self.text_utils.estimate_tokens(result.content)
            
            # Check if adding this chunk would exceed token limit
            if total_tokens + chunk_tokens > max_tokens:
                break
            
            # Add chunk to context
            context_parts.append(f"[Document {i+1}: {result.document_title}]\n{result.content}")
            
            # Add to sources
            source_info = {
                'document_id': result.document_id,
                'document_title': result.document_title,
                'chunk_id': result.chunk_id,
                'chunk_index': result.chunk_index,
                'similarity_score': result.similarity_score,
                'position': i + 1
            }
            sources.append(source_info)
            
            total_tokens += chunk_tokens
        
        context = "\n\n".join(context_parts)
        return context, sources
    
    def _format_conversation_context(self, conversation: List[Dict[str, Any]]) -> str:
        """Format conversation history for context"""
        formatted = []
        
        for message in conversation[-5:]:  # Last 5 messages
            role = message.get('role', 'user')
            content = message.get('content', '')
            
            if role == MessageRole.USER:
                formatted.append(f"User: {content}")
            elif role == MessageRole.ASSISTANT:
                formatted.append(f"Assistant: {content}")
            elif role == MessageRole.SYSTEM:
                formatted.append(f"System: {content}")
        
        return "\n".join(formatted)
    
    def _extract_answer(self, llm_response: str, sources: List[Dict[str, Any]]) -> str:
        """
        Extract and format answer from LLM response.
        Ensures source citations are properly formatted.
        """
        # Clean up the response
        answer = llm_response.strip()
        
        # If no sources, return as-is
        if not sources:
            return answer
        
        # Check if answer already contains citations
        if re.search(r'\[\d+\]', answer):
            return answer
        
        # Add source citations if they're missing but we have sources
        sources_text = "\n\nSources:\n"
        for source in sources:
            sources_text += f"[{source['position']}] {source['document_title']}\n"
        
        return answer + sources_text
    
    async def summarize_documents(
        self,
        document_ids: List[int],
        query: Optional[str] = None,
        user_id: Optional[int] = None,
        **kwargs
    ) -> RAGResponse:
        """
        Generate a summary of specified documents.
        
        Args:
            document_ids: List of document IDs to summarize
            query: Optional focus for the summary
            user_id: Optional user ID for access control
            **kwargs: Additional parameters
        
        Returns:
            RAGResponse with summary
        """
        import time
        start_time = time.time()
        
        config = self._merge_config_with_kwargs(kwargs)
        
        try:
            # Verify user has access to documents
            if user_id:
                accessible_docs = self.db.query(Document.id).filter(
                    Document.id.in_(document_ids),
                    Document.user_id == user_id,
                    Document.processed.is_(True)
                ).all()
                accessible_ids = [doc.id for doc in accessible_docs]
                
                if not accessible_ids:
                    raise ValueError("No accessible documents found")
                
                document_ids = accessible_ids
            
            # Get all chunks from specified documents
            chunks = self.db.query(DocumentChunk).filter(
                DocumentChunk.document_id.in_(document_ids)
            ).order_by(DocumentChunk.document_id, DocumentChunk.chunk_index).all()
            
            if not chunks:
                raise ValueError("No content found in specified documents")
            
            # Assemble context from all chunks
            context_parts = []
            sources = []
            total_tokens = 0
            
            current_doc_id = None
            for chunk in chunks:
                if chunk.document_id != current_doc_id:
                    # Get document title
                    doc = self.db.query(Document).filter(Document.id == chunk.document_id).first()
                    doc_title = doc.title if doc else f"Document {chunk.document_id}"
                    context_parts.append(f"\n[Document: {doc_title}]")
                    current_doc_id = chunk.document_id
                
                # Add chunk
                chunk_tokens = self.text_utils.estimate_tokens(chunk.content)
                if total_tokens + chunk_tokens > config.context_window_tokens:
                    break
                
                context_parts.append(chunk.content)
                total_tokens += chunk_tokens
            
            context = "\n".join(context_parts)
            
            # Generate summary using LLM
            prompt = PromptTemplates.get_summarization_template(context, query)
            
            llm_response = await self.llm_service.generate_response(
                prompt=prompt,
                temperature=config.temperature,
                max_tokens=config.max_tokens
            )
            
            total_time = (time.time() - start_time) * 1000
            
            # Create response
            response = RAGResponse(
                answer=llm_response.strip(),
                sources=[],  # For summarization, we might not want individual sources
                context=context[:1000] + "..." if len(context) > 1000 else context,
                metadata={
                    'processing_time_ms': total_time,
                    'document_count': len(set(doc.id for doc in chunks)),
                    'total_chunks': len(chunks),
                    'query': query
                },
                search_results=[],  # No search results for direct summarization
                processing_time_ms=total_time
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error summarizing documents: {str(e)}")
            raise
    
    async def extract_information(
        self,
        question: str,
        extraction_type: str,
        user_id: Optional[int] = None,
        **kwargs
    ) -> RAGResponse:
        """
        Extract specific information from documents.
        
        Args:
            question: Question specifying what to extract
            extraction_type: Type of information to extract (e.g., "names", "dates", "keywords")
            user_id: Optional user ID for access control
            **kwargs: Additional parameters
        
        Returns:
            RAGResponse with extracted information
        """
        # Use the main query method first
        rag_response = await self.query(
            question=question,
            user_id=user_id,
            **kwargs
        )
        
        # Then extract specific information
        prompt = PromptTemplates.get_extraction_template(
            context=rag_response.context,
            extraction_type=extraction_type
        )
        
        llm_response = await self.llm_service.generate_response(
            prompt=prompt,
            temperature=kwargs.get('temperature', 0.3),  # Lower temperature for extraction
            max_tokens=kwargs.get('max_tokens', 500)
        )
        
        # Update response with extracted information
        rag_response.answer = llm_response.strip()
        rag_response.metadata['extraction_type'] = extraction_type
        
        return rag_response
    
    def get_conversation_history(
        self,
        conversation_id: Optional[int] = None,
        user_id: Optional[int] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history for RAG context.
        
        Args:
            conversation_id: Optional specific conversation ID
            user_id: User ID for filtering
            limit: Maximum number of messages to return
        
        Returns:
            List of conversation messages
        """
        # This would typically query a conversations/messages table
        # For now, return empty list - implementation depends on your database schema
        return []
    
    def save_conversation(
        self,
        user_id: int,
        question: str,
        response: RAGResponse,
        conversation_id: Optional[int] = None
    ) -> int:
        """
        Save conversation to database.
        
        Args:
            user_id: User ID
            question: User's question
            response: RAG response
            conversation_id: Optional existing conversation ID
        
        Returns:
            Conversation ID
        """
        # Implementation depends on your database schema
        # This would typically save to a conversations/messages table
        logger.info(f"Saving conversation for user {user_id}")
        
        # Return a placeholder conversation ID
        return conversation_id or 1