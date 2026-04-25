import logging
import asyncio
import json
import time
import re
from collections import Counter

from app.core.gemini_client import gemini_client
from app.core.config import settings
from groq import AsyncGroq

logger = logging.getLogger(__name__)

# Fallback extractive methods (used if Gemini fails)
def _extractive_summary(text: str, num_sentences: int = 8) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sentences) <= num_sentences:
        return text.strip()
    words = re.findall(r'\w+', text.lower())
    freq = Counter(words)
    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
                 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'that', 'this',
                 'it', 'be', 'as', 'by', 'from', 'have', 'has', 'had', 'not', 'do'}
    for sw in stopwords:
        freq.pop(sw, None)
    scored = []
    for i, sent in enumerate(sentences):
        words_in = re.findall(r'\w+', sent.lower())
        score = sum(freq.get(w, 0) for w in words_in) / (len(words_in) + 1)
        if i < 5:
            score *= 1.3
        scored.append((score, i, sent))
    scored.sort(reverse=True)
    top = sorted(scored[:num_sentences], key=lambda x: x[1])
    return ' '.join(s[2] for s in top)


def _calculate_reading_time(full_text: str) -> int:
    word_count = len(full_text.split())
    return max(1, round(word_count / 200))


def _calculate_complexity(text: str) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    avg_sent_len = len(text.split()) / len(sentences) if sentences else 0
    if avg_sent_len > 25:
        return "High"
    elif avg_sent_len > 15:
        return "Medium"
    else:
        return "Low"


def _build_analysis_prompt(text: str, title: str = "Research Paper") -> str:
    return f"""You are an expert academic research analyst. Analyze the following research paper and produce a structured JSON output.

Paper Title: {title}

Instructions:
- Read the document carefully and extract the following fields.
- Return ONLY valid JSON. No markdown, no explanations outside the JSON.
- Use concise academic language.
- If a section is not found, use "Not explicitly stated in the document."

Document Content (first ~60k characters):
{text[:60000]}

Required JSON structure:
{{
  "summary": "A comprehensive 4-6 sentence summary of the paper's purpose, methods, and key findings.",
  "keyInsights": [
    "Insight 1: A specific contribution or finding.",
    "Insight 2: Another key contribution or finding.",
    "Insight 3: ... up to 6 insights"
  ],
  "methodology": "Detailed description of the methods, dataset, experimental setup, and approach used.",
  "results": "Summary of the main quantitative and qualitative results, metrics, and outcomes.",
  "limitations": "Description of limitations, threats to validity, or constraints acknowledged by the authors.",
  "futureWork": "Suggested future research directions, open questions, or improvements mentioned.",
  "keyThemesCount": <integer: number of distinct research themes>,
  "confidenceScore": <float 0.0-1.0: how confident you are in this analysis based on text clarity>
}}
"""


async def _analyze_with_groq(text: str, title: str = "Research Paper") -> dict:
    """Analyze document using Groq Llama-3."""
    try:
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        prompt = _build_analysis_prompt(text, title)
        
        completion = await client.chat.completions.create(
            model=settings.GROQ_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"} if "llama-3" in settings.GROQ_CHAT_MODEL.lower() else None
        )
        
        raw = completion.choices[0].message.content or ""
        # Try to find JSON block if not forced
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return {}
    except Exception as e:
        logger.error(f"Groq analysis failed: {e}")
        return {}


