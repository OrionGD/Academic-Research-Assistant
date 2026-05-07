from fastapi import APIRouter, UploadFile, File, Form
from app.config.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/api/documents", tags=["documents"])


# =========================
# 📄 PDF UPLOAD
# =========================
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...)
):
    from app.pipelines.ml_process import process_document_pipeline
    from app.pipelines.ml_analyze import analyze_document_pipeline

    db = get_database()

    # ✅ Process PDF
    processed = await process_document_pipeline(file)
    analyzed = await analyze_document_pipeline(processed.get("fullText", ""))

    document = {
        "title": title,
        "content": processed.get("fullText", ""),
        "metadata": processed.get("metadata", {}),
        "analytics": analyzed,
        "status": "completed"
    }

    result = await db.documents.insert_one(document)

    document["_id"] = str(result.inserted_id)

    return {
        "document": {
            "documentId": document["_id"],
            "title": document["title"],
            "status": document["status"]
        },
        "message": "Upload successful"
    }


# =========================
# 🌐 URL UPLOAD
# =========================
@router.post("/upload-url")
async def upload_from_url(payload: dict):
    from app.api.documents.document_ingestion_service import ingest_from_url
    from app.api.documents.text_processing_service import process_text
    from app.api.documents.embedding_service import generate_embeddings
    from app.api.documents.analytics_service import generate_analytics

    db = get_database()

    raw_text = await ingest_from_url(payload["url"])
    processed = await process_text(raw_text)

    await generate_embeddings(processed["text"])
    analytics = await generate_analytics(processed["text"])

    document = {
        "title": payload.get("title") or processed.get("title"),
        "content": processed["text"],
        "analytics": analytics,
        "status": "completed"
    }

    result = await db.documents.insert_one(document)

    return {
        "document": {
            "documentId": str(result.inserted_id),
            "title": document["title"],
            "status": document["status"]
        }
    }


# =========================
# 📝 TEXT UPLOAD
# =========================
@router.post("/upload-text")
async def upload_text(payload: dict):
    from app.api.documents.text_processing_service import process_text
    from app.api.documents.embedding_service import generate_embeddings
    from app.api.documents.analytics_service import generate_analytics

    db = get_database()

    processed = await process_text(payload["text"])

    await generate_embeddings(processed["text"])
    analytics = await generate_analytics(processed["text"])

    document = {
        "title": payload.get("title") or processed.get("title"),
        "content": processed["text"],
        "analytics": analytics,
        "status": "completed"
    }

    result = await db.documents.insert_one(document)

    return {
        "document": {
            "documentId": str(result.inserted_id),
            "title": document["title"],
            "status": document["status"]
        }
    }


# =========================
# 📊 ANALYTICS
# =========================
@router.get("/{document_id}/analytics")
async def get_document_analytics(document_id: str):
    db = get_database()

    doc = await db.documents.find_one({"_id": document_id})

    if not doc:
        return {"document_id": document_id, "analytics": {}}

    return {
        "document_id": document_id,
        "title": doc.get("title"),
        "analytics": doc.get("analytics", {})
    }


# =========================
# 📋 LIST DOCUMENTS
# =========================
@router.get("/")
async def list_documents():
    db = get_database()

    cursor = db.documents.find({})
    documents = await cursor.to_list(length=100)

    return {
        "documents": [
            {
                "documentId": str(doc.get("_id", "")),
                "title": doc.get("title"),
                "status": doc.get("status", "completed")
            }
            for doc in documents
        ],
        "total": len(documents)
    }


# =========================
# 🗑 DELETE DOCUMENT
# =========================
@router.delete("/{document_id}")
async def delete_document(document_id: str):
    db = get_database()

    await db.documents.delete_many({"_id": document_id})

    return {
        "message": "Document deleted successfully"
    }