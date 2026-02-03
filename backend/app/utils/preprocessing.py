"""
Text normalization and cleaning.
Removes irrelevant content, standardizes academic formatting, 
handles special characters, and prepares text for embedding generation.
"""

import re
import logging
import unicodedata
from typing import List, Dict, Any, Optional, Tuple
import string
from dataclasses import dataclass
import html

logger = logging.getLogger(__name__)

@dataclass
class PreprocessingConfig:
    """Configuration for text preprocessing."""
    remove_html: bool = True
    remove_urls: bool = True
    remove_citations: bool = False  # Keep citations by default, they're important for academic docs
    normalize_whitespace: bool = True
    normalize_unicode: bool = True
    remove_control_chars: bool = True
    lower_case: bool = False  # Keep case for academic texts
    remove_punctuation: bool = False  # Keep punctuation for academic texts
    expand_contractions: bool = True
    remove_stopwords: bool = False  # Keep stopwords for academic texts
    remove_numbers: bool = False  # Keep numbers for academic texts
    min_word_length: int = 2
    max_word_length: int = 50
    preserve_equations: bool = True
    preserve_references: bool = True
    academic_specific: bool = True

class AcademicTextPreprocessor:
    """Preprocessor specialized for academic text."""
    
    def __init__(self, config: Optional[PreprocessingConfig] = None):
        """
        Initialize the academic text preprocessor.
        
        Args:
            config: Preprocessing configuration
        """
        self.config = config or PreprocessingConfig()
        
        # Common contractions mapping
        self.contractions = {
            "don't": "do not",
            "doesn't": "does not",
            "didn't": "did not",
            "can't": "cannot",
            "couldn't": "could not",
            "won't": "will not",
            "wouldn't": "would not",
            "shouldn't": "should not",
            "isn't": "is not",
            "aren't": "are not",
            "wasn't": "was not",
            "weren't": "were not",
            "haven't": "have not",
            "hasn't": "has not",
            "hadn't": "had not",
            "i'm": "i am",
            "you're": "you are",
            "he's": "he is",
            "she's": "she is",
            "it's": "it is",
            "we're": "we are",
            "they're": "they are",
            "i've": "i have",
            "you've": "you have",
            "we've": "we have",
            "they've": "they have",
            "i'd": "i would",
            "you'd": "you would",
            "he'd": "he would",
            "she'd": "she would",
            "we'd": "we would",
            "they'd": "they would",
            "i'll": "i will",
            "you'll": "you will",
            "he'll": "he will",
            "she'll": "she will",
            "we'll": "we will",
            "they'll": "they will",
            "that's": "that is",
            "there's": "there is",
            "what's": "what is",
            "where's": "where is",
            "who's": "who is",
            "how's": "how is",
            "let's": "let us",
            "ain't": "am not",
            "gonna": "going to",
            "wanna": "want to",
            "gotta": "got to",
            "kinda": "kind of",
            "sorta": "sort of",
            "lotta": "lot of",
            "lemme": "let me",
            "gimme": "give me",
            "outta": "out of",
            "whatcha": "what are you",
            "dunno": "do not know"
        }
        
        # Academic-specific patterns
        self.academic_patterns = {
            'equation_patterns': [
                r'\$\$.+?\$\$',
                r'\$.+?\$',
                r'\\begin\{equation\}(.+?)\\end\{equation\}',
                r'\\\[(.+?)\\\]',
                r'\\\((.+?)\\\)',
            ],
            'citation_patterns': [
                r'\[(\d+(?:,\s*\d+)*)\]',
                r'\([A-Z][a-z]+(?: et al\.)?,?\s*\d{4}\)',
                r'[A-Z][a-z]+(?: et al\.)?\s+\(\d{4}\)',
            ],
            'reference_pattern': r'^\s*(?:\[\d+\]|\([^)]+\)|[A-Z][a-z]+,\s+\d{4})',
            'figure_table_patterns': [
                r'(?:Figure|Fig\.|Table|Tab\.)\s+\d+[.:]',
                r'(?:Figure|Fig\.|Table|Tab\.)\s+[A-Z]\.\d+',
            ]
        }
        
        # Common academic stopwords to preserve
        self.academic_important_words = {
            'therefore', 'however', 'moreover', 'furthermore', 'consequently',
            'nevertheless', 'nonetheless', 'notwithstanding', 'accordingly',
            'hence', 'thus', 'whereas', 'although', 'because', 'since',
            'while', 'although', 'though', 'unless', 'until', 'when',
            'whenever', 'where', 'wherever', 'whether', 'while', 'why',
            'method', 'methods', 'methodology', 'result', 'results',
            'discussion', 'conclusion', 'abstract', 'introduction',
            'reference', 'references', 'bibliography', 'appendix',
            'hypothesis', 'hypotheses', 'theory', 'theories', 'model',
            'models', 'framework', 'frameworks', 'analysis', 'analyses',
            'experiment', 'experiments', 'study', 'studies', 'research',
            'researches', 'data', 'datum', 'evidence', 'proof', 'prove',
            'shows', 'shown', 'showed', 'demonstrate', 'demonstrates',
            'demonstrated', 'indicate', 'indicates', 'indicated', 'suggest',
            'suggests', 'suggested', 'propose', 'proposes', 'proposed',
            'conclude', 'concludes', 'concluded', 'find', 'finds', 'found',
            'observe', 'observes', 'observed', 'measure', 'measures',
            'measured', 'calculate', 'calculates', 'calculated',
            'compute', 'computes', 'computed', 'estimate', 'estimates',
            'estimated', 'approximate', 'approximates', 'approximated',
            'define', 'defines', 'defined', 'describe', 'describes',
            'described', 'explain', 'explains', 'explained',
            'significant', 'significantly', 'significance',
            'correlation', 'correlations', 'correlated',
            'causation', 'causal', 'cause', 'causes', 'caused',
            'effect', 'effects', 'effective', 'effectiveness',
            'variable', 'variables', 'variance', 'variant',
            'parameter', 'parameters', 'parametric',
            'coefficient', 'coefficients',
            'statistic', 'statistics', 'statistical',
            'probability', 'probabilities', 'probabilistic',
            'distribution', 'distributions', 'distributed',
            'function', 'functions', 'functional',
            'equation', 'equations', 'equational',
            'theorem', 'theorems', 'theoretical',
            'lemma', 'lemmas', 'lemmata',
            'corollary', 'corollaries',
            'proof', 'proofs', 'proven',
            'axiom', 'axioms', 'axiomatic',
            'definition', 'definitions', 'definitive',
            'example', 'examples', 'exemplary',
            'counterexample', 'counterexamples',
            'hypothesis', 'hypotheses', 'hypothetical',
            'null', 'alternative', 'alternatives',
            'experiment', 'experiments', 'experimental',
            'control', 'controls', 'controlled',
            'treatment', 'treatments', 'treated',
            'sample', 'samples', 'sampling',
            'population', 'populations', 'populated',
            'random', 'randomized', 'randomization',
            'bias', 'biases', 'biased',
            'variance', 'variances', 'variant',
            'standard', 'standards', 'standardized',
            'error', 'errors', 'erroneous',
            'confidence', 'confidences', 'confident',
            'interval', 'intervals', 'intervallic',
            'significance', 'significances', 'significant',
            'p-value', 'p-values',
            't-test', 't-tests',
            'anova', 'anovas',
            'regression', 'regressions', 'regressive',
            'correlation', 'correlations', 'correlative',
            'coefficient', 'coefficients',
            'r-squared', 'r-square',
            'beta', 'betas',
            'alpha', 'alphas',
            'gamma', 'gammas',
            'delta', 'deltas',
            'epsilon', 'epsilons',
            'sigma', 'sigmas',
            'mu', 'mus',
            'nu', 'nus',
            'xi', 'xis',
            'pi', 'pis',
            'rho', 'rhos',
            'tau', 'taus',
            'phi', 'phis',
            'chi', 'chis',
            'psi', 'psis',
            'omega', 'omegas'
        }
    
    def preprocess(self, text: str, doc_metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Apply preprocessing pipeline to text.
        
        Args:
            text: Input text to preprocess
            doc_metadata: Document metadata for context-aware preprocessing
            
        Returns:
            Preprocessed text
        """
        if not text or not text.strip():
            return text
        
        logger.debug(f"Preprocessing text of length {len(text)}")
        
        # Store protected content (equations, citations, etc.)
        protected = self._extract_protected_content(text)
        
        # Apply preprocessing steps
        processed = text
        
        # HTML decoding and cleaning
        if self.config.remove_html:
            processed = self._remove_html_tags(processed)
        
        # URL removal
        if self.config.remove_urls:
            processed = self._remove_urls(processed)
        
        # Unicode normalization
        if self.config.normalize_unicode:
            processed = self._normalize_unicode(processed)
        
        # Control character removal
        if self.config.remove_control_chars:
            processed = self._remove_control_characters(processed)
        
        # Contraction expansion
        if self.config.expand_contractions:
            processed = self._expand_contractions(processed)
        
        # Academic-specific preprocessing
        if self.config.academic_specific:
            processed = self._academic_specific_cleaning(processed)
        
        # Case normalization (optional)
        if self.config.lower_case:
            processed = processed.lower()
        
        # Punctuation removal (optional)
        if self.config.remove_punctuation:
            processed = self._remove_punctuation(processed)
        
        # Number removal (optional)
        if self.config.remove_numbers:
            processed = self._remove_numbers(processed)
        
        # Whitespace normalization
        if self.config.normalize_whitespace:
            processed = self._normalize_whitespace(processed)
        
        # Word length filtering
        processed = self._filter_by_word_length(processed)
        
        # Restore protected content
        processed = self._restore_protected_content(processed, protected)
        
        logger.debug(f"Preprocessed text length: {len(processed)}")
        return processed
    
    def preprocess_batch(self, texts: List[str], doc_metadata: Optional[List[Dict]] = None) -> List[str]:
        """
        Preprocess a batch of texts.
        
        Args:
            texts: List of texts to preprocess
            doc_metadata: Optional list of document metadata
            
        Returns:
            List of preprocessed texts
        """
        results = []
        for i, text in enumerate(texts):
            metadata = doc_metadata[i] if doc_metadata and i < len(doc_metadata) else None
            results.append(self.preprocess(text, metadata))
        return results
    
    def _extract_protected_content(self, text: str) -> Dict[str, List[Tuple[str, str]]]:
        """
        Extract and store content that should be protected from preprocessing.
        
        Returns:
            Dictionary mapping content type to list of (placeholder, original_content)
        """
        protected = {
            'equations': [],
            'citations': [],
            'references': [],
            'figures_tables': [],
        }
        
        if self.config.preserve_equations:
            # Extract equations
            for pattern in self.academic_patterns['equation_patterns']:
                matches = re.finditer(pattern, text, re.DOTALL)
                for match in matches:
                    placeholder = f"__EQUATION_{len(protected['equations'])}__"
                    protected['equations'].append((placeholder, match.group()))
        
        if self.config.preserve_references and not self.config.remove_citations:
            # Extract citations
            for pattern in self.academic_patterns['citation_patterns']:
                matches = re.finditer(pattern, text)
                for match in matches:
                    placeholder = f"__CITATION_{len(protected['citations'])}__"
                    protected['citations'].append((placeholder, match.group()))
            
            # Extract reference lines
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if re.match(self.academic_patterns['reference_pattern'], line):
                    placeholder = f"__REFERENCE_{len(protected['references'])}__"
                    protected['references'].append((placeholder, line))
        
        # Extract figure/table references
        for pattern in self.academic_patterns['figure_table_patterns']:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                placeholder = f"__FIGURE_TABLE_{len(protected['figures_tables'])}__"
                protected['figures_tables'].append((placeholder, match.group()))
        
        return protected
    
    def _restore_protected_content(self, text: str, protected: Dict[str, List[Tuple[str, str]]]) -> str:
        """Restore protected content after preprocessing."""
        # Restore in reverse order to avoid placeholder collisions
        for content_type in ['figures_tables', 'references', 'citations', 'equations']:
            for placeholder, original in protected.get(content_type, []):
                text = text.replace(placeholder, original)
        
        return text
    
    def _remove_html_tags(self, text: str) -> str:
        """Remove HTML tags and decode HTML entities."""
        # Decode HTML entities
        text = html.unescape(text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        
        return text
    
    def _remove_urls(self, text: str) -> str:
        """Remove URLs from text."""
        # Pattern for URLs
        url_pattern = r'https?://\S+|www\.\S+'
        text = re.sub(url_pattern, ' ', text)
        
        # Pattern for email addresses
        email_pattern = r'\S+@\S+'
        text = re.sub(email_pattern, ' ', text)
        
        return text
    
    def _normalize_unicode(self, text: str) -> str:
        """Normalize Unicode characters."""
        # Normalize to NFKC form (compatibility composition)
        text = unicodedata.normalize('NFKC', text)
        
        # Replace common Unicode characters with ASCII equivalents
        replacements = {
            '―': '-',
            '–': '-',
            '—': '-',
            '…': '...',
            '´': "'",
            '‘': "'",
            '’': "'",
            '`': "'",
            '“': '"',
            '”': '"',
            '„': '"',
            '«': '"',
            '»': '"',
            '‹': '<',
            '›': '>',
            '•': '*',
            '·': '*',
            '°': ' degrees ',
            '±': ' plus-minus ',
            '×': ' x ',
            '÷': ' divided by ',
            '≈': ' approximately ',
            '≠': ' not equal ',
            '≤': ' less than or equal ',
            '≥': ' greater than or equal ',
            '∞': ' infinity ',
            'µ': ' micro ',
            'α': ' alpha ',
            'β': ' beta ',
            'γ': ' gamma ',
            'δ': ' delta ',
            'ε': ' epsilon ',
            'ζ': ' zeta ',
            'η': ' eta ',
            'θ': ' theta ',
            'ι': ' iota ',
            'κ': ' kappa ',
            'λ': ' lambda ',
            'μ': ' mu ',
            'ν': ' nu ',
            'ξ': ' xi ',
            'π': ' pi ',
            'ρ': ' rho ',
            'σ': ' sigma ',
            'τ': ' tau ',
            'υ': ' upsilon ',
            'φ': ' phi ',
            'χ': ' chi ',
            'ψ': ' psi ',
            'ω': ' omega ',
        }
        
        for unicode_char, replacement in replacements.items():
            text = text.replace(unicode_char, replacement)
        
        return text
    
    def _remove_control_characters(self, text: str) -> str:
        """Remove control characters."""
        # Remove control characters except for common whitespace
        text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C' or char in '\n\r\t')
        return text
    
    def _expand_contractions(self, text: str) -> str:
        """Expand English contractions."""
        # Create a regex pattern for contractions
        contractions_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(key) for key in self.contractions.keys()) + r')\b',
            re.IGNORECASE
        )
        
        def expand_match(match):
            matched = match.group(0).lower()
            return self.contractions.get(matched, matched)
        
        text = contractions_pattern.sub(expand_match, text)
        return text
    
    def _academic_specific_cleaning(self, text: str) -> str:
        """Academic-specific cleaning operations."""
        # Remove running headers/footers (common in academic papers)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                cleaned_lines.append(line)
                continue
            
            # Skip lines that look like page numbers
            if re.match(r'^\d+$', line):
                continue
            
            # Skip lines that are likely headers/footers
            if len(line) < 100 and (line.isupper() or line.replace(' ', '').isnumeric()):
                # Check if it appears multiple times (common for headers)
                if lines.count(line) > 2:
                    continue
            
            cleaned_lines.append(line)
        
        text = '\n'.join(cleaned_lines)
        
        # Standardize academic abbreviations
        replacements = {
            r'\bet al\.': 'et al',
            r'\bi\.e\.': 'that is',
            r'\be\.g\.': 'for example',
            r'\bcf\.': 'compare',
            r'\bvs\.': 'versus',
            r'\bFig\.': 'Figure',
            r'\bFigs\.': 'Figures',
            r'\bEq\.': 'Equation',
            r'\bEqs\.': 'Equations',
            r'\bSec\.': 'Section',
            r'\bSecs\.': 'Sections',
            r'\bChap\.': 'Chapter',
            r'\bChaps\.': 'Chapters',
            r'\bTab\.': 'Table',
            r'\bTabs\.': 'Tables',
        }
        
        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    
    def _remove_punctuation(self, text: str) -> str:
        """Remove punctuation from text."""
        # Keep some punctuation that might be important in academic texts
        keep_chars = '-_'
        if self.config.academic_specific:
            keep_chars += '()[]{}'  # Keep brackets for citations and equations
        
        # Create translation table
        translator = str.maketrans('', '', string.punctuation.replace(keep_chars, ''))
        text = text.translate(translator)
        
        return text
    
    def _remove_numbers(self, text: str) -> str:
        """Remove numbers from text."""
        # Remove standalone numbers but keep numbers in words/alphanumeric
        text = re.sub(r'\b\d+\b', ' ', text)
        return text
    
    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace characters."""
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize newlines
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        
        # Trim leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def _filter_by_word_length(self, text: str) -> str:
        """Filter words by minimum and maximum length."""
        if self.config.min_word_length <= 1 and self.config.max_word_length >= 100:
            return text
        
        words = text.split()
        filtered_words = []
        
        for word in words:
            word_len = len(word)
            if (word_len >= self.config.min_word_length and 
                word_len <= self.config.max_word_length):
                filtered_words.append(word)
            else:
                # Replace with empty string but maintain spacing
                filtered_words.append('')
        
        # Reconstruct text
        text = ' '.join(filtered_words)
        # Remove multiple spaces caused by removed words
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def validate_preprocessing(self, original: str, processed: str) -> Dict[str, Any]:
        """
        Validate preprocessing results.
        
        Returns:
            Dictionary with validation metrics
        """
        validation = {
            'original_length': len(original),
            'processed_length': len(processed),
            'reduction_percentage': 0,
            'word_count_original': len(original.split()),
            'word_count_processed': len(processed.split()),
            'preserved_equations': 0,
            'preserved_citations': 0,
            'issues': []
        }
        
        # Calculate reduction
        if validation['original_length'] > 0:
            validation['reduction_percentage'] = (
                (validation['original_length'] - validation['processed_length']) / 
                validation['original_length'] * 100
            )
        
        # Check for preserved content
        if self.config.preserve_equations:
            for pattern in self.academic_patterns['equation_patterns']:
                original_count = len(re.findall(pattern, original, re.DOTALL))
                processed_count = len(re.findall(pattern, processed, re.DOTALL))
                if original_count > 0:
                    validation['preserved_equations'] += processed_count
        
        if self.config.preserve_references:
            for pattern in self.academic_patterns['citation_patterns']:
                original_count = len(re.findall(pattern, original))
                processed_count = len(re.findall(pattern, processed))
                if original_count > 0:
                    validation['preserved_citations'] += processed_count
        
        # Check for potential issues
        if validation['reduction_percentage'] > 80:
            validation['issues'].append('Excessive text reduction')
        
        if validation['word_count_processed'] == 0 and validation['word_count_original'] > 0:
            validation['issues'].append('All words removed')
        
        # Check if important academic words were preserved
        if self.config.academic_specific:
            important_words_found = sum(
                1 for word in self.academic_important_words 
                if word.lower() in processed.lower()
            )
            validation['important_academic_words_preserved'] = important_words_found
        
        return validation