from fastapi import APIRouter, Request, HTTPException
from ..pipelines.ml_analyze import analyze_document_pipeline
from ..core.gemini_client import gemini_client
from ..config.database import get_database
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("")
async def analyze_document(request: Request, body: dict):
    # Allow both registered users and guests
    # (Middleware already ensures request.state.user exists)
    
    document_id = body.get("documentId")
    full_text = body.get("fullText")
    title = body.get("title", "Research Paper")
    
    if not document_id or not full_text:
        raise HTTPException(status_code=400, detail="documentId and fullText are required")
        
    try:
        result = await analyze_document_pipeline(document_id, full_text, title=title)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{document_id}")
async def get_document_analysis(request: Request, document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if doc and doc.get("analysis"):
        return doc["analysis"]

    # Return placeholder if document missing or analysis not available
    return {
        "documentId": document_id,
        "summary": "Analysis not available for this document.",
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


@router.get("/{document_id}")
async def get_analysis(request: Request, document_id: str):
    return await get_document_analysis(request, document_id)


@router.post("/start")
async def start_analysis(request: Request, body: dict):
    document_id = body.get("documentId")
    if not document_id:
        raise HTTPException(status_code=400, detail="documentId is required")

    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})

    if doc:
        analysis = doc.get("analysis") or {}
        if not analysis:
            analysis = {
                "documentId": document_id,
                "summary": f"Placeholder analysis for {doc.get('title', 'document')}",
                "keyInsights": ["Baseline research synthesis"],
                "methodology": "Automated placeholder analysis.",
                "results": "Generated sample insights.",
                "limitations": "This is a placeholder analysis.",
                "futureWork": "Expand this with real AI analysis.",
                "complexity": "Moderate",
                "readingTime": 8,
                "keyThemesCount": 3,
                "confidenceScore": 78.5
            }
            await db.documents.update_one({"documentId": document_id}, {"$set": {"analysis": analysis, "status": "completed"}})

    return {"jobId": f"analysis_{document_id}"}


@router.post("/compare")
async def compare_analysis(request: Request, body: dict):
    document_ids = body.get("documentIds", [])
    if not isinstance(document_ids, list):
        raise HTTPException(status_code=400, detail="documentIds must be an array")

    db = get_database()
    docs = await db.documents.find({"documentId": {"$in": document_ids}}).to_list(length=10)

    if not docs or len(docs) < 2:
        return {
            "features": [],
            "commonThemes": [],
            "summary": "Please provide at least 2 documents for comparison.",
            "comparisonTable": [],
            "aiGenerated": False,
        }

    # Build rich context for AI comparison
    papers_context = []
    for doc in docs:
        analysis = doc.get("analysis", {}) or {}
        papers_context.append({
            "id": doc.get("documentId"),
            "title": doc.get("title", "Untitled"),
            "summary": analysis.get("summary", "No summary available."),
            "methodology": analysis.get("methodology", ""),
            "results": analysis.get("results", ""),
            "keyInsights": analysis.get("keyInsights", []),
            "limitations": analysis.get("limitations", ""),
        })

    # Try AI-powered comparison
    if gemini_client.analysis_client and len(papers_context) >= 2:
        try:
            prompt = f"""You are an expert research analyst. Compare the following research papers and produce a structured JSON comparison.

Papers:
{json.dumps(papers_context, indent=2)}

Instructions:
- Return ONLY valid JSON. No markdown, no explanations outside the JSON.
- Provide an in-depth academic comparison.

Required JSON structure:
{{
  "summary": "2-3 paragraph comparative synthesis highlighting the relationship between these papers.",
  "commonThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "conflictingFindings": ["Conflict 1: Paper A says X while Paper B says Y", ...],
  "researchGaps": ["Gap 1", "Gap 2"],
  "novelOpportunities": ["Opportunity 1", "Opportunity 2"],
  "features": [
    {{
      "name": "Methodology",
      "values": {{"doc_id_1": "description", "doc_id_2": "description"}}
    }},
    {{
      "name": "Results",
      "values": {{"doc_id_1": "description", "doc_id_2": "description"}}
    }},
    {{
      "name": "Key Insights",
      "values": {{"doc_id_1": "description", "doc_id_2": "description"}}
    }}
  ],
  "comparisonTable": [
    {{"dimension": "Methodology", "paperA": "...", "paperB": "...", "comparison": "..."}},
    {{"dimension": "Results", "paperA": "...", "paperB": "...", "comparison": "..."}},
    {{"dimension": "Limitations", "paperA": "...", "paperB": "...", "comparison": "..."}}
  ]
}}
"""
            response = gemini_client.generate_content(
                model=gemini_client.chat_model_name,
                prompt=prompt
            )
            raw = response.strip() if response else ""
            json_match = None
            if raw.startswith("{"):
                json_match = json.loads(raw)
            else:
                import re as _re
                match = _re.search(r'\{.*\}', raw, _re.DOTALL)
                if match:
                    json_match = json.loads(match.group(0))

            if json_match:
                return {
                    "summary": json_match.get("summary", ""),
                    "commonThemes": json_match.get("commonThemes", []),
                    "conflictingFindings": json_match.get("conflictingFindings", []),
                    "researchGaps": json_match.get("researchGaps", []),
                    "novelOpportunities": json_match.get("novelOpportunities", []),
                    "features": json_match.get("features", []),
                    "comparisonTable": json_match.get("comparisonTable", []),
                    "aiGenerated": True,
                }
        except Exception as e:
            logger.warning(f"AI comparison failed in analysis router, falling back: {e}")

    # Fallback heuristic comparison
    features = []
    for doc in docs:
        analysis = doc.get("analysis") or {}
        features.append({
            "name": doc.get("title", "Document"),
            "value": analysis.get("summary", "No analysis available")
        })

    return {
        "features": features,
        "commonThemes": ["Placeholder theme A", "Placeholder theme B"],
        "summary": "Comparison is currently simulated and returns high-level insights.",
        "comparisonTable": [],
        "aiGenerated": False,
    }

