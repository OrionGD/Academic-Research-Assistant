import logging
import asyncio
import json
import time
import re
from collections import Counter

logger = logging.getLogger(__name__)


def _extractive_summary(text: str, num_sentences: int = 8) -> str:
    """Simple extractive summarization using sentence scoring."""
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if len(sentences) <= num_sentences:
        return text.strip()

    # Score sentences by word frequency (TF-based)
    words = re.findall(r'\w+', text.lower())
    freq = Counter(words)
    # Remove very common words
    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
                 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'that', 'this',
                 'it', 'be', 'as', 'by', 'from', 'have', 'has', 'had', 'not', 'do'}
    for sw in stopwords:
        freq.pop(sw, None)

    scored = []
    for i, sent in enumerate(sentences):
        words_in = re.findall(r'\w+', sent.lower())
        score = sum(freq.get(w, 0) for w in words_in) / (len(words_in) + 1)
        # Slight boost for early sentences (intro usually matters)
        if i < 5:
            score *= 1.3
        scored.append((score, i, sent))

    scored.sort(reverse=True)
    top = sorted(scored[:num_sentences], key=lambda x: x[1])
    return ' '.join(s[2] for s in top)


def _extract_key_insights(text: str, n: int = 6) -> list[str]:
    """Extract key sentences that look like findings/contributions."""
    patterns = [
        r'(?:we (?:propose|present|introduce|demonstrate|show|find|observe|develop))[^.]+\.',
        r'(?:our (?:approach|method|system|framework|model|results))[^.]+\.',
        r'(?:the results (?:show|indicate|demonstrate|suggest))[^.]+\.',
        r'(?:this (?:paper|work|study|research) (?:presents|proposes|introduces|addresses))[^.]+\.',
        r'(?:significantly|notably|importantly)[^.]+\.',
    ]
    insights = []
    for pat in patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            clean = m.strip()
            if len(clean) > 30 and clean not in insights:
                insights.append(clean)
            if len(insights) >= n:
                break
        if len(insights) >= n:
            break

    # Fallback: take early sentences if not enough pattern matches
    if len(insights) < 3:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        for s in sentences[:20]:
            if len(s) > 40 and s not in insights:
                insights.append(s)
            if len(insights) >= n:
                break

    return insights[:n]


def _extract_section(text: str, keywords: list[str], fallback: str = "") -> str:
    """Try to extract a section by heading keywords."""
    for kw in keywords:
        # Match section headings like "3. Methodology" or "## Methodology" or "METHODOLOGY"
        pattern = rf'(?:^|\n)(?:\d+\.?\s*)?(?:#+\s*)?{kw}\s*\n([\s\S]*?)(?=\n(?:\d+\.?\s*)?(?:#+\s*)?[A-Z][a-z]|\Z)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            section = match.group(1).strip()
            # Limit length
            if len(section) > 2000:
                section = section[:2000] + "..."
            return section
    return fallback


async def analyze_document_pipeline(document_id: str, full_text: str) -> dict:
    """
    Run local analysis pipeline on a document.
    Uses extractive methods — NO Gemini API calls.
    """
    start = time.time()

    # Truncate for safety
    text = full_text[:80000] if len(full_text) > 80000 else full_text

    loop = asyncio.get_event_loop()

    # Run CPU-bound extraction in executor
    def _analyze():
        summary = _extractive_summary(text, num_sentences=10)
        key_insights = _extract_key_insights(text)
        methodology = _extract_section(text,
            ['methodology', 'methods', 'approach', 'experimental setup'],
            fallback="Methodology section not automatically detected.")
        results = _extract_section(text,
            ['results', 'findings', 'evaluation', 'experiments'],
            fallback="Results section not automatically detected.")
        limitations = _extract_section(text,
            ['limitations', 'threats to validity', 'constraints'],
            fallback="Limitations section not automatically detected.")
        future_work = _extract_section(text,
            ['future work', 'future directions', 'open questions', 'conclusion'],
            fallback="Future work section not automatically detected.")

        return {
            "summary": summary,
            "keyInsights": key_insights,
            "methodology": methodology,
            "results": results,
            "limitations": limitations,
            "futureWork": future_work,
            "confidenceScore": 0.70,
        }

    try:
        result = await loop.run_in_executor(None, _analyze)
    except Exception as e:
        logger.error(f"Analysis pipeline failed for {document_id}: {e}")
        result = {
            "summary": "Analysis failed. Please retry.",
            "keyInsights": [],
            "methodology": "",
            "results": "",
            "limitations": "",
            "futureWork": "",
            "confidenceScore": 0.0,
        }

    processing_time = int((time.time() - start) * 1000)
    result["documentId"] = document_id
    result["processingTime"] = processing_time
    result["modelVersion"] = "local-extractive-v1"

    logger.info(f"[AnalyzePipeline] doc={document_id} time={processing_time}ms")
    return result
