from fastapi import APIRouter, Request, HTTPException
from ..pipelines.ml_analyze import analyze_document_pipeline
from ..config.database import get_database
from datetime import datetime

router = APIRouter()

@router.post("/")
async def analyze_document(request: Request, body: dict):
    # Allow both registered users and guests
    # (Middleware already ensures request.state.user exists)
    
    document_id = body.get("documentId")
    full_text = body.get("fullText")
    
    if not document_id or not full_text:
        raise HTTPException(status_code=400, detail="documentId and fullText are required")
        
    try:
        result = await analyze_document_pipeline(document_id, full_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{document_id}")
async def get_document_analysis(request: Request, document_id: str):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id, "userId": user["user_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = doc.get("analysis")
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not available")
    return analysis


@router.get("/{document_id}")
async def get_analysis(request: Request, document_id: str):
    return await get_document_analysis(request, document_id)


@router.post("/start")
async def start_analysis(request: Request, body: dict):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    document_id = body.get("documentId")
    if not document_id:
        raise HTTPException(status_code=400, detail="documentId is required")

    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id, "userId": user["user_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

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
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    document_ids = body.get("documentIds")
    if not isinstance(document_ids, list) or len(document_ids) < 2:
        raise HTTPException(status_code=400, detail="documentIds must be an array of at least two IDs")

    db = get_database()
    docs = await db.documents.find({"documentId": {"$in": document_ids}, "userId": user["user_id"]}).to_list(length=10)
    if not docs:
        raise HTTPException(status_code=404, detail="No documents found for comparison")

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
        "summary": "Comparison is currently simulated and returns high-level insights."
    }
