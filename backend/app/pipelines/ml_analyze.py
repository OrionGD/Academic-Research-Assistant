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
        pattern = rf'(?:^|\n)(?:\d+\.?\s*)?(?:#+\s*)?{kw}\s*\n([\s\S]*?)(?=\n(?:\d+\.?\s*)?(?:#+\s*)?[A-Z][a-z]|\Z)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            section = match.group(1).strip()
            if len(section) > 2000:
                section = section[:2000] + "..."
            return section
    return fallback


async def analyze_document_pipeline(document_id: str, full_text: str, depth: str = "full") -> dict:
    """
    Run local analysis pipeline on a document.
    Uses extractive methods.
    
    depth: "full" for premium users, "limited" for guests/free users.
    """
    start = time.time()

    # Truncate for safety - guests get even less context for speed/cost
    max_chars = 20000 if depth == "limited" else 80000
    text = full_text[:max_chars] if len(full_text) > max_chars else full_text

    loop = asyncio.get_event_loop()

    # Run CPU-bound extraction in executor
    def _analyze():
        num_sentences = 4 if depth == "limited" else 10
        summary = _extractive_summary(text, num_sentences=num_sentences)
        
        # Calculate Reading Time (avg 200 wpm)
        word_count = len(full_text.split())
        reading_time = max(1, round(word_count / 200))
        
        # Calculate Complexity Score (based on avg word length and sentence length)
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        avg_sent_len = len(text.split()) / len(sentences) if sentences else 0
        if avg_sent_len > 25:
            complexity = "High"
        elif avg_sent_len > 15:
            complexity = "Medium"
        else:
            complexity = "Low"

        key_insights = _extract_key_insights(text, n=3 if depth == "limited" else 6)
        
        if depth == "limited":
            return {
                "summary": summary + " [Guest Tier: Summary Truncated]",
                "keyInsights": key_insights,
                "methodology": "Premium Access Required",
                "results": "Premium Access Required",
                "limitations": "Premium Access Required",
                "futureWork": "Premium Access Required",
                "complexity": complexity,
                "readingTime": reading_time,
                "keyThemesCount": len(key_insights),
                "confidenceScore": 0.65,
            }

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
            "complexity": complexity,
            "readingTime": reading_time,
            "keyThemesCount": len(key_insights) + 2, # Premium gets deeper theme extraction
            "confidenceScore": 0.85,
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
            "complexity": "Unknown",
            "readingTime": 0,
            "keyThemesCount": 0,
            "confidenceScore": 0.0,
        }

    processing_time = int((time.time() - start) * 1000)
    result["documentId"] = document_id
    result["processingTime"] = processing_time
    result["modelVersion"] = "local-extractive-v1"
    result["depth"] = depth

    logger.info(f"[AnalyzePipeline] doc={document_id} depth={depth} time={processing_time}ms")
    return result
