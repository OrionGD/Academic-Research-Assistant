"""
ARAS Backend - Utilities Package

This package contains reusable utility functions and helper modules for 
academic document processing and retrieval-augmented generation.

Modules:
    document_parser: Specialized parsers for academic document formats
    chunking: Advanced text segmentation strategies
    preprocessing: Text normalization and cleaning
    logger: Centralized logging configuration
"""

from .document_parser import (
    AcademicDocumentParser,
    DocumentType,
    AcademicSection,
    Citation,
    Equation
)

from .chunking import (
    AcademicChunker,
    ChunkingStrategy,
    TextChunk
)

from .preprocessing import (
    AcademicTextPreprocessor,
    PreprocessingConfig
)

from .logger import (
    LogManager,
    ContextLogger,
    LogLevel,
    LogFormat,
    LogContext,
    setup_logging,
    get_logger,
    log_execution
)

# Version
__version__ = "1.0.0"
__author__ = "ARAS Team"
__description__ = "Utilities for Academic RAG System"

# Public API
__all__ = [
    # Document Parser
    "AcademicDocumentParser",
    "DocumentType",
    "AcademicSection",
    "Citation",
    "Equation",
    
    # Chunking
    "AcademicChunker",
    "ChunkingStrategy",
    "TextChunk",
    
    # Preprocessing
    "AcademicTextPreprocessor",
    "PreprocessingConfig",
    
    # Logging
    "LogManager",
    "ContextLogger",
    "LogLevel",
    "LogFormat",
    "LogContext",
    "setup_logging",
    "get_logger",
    "log_execution",
]

# Initialize default logging configuration
from .logger import init_default_logging
init_default_logging()

print(f"ARAS Utilities v{__version__} initialized")