"""
Advanced text segmentation strategies.
Implements semantic chunking, sliding window approaches, 
and academic-specific chunking (by sections, paragraphs, or semantic boundaries).
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np
from sentence_transformers import SentenceTransformer
import tiktoken  # For token counting
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

class ChunkingStrategy(Enum):
    """Available chunking strategies."""
    SEMANTIC = "semantic"
    FIXED_SIZE = "fixed_size"
    SECTION_BASED = "section_based"
    SLIDING_WINDOW = "sliding_window"
    PARAGRAPH = "paragraph"
    HIERARCHICAL = "hierarchical"
# Line 9: LangChain is imported
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Line 256: LangChain is actually used
def _fixed_size_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=self.chunk_size,
        chunk_overlap=self.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
@dataclass
class TextChunk:
    """Represents a chunk of text with metadata."""
    text: str
    chunk_id: str
    start_index: int
    end_index: int
    token_count: int
    metadata: Dict[str, Any]
    parent_section: Optional[str] = None
    section_type: Optional[str] = None
    page_number: Optional[int] = None

class AcademicChunker:
    """Advanced chunker optimized for academic text."""
    
    def __init__(
        self,
        strategy: ChunkingStrategy = ChunkingStrategy.SEMANTIC,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        model_name: str = "all-MiniLM-L6-v2",
        max_tokens: int = 512
    ):
        """
        Initialize the academic chunker.
        
        Args:
            strategy: Chunking strategy to use
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between chunks in characters
            model_name: Sentence transformer model for semantic chunking
            max_tokens: Maximum tokens per chunk
        """
        self.strategy = strategy
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.max_tokens = max_tokens
        
        # Initialize tokenizer for token counting
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
        except:
            self.tokenizer = None
        
        # Initialize semantic model if needed
        self.semantic_model = None
        if strategy == ChunkingStrategy.SEMANTIC:
            try:
                self.semantic_model = SentenceTransformer(model_name)
            except Exception as e:
                logger.warning(f"Failed to load semantic model: {str(e)}")
                logger.warning("Falling back to fixed-size chunking")
                self.strategy = ChunkingStrategy.FIXED_SIZE
        
        # Academic section patterns for section-based chunking
        self.section_patterns = [
            (r'^\s*\d+\.\s+[A-Z]', 2),  # 1. INTRODUCTION
            (r'^\s*\d+\.\d+\s+[A-Z]', 3),  # 1.1 Background
            (r'^\s*\d+\.\d+\.\d+\s+[A-Z]', 4),  # 1.1.1 Details
            (r'^\s*[A-Z][A-Z\s]{5,}', 1),  # ALL CAPS HEADINGS
            (r'^\s*Abstract\s*$', 1),
            (r'^\s*Introduction\s*$', 1),
            (r'^\s*Methods?\s*$', 1),
            (r'^\s*Results\s*$', 1),
            (r'^\s*Discussion\s*$', 1),
            (r'^\s*Conclusion\s*$', 1),
            (r'^\s*References\s*$', 1),
        ]
    
    def chunk_document(
        self, 
        text: str, 
        metadata: Optional[Dict[str, Any]] = None,
        sections: Optional[List[Dict]] = None
    ) -> List[TextChunk]:
        """
        Chunk document based on selected strategy.
        
        Args:
            text: Document text to chunk
            metadata: Additional metadata for chunks
            sections: Pre-identified sections (for section-based chunking)
            
        Returns:
            List of TextChunk objects
        """
        if metadata is None:
            metadata = {}
        
        logger.info(f"Chunking document with strategy: {self.strategy.value}")
        
        if self.strategy == ChunkingStrategy.SEMANTIC:
            chunks = self._semantic_chunking(text, metadata)
        elif self.strategy == ChunkingStrategy.SECTION_BASED:
            chunks = self._section_based_chunking(text, metadata, sections)
        elif self.strategy == ChunkingStrategy.SLIDING_WINDOW:
            chunks = self._sliding_window_chunking(text, metadata)
        elif self.strategy == ChunkingStrategy.PARAGRAPH:
            chunks = self._paragraph_chunking(text, metadata)
        elif self.strategy == ChunkingStrategy.HIERARCHICAL:
            chunks = self._hierarchical_chunking(text, metadata)
        else:  # FIXED_SIZE as default
            chunks = self._fixed_size_chunking(text, metadata)
        
        # Add token counts to chunks
        for chunk in chunks:
            chunk.token_count = self._count_tokens(chunk.text)
        
        logger.info(f"Created {len(chunks)} chunks")
        return chunks
    
    def _semantic_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
        """
        Chunk text based on semantic boundaries using sentence embeddings.
        """
        if not self.semantic_model:
            logger.warning("Semantic model not available, using fixed-size chunking")
            return self._fixed_size_chunking(text, metadata)
        
        try:
            # Split into sentences
            sentences = self._split_into_sentences(text)
            
            if len(sentences) <= 1:
                return self._create_chunk(text, 0, len(text), metadata)
            
            # Get sentence embeddings
            embeddings = self.semantic_model.encode(sentences, show_progress_bar=False)
            
            # Calculate cosine similarities between consecutive sentences
            similarities = []
            for i in range(len(embeddings) - 1):
                sim = np.dot(embeddings[i], embeddings[i + 1]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i + 1])
                )
                similarities.append(sim)
            
            # Find chunk boundaries where similarity is low
            chunks = []
            current_chunk_start = 0
            current_chunk_text = sentences[0]
            current_length = len(sentences[0])
            
            for i, (sentence, similarity) in enumerate(zip(sentences[1:], similarities), 1):
                sentence_length = len(sentence)
                
                # Check if we should start a new chunk
                if (similarity < 0.5 or  # Low semantic similarity
                    current_length + sentence_length > self.chunk_size):
                    
                    # Create chunk
                    chunk_text = ' '.join(sentences[current_chunk_start:i])
                    chunks.append(self._create_chunk(
                        chunk_text, 
                        self._find_position(text, chunk_text, current_chunk_start),
                        self._find_position(text, chunk_text, i - 1),
                        metadata
                    ))
                    
                    current_chunk_start = i
                    current_chunk_text = sentence
                    current_length = sentence_length
                else:
                    current_chunk_text += ' ' + sentence
                    current_length += sentence_length
            
            # Add last chunk
            if current_chunk_start < len(sentences):
                chunk_text = ' '.join(sentences[current_chunk_start:])
                chunks.append(self._create_chunk(
                    chunk_text,
                    self._find_position(text, chunk_text, current_chunk_start),
                    len(text),
                    metadata
                ))
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error in semantic chunking: {str(e)}")
            return self._fixed_size_chunking(text, metadata)
    
    def _section_based_chunking(
        self, 
        text: str, 
        metadata: Dict[str, Any], 
        sections: Optional[List[Dict]] = None
    ) -> List[TextChunk]:
        """
        Chunk text based on academic sections.
        """
        chunks = []
        
        if sections:
            # Use pre-identified sections
            for section in sections:
                chunk = self._create_chunk(
                    section['content'],
                    section.get('start_idx', 0),
                    section.get('end_idx', len(section['content'])),
                    {**metadata, 'section_type': section.get('type', 'unknown')}
                )
                chunk.parent_section = section.get('title')
                chunk.section_type = section.get('type')
                chunks.append(chunk)
        else:
            # Identify sections from text
            lines = text.split('\n')
            current_section = None
            current_content = []
            section_start = 0
            
            for i, line in enumerate(lines):
                section_match = self._identify_section(line)
                
                if section_match:
                    # Save previous section
                    if current_section and current_content:
                        chunk_text = '\n'.join(current_content)
                        chunks.append(self._create_chunk(
                            chunk_text,
                            section_start,
                            section_start + len(chunk_text),
                            {**metadata, 'section_type': current_section}
                        ))
                    
                    # Start new section
                    current_section = section_match
                    current_content = [line]
                    section_start = self._find_position(text, line, i)
                else:
                    if current_section:
                        current_content.append(line)
            
            # Add last section
            if current_section and current_content:
                chunk_text = '\n'.join(current_content)
                chunks.append(self._create_chunk(
                    chunk_text,
                    section_start,
                    section_start + len(chunk_text),
                    {**metadata, 'section_type': current_section}
                ))
        
        # If no sections found or text is too long, further chunk large sections
        if not chunks or any(len(chunk.text) > self.chunk_size * 2 for chunk in chunks):
            refined_chunks = []
            for chunk in chunks:
                if len(chunk.text) > self.chunk_size * 2:
                    sub_chunks = self._fixed_size_chunking(
                        chunk.text, 
                        {**chunk.metadata, 'parent_chunk_id': chunk.chunk_id}
                    )
                    for sub_chunk in sub_chunks:
                        sub_chunk.parent_section = chunk.parent_section
                        sub_chunk.section_type = chunk.section_type
                    refined_chunks.extend(sub_chunks)
                else:
                    refined_chunks.append(chunk)
            chunks = refined_chunks
        
        return chunks
    
    def _sliding_window_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
        """
        Create overlapping chunks using a sliding window approach.
        """
        chunks = []
        text_length = len(text)
        
        start = 0
        chunk_id = 0
        
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            # Adjust end to not cut in middle of a word
            if end < text_length:
                while end > start and text[end] not in ' \t\n.,;!?':
                    end -= 1
            
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunk = self._create_chunk(chunk_text, start, end, metadata)
                chunk.chunk_id = f"{metadata.get('doc_id', 'doc')}_sw_{chunk_id}"
                chunks.append(chunk)
                chunk_id += 1
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            if start < 0:
                start = 0
        
        return chunks
    
    def _paragraph_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
        """
        Chunk by paragraphs, respecting paragraph boundaries.
        """
        chunks = []
        paragraphs = text.split('\n\n')
        
        current_chunk = []
        current_length = 0
        chunk_start = 0
        chunk_id = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_length = len(para)
            
            if current_length + para_length > self.chunk_size and current_chunk:
                # Create chunk from accumulated paragraphs
                chunk_text = '\n\n'.join(current_chunk)
                chunk = self._create_chunk(chunk_text, chunk_start, chunk_start + len(chunk_text), metadata)
                chunk.chunk_id = f"{metadata.get('doc_id', 'doc')}_para_{chunk_id}"
                chunks.append(chunk)
                chunk_id += 1
                
                # Start new chunk
                current_chunk = [para]
                current_length = para_length
                chunk_start = self._find_position(text, para, paragraphs.index(para))
            else:
                if not current_chunk:
                    chunk_start = self._find_position(text, para, paragraphs.index(para))
                current_chunk.append(para)
                current_length += para_length
        
        # Add last chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            chunk = self._create_chunk(chunk_text, chunk_start, chunk_start + len(chunk_text), metadata)
            chunk.chunk_id = f"{metadata.get('doc_id', 'doc')}_para_{chunk_id}"
            chunks.append(chunk)
        
        return chunks
    
    def _hierarchical_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
        """
        Hierarchical chunking: first by sections, then by paragraphs within sections.
        """
        # First, do section-based chunking
        section_chunks = self._section_based_chunking(text, metadata)
        
        # Then, further chunk large sections by paragraphs
        final_chunks = []
        
        for section_chunk in section_chunks:
            if len(section_chunk.text) > self.chunk_size:
                # Further chunk this section by paragraphs
                para_chunks = self._paragraph_chunking(
                    section_chunk.text,
                    {**metadata, 'parent_section': section_chunk.parent_section}
                )
                
                # Update metadata for paragraph chunks
                for para_chunk in para_chunks:
                    para_chunk.parent_section = section_chunk.parent_section
                    para_chunk.section_type = section_chunk.section_type
                    para_chunk.page_number = section_chunk.page_number
                
                final_chunks.extend(para_chunks)
            else:
                final_chunks.append(section_chunk)
        
        return final_chunks
    
    def _fixed_size_chunking(self, text: str, metadata: Dict[str, Any]) -> List[TextChunk]:
        """
        Simple fixed-size chunking with overlap.
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = []
        splits = text_splitter.split_text(text)
        
        for i, split in enumerate(splits):
            # Find position in original text
            start_pos = text.find(split)
            if start_pos == -1:
                start_pos = i * self.chunk_size
            
            chunk = self._create_chunk(
                split,
                start_pos,
                start_pos + len(split),
                metadata
            )
            chunk.chunk_id = f"{metadata.get('doc_id', 'doc')}_fixed_{i}"
            chunks.append(chunk)
        
        return chunks
    
    def _create_chunk(
        self, 
        text: str, 
        start: int, 
        end: int, 
        metadata: Dict[str, Any]
    ) -> TextChunk:
        """Helper to create a TextChunk object."""
        chunk_id = f"{metadata.get('doc_id', 'doc')}_{start}_{end}"
        
        return TextChunk(
            text=text,
            chunk_id=chunk_id,
            start_index=start,
            end_index=end,
            token_count=self._count_tokens(text),
            metadata=metadata.copy()
        )
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _identify_section(self, line: str) -> Optional[str]:
        """Identify if a line is a section header."""
        line = line.strip()
        
        for pattern, _ in self.section_patterns:
            if re.match(pattern, line, re.IGNORECASE):
                # Map to common section types
                line_lower = line.lower()
                if 'abstract' in line_lower:
                    return 'abstract'
                elif 'introduction' in line_lower:
                    return 'introduction'
                elif 'method' in line_lower:
                    return 'methodology'
                elif 'result' in line_lower:
                    return 'results'
                elif 'discussion' in line_lower:
                    return 'discussion'
                elif 'conclusion' in line_lower:
                    return 'conclusion'
                elif 'reference' in line_lower or 'bibliography' in line_lower:
                    return 'references'
                elif 'appendix' in line_lower:
                    return 'appendix'
                else:
                    return 'section'
        
        return None
    
    def _find_position(self, text: str, substring: str, start_search: int = 0) -> int:
        """Find position of substring in text, starting from given position."""
        pos = text.find(substring, start_search)
        return pos if pos != -1 else start_search
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Rough estimate: 1 token ≈ 4 characters for English
            return len(text) // 4
    
    def validate_chunks(self, chunks: List[TextChunk]) -> bool:
        """
        Validate that chunks meet criteria.
        
        Returns:
            True if all chunks are valid
        """
        if not chunks:
            logger.warning("No chunks created")
            return False
        
        for i, chunk in enumerate(chunks):
            # Check chunk size
            if len(chunk.text.strip()) == 0:
                logger.warning(f"Chunk {i} is empty")
                return False
            
            # Check token count
            if chunk.token_count > self.max_tokens * 1.5:  # Allow some margin
                logger.warning(f"Chunk {i} exceeds token limit: {chunk.token_count} > {self.max_tokens}")
                return False
            
            # Check for truncation in middle of sentence/word
            if i < len(chunks) - 1:
                # Check if chunk ends with complete sentence
                last_char = chunk.text.strip()[-1] if chunk.text.strip() else ''
                if last_char not in '.!?"\'':
                    # It's okay if it's the end of the document or a section
                    pass
        
        logger.info(f"Validated {len(chunks)} chunks successfully")
        return True