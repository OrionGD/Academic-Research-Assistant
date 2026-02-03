"""
Specialized parsers for academic document formats.
Handles PDF text extraction with layout preservation, 
reference/citation detection, and equation/formula recognition.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import fitz  # PyMuPDF
import pdfplumber
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LTFigure, LTImage
import io
import pytesseract
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

class DocumentType(Enum):
    """Supported academic document types."""
    PDF = "pdf"
    DOCX = "docx"
    TEX = "tex"
    MARKDOWN = "markdown"

@dataclass
class AcademicSection:
    """Represents a section in an academic document."""
    title: str
    content: str
    level: int
    page_number: int
    section_type: str  # e.g., 'abstract', 'introduction', 'methodology', 'results', 'discussion', 'references'

@dataclass
class Citation:
    """Represents a detected citation."""
    text: str
    authors: List[str]
    year: Optional[int]
    journal: Optional[str]
    context: str  # Surrounding text where citation appears

@dataclass
class Equation:
    """Represents a detected equation."""
    content: str
    label: Optional[str]
    equation_number: Optional[int]
    bounding_box: Optional[Tuple[float, float, float, float]]

class AcademicDocumentParser:
    """Parser for academic documents with specialized handling for academic content."""
    
    def __init__(self, ocr_enabled: bool = True, preserve_layout: bool = True):
        """
        Initialize the parser.
        
        Args:
            ocr_enabled: Enable OCR for scanned documents
            preserve_layout: Preserve document layout and formatting
        """
        self.ocr_enabled = ocr_enabled
        self.preserve_layout = preserve_layout
        self.reference_patterns = [
            r'\[(\d+(?:,\s*\d+)*)\]',  # [1], [1,2,3]
            r'\([A-Z][a-z]+(?: et al\.)?,?\s*\d{4}\)',  # (Author, 2024)
            r'[A-Z][a-z]+(?: et al\.)?\s+\(\d{4}\)',  # Author (2024)
        ]
        
        self.equation_patterns = [
            r'\$\$.+?\$\$',  # Block equations
            r'\$.+?\$',  # Inline equations
            r'\\begin\{equation\}(.+?)\\end\{equation\}',
            r'\\\[(.+?)\\\]',
        ]
    
    def parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Parse PDF document with academic-specific processing.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Dictionary containing parsed document components
        """
        logger.info(f"Parsing PDF: {file_path}")
        
        document_data = {
            'metadata': {},
            'sections': [],
            'citations': [],
            'equations': [],
            'references': [],
            'full_text': '',
            'figures': []
        }
        
        try:
            # Extract metadata
            document_data['metadata'] = self._extract_metadata(file_path)
            
            # Extract text with layout preservation
            full_text, sections = self._extract_text_with_layout(file_path)
            document_data['full_text'] = full_text
            document_data['sections'] = sections
            
            # Detect citations
            document_data['citations'] = self._detect_citations(full_text)
            
            # Detect equations
            document_data['equations'] = self._detect_equations(full_text)
            
            # Extract references section
            document_data['references'] = self._extract_references(full_text)
            
            # Extract figures and tables (if OCR enabled)
            if self.ocr_enabled:
                document_data['figures'] = self._extract_figures_with_ocr(file_path)
            
            logger.info(f"Successfully parsed PDF: {len(sections)} sections, "
                       f"{len(document_data['citations'])} citations found")
            
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {str(e)}")
            raise
        
        return document_data
    
    def _extract_metadata(self, file_path: str) -> Dict[str, str]:
        """Extract document metadata."""
        metadata = {}
        try:
            with fitz.open(file_path) as doc:
                metadata = doc.metadata
                # Extract potential title from first page
                if len(doc) > 0:
                    first_page = doc[0]
                    text = first_page.get_text()
                    # Simple heuristic for title extraction
                    lines = text.split('\n')
                    if lines:
                        metadata['extracted_title'] = lines[0].strip()
        except Exception as e:
            logger.warning(f"Failed to extract metadata: {str(e)}")
        
        return metadata
    
    def _extract_text_with_layout(self, file_path: str) -> Tuple[str, List[AcademicSection]]:
        """Extract text while preserving document layout and structure."""
        full_text = ""
        sections = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract text with layout preservation
                    page_text = page.extract_text(x_tolerance=3, y_tolerance=3)
                    
                    if page_text:
                        full_text += f"\n--- Page {page_num} ---\n{page_text}\n"
                        
                        # Identify sections based on headings
                        page_sections = self._identify_sections(page_text, page_num)
                        sections.extend(page_sections)
            
            # Fallback to PyMuPDF if pdfplumber fails
            if not full_text.strip():
                with fitz.open(file_path) as doc:
                    for page_num, page in enumerate(doc, 1):
                        text = page.get_text("text")
                        full_text += f"\n--- Page {page_num} ---\n{text}\n"
        
        except Exception as e:
            logger.error(f"Error extracting text with layout: {str(e)}")
            raise
        
        return full_text, sections
    
    def _identify_sections(self, text: str, page_num: int) -> List[AcademicSection]:
        """Identify academic document sections."""
        sections = []
        lines = text.split('\n')
        
        # Common academic section patterns
        section_patterns = {
            r'(?i)^\s*(abstract|summary)\s*$': 'abstract',
            r'(?i)^\s*(\d+\.)?\s*introduction\s*$': 'introduction',
            r'(?i)^\s*(\d+\.)?\s*(methodology|methods)\s*$': 'methodology',
            r'(?i)^\s*(\d+\.)?\s*results\s*$': 'results',
            r'(?i)^\s*(\d+\.)?\s*discussion\s*$': 'discussion',
            r'(?i)^\s*(\d+\.)?\s*conclusion\s*$': 'conclusion',
            r'(?i)^\s*references\s*$': 'references',
            r'(?i)^\s*bibliography\s*$': 'references',
            r'(?i)^\s*appendix\s*[A-Z]?\s*$': 'appendix',
        }
        
        current_section = None
        section_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line matches a section header
            matched_section = None
            for pattern, section_type in section_patterns.items():
                if re.match(pattern, line):
                    matched_section = section_type
                    break
            
            if matched_section:
                # Save previous section if exists
                if current_section and section_content:
                    sections.append(AcademicSection(
                        title=current_section,
                        content='\n'.join(section_content),
                        level=1,
                        page_number=page_num,
                        section_type=current_section
                    ))
                    section_content = []
                
                current_section = matched_section
            elif current_section:
                section_content.append(line)
        
        # Add the last section
        if current_section and section_content:
            sections.append(AcademicSection(
                title=current_section,
                content='\n'.join(section_content),
                level=1,
                page_number=page_num,
                section_type=current_section
            ))
        
        return sections
    
    def _detect_citations(self, text: str) -> List[Citation]:
        """Detect and extract citations from text."""
        citations = []
        
        try:
            # Split text into sentences for context
            sentences = re.split(r'[.!?]+', text)
            
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue
                
                # Check for various citation patterns
                for pattern in self.reference_patterns:
                    matches = re.finditer(pattern, sentence)
                    for match in matches:
                        citation_text = match.group()
                        
                        # Extract potential authors and year
                        authors, year, journal = self._parse_citation_details(citation_text)
                        
                        citations.append(Citation(
                            text=citation_text,
                            authors=authors,
                            year=year,
                            journal=journal,
                            context=sentence[:200]  # First 200 chars as context
                        ))
        
        except Exception as e:
            logger.warning(f"Error detecting citations: {str(e)}")
        
        return citations
    
    def _parse_citation_details(self, citation_text: str) -> Tuple[List[str], Optional[int], Optional[str]]:
        """Parse citation text to extract authors, year, and journal."""
        authors = []
        year = None
        journal = None
        
        try:
            # Pattern for (Author, Year) format
            author_year_match = re.search(r'\(([^)]+)\)', citation_text)
            if author_year_match:
                content = author_year_match.group(1)
                # Try to extract year
                year_match = re.search(r'\b(19|20)\d{2}\b', content)
                if year_match:
                    year = int(year_match.group())
                
                # Extract authors (simple heuristic)
                author_part = re.sub(r'\b(19|20)\d{2}\b', '', content).strip()
                if author_part and ',' in author_part:
                    authors = [a.strip() for a in author_part.split(',') if a.strip()]
            
            # Pattern for [number] format
            elif re.match(r'\[\d+\]', citation_text):
                # This is a numeric citation, no author/year info
                pass
        
        except Exception as e:
            logger.debug(f"Error parsing citation details: {str(e)}")
        
        return authors, year, journal
    
    def _detect_equations(self, text: str) -> List[Equation]:
        """Detect mathematical equations in text."""
        equations = []
        
        try:
            for pattern in self.equation_patterns:
                matches = re.finditer(pattern, text, re.DOTALL)
                for match in matches:
                    equation_content = match.group()
                    
                    # Clean equation content
                    if equation_content.startswith('$$') and equation_content.endswith('$$'):
                        equation_content = equation_content[2:-2].strip()
                    elif equation_content.startswith('$') and equation_content.endswith('$'):
                        equation_content = equation_content[1:-1].strip()
                    
                    equations.append(Equation(
                        content=equation_content,
                        label=None,  # Would need more advanced parsing for labels
                        equation_number=None,
                        bounding_box=None
                    ))
        
        except Exception as e:
            logger.warning(f"Error detecting equations: {str(e)}")
        
        return equations
    
    def _extract_references(self, text: str) -> List[str]:
        """Extract references/bibliography section."""
        references = []
        
        try:
            # Find references section
            ref_start = None
            lines = text.split('\n')
            
            for i, line in enumerate(lines):
                if re.search(r'(?i)^\s*(references|bibliography)\s*$', line):
                    ref_start = i + 1
                    break
            
            if ref_start:
                # Collect reference lines until next major section
                for i in range(ref_start, len(lines)):
                    line = lines[i].strip()
                    if line and not re.search(r'(?i)^\s*(appendix|acknowledgements?)\s*$', line):
                        # Simple heuristic: references often start with [number] or author names
                        if (re.match(r'^\[\d+\]', line) or 
                            re.match(r'^[A-Z][a-z]+,', line) or
                            re.match(r'^[A-Z]\.[A-Z]', line)):
                            references.append(line)
                    else:
                        break
        
        except Exception as e:
            logger.warning(f"Error extracting references: {str(e)}")
        
        return references
    
    def _extract_figures_with_ocr(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract figures using OCR."""
        figures = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Find images/figures on page
                    images = page.images
                    
                    for img_idx, img in enumerate(images):
                        try:
                            # Extract image
                            bbox = (img['x0'], img['top'], img['x1'], img['bottom'])
                            cropped_page = page.crop(bbox)
                            
                            # Convert to PIL Image for OCR
                            pil_image = cropped_page.to_image().original
                            
                            # Perform OCR
                            ocr_text = pytesseract.image_to_string(pil_image)
                            
                            figures.append({
                                'page': page_num,
                                'bbox': bbox,
                                'ocr_text': ocr_text.strip(),
                                'image_index': img_idx
                            })
                        
                        except Exception as img_error:
                            logger.debug(f"Failed to OCR image on page {page_num}: {str(img_error)}")
        
        except Exception as e:
            logger.warning(f"Error extracting figures with OCR: {str(e)}")
        
        return figures
    
    def parse_docx(self, file_path: str) -> Dict[str, Any]:
        """Parse DOCX document (placeholder for implementation)."""
        # TODO: Implement DOCX parsing
        logger.info(f"DOCX parsing not yet implemented for {file_path}")
        return {}
    
    def parse_latex(self, file_path: str) -> Dict[str, Any]:
        """Parse LaTeX document (placeholder for implementation)."""
        # TODO: Implement LaTeX parsing
        logger.info(f"LaTeX parsing not yet implemented for {file_path}")
        return {}