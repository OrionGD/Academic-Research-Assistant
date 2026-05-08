"""
Text processing service - handles text cleaning and chunking
"""
import logging
import re
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings

logger = logging.getLogger(__name__)


class TextProcessingService:
    """Service for text processing and chunking"""
    
    def __init__(self):
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and normalize text
        
        Args:
            text: Raw text to clean
            
        Returns:
            Cleaned text
        """
        try:
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            
            # Remove special characters but keep punctuation
            text = re.sub(r'[^\w\s.!?,;:\-()]', '', text)
            
            # Fix spacing around punctuation
            text = re.sub(r'\s+([.!?,;:])', r'\1', text)
            
            # Remove leading/trailing whitespace
            text = text.strip()
            
            logger.info(f"Cleaned text from {len(text)} characters")
            return text
        except Exception as e:
            logger.error(f"Error cleaning text: {str(e)}")
            return text
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into semantic chunks
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
        """
        try:
            # Clean text first
            cleaned_text = self.clean_text(text)
            
            # Split into chunks
            chunks = self.splitter.split_text(cleaned_text)
            
            # Filter out very small chunks
            chunks = [chunk for chunk in chunks if len(chunk.strip()) > 50]
            
            logger.info(f"Created {len(chunks)} chunks from text")
            return chunks
        except Exception as e:
            logger.error(f"Error chunking text: {str(e)}")
            raise
    
    def get_chunk_with_context(
        self,
        chunks: List[str],
        chunk_index: int,
        context_window: int = 1
    ) -> str:
        """
        Get a chunk with surrounding context
        
        Args:
            chunks: List of all chunks
            chunk_index: Index of the chunk
            context_window: Number of chunks before and after to include
            
        Returns:
            Chunk with context
        """
        start = max(0, chunk_index - context_window)
        end = min(len(chunks), chunk_index + context_window + 1)
        
        context_chunks = chunks[start:end]
        return "\n".join(context_chunks)


text_processing_service = TextProcessingService()
