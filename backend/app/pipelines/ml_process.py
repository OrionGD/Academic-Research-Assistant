"""
Document Processing Pipeline with OCR fallback support.
Fallback chain: pypdf → PyMuPDF (fitz) → pytesseract OCR (pdf2image)
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
from ..services.chroma_db import add_document_chunks, EXPECTED_EMBEDDING_DIM
from ..config.settings import settings
from ..core.gemini_client import gemini_client

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


def _extract_with_pypdf(file_content: bytes) -> tuple[str, int]:
    """Primary extraction using pypdf."""
    reader = pypdf.PdfReader(BytesIO(file_content))
    pages_text = []
    page_count = len(reader.pages)

    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(text)
        except Exception as page_err:
            logger.warning(f"[Extraction:pypdf] Failed to extract text from page {i+1}: {page_err}")

    return clean_text("\n\n".join(pages_text)), page_count


def _extract_with_fitz(file_content: bytes) -> tuple[str, int]:
    """Fallback extraction using PyMuPDF (fitz)."""
    try:
        import fitz
        doc = fitz.open(stream=file_content, filetype="pdf")
        pages_text = []
        page_count = len(doc)
        for page in doc:
            text = page.get_text() or ""
            if text.strip():
                pages_text.append(text)
        doc.close()
        return clean_text("\n\n".join(pages_text)), page_count
    except ImportError:
        logger.warning("[Extraction:fitz] PyMuPDF not available. Skipping fitz fallback.")
        return "", 0
    except Exception as e:
        logger.warning(f"[Extraction:fitz] Failed: {e}")
        return "", 0


def _extract_with_ocr(file_content: bytes) -> tuple[str, int]:
    """Last-resort OCR extraction using pdf2image + pytesseract."""
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError:
        logger.warning(
            "[Extraction:OCR] pdf2image or pytesseract not installed. "
            "Skipping OCR fallback. Install with: pip install pdf2image pytesseract"
        )
        return "", 0

    try:
        images = convert_from_bytes(file_content, dpi=200)
        pages_text = []
        for i, image in enumerate(images):
            try:
                text = pytesseract.image_to_string(image)
                if text and text.strip():
                    pages_text.append(text)
            except Exception as ocr_err:
                logger.warning(f"[Extraction:OCR] Tesseract failed on page {i+1}: {ocr_err}")

        if not pages_text:
            logger.warning("[Extraction:OCR] No text extracted via OCR.")
        return clean_text("\n\n".join(pages_text)), len(images)
    except Exception as e:
        logger.warning(f"[Extraction:OCR] pdf2image conversion failed: {e}")
        return "", 0


async def extract_text_from_pdf(file_content: bytes, filename: str = "document.pdf") -> tuple[str, int]:
    """
    Extract full text from PDF bytes using a fallback chain:
      1. pypdf (fast, preserves text layer)
      2. PyMuPDF / fitz (better handling of complex layouts)
      3. OCR via pdf2image + pytesseract (scanned PDFs)
      4. Gemini Vision (Ultimate AI fallback for scanned/complex docs)
    Returns: (full_text, page_count)
    """
    # Attempt 1: pypdf
    full_text, page_count = _extract_with_pypdf(file_content)
    if full_text.strip():
        logger.info(f"[Extraction] pypdf: {page_count} pages, {len(full_text)} chars")
        return full_text, page_count
    logger.warning("[Extraction] pypdf returned empty text. Trying PyMuPDF fallback...")

    # Attempt 2: fitz
    full_text, page_count = _extract_with_fitz(file_content)
    if full_text.strip():
        logger.info(f"[Extraction] fitz: {page_count} pages, {len(full_text)} chars")
        return full_text, page_count
    logger.warning("[Extraction] PyMuPDF returned empty text. Trying OCR fallback...")

    # Attempt 3: OCR
    full_text, page_count = _extract_with_ocr(file_content)
    if full_text.strip():
        logger.info(f"[Extraction] OCR: {page_count} pages, {len(full_text)} chars")
        return full_text, page_count
    logger.warning("[Extraction] OCR returned empty text. Trying Gemini Vision fallback...")

    # Attempt 4: Gemini Multimodal (Ultimate Fallback)
    try:
        full_text = await gemini_client.vision_extract_text(file_content, filename)
        if full_text.strip():
            # Estimate page count if not already known
            if page_count <= 0:
                # Fallback estimate
                page_count = max(1, len(file_content) // 200_000) 
            logger.info(f"[Extraction] Gemini Vision: {len(full_text)} chars extracted.")
            return full_text, page_count
    except Exception as e:
        logger.error(f"[Extraction] Gemini Vision fallback failed: {e}")

    # Nothing worked
    return "", page_count if page_count > 0 else 0


def detect_section(text: str) -> str:
    """Detect which academic section a chunk likely belongs to."""
    text_lower = text[:300].lower()
    for section, pattern in SECTION_PATTERNS.items():
        if re.search(pattern, text_lower):
            return section
    return "body"


def chunk_text_with_sections(full_text: str, page_count: int = 0) -> list[dict]:
    """Split text into overlapping chunks and annotate with detected section and estimated page number."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(full_text)

    # Estimate page numbers based on character position
    total_chars = len(full_text)
    chars_per_page = total_chars / page_count if page_count > 0 else total_chars

    result = []
    current_pos = 0
    for i, chunk in enumerate(chunks):
        # Find the chunk position in the full text
        chunk_start = full_text.find(chunk, current_pos)
        if chunk_start == -1:
            chunk_start = current_pos
        current_pos = chunk_start + len(chunk)

        # Estimate page number (1-indexed)
        estimated_page = None
        if page_count > 0 and chars_per_page > 0:
            estimated_page = max(1, min(page_count, int(chunk_start / chars_per_page) + 1))

        result.append({
            "index": i,
            "text": chunk,
            "section": detect_section(chunk),
            "token_count": max(1, len(chunk.split())),
            "pageNumber": estimated_page,
            "charStart": chunk_start,
        })

    return result


