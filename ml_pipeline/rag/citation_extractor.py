"""
Citation extraction and validation for academic source attribution.
Handles parsing, validation, and formatting of citations in academic responses.
"""

import re
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass, field
import logging
from datetime import datetime
import json
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Citation:
    """Citation information."""
    document_id: str
    chunk_id: Optional[str]
    document_title: str
    relevance: str  # 'direct', 'supporting', 'contextual'
    confidence: float
    text_snippet: str
    position_in_response: int
    metadata: Dict[str, Any] = field(default_factory=dict)


class CitationExtractor:
    """
    Extract and validate citations from generated responses.
    Handles multiple citation formats and validates against source documents.
    """
    
    # Citation patterns
    CITATION_PATTERNS = {
        'document': r'\[Document\s+(\d+)(?:,\s*p\.?\s*(\d+))?\]',
        'bracket': r'\[(\d+)(?:,\s*(\d+))?\]',
        'paren': r'\(([^)]+)\)',
        'academic': r'\(([A-Za-z]+,\s*\d{4}(?:,\s*p\.?\s*\d+)?)\)'
    }
    
    def __init__(
        self,
        mongodb_client,
        validate_sources: bool = True,
        min_confidence: float = 0.7,
        extract_quotes: bool = True
    ):
        """
        Initialize citation extractor.
        
        Args:
            mongodb_client: MongoDB client for source validation
            validate_sources: Whether to validate citations against source documents
            min_confidence: Minimum confidence for citation validity
            extract_quotes: Whether to extract quoted text
        """
        self.mongodb = mongodb_client
        self.validate_sources = validate_sources
        self.min_confidence = min_confidence
        self.extract_quotes = extract_quotes
        
        logger.info("Initialized CitationExtractor")
    
    async def extract_citations(
        self,
        response: str,
        source_documents: List[Any]
    ) -> List[Citation]:
        """
        Extract citations from generated response.
        
        Args:
            response: Generated response text
            source_documents: Source documents used for generation
            
        Returns:
            List of extracted citations
        """
        citations = []
        
        # Create document lookup
        doc_lookup = self._create_document_lookup(source_documents)
        
        # Extract citations using different patterns
        for pattern_name, pattern in self.CITATION_PATTERNS.items():
            matches = re.finditer(pattern, response)
            
            for match in matches:
                citation = await self._process_citation_match(
                    match=match,
                    pattern_name=pattern_name,
                    full_text=response,
                    doc_lookup=doc_lookup
                )
                
                if citation and citation.confidence >= self.min_confidence:
                    citations.append(citation)
        
        # Remove duplicates
        citations = self._deduplicate_citations(citations)
        
        # Sort by position
        citations.sort(key=lambda x: x.position_in_response)
        
        logger.info(f"Extracted {len(citations)} citations")
        return citations
    
    async def _process_citation_match(
        self,
        match: re.Match,
        pattern_name: str,
        full_text: str,
        doc_lookup: Dict[str, Any]
    ) -> Optional[Citation]:
        """
        Process a regex match to extract citation.
        
        Args:
            match: Regex match object
            pattern_name: Name of matching pattern
            full_text: Full response text
            doc_lookup: Document lookup dictionary
            
        Returns:
            Citation object if valid, None otherwise
        """
        try:
            # Extract citation text
            citation_text = match.group(0)
            position = match.start()
            
            # Extract document reference
            doc_ref = self._parse_document_reference(match, pattern_name)
            if not doc_ref:
                return None
            
            # Find matching source document
            source_doc = self._find_source_document(doc_ref, doc_lookup)
            if not source_doc and self.validate_sources:
                logger.debug(f"No source document found for reference: {doc_ref}")
                return None
            
            # Extract surrounding text
            text_snippet = self._extract_surrounding_text(full_text, position)
            
            # Calculate confidence
            confidence = self._calculate_confidence(
                match=match,
                source_doc=source_doc,
                text_snippet=text_snippet
            )
            
            # Determine relevance
            relevance = self._determine_relevance(source_doc, text_snippet)
            
            # Create citation
            citation = Citation(
                document_id=source_doc.get('document_id', 'unknown') if source_doc else 'unknown',
                chunk_id=source_doc.get('chunk_id') if source_doc else None,
                document_title=source_doc.get('title', 'Unknown Document') if source_doc else 'Unknown Document',
                relevance=relevance,
                confidence=confidence,
                text_snippet=text_snippet,
                position_in_response=position,
                metadata={
                    'pattern': pattern_name,
                    'citation_text': citation_text,
                    'validated': source_doc is not None
                }
            )
            
            return citation
            
        except Exception as e:
            logger.error(f"Error processing citation match: {e}")
            return None
    
    def _parse_document_reference(
        self,
        match: re.Match,
        pattern_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        Parse document reference from match.
        
        Args:
            match: Regex match
            pattern_name: Pattern name
            
        Returns:
            Document reference dictionary
        """
        if pattern_name == 'document':
            # [Document X] format
            doc_num = match.group(1)
            page = match.group(2)
            return {
                'type': 'document',
                'number': int(doc_num) if doc_num else None,
                'page': int(page) if page else None
            }
        
        elif pattern_name == 'bracket':
            # [X] format
            doc_num = match.group(1)
            return {
                'type': 'simple',
                'number': int(doc_num) if doc_num else None
            }
        
        elif pattern_name == 'paren':
            # (text) format - try to parse
            text = match.group(1)
            # Check if it looks like a document reference
            if text.isdigit():
                return {
                    'type': 'paren_digit',
                    'number': int(text)
                }
            elif ',' in text and text.split(',')[0].isdigit():
                parts = text.split(',')
                return {
                    'type': 'paren_complex',
                    'number': int(parts[0]),
                    'extra': parts[1].strip()
                }
        
        elif pattern_name == 'academic':
            # (Author, year) format
            text = match.group(1)
            parts = text.split(',')
            if len(parts) >= 2:
                return {
                    'type': 'academic',
                    'author': parts[0].strip(),
                    'year': parts[1].strip().split()[0] if parts[1] else None
                }
        
        return None
    
    def _find_source_document(
        self,
        doc_ref: Dict[str, Any],
        doc_lookup: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Find source document matching reference.
        
        Args:
            doc_ref: Document reference
            doc_lookup: Document lookup dictionary
            
        Returns:
            Source document if found
        """
        if not doc_lookup:
            return None
        
        # Try by document number
        if 'number' in doc_ref and doc_ref['number']:
            # Document numbers are 1-based in citations
            doc_key = f"doc_{doc_ref['number']}"
            if doc_key in doc_lookup:
                return doc_lookup[doc_key]
        
        # Try by academic reference
        if doc_ref.get('type') == 'academic':
            # Look for author/year match
            for doc in doc_lookup.values():
                doc_author = doc.get('author', '').lower()
                doc_year = str(doc.get('year', ''))
                
                if (doc_ref.get('author', '').lower() in doc_author and
                    doc_ref.get('year', '') in doc_year):
                    return doc
        
        return None
    
    def _create_document_lookup(
        self,
        source_documents: List[Any]
    ) -> Dict[str, Any]:
        """
        Create lookup dictionary for source documents.
        
        Args:
            source_documents: List of source documents
            
        Returns:
            Document lookup dictionary
        """
        lookup = {}
        
        for i, doc in enumerate(source_documents, 1):
            # Extract document info
            doc_id = None
            title = None
            author = None
            year = None
            
            if hasattr(doc, 'document_id'):
                doc_id = doc.document_id
                title = getattr(doc, 'title', f'Document {i}')
            elif isinstance(doc, dict):
                doc_id = doc.get('document_id')
                title = doc.get('title', f'Document {i}')
                author = doc.get('author')
                year = doc.get('year')
            
            # Store by multiple keys
            lookup[f"doc_{i}"] = {
                'document_id': doc_id,
                'chunk_id': getattr(doc, 'chunk_id', None) if hasattr(doc, 'chunk_id') else doc.get('chunk_id'),
                'title': title,
                'author': author,
                'year': year,
                'text': self._get_doc_text(doc),
                'original': doc
            }
            
            if doc_id:
                lookup[doc_id] = lookup[f"doc_{i}"]
        
        return lookup
    
    def _get_doc_text(self, doc: Any) -> str:
        """Extract text from document."""
        if hasattr(doc, 'text'):
            return doc.text
        elif isinstance(doc, dict):
            return doc.get('text', '')
        return ''
    
    def _extract_surrounding_text(
        self,
        full_text: str,
        position: int,
        context_chars: int = 100
    ) -> str:
        """
        Extract text surrounding a citation.
        
        Args:
            full_text: Full response text
            position: Citation position
            context_chars: Number of context characters
            
        Returns:
            Surrounding text snippet
        """
        start = max(0, position - context_chars)
        end = min(len(full_text), position + context_chars)
        
        snippet = full_text[start:end].strip()
        
        # Add ellipsis if truncated
        if start > 0:
            snippet = "..." + snippet
        if end < len(full_text):
            snippet = snippet + "..."
        
        return snippet
    
    def _calculate_confidence(
        self,
        match: re.Match,
        source_doc: Optional[Dict[str, Any]],
        text_snippet: str
    ) -> float:
        """
        Calculate confidence for citation.
        
        Args:
            match: Regex match
            source_doc: Source document if found
            text_snippet: Surrounding text
            
        Returns:
            Confidence score
        """
        confidence = 1.0
        
        # Factor 1: Source document found
        if not source_doc:
            confidence *= 0.5
        
        # Factor 2: Match length (longer citations are clearer)
        match_length = len(match.group(0))
        if match_length < 5:
            confidence *= 0.8
        
        # Factor 3: Citation pattern type
        pattern_name = match.re.pattern if hasattr(match.re, 'pattern') else ''
        if 'Document' in pattern_name:
            confidence *= 1.0  # Most explicit
        elif 'academic' in pattern_name.lower():
            confidence *= 0.95  # Academic format
        else:
            confidence *= 0.9   # Less explicit
        
        # Factor 4: Text snippet relevance
        if source_doc:
            # Check if snippet appears in source document
            doc_text = source_doc.get('text', '').lower()
            snippet_words = set(text_snippet.lower().split())
            
            if snippet_words:
                overlap = sum(1 for word in snippet_words if word in doc_text)
                text_relevance = overlap / len(snippet_words)
                confidence *= (0.8 + 0.2 * text_relevance)
        
        return round(min(confidence, 1.0), 3)
    
    def _determine_relevance(
        self,
        source_doc: Optional[Dict[str, Any]],
        text_snippet: str
    ) -> str:
        """
        Determine citation relevance type.
        
        Args:
            source_doc: Source document
            text_snippet: Surrounding text
            
        Returns:
            Relevance type
        """
        if not source_doc:
            return "uncertain"
        
        # Check for direct quotes
        if self.extract_quotes and '"' in text_snippet:
            return "direct"
        
        # Check for supporting language
        supporting_indicators = [
            "according to", "as noted by", "states that",
            "suggests", "indicates", "shows that"
        ]
        
        text_lower = text_snippet.lower()
        for indicator in supporting_indicators:
            if indicator in text_lower:
                return "supporting"
        
        return "contextual"
    
    def _deduplicate_citations(
        self,
        citations: List[Citation]
    ) -> List[Citation]:
        """
        Remove duplicate citations.
        
        Args:
            citations: List of citations
            
        Returns:
            Deduplicated citations
        """
        seen = set()
        unique = []
        
        for citation in citations:
            # Create unique key
            key = f"{citation.document_id}_{citation.chunk_id}_{citation.position_in_response}"
            
            if key not in seen:
                seen.add(key)
                unique.append(citation)
        
        return unique
    
    def format_citations(
        self,
        citations: List[Citation],
        format_type: str = "academic"
    ) -> str:
        """
        Format citations for display.
        
        Args:
            citations: List of citations
            format_type: Format type ('academic', 'numeric', 'inline')
            
        Returns:
            Formatted citation string
        """
        if not citations:
            return ""
        
        if format_type == "academic":
            # APA-like format
            formatted = []
            for i, cit in enumerate(citations, 1):
                formatted.append(
                    f"{i}. {cit.document_title} "
                    f"[{cit.relevance.capitalize()}]"
                )
            return "\n".join(formatted)
        
        elif format_type == "numeric":
            # Simple numeric format
            return ", ".join([f"[{i+1}]" for i in range(len(citations))])
        
        elif format_type == "inline":
            # Inline format with titles
            return "; ".join([
                f"{cit.document_title} ({cit.relevance})"
                for cit in citations
            ])
        
        return ""
    
    def validate_citation_quality(
        self,
        citations: List[Citation],
        response_length: int
    ) -> Dict[str, Any]:
        """
        Validate overall citation quality.
        
        Args:
            citations: List of citations
            response_length: Length of response in characters
            
        Returns:
            Quality metrics
        """
        if not citations:
            return {
                "has_citations": False,
                "citation_density": 0,
                "average_confidence": 0,
                "relevance_distribution": {}
            }
        
        # Calculate metrics
        citation_density = len(citations) / (response_length / 1000)  # Citations per 1000 chars
        
        avg_confidence = sum(c.confidence for c in citations) / len(citations)
        
        # Relevance distribution
        relevance_counts = {}
        for c in citations:
            relevance_counts[c.relevance] = relevance_counts.get(c.relevance, 0) + 1
        
        return {
            "has_citations": True,
            "citation_count": len(citations),
            "citation_density": round(citation_density, 2),
            "average_confidence": round(avg_confidence, 3),
            "relevance_distribution": relevance_counts,
            "unique_documents": len(set(c.document_id for c in citations))
        }