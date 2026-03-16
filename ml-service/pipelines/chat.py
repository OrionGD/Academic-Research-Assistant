"""
RAG Chat Pipeline

Implements conversational research assistant with:
  - Hybrid semantic search for context retrieval (with userId scoping)
  - Token-budget context deduplication
  - Gemini streaming response
  - Source citations
"""
import os
import logging
import asyncio
from typing import AsyncIterator
from google import genai
from services.config import GEMINI_API_KEY, CHAT_MODEL
from pipelines.search import search_pipeline

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS = 20_000


def get_genai_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=GEMINI_API_KEY)


async def _build_context(
    message: str,
    user_id: str,
    document_ids: list[str] | None,
) -> tuple[list[dict], str]:
    """
    Retrieve and deduplicate relevant chunks, return context parts and formatted text.
    Always passes user_id to enforce multi-tenant isolation.
    """
    search_results = await search_pipeline(
        message,
        limit=7,
        user_id=user_id,
        document_ids=document_ids,
    )

    seen: set[str] = set()
    context_parts: list[dict] = []
    total_chars = 0

    for i, result in enumerate(search_results):
        key = f"{result['documentId']}:{result['chunkIndex']}"
        if key in seen:
            continue
        seen.add(key)

        chunk_text = result.get("fullText", "")
        if total_chars + len(chunk_text) > MAX_CONTEXT_CHARS:
            break

        total_chars += len(chunk_text)
        context_parts.append({
            "index": i + 1,
            "text": chunk_text,
            "documentId": result["documentId"],
            "chunkIndex": result["chunkIndex"],
            "section": result.get("section", "unknown"),
            "score": result.get("relevanceScore", 0),
        })

    context_text = (
        "\n\n---\n\n".join(
            f"[Source {p['index']} | Doc: {p['documentId']} | Section: {p['section']}]\n{p['text']}"
            for p in context_parts
        )
        if context_parts
        else "No relevant context found in the indexed documents."
    )

    return context_parts, context_text


def _build_prompt(message: str, context_text: str) -> str:
    return f"""You are ARAS, an expert AI Academic Research Assistant.

Use the retrieved document context below to answer the question accurately.
- Cite sources using [Source N] notation when referencing specific content.
- If the context is insufficient, say so honestly — do NOT fabricate information.
- Be clear, precise, and well-structured in your response.

Retrieved Context:
{context_text}

User Question: {message}"""


async def chat_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> dict:
    """Standard (non-streaming) RAG chat. Returns full structured response."""
    context_parts, context_text = await _build_context(message, user_id, document_ids)
    prompt = _build_prompt(message, context_text)

    client = get_genai_client()
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(model=CHAT_MODEL, contents=prompt),
    )

    citations = [
        {
            "index": p["index"],
            "documentId": p["documentId"],
            "chunkIndex": p["chunkIndex"],
            "section": p["section"],
            "relevanceScore": p["score"],
        }
        for p in context_parts
    ]

    return {
        "message": {
            "id": f"msg-{os.urandom(4).hex()}",
            "role": "assistant",
            "content": response.text or "No response generated.",
        },
        "citations": citations,
        "sources": [p["documentId"] for p in context_parts],
        "contextChunksUsed": len(context_parts),
    }


async def chat_stream_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> AsyncIterator[str]:
    """
    Streaming RAG chat using Gemini generateContentStream.
    Yields SSE-formatted strings: data lines followed by data: [DONE].
    """
    import json

    context_parts, context_text = await _build_context(message, user_id, document_ids)
    prompt = _build_prompt(message, context_text)

    citations = [
        {
            "index": p["index"],
            "documentId": p["documentId"],
            "chunkIndex": p["chunkIndex"],
            "section": p["section"],
            "relevanceScore": p["score"],
        }
        for p in context_parts
    ]

    client = get_genai_client()
    loop = asyncio.get_event_loop()

    def _run_stream():
        return list(client.models.generate_content_stream(model=CHAT_MODEL, contents=prompt))

    chunks = await loop.run_in_executor(None, _run_stream)

    for chunk in chunks:
        text = getattr(chunk, "text", None) or ""
        if text:
            yield f"data: {json.dumps({'chunk': text})}\n\n"

    # Final event with citations
    yield f"data: {json.dumps({'done': True, 'citations': citations, 'sources': [p['documentId'] for p in context_parts]})}\n\n"
    yield "data: [DONE]\n\n"
