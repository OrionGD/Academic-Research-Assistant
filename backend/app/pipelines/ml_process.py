"""
Document Processing Pipeline
"""
import os
import re
import json
import logging
import unicodedata
from io import BytesIO
import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ..services.embedding_service import EmbeddingService
from ..services.chroma_db import add_document_chunks
from ..config.settings import settings

logger = logging.getLogger(__name__)
embedding_service = EmbeddingService()

# Section headers to detect (case-insensitive)
SECTION_PATTERNS = {
    "abstract": r"\babstract\b",
    "introduction": r"\bintroduction\b",
    "methods": r"\b(methods?|methodology|materials\s+and\s+methods?)\b",
    "results": r"\bresults?\b",
    "discussion": r"\bdiscussion\b",
    "conclusion": r"\bconclusion(s)?\b",
    "references": r"\breferences?\b",
}

def clean_text(text: str) -> str:
    """
    Perform text hardening:
    1. Unicode NFC normalization.
    2. Removal of control characters (except \n, \r, \t).
    3. Normalization of inconsistent whitespace.
    """
    if not text:
        return ""
    
    # 1. Unicode Normalization (NFC)
    text = unicodedata.normalize("NFC", text)
    
    # 2. Remove control characters (C0 & C1 control blocks)
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C" or ch in "\n\r\t")
    
    # 3. Normalize whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\r\n", "\n", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    return text.strip()

def extract_text_from_pdf(file_content: bytes) -> tuple[str, int]:
    """
    Extract full text from PDF bytes using pypdf.
    Returns: (full_text, page_count)
    """
    debug_mode = settings.DEBUG
    
    try:
        reader = pypdf.PdfReader(BytesIO(file_content))
        pages_text: list[str] = []
        page_count = len(reader.pages)

        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append(text)
                    if debug_mode:
                        logger.debug(f"[Extraction] Page {i+1}/{page_count}: {len(text)} chars extracted")
                elif debug_mode:
                    logger.debug(f"[Extraction] Page {i+1}/{page_count}: No readable text layer found")
            except Exception as page_err:
                logger.warning(f"[Extraction] Failed to extract text from page {i+1}: {page_err}")

        full_text = clean_text("\n\n".join(pages_text))
        total_chars = len(full_text)
        
        logger.info(
            f"[Extraction] Summary: {page_count} pages, {total_chars} total chars "
            f"({(total_chars/page_count):.1f} avg/page)" if page_count > 0 else "[Extraction] Summary: 0 pages"
        )
        
        return full_text, page_count

    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return "", 0

def detect_section(text: str) -> str:
    """Detect which academic section a chunk likely belongs to."""
    text_lower = text[:300].lower()
    for section, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, text_lower):
            return section
    return "body"

def chunk_text_with_sections(full_text: str) -> list[dict]:
    """Split text into overlapping chunks and annotate with detected section."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(full_text)
    return [
        {
            "index": i,
            "text": chunk,
            "section": detect_section(chunk),
            "token_count": max(1, len(chunk.split())),
        }
        for i, chunk in enumerate(chunks)
    ]

async def process_document_pipeline(
    filename: str,
    file_content: bytes,
    metadata: dict,
) -> dict:
    """
    Full document processing pipeline using PyPDF, Gemini, and ChromaDB.
    """
    document_id: str = str(metadata.get("documentId", "")).strip()
    user_id: str = str(metadata.get("userId", "")).strip()

    if not document_id:
        logger.error("[Process] CRITICAL: documentId missing in metadata")
        raise ValueError("documentId must be provided in metadata for RAG mapping")

    logger.info(f"[Process] Processing doc={document_id} user={user_id} file='{filename}'")

    # Step 1: Extract text (PyPDF)
    full_text, page_count = extract_text_from_pdf(file_content)
    
    classification = "healthy"
    if page_count == 0:
        raise ValueError("The PDF appears to have no pages or is corrupted.")

    if not full_text.strip():
        raise ValueError(
            "Scanned PDF detected. This document has no readable text layer. "
            "Please upload a text-based PDF or use a document with the text layer preserved."
        )

    if page_count >= 2:
        chars_per_page = len(full_text) / page_count
        if chars_per_page < 10:
            classification = "suspicious"
            logger.warning(
                f"[Process] Low text density detected ({chars_per_page:.1f} chars/page). "
                "Classifying as suspicious."
            )

    logger.info(
        f"[Process] Validated extraction: {len(full_text)} chars, {page_count} pages, classification={classification}"
    )

    # Step 2: Section-aware chunking
    chunks_data = chunk_text_with_sections(full_text)
    if not chunks_data:
        raise ValueError("No chunks generated from document.")

    logger.info(f"[Process] Generated {len(chunks_data)} chunks")

    # Step 3: Batch embed with Gemini API
    chunk_texts = [c["text"] for c in chunks_data]
    embeddings = await embedding_service.generate_embeddings(chunk_texts)

    if not embeddings or len(embeddings) == 0:
        raise ValueError("Embedding generation returned no results")

    logger.info(f"[Process] Embedded {len(embeddings)} chunks")

    # Step 4: Store chunks in ChromaDB
    await add_document_chunks(
        document_id=document_id,
        user_id=user_id,
        chunks_data=chunks_data,
        embeddings=embeddings
    )

    return {
        "documentId": document_id,
        "filename": filename,
        "pageCount": page_count,
        "chunksProcessed": len(chunks_data),
        "embeddingDimensions": len(embeddings[0]) if embeddings else 0,
        "status": "completed",
        "classification": classification,
        "summary": {
            "totalChars": len(full_text),
            "avgCharsPerPage": len(full_text) / page_count if page_count > 0 else 0
        },
        "fullText": full_text[:200_000], 
    }