async def analyze_document_pipeline(document_id: str, full_text: str, depth: str = "full", title: str = "Research Paper") -> dict:
    """
    AI-powered document analysis pipeline using Google Gemini.
    Falls back to extractive methods if Gemini is unavailable.
    """
    start = time.time()

    word_count = len(full_text.split())
    reading_time = _calculate_reading_time(full_text)
    complexity = _calculate_complexity(full_text)

    # Try Gemini-powered analysis first
    if depth != "limited" and gemini_client.analysis_client:
        try:
            prompt = _build_analysis_prompt(full_text, title)
            response = gemini_client.generate_content(
                model=gemini_client.chat_model_name,
                prompt=prompt
            )

            # Extract JSON from response
            raw = response.strip() if response else ""
            # Try to find JSON block
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                raw_json = json_match.group(0)
                parsed = json.loads(raw_json)

                result = {
                    "summary": parsed.get("summary", ""),
                    "keyInsights": parsed.get("keyInsights", []),
                    "methodology": parsed.get("methodology", ""),
                    "results": parsed.get("results", ""),
                    "limitations": parsed.get("limitations", ""),
                    "futureWork": parsed.get("futureWork", ""),
                    "complexity": complexity,
                    "readingTime": reading_time,
                    "keyThemesCount": parsed.get("keyThemesCount", len(parsed.get("keyInsights", []))),
                    "confidenceScore": parsed.get("confidenceScore", 0.85),
                }

                processing_time = int((time.time() - start) * 1000)
                result["documentId"] = document_id
                result["processingTime"] = processing_time
                result["modelVersion"] = "gemini-2.0-flash"
                result["depth"] = depth
                result["wordCount"] = word_count

                logger.info(f"[AnalyzePipeline] Gemini analysis complete doc={document_id} time={processing_time}ms")
                return result
        except Exception as e:
            logger.warning(f"Gemini analysis failed for {document_id}, trying Groq fallback: {e}")

    # Step 2: Try Groq-powered analysis
    if depth != "limited":
        try:
            parsed = await _analyze_with_groq(full_text, title)
            if parsed:
                result = {
                    "summary": parsed.get("summary", ""),
                    "keyInsights": parsed.get("keyInsights", []),
                    "methodology": parsed.get("methodology", ""),
                    "results": parsed.get("results", ""),
                    "limitations": parsed.get("limitations", ""),
                    "futureWork": parsed.get("futureWork", ""),
                    "complexity": complexity,
                    "readingTime": reading_time,
                    "keyThemesCount": parsed.get("keyThemesCount", len(parsed.get("keyInsights", []))),
                    "confidenceScore": parsed.get("confidenceScore", 0.85),
                }

                processing_time = int((time.time() - start) * 1000)
                result["documentId"] = document_id
                result["processingTime"] = processing_time
                result["modelVersion"] = f"groq-{settings.GROQ_CHAT_MODEL}"
                result["depth"] = depth
                result["wordCount"] = word_count

                logger.info(f"[AnalyzePipeline] Groq analysis complete doc={document_id} time={processing_time}ms")
                return result
        except Exception as e:
            logger.warning(f"Groq analysis failed for {document_id}, falling back to extractive: {e}")

    # Fallback / limited depth: extractive analysis
    num_sentences = 4 if depth == "limited" else 10
    summary = _extractive_summary(full_text, num_sentences=num_sentences)

    if depth == "limited":
        result = {
            "summary": summary + " [Analysis truncated — upload more text for full AI analysis]",
            "keyInsights": [],
            "methodology": "Premium Access Required",
            "results": "Premium Access Required",
            "limitations": "Premium Access Required",
            "futureWork": "Premium Access Required",
            "complexity": complexity,
            "readingTime": reading_time,
            "keyThemesCount": 0,
            "confidenceScore": 0.65,
        }
    else:
        result = {
            "summary": summary,
            "keyInsights": [],
            "methodology": "Methodology section not automatically detected.",
            "results": "Results section not automatically detected.",
            "limitations": "Limitations section not automatically detected.",
            "futureWork": "Future work section not automatically detected.",
            "complexity": complexity,
            "readingTime": reading_time,
            "keyThemesCount": 0,
            "confidenceScore": 0.75,
        }

    processing_time = int((time.time() - start) * 1000)
    result["documentId"] = document_id
    result["processingTime"] = processing_time
    result["modelVersion"] = "fallback-extractive-v2"
    result["depth"] = depth
    result["wordCount"] = word_count

    logger.info(f"[AnalyzePipeline] extractive fallback doc={document_id} depth={depth} time={processing_time}ms")
    return result

