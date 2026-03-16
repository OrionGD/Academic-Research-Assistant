import logging
import asyncio
from google import genai
from services.config import GEMINI_API_KEY, CHAT_MODEL

logger = logging.getLogger(__name__)

ANALYSIS_SYSTEM_PROMPT = """You are an expert academic paper analysis AI. Analyze the provided research paper text and extract structured information.

Return a JSON object with these exact fields:
- summary: A comprehensive 2-3 paragraph summary of the paper
- keyInsights: An array of 5-8 key insights or contributions (strings)
- methodology: Description of the research methodology used
- results: Main results and findings (2-3 paragraphs)
- limitations: Known limitations acknowledged in the paper
- futureWork: Suggested future work or open questions
- confidenceScore: Your confidence in this analysis (0.0 to 1.0)
"""

def get_genai_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set")
    return genai.Client(api_key=GEMINI_API_KEY)

async def analyze_document_pipeline(document_id: str, full_text: str) -> dict:
    """Run AI analysis pipeline on a document. Returns structured analysis."""
    import json, time
    start = time.time()
    
    # Truncate text to avoid token limits (~100k chars max)
    truncated_text = full_text[:80000] if len(full_text) > 80000 else full_text
    
    prompt = f"""{ANALYSIS_SYSTEM_PROMPT}

Research Paper Text:
---
{truncated_text}
---

Return ONLY valid JSON, no markdown fences."""

    schema = {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "keyInsights": {"type": "array", "items": {"type": "string"}},
            "methodology": {"type": "string"},
            "results": {"type": "string"},
            "limitations": {"type": "string"},
            "futureWork": {"type": "string"},
            "confidenceScore": {"type": "number"},
        },
        "required": ["summary", "keyInsights", "methodology", "results", "limitations", "futureWork"]
    }
    
    client = get_genai_client()
    loop = asyncio.get_event_loop()
    
    try:
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=CHAT_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
        )
        result = json.loads(response.text or "{}")
    except Exception as e:
        logger.error(f"Analysis pipeline failed for {document_id}: {e}")
        result = {
            "summary": "Analysis failed. Please retry.",
            "keyInsights": [],
            "methodology": "",
            "results": "",
            "limitations": "",
            "futureWork": "",
        }

    processing_time = int((time.time() - start) * 1000)
    result["documentId"] = document_id
    result["processingTime"] = processing_time
    result["modelVersion"] = CHAT_MODEL
    result["confidenceScore"] = result.get("confidenceScore", 0.85)

    logger.info(f"[AnalyzePipeline] doc={document_id} time={processing_time}ms")
    return result
