"""
Document Processing Pipeline

Flow:
  1. PDF text extraction  (PyMuPDF + Tesseract OCR fallback)
  2. Section-aware chunking (RecursiveCharacterTextSplitter)
  3. Batch embedding generation  (Gemini text-embedding-004, 768 dims)
  4. Chunk storage in MongoDB   (DocumentChunk schema, with documentId + userId)

IMPORTANT:
  - documentId and userId are passed from the Node.js backend via form metadata.
  - We do NOT create a duplicate document record here — the backend already created it.
  - Chunks are stored with the backend's MongoDB ObjectId string as documentId.
"""
import re
import json
import logging
from io import BytesIO
import pymupdf  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.db import get_db
from services.embedding_service import generate_embeddings_batch
from services.config import CHUNK_SIZE, CHUNK_OVERLAP

logger = logging.getLogger(__name__)

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


def extract_text_from_pdf(file_content: bytes) -> tuple[str, int]:
    """
    Extract full text from PDF bytes.
    Primary:  PyMuPDF (fast, accurate for digital PDFs)
    Fallback: Tesseract OCR (for scanned / image-only pages)
    Returns: (full_text, page_count)
    """
    try:
        doc = pymupdf.open(stream=file_content, filetype="pdf")
        pages_text: list[str] = []
        page_count = doc.page_count

        for page in doc:
            text = page.get_text("text")
            if text.strip():
                pages_text.append(text)
            else:
                # Fallback: render page as image and run OCR
                ocr_text = _ocr_page(doc, page)
                if ocr_text:
                    pages_text.append(ocr_text)

        return "\n\n".join(pages_text), page_count

    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return "", 0


def _ocr_page(doc: pymupdf.Document, page: pymupdf.Page) -> str:
    """Run Tesseract OCR on a single PDF page (scanned documents)."""
    try:
        import pytesseract
        from PIL import Image

        mat = pymupdf.Matrix(200 / 72, 200 / 72)  # 200 DPI
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        image = Image.open(BytesIO(img_bytes))
        text = pytesseract.image_to_string(image, lang="eng")
        logger.info(f"  OCR fallback used for page {page.number}")
        return text.strip()

    except ImportError:
        logger.warning("  pytesseract not available — skipping OCR for this page")
        return ""
    except Exception as e:
        logger.warning(f"  OCR failed on page {page.number}: {e}")
        return ""


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
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
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
    metadata_str: str | None,
) -> dict:
    """
    Full document processing pipeline.
    documentId and userId are injected by the Node.js backend via the metadata field.
    """
    db = get_db()

    # Parse metadata from the backend (contains documentId and userId)
    metadata: dict = {}
    if metadata_str:
        try:
            metadata = json.loads(metadata_str)
        except (json.JSONDecodeError, TypeError):
            logger.warning("Could not parse metadata JSON — using empty metadata")

    # Use the documentId provided by the backend (MongoDB ObjectId string)
    document_id: str = metadata.get("documentId", "")
    user_id: str = metadata.get("userId", "")

    if not document_id:
        raise ValueError("documentId must be provided in metadata by the backend")

    logger.info(f"[Process] Processing doc={document_id} user={user_id} file='{filename}'")

    # Step 1: Extract text (PyMuPDF + Tesseract fallback)
    full_text, page_count = extract_text_from_pdf(file_content)
    if not full_text.strip():
        raise ValueError(
            "Could not extract any text from the PDF. "
            "The file may be blank, image-only, or corrupted."
        )

    logger.info(
        f"[Process] Extracted {len(full_text)} chars, {page_count} pages from '{filename}'"
    )

    # Step 2: Section-aware chunking
    chunks_data = chunk_text_with_sections(full_text)
    if not chunks_data:
        raise ValueError("No chunks generated from document.")

    logger.info(f"[Process] Generated {len(chunks_data)} chunks")

    # Step 3: Batch embed with Gemini text-embedding-004 (768 dims)
    chunk_texts = [c["text"] for c in chunks_data]
    embeddings = await generate_embeddings_batch(chunk_texts)

    if not embeddings or len(embeddings) == 0:
        raise ValueError("Embedding generation returned no results")

    logger.info(
        f"[Process] Embedded {len(embeddings)} chunks ({len(embeddings[0])} dims)"
    )

    # Step 4: Delete any existing chunks for this document (idempotent re-processing)
    await db.document_chunks.delete_many({"documentId": document_id})

    # Step 5: Store chunks in MongoDB (matches DocumentChunk Mongoose schema)
    chunk_docs = [
        {
            "documentId": document_id,   # Backend MongoDB ObjectId string
            "userId": user_id,           # Required for multi-tenant isolation in vector search
            "chunkIndex": c["index"],
            "chunkText": c["text"],
            "embedding": emb,            # 768-dim Gemini vector
            "metadata": {
                "section": c["section"],
                "tokenCount": c["token_count"],
            },
        }
        for c, emb in zip(chunks_data, embeddings)
    ]

    await db.document_chunks.insert_many(chunk_docs)
    logger.info(
        f"[Process] Stored {len(chunk_docs)} chunks for doc={document_id}"
    )

    return {
        "documentId": document_id,
        "filename": filename,
        "pageCount": page_count,
        "chunksProcessed": len(chunk_docs),
        "embeddingDimensions": len(embeddings[0]) if embeddings else 0,
        "status": "completed",
        # Return extracted text so the backend worker can queue the analysis job
        "fullText": full_text[:200_000],  # Cap at 200k chars for the queue payload
    }
