"""
RAG Chat Pipeline with Multi-LLM Support
"""
import os
import json
import logging
from typing import AsyncIterator
import asyncio

from ..config.settings import settings
from .ml_search import search_pipeline

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS = 20_000

async def _build_context(
    message: str,
    user_id: str,
    document_ids: list[str] | None,
) -> tuple[list[dict], str]:
    """
    Retrieve relevant chunks, return context parts and formatted text.
    """
    search_results = await search_pipeline(
        query=message,
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
            "pageNumber": result.get("pageNumber"),
        })

    lines = []
    for p in context_parts:
        page_info = f" | Page: {p['pageNumber']}" if p.get('pageNumber') else ""
        lines.append(f"[Source {p['index']} | Doc: {p['documentId']} | Section: {p['section']}{page_info}]\n{p['text']}")

    context_text = "\n\n---\n\n".join(lines) if lines else "No relevant context found in the indexed documents."

    return context_parts, context_text


def _build_prompt(message: str, context_text: str) -> str:
    return f"""You are ARAS, an expert AI Academic Research Assistant.

Use the retrieved document context below to answer the user's question accurately.
- Cite sources strictly using [Source N] notation when referencing specific content.
- If page numbers are available, include them in citations like [Source N, Page X].
- If the context is missing or insufficient, state that you cannot answer based on the provided documents. Do NOT hallucinate or fabricate information.
- Provide a clear, precise, and well-structured response.

Retrieved Context:
{context_text}

User Question: {message}
"""


async def _generate_groq(prompt: str) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    completion = await client.chat.completions.create(
        model=settings.GROQ_CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return completion.choices[0].message.content or ""


async def _generate_groq_stream(prompt: str) -> AsyncIterator[str]:
    """Stream tokens from Groq API."""
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    stream = await client.chat.completions.create(
        model=settings.GROQ_CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or "" if chunk.choices else ""
        if delta:
            yield delta


async def chat_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> dict:
    """RAG Chat using Groq. Returns structured response with answer and sources."""
    context_parts, context_text = await _build_context(message, user_id, document_ids)
    prompt = _build_prompt(message, context_text)

    try:
        answer = await _generate_groq(prompt)
    except Exception as e:
        logger.error(f"Groq generation failed: {e}")
        answer = "Error generating answer with Groq."

    citations = [
        {
            "index": p["index"],
            "documentId": p["documentId"],
            "chunkIndex": p["chunkIndex"],
            "section": p["section"],
            "relevanceScore": p["score"],
            "pageNumber": p.get("pageNumber"),
        }
        for p in context_parts
    ]

    return {
        "answer": answer,
        "sources": citations,
        "contextChunksUsed": len(context_parts),
        "provider": settings.LLM_PROVIDER
    }


async def chat_stream_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> AsyncIterator[str]:
    """
    True streaming RAG chat. Yields tokens as they arrive from Groq.
    """
    context_parts, context_text = await _build_context(message, user_id, document_ids)
    prompt = _build_prompt(message, context_text)

    citations = [
        {
            "index": p["index"],
            "documentId": p["documentId"],
            "chunkIndex": p["chunkIndex"],
            "section": p["section"],
            "relevanceScore": p["score"],
            "pageNumber": p.get("pageNumber"),
        }
        for p in context_parts
    ]

    try:
        async for token in _generate_groq_stream(prompt):
            yield f"data: {json.dumps({'chunk': token})}\n\n"
    except Exception as e:
        logger.error(f"Groq streaming failed: {e}")
        yield f"data: {json.dumps({'chunk': 'Error generating response. Please try again.'})}\n\n"

    # Final event with citations
    yield f"data: {json.dumps({'done': True, 'citations': citations, 'sources': [s['documentId'] for s in citations]})}\n\n"
    yield "data: [DONE]\n\n"

