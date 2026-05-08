"""
Gemini API client for embeddings and analytics using the modern google-genai SDK.
Uses two separate API keys to avoid quota conflicts:
  - GEMINI_EMBEDDING_API_KEY  → embeddings only
  - GEMINI_ANALYSIS_API_KEY   → analysis / chat generation only
"""
import logging
import time
from typing import List, Dict, Any
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_RETRIES = 6
BASE_BACKOFF = 1.5  # seconds


def _resolve_key(primary: str, fallback: str) -> str:
    """Return primary if non-empty, else fallback."""
    return primary.strip() if primary and primary.strip() else fallback.strip()


def _retry_with_backoff(func, *args, **kwargs):
    """Retry Gemini API calls with exponential backoff on 429 / 5xx / quota errors."""
    last_exc = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            last_exc = e
            msg = str(e).lower()
            is_permanent = any(k in msg for k in ("403", "permission_denied", "permission denied"))
            if is_permanent:
                logger.error(f"[PERMANENT FAILURE] Gemini API Error: {e}")
                raise e
            
            is_rate_limit = any(k in msg for k in ("429", "quota", "rate limit", "resource exhausted"))
            is_server_err = any(k in msg for k in ("503", "502", "500", "internal", "timeout", "connection"))
            if not (is_rate_limit or is_server_err):
                raise e
            wait = BASE_BACKOFF * (2 ** (attempt - 1))
            logger.warning(f"[TRANSIENT FAILURE] Gemini API attempt {attempt}/{MAX_RETRIES} failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    raise last_exc


class GeminiClient:
    """Client for Gemini API operations using google-genai"""

    def __init__(self):
        # Resolve keys (prefer dedicated keys, fall back to legacy single key)
        self.embedding_api_key = _resolve_key(
            settings.gemini_embedding_api_key,
            settings.gemini_api_key
        )
        self.analysis_api_key = _resolve_key(
            settings.gemini_analysis_api_key,
            settings.gemini_api_key
        )

        self.embedding_model_name = settings.gemini_embedding_model
        self.embedding_dim = settings.gemini_embedding_dim
        self.chat_model_name = settings.gemini_analysis_model

        # Two isolated clients to prevent quota contention
        self.embedding_client = None
        self.analysis_client = None

        if self.embedding_api_key:
            try:
                self.embedding_client = genai.Client(
                    api_key=self.embedding_api_key,
                    http_options=types.HttpOptions(api_version='v1')
                )
                logger.info("Gemini Embedding Client initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Embedding Client: {e}")
        else:
            logger.warning("GEMINI_EMBEDDING_API_KEY not found. Embedding services unavailable.")

        if self.analysis_api_key:
            try:
                self.analysis_client = genai.Client(
                    api_key=self.analysis_api_key,
                    http_options=types.HttpOptions(api_version='v1')
                )
                logger.info("Gemini Analysis Client initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Analysis Client: {e}")
        else:
            logger.warning("GEMINI_ANALYSIS_API_KEY not found. Analysis services unavailable.")

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    def _ensure_embedding_client(self):
        if not self.embedding_client:
            raise ValueError("Gemini Embedding Client not initialized. Check GEMINI_EMBEDDING_API_KEY.")

    def _ensure_analysis_client(self):
        if not self.analysis_client:
            raise ValueError("Gemini Analysis Client not initialized. Check GEMINI_ANALYSIS_API_KEY.")

    def _validate_embedding_dim(self, embedding: List[float], context: str = "") -> List[float]:
        """Ensure embedding is exactly self.embedding_dim; warn otherwise."""
        dim = len(embedding)
        if dim != self.embedding_dim:
            logger.warning(
                f"Embedding dimension mismatch ({context}): expected {self.embedding_dim}, got {dim}. "
                "Ensure gemini_embedding_model and gemini_embedding_dim match."
            )
        return embedding

    # -----------------------------------------------------------------------
    # Embeddings (embedding_client only)
    # -----------------------------------------------------------------------
    def generate_embedding(self, text: str) -> List[float]:
        """Generate a single embedding via the embedding client."""
        self._ensure_embedding_client()
        if not text:
            text = " "

        def _call():
            response = self.embedding_client.models.embed_content(
                model=self.embedding_model_name,
                contents=text
            )
            if response.embeddings and response.embeddings[0].values:
                return response.embeddings[0].values
            raise ValueError("Gemini API returned empty embedding values")

        embedding = _retry_with_backoff(_call)
        return self._validate_embedding_dim(embedding, context="single")

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in a single batch.
        Validates exact 1:1 output mapping and consistent dimensions.
        Falls back to individual calls on mismatch.
        """
        self._ensure_embedding_client()
        if not texts:
            return []

        # Defensive: replace empty strings with space so API doesn't choke
        safe_texts = [t if t and t.strip() else " " for t in texts]

        try:
            def _call():
                return self.embedding_client.models.embed_content(
                    model=self.embedding_model_name,
                    contents=safe_texts
                )

            response = _retry_with_backoff(_call)
            embeddings = [emb.values for emb in response.embeddings]

            # 1) Count validation
            if len(embeddings) != len(texts):
                raise ValueError(
                    f"Batch embedding count mismatch: expected {len(texts)}, got {len(embeddings)}"
                )

            # 2) Dimension validation
            for i, emb in enumerate(embeddings):
                dim = len(emb)
                if dim != self.embedding_dim:
                    raise ValueError(
                        f"Batch embedding dimension mismatch at index {i}: expected {self.embedding_dim}, got {dim}"
                    )

            return embeddings

        except Exception as e:
            msg = str(e).lower()
            is_permanent = any(k in msg for k in ("403", "permission_denied", "permission denied"))
            
            logger.error(
                f"Embedding failed: {e}",
                extra={
                    "total_chunks": len(texts),
                    "model": self.embedding_model_name,
                    "reason": str(e),
                    "type": "permanent" if is_permanent else "transient"
                }
            )

            if is_permanent:
                logger.error("Batch embedding failed permanently. Skipping fallback.")
                return [None] * len(texts)

            logger.error(f"Batch embedding failed ({e}). Falling back to individual calls.")
            embeddings = []
            for text in safe_texts:
                try:
                    emb = self.generate_embedding(text)
                    embeddings.append(emb)
                except Exception as inner:
                    logger.error(f"Individual embedding failed for chunk: {inner}")
                    embeddings.append(None)
            return embeddings

    # -----------------------------------------------------------------------
    # Analysis / Generation (analysis_client only)
    # -----------------------------------------------------------------------
    def analyze_document(self, chunks: List[str], title: str = "Document") -> Dict[str, Any]:
        """Analyze document and generate summary, keywords, and topics."""
        try:
            self._ensure_analysis_client()
            combined_text = " ".join(chunks[:10])

            prompt = f"""
            Please analyze this academic document titled "{title}".
            Provide the following in your response:
            1. A concise summary (2-3 sentences).
            2. Top 10 keywords (comma separated).
            3. Main topics (list).

            Document Content:
            {combined_text[:4000]}
            """

            def _call():
                return self.analysis_client.models.generate_content(
                    model=self.chat_model_name,
                    contents=prompt
                )

            response = _retry_with_backoff(_call)
            raw_text = response.text if response and response.text else ""

            summary = "Summary not available"
            keywords = []
            topics = []

            if "1." in raw_text:
                parts = raw_text.split("2.")
                summary = parts[0].replace("1.", "").strip()
                if len(parts) > 1:
                    subparts = parts[1].split("3.")
                    keywords = [k.strip() for k in subparts[0].split(",")]
                    if len(subparts) > 1:
                        topics = [t.strip("- ").strip() for t in subparts[1].split("\n") if t.strip()]

            total_words = sum(len(chunk.split()) for chunk in chunks)
            reading_time = max(1, round(total_words / 200))

            return {
                "summary": summary,
                "keywords": keywords[:10],
                "topics": topics[:5],
                "reading_time": reading_time,
                "chunk_count": len(chunks),
                "total_words": total_words
            }
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            return {
                "summary": "Analysis failed",
                "keywords": [],
                "topics": [],
                "reading_time": 0,
                "chunk_count": len(chunks),
                "total_words": sum(len(chunk.split()) for chunk in chunks)
            }

    async def vision_extract_text(self, file_content: bytes, filename: str = "document.pdf") -> str:
        """
        Extract verbatim text from a PDF (even scanned ones) using Gemini Multimodal.
        """
        self._ensure_analysis_client()
        
        try:
            # Inline data part for PDF
            # google-genai SDK handles this via a Part with inline_data
            pdf_part = types.Part.from_bytes(
                data=file_content,
                mime_type="application/pdf"
            )

            prompt = (
                "ACT AS AN OCR ENGINE. Extract all text from this PDF document exactly as it appears. "
                "Do not summarize. Provide the full verbatim text. "
                "If there are multiple pages, include text from all of them in order."
            )

            def _call():
                return self.analysis_client.models.generate_content(
                    model=self.chat_model_name,
                    contents=[pdf_part, prompt],
                    config=types.GenerateContentConfig(
                        temperature=0.0,  # Zero temperature for deterministic extraction
                    )
                )

            logger.info(f"[Gemini:Vision] Attempting multimodal extraction for {filename} ({len(file_content)} bytes)")
            response = await _retry_with_backoff(_call) if hasattr(_retry_with_backoff, "__await__") else _retry_with_backoff(_call)
            
            extracted_text = response.text if response and hasattr(response, "text") else ""
            
            if extracted_text:
                logger.info(f"[Gemini:Vision] Successfully extracted {len(extracted_text)} characters.")
                return extracted_text.strip()
            
            logger.warning("[Gemini:Vision] No text returned from multimodal extraction.")
            return ""
            
        except Exception as e:
            logger.error(f"[Gemini:Vision] Multimodal extraction failed: {e}")
            return ""

    def generate_content(self, model: str, prompt: str) -> str:
        """Generate text content using Gemini Analysis client."""
        try:
            self._ensure_analysis_client()

            def _call():
                response = self.analysis_client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response

            response = _retry_with_backoff(_call)
            return response.text if response and getattr(response, "text", None) else ""
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            raise


# Singleton instance
gemini_client = GeminiClient()

