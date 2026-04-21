"""
RAG Chat Pipeline with Multi-LLM Support

Implements conversational research assistant with:
  - ChromaDB semantic search for context retrieval
  - Response generation via Gemini, Groq, OpenAI, or Anthropic
  - Explicit source citations in outputs
"""
import os
import json
import logging
from typing import AsyncIterator
import asyncio

from services.config import (
    LLM_PROVIDER,
    GEMINI_API_KEY,
    GROQ_API_KEY,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    CHAT_MODEL
)
from pipelines.search import search_pipeline

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

Use the retrieved document context below to answer the user's question accurately.
- Cite sources strictly using [Source N] notation when referencing specific content.
- If the context is missing or insufficient, state that you cannot answer based on the provided documents. Do NOT hallucinate or fabricate information.
- Provide a clear, precise, and well-structured response.

Retrieved Context:
{context_text}

User Question: {message}
"""

async def _generate_gemini(prompt: str) -> str:
    from google import genai
    client = genai.Client(api_key=GEMINI_API_KEY)
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=CHAT_MODEL if CHAT_MODEL else "gemini-1.5-flash",
            contents=prompt
        )
    )
    return response.text or ""

async def _generate_groq(prompt: str) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=GROQ_API_KEY)
    completion = await client.chat.completions.create(
        model="llama3-8b-8192", # Default, ideally config driven
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return completion.choices[0].message.content or ""

async def _generate_openai(prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    completion = await client.chat.completions.create(
        model="gpt-4o-mini", # Default
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return completion.choices[0].message.content or ""

async def _generate_anthropic(prompt: str) -> str:
    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    message = await client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1024,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

async def chat_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> dict:
    """Multi-LLM RAG chat. Returns structured response with answer and sources."""
    context_parts, context_text = await _build_context(message, user_id, document_ids)
    prompt = _build_prompt(message, context_text)

    try:
        if LLM_PROVIDER == "groq":
            answer = await _generate_groq(prompt)
        elif LLM_PROVIDER == "openai":
            answer = await _generate_openai(prompt)
        elif LLM_PROVIDER == "anthropic":
            answer = await _generate_anthropic(prompt)
        else:
            # Default to gemini
            answer = await _generate_gemini(prompt)
    except Exception as e:
        logger.error(f"LLM Generation failed for provider {LLM_PROVIDER}: {e}")
        answer = f"Error generating answer with {LLM_PROVIDER}."

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
        "answer": answer,
        "sources": citations,
        "contextChunksUsed": len(context_parts),
        "provider": LLM_PROVIDER
    }

async def chat_stream_pipeline(
    message: str,
    user_id: str = "",
    document_ids: list[str] | None = None,
) -> AsyncIterator[str]:
    """
    Streaming bridge to return formatted JSON chunks depending on provider.
    (This yields the answer as a single block for non-streaming providers currently).
    """
    # For a fully functional stream across 4 different SDKs properly handled
    # we would need 4 different stream handlers. For now, since user
    # specifically requested JSON format with answer & sources,
    # we yield standard chat_pipeline response as a stream payload
    # if the backend still expects SSE.
    
    response = await chat_pipeline(message, user_id, document_ids)
    
    # Send the single generated chunk
    yield f"data: {json.dumps({'chunk': response['answer']})}\n\n"
    
    # Final event with citations
    yield f"data: {json.dumps({'done': True, 'citations': response['sources'], 'sources': [s['documentId'] for s in response['sources']]})}\n\n"
    yield "data: [DONE]\n\n"
