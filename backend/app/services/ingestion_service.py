"""
Document ingestion service - handles PDF, URL, and text input
"""
import logging
from typing import Tuple
import pypdf
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """Service for ingesting documents from various sources"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        Extract text from PDF file
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Extracted text
        """
        try:
            text = []
            with open(file_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                for page in pdf_reader.pages:
                    text.append(page.extract_text())
            
            extracted_text = "\n".join(text)
            logger.info(f"Extracted {len(extracted_text)} characters from PDF")
            return extracted_text
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            raise
    
    @staticmethod
    async def extract_text_from_url(url: str) -> str:
        """
        Extract text from URL
        
        Args:
            url: URL of the webpage
            
        Returns:
            Extracted text
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url)
                
                # 307 redirects are followed automatically; if we still get 307 after max_redirects, log and continue
                if response.status_code == 307:
                    logger.warning(f"URL returned 307 redirect after following redirects: {url}. Ignoring.")
                
                response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            logger.info(f"Extracted {len(text)} characters from URL")
            return text
        except Exception as e:
            logger.error(f"Error extracting URL text: {str(e)}")
            raise
    
    @staticmethod
    def validate_text(text: str) -> Tuple[bool, str]:
        """
        Validate extracted text
        
        Args:
            text: Text to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not text or not text.strip():
            return False, "Text is empty"
        
        if len(text.strip()) < 50:
            return False, "Text is too short (minimum 50 characters)"
        
        return True, ""


document_ingestion_service = DocumentIngestionService()
