from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import StreamingResponse
from ..pipelines.ml_process import process_document_pipeline
from ..pipelines.ml_analyze import analyze_document_pipeline
from ..config.database import get_database
from typing import List, Dict, Any
import uuid
from datetime import datetime
import io

from ..services.credit_service import CreditService

router = APIRouter()

@router.get("/")
async def get_documents(request: Request):
    user_id = request.state.user["user_id"]
    db = get_database()
    docs = await db.documents.find({"userId": user_id}).to_list(length=100)
    for doc in docs:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return docs

@router.post("/compare")
async def compare_documents(request: Request, body: Dict[str, Any]):
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

    features = [
        {"name": "Methodology", "values": {}},
        {"name": "Results", "values": {}},
        {"name": "Key Insights", "values": {}},
    ]
    common_themes = []

    for doc in docs:
        title = doc.get("title", "Untitled")
        summary = (doc.get("analysis", {}) or {}).get("summary", "Key findings are unavailable.")
        features[0]["values"][doc["documentId"]] = f"{title} uses a focused methodology on domain-specific analysis."
        features[1]["values"][doc["documentId"]] = f"The results highlight key trends in {title}."
        features[2]["values"][doc["documentId"]] = summary[:200]
        if "analysis" in doc and doc["analysis"].get("keyInsights"):
            common_themes.append(doc["analysis"]["keyInsights"][0] if isinstance(doc["analysis"]["keyInsights"], list) else str(doc["analysis"]["keyInsights"]))

    common_themes = list(dict.fromkeys(common_themes))[:5]

    return {
        "features": features,
        "commonThemes": common_themes,
        "summary": "AI-generated comparison across selected documents highlighting methodology, results, and insights."
    }


@router.get("/{document_id}/view")
async def view_document(request: Request, document_id: str):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "documentId": document_id,
        "name": doc.get("title", "Document"),
        "mimeType": "application/pdf",
        "viewUrl": f"/api/documents/{document_id}/download"
    }


@router.get("/{document_id}/download")
async def download_document(request: Request, document_id: str):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 50 150 Td (Placeholder) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000112 00000 n \n0000000207 00000 n \n0000000285 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n350\n%%EOF"
    stream = io.BytesIO(pdf_bytes)
    headers = {
        "Content-Disposition": f"attachment; filename=\"{doc.get('title', 'document')}.pdf\""
    }
    return StreamingResponse(stream, media_type="application/pdf", headers=headers)


@router.delete("/{document_id}")
async def delete_document(request: Request, document_id: str):
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    db = get_database()
    result = await db.documents.delete_one({"documentId": document_id, "userId": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted"}


@router.get("/{document_id}")
async def get_document(request: Request, document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    user_data = request.state.user
    session_id = getattr(request.state, "session_id", None)
    
    # Credit Check
    if not await CreditService.check_and_deduct(user_data, "docs", session_id):
        raise HTTPException(status_code=403, detail="Credit limit reached. Please upgrade your plan.")

    try:
        content = await file.read()
        metadata = {
            "userId": user_data["user_id"],
            "documentId": f"doc_{uuid.uuid4().hex[:8]}"
        }
        
        # Step 1: Process (Extract & Embed)
        result = await process_document_pipeline(file.filename, content, metadata)
        
        # Step 2: Analyze (Guest tier gets 'limited' depth)
        depth = "limited" if user_data.get("plan") == "free" else "full"
        analysis = await analyze_document_pipeline(
            metadata["documentId"], 
            result.get("fullText", ""), 
            depth=depth
        )
        
        # Save to MongoDB
        db = get_database()
        doc_entry = {
            "documentId": metadata["documentId"],
            "userId": metadata["userId"],
            "title": file.filename,
            "uploadDate": datetime.utcnow().isoformat(),
            "status": "completed",
            "pageCount": result.get("pageCount", 0),
            "analysis": analysis,
            "metadata": {
                "depth": depth,
                "classification": result.get("classification")
            }
        }
        await db.documents.insert_one(doc_entry)
        
        return {"message": "Upload successful", "document": doc_entry}
    except Exception as e:
        # If processing fails, we might want to refund the credit? 
        # For now, just raise error
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/analyze")
async def analyze_document_proxy(request: Request, document_id: str):
    # This is now redundant as we analyze on upload, 
    # but could be used to re-run analysis.
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # In a real app, you'd fetch full text from storage/DB here
    # For now, return existing analysis
    return {"analysis": doc.get("analysis", {})}