async def process_text_pipeline(
    text: str,
    metadata: dict,
    page_count: int = 1,
    filename: str = "text_source"
) -> dict:
    """
    RAG processing pipeline for raw text.
    Handles cleaning, chunking, embedding, and storing in ChromaDB.
    """
    document_id: str = str(metadata.get("documentId", "")).strip()
    user_id: str = str(metadata.get("userId", "public")).strip()

    if not document_id:
        logger.error("[ProcessText] CRITICAL: documentId missing in metadata")
        raise ValueError("documentId must be provided in metadata for RAG mapping")

    # Step 1: Clean text
    cleaned_text = clean_text(text)
    if not cleaned_text.strip():
        raise ValueError("Text content is empty after cleaning.")

    # Step 2: Section-aware chunking
    chunks_data = chunk_text_with_sections(cleaned_text, page_count)
    if not chunks_data:
        raise ValueError("No chunks generated from text.")

    logger.info(f"[ProcessText] Generated {len(chunks_data)} chunks for doc={document_id}")

    # Step 3: Batch embed and store
    embeddings = []
    try:
        chunk_texts = [c["text"] for c in chunks_data]
        embeddings = await embedding_service.generate_embeddings(chunk_texts)

        if embeddings and len(embeddings) > 0:
            valid_pairs = [(c, e) for c, e in zip(chunks_data, embeddings) if e is not None]
            if len(valid_pairs) != len(chunks_data):
                chunks_data = [p[0] for p in valid_pairs]
                embeddings = [p[1] for p in valid_pairs]

            if embeddings:
                # Validate dimensions
                if len(embeddings[0]) == EXPECTED_EMBEDDING_DIM:
                    await add_document_chunks(
                        document_id=document_id,
                        user_id=user_id,
                        chunks_data=chunks_data,
                        embeddings=embeddings
                    )
                    logger.info(f"[ProcessText] Successfully indexed {len(embeddings)} chunks in ChromaDB")
                else:
                    logger.error(f"[ProcessText] Dimension mismatch: expected {EXPECTED_EMBEDDING_DIM}, got {len(embeddings[0])}")
    except Exception as e:
        logger.warning(f"[ProcessText] Embedding/ChromaDB failed: {e}")

    return {
        "documentId": document_id,
        "filename": filename,
        "chunksProcessed": len(chunks_data),
        "status": "completed",
        "fullText": cleaned_text[:200_000],
    }


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

    # Step 1: Extract text with fallback chain
    full_text, page_count = await extract_text_from_pdf(file_content, filename)

    if page_count == 0:
        raise ValueError("The PDF appears to have no pages or is corrupted.")

    if not full_text.strip():
        raise ValueError(
            "Scanned PDF detected. This document has no readable text layer, "
            "and OCR fallback also failed."
        )

    classification = "healthy"
    if page_count >= 2:
        chars_per_page = len(full_text) / page_count
        if chars_per_page < 10:
            classification = "suspicious"

    # Step 2-4: Hand over to text pipeline for chunking/embedding/storing
    text_result = await process_text_pipeline(
        text=full_text,
        metadata=metadata,
        page_count=page_count,
        filename=filename
    )

    return {
        **text_result,
        "pageCount": page_count,
        "classification": classification,
        "summary": {
            "totalChars": len(full_text),
            "avgCharsPerPage": len(full_text) / page_count if page_count > 0 else 0
        },
    }

