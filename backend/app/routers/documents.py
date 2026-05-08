from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException, Response
from fastapi.responses import StreamingResponse, FileResponse
from ..pipelines import ml_process, ml_analyze
from ..config.database import get_database
from ..core.gemini_client import gemini_client
from ..core.groq_client import groq_client
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
import io
import json
import logging
import os

logger = logging.getLogger(__name__)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def serialize_doc(doc: dict) -> dict:
    """Serialize MongoDB document: convert ObjectId → string."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


router = APIRouter()


def get_session_id(request: Request) -> str:
    """Extract session ID from headers or query params; fallback to 'public'."""
    # Check headers first (standard for most requests)
    sid = request.headers.get("X-Session-ID")
    if sid:
        return sid
    # Check query params (used for sendBeacon cleanup)
    return request.query_params.get("sessionId", "public")


@router.get("")
async def get_documents(request: Request, page: int = 1, limit: int = 10):
    session_id = get_session_id(request)
    query = {"sessionId": session_id}
    
    skip = (page - 1) * limit
    db = get_database()
    total = await db.documents.count_documents(query)
    completed_count = await db.documents.count_documents({**query, "status": "completed"})
    docs = await db.documents.find(query).skip(skip).limit(limit).to_list(length=limit)
    for doc in docs:
        serialize_doc(doc)
    return {
        "documents": docs,
        "total": total,
        "completedCount": completed_count,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit
    }


@router.post("/session/clear")
async def clear_session_documents(request: Request):
    session_id = get_session_id(request)
    if session_id == "public":
        return {"message": "Public session not cleared"}
        
    db = get_database()
    # Find all docs for this session to clean up files and vector DB
    docs = await db.documents.find({"sessionId": session_id}).to_list(length=1000)
    
    for doc in docs:
        doc_id = doc["documentId"]
        # Delete physical file
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Clean up vector embeddings
        try:
            from ..services.chroma_db import delete_document_chunks
            await delete_document_chunks(doc_id)
        except Exception:
            pass

    # Delete from MongoDB (Documents)
    await db.documents.delete_many({"sessionId": session_id})
    
    # Delete chat history for all documents belonging to this session
    # AND any general chats for this session (if saved with sessionId)
    for doc in docs:
        await db.chat_history.delete_many({"document_id": doc["documentId"]})
    
    # Catch any leftover chats directly by sessionId
    await db.chat_history.delete_many({"sessionId": session_id})
    await db.chats.delete_many({"sessionId": session_id}) # Compatibility with legacy api/chat.py
        
    return {"message": f"Cleared {len(docs)} documents and associated history for session {session_id}"}


@router.post("/compare")
async def compare_documents(request: Request, body: Dict[str, Any]):
    document_ids = body.get("documentIds", [])
    if not isinstance(document_ids, list):
        raise HTTPException(status_code=400, detail="documentIds must be an array")

    db = get_database()
    docs = await db.documents.find({"documentId": {"$in": document_ids}}).to_list(length=20)
    if not docs:
        return {
            "features": [],
            "commonThemes": [],
            "summary": "No documents found for comparison.",
            "comparisonTable": []
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

    # Try AI-powered comparison using Groq (no quota limits like Gemini free tier)
    if groq_client.client and len(papers_context) >= 2:
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
  "conflictingFindings": ["Conflict 1: Paper A says X while Paper B says Y"],
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
            response = groq_client.client.chat.completions.create(
                model=groq_client.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2048
            )
            response_text = response.choices[0].message.content.strip()
            import re as _re
            raw = response_text if response_text else ""
            json_match = None
            try:
                json_match = json.loads(raw) if raw.startswith("{") else None
            except:
                json_match = None

            if not json_match:
                match = _re.search(r'\{.*\}', raw, _re.DOTALL)
                if match:
                    try:
                        json_match = json.loads(match.group(0))
                    except:
                        json_match = None

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
            logger.warning(f"AI comparison failed, falling back to heuristic: {e}")

    # Fallback heuristic comparison
    features = [
        {"name": "Methodology", "values": {}},
        {"name": "Results", "values": {}},
        {"name": "Key Insights", "values": {}},
    ]
    common_themes = []

    for doc in docs:
        title = doc.get("title", "Untitled")
        summary = (doc.get("analysis", {}) or {}).get("summary", "Key findings are unavailable.")
        doc_id = doc["documentId"]
        features[0]["values"][doc_id] = f"{title} uses a focused methodology on domain-specific analysis."
        features[1]["values"][doc_id] = f"The results highlight key trends in {title}."
        features[2]["values"][doc_id] = summary[:200]
        
        analysis = doc.get("analysis", {})
        if analysis.get("keyInsights"):
            insights = analysis["keyInsights"]
            if isinstance(insights, list) and len(insights) > 0:
                common_themes.append(insights[0])

    common_themes = list(dict.fromkeys(common_themes))[:5]

    return {
        "features": features,
        "commonThemes": common_themes,
        "summary": "AI-generated comparison across selected documents highlighting methodology, results, and insights.",
        "comparisonTable": [],
        "aiGenerated": False,
    }


@router.get("/{document_id}/view")
async def view_document(request: Request, document_id: str):
    session_id = get_session_id(request)
    db = get_database()
    doc = await db.documents.find_one({
        "documentId": document_id, 
        "$or": [{"sessionId": session_id}, {"sessionId": {"$exists": False}}]
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Detect if it's a text/url source vs PDF
    is_text_source = document_id.startswith("doc_") or "sourceUrl" in doc
    mime_type = "text/plain" if is_text_source else "application/pdf"

    return {
        "documentId": document_id,
        "name": doc.get("title", "Document"),
        "mimeType": mime_type,
        "viewUrl": f"/api/documents/{document_id}/download",
        "isTextSource": is_text_source
    }


@router.get("/{document_id}/download")
async def download_document(request: Request, document_id: str, inline: bool = False):
    session_id = get_session_id(request)
    db = get_database()
    doc = await db.documents.find_one({
        "documentId": document_id, 
        "$or": [{"sessionId": session_id}, {"sessionId": {"$exists": False}}]
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Handle text/url sources by returning the content
    is_text_source = document_id.startswith("doc_") or "sourceUrl" in doc
    if is_text_source:
        content = doc.get("content", "")
        if inline:
            return Response(content, media_type="text/plain")
        
        filename = f"{doc.get('title', 'document')}.txt"
        return Response(
            content, 
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    file_path = os.path.join(UPLOAD_DIR, f"{document_id}.pdf")
    
    if os.path.exists(file_path):
        if inline:
            return FileResponse(file_path, media_type="application/pdf")
        return FileResponse(
            file_path, 
            media_type="application/pdf", 
            filename=f"{doc.get('title', 'document')}.pdf"
        )
    
    # Fallback to the placeholder only if file is missing
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 50 150 Td (Original File Not Found) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000061 00000 n \n0000000112 00000 n \n0000000207 00000 n \n0000000285 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n350\n%%EOF"
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")


@router.delete("/{document_id}")
async def delete_document(request: Request, document_id: str):
    session_id = get_session_id(request)
    db = get_database()
    
    # Check if doc exists and belongs to session
    doc = await db.documents.find_one({
        "documentId": document_id, 
        "$or": [{"sessionId": session_id}, {"sessionId": {"$exists": False}}]
    })
    if not doc:
         raise HTTPException(status_code=404, detail="Document not found or access denied")

    result = await db.documents.delete_one({"documentId": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # Delete physical file
    file_path = os.path.join(UPLOAD_DIR, f"{document_id}.pdf")
    if os.path.exists(file_path):
        os.remove(file_path)

    # Clean up vector embeddings from ChromaDB
    try:
        from ..services.chroma_db import delete_document_chunks
        await delete_document_chunks(document_id)
    except Exception as e:
        logger.warning(f"Failed to delete ChromaDB chunks for {document_id}: {e}")

    return {"message": "Document deleted successfully"}


@router.get("/{document_id}")
async def get_document(request: Request, document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.get("/{document_id}/analytics")
async def get_document_analytics(request: Request, document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document_id": document_id,
        "title": doc.get("title", "Untitled"),
        "analytics": doc.get("analysis", {})
    }


@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...), 
    title: str = Form(None), 
    author: str = Form(None),
    collection: str = Form(None)
):
    from app.pipelines.ml_process import process_document_pipeline, extract_text_from_pdf
    from app.pipelines.ml_analyze import analyze_document_pipeline

    session_id = get_session_id(request)
    db = get_database()
    document_id = str(uuid.uuid4())
    file_bytes = await file.read()
    
    # Save file to disk immediately
    file_path = os.path.join(UPLOAD_DIR, f"{document_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    
    full_text = ""

    try:
        result = await process_document_pipeline(
            filename=file.filename,
            file_content=file_bytes,
            metadata={"title": title, "author": author, "documentId": document_id}
        )
        full_text = result.get("fullText") or result.get("text", "")
    except Exception as e:
        logger.warning(f"ML Pipeline failed: {e}")
        # Fallback: extract text directly without embeddings
        try:
            full_text, _page_count = await extract_text_from_pdf(file_bytes, file.filename)
        except Exception:
            full_text = ""

    # Generate analysis if we have text
    analysis = {}
    if full_text:
        try:
            analysis = await analyze_document_pipeline(
                document_id, 
                full_text,
                title=title or file.filename
            )
        except Exception:
            analysis = {
                "summary": "Document uploaded successfully.",
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
    else:
        analysis = {
            "summary": "Document uploaded successfully. Text extraction was not available.",
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

    document = {
        "documentId": document_id,
        "id": document_id,
        "sessionId": session_id,
        "filename": file.filename,
        "content": full_text,
        "title": title or file.filename,
        "status": "completed",
        "analysis": analysis,
        "keywords": analysis.get("keyInsights", []) or [],
        "uploadDate": datetime.now(timezone.utc).isoformat(),
        "year": datetime.now(timezone.utc).year,
        "authors": [author] if author else [],
        "fileUrl": f"/api/documents/{document_id}/download",
        "userId": "public",
        "collection": collection,
    }

    await db.documents.insert_one(document)

    return {
        "message": "Upload successful",
        "document": serialize_doc(document)
    }


@router.post("/upload-url")
async def upload_url(request: Request, body: Dict[str, str]):
    from app.pipelines.ml_process import process_text_pipeline
    from app.pipelines.ml_analyze import analyze_document_pipeline
    from app.services.ingestion_service import document_ingestion_service

    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    session_id = get_session_id(request)
    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    title = body.get("title") or url.split("/")[-1] or "URL Document"

    try:
        # Step 1: Extract text from URL
        full_text = await document_ingestion_service.extract_text_from_url(url)
        
        # Step 2: Process RAG (chunking, embedding, indexing)
        await process_text_pipeline(
            text=full_text,
            metadata={"documentId": document_id, "userId": "public"},
            filename=url
        )

        # Step 3: Analyze document
        analysis = await analyze_document_pipeline(
            document_id=document_id,
            full_text=full_text,
            title=title
        )
    except Exception as e:
        logger.error(f"URL processing failed for {url}: {e}")
        # Partial success fallback
        full_text = ""
        analysis = {
            "summary": f"Failed to extract content from {url}. Error: {str(e)}",
            "keyInsights": [],
            "confidenceScore": 0.0
        }

    doc_entry = {
        "documentId": document_id,
        "id": document_id,
        "sessionId": session_id,
        "title": title,
        "uploadDate": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "sourceUrl": url,
        "content": full_text,
        "analysis": analysis,
        "keywords": analysis.get("keyInsights", []) or [],
        "userId": "public",
        "collection": body.get("collection")
    }
    
    db = get_database()
    await db.documents.insert_one(doc_entry)
    
    return {
        "message": "URL upload successful",
        "document": serialize_doc(doc_entry)
    }


@router.post("/upload-text")
async def upload_text(request: Request, body: Dict[str, str]):
    from app.pipelines.ml_process import process_text_pipeline
    from app.pipelines.ml_analyze import analyze_document_pipeline

    text = body.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    session_id = get_session_id(request)
    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    title = body.get("title") or "Pasted Text Document"

    try:
        # Step 1: Process RAG (chunking, embedding, indexing)
        await process_text_pipeline(
            text=text,
            metadata={"documentId": document_id, "userId": "public"},
            filename="pasted_text"
        )

        # Step 2: Analyze document
        analysis = await analyze_document_pipeline(
            document_id=document_id,
            full_text=text,
            title=title
        )
    except Exception as e:
        logger.error(f"Text processing failed: {e}")
        analysis = {
            "summary": "Pasted text document processed with limited analysis.",
            "keyInsights": [],
            "confidenceScore": 0.5
        }

    doc_entry = {
        "documentId": document_id,
        "id": document_id,
        "sessionId": session_id,
        "title": title,
        "uploadDate": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "content": text,
        "analysis": analysis,
        "keywords": analysis.get("keyInsights", []) or [],
        "userId": "public",
        "collection": body.get("collection")
    }
    
    db = get_database()
    await db.documents.insert_one(doc_entry)
    
    return {
        "message": "Text upload successful",
        "document": serialize_doc(doc_entry)
    }


@router.post("/{document_id}/analyze")
async def analyze_document_proxy(request: Request, document_id: str):
    db = get_database()
    doc = await db.documents.find_one({"documentId": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"analysis": doc.get("analysis", {})}
