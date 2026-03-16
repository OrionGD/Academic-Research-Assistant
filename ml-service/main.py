"""
ARAS ML Service — FastAPI Entry Point

Routes:
  POST /process-document  — PDF extraction + chunking + Gemini embeddings → MongoDB
  POST /search            — Hybrid semantic search (vector + BM25, userId-scoped)
  POST /chat              — Standard RAG chat response
  POST /chat/stream       — Streaming SSE RAG chat response
  POST /analyze-document  — Gemini structured document analysis
  GET  /health            — Service health check

Security:
  All protected routes require X-API-Key header matching ML_SERVICE_API_KEY env var.
  userId is required in Search and Chat requests for multi-tenant isolation.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from typing import Optional
import logging
import uvicorn

from services.db import connect_to_mongo, close_mongo_connection
from services.config import ML_SERVICE_API_KEY
from pipelines.process import process_document_pipeline
from pipelines.search import search_pipeline
from pipelines.chat import chat_pipeline, chat_stream_pipeline
from pipelines.analyze import analyze_document_pipeline

# ─── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ARAS ML Service...")
    await connect_to_mongo()
    logger.info("ML Service ready ✓")
    yield
    await close_mongo_connection()
    logger.info("ML Service shut down.")


app = FastAPI(
    title="ARAS ML Service",
    description="AI/ML pipeline service for the Academic Research Assistant System",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API Key Authentication ────────────────────────────────────────────────────
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify X-API-Key matches ML_SERVICE_API_KEY. Auth disabled if key not configured."""
    if not ML_SERVICE_API_KEY:
        return  # Auth disabled (development mode)
    if api_key != ML_SERVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing X-API-Key header")


# ─── Request Models ────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    userId: str = Field(..., description="MongoDB User ObjectId string (required for multi-tenant isolation)")
    limit: Optional[int] = Field(default=5, ge=1, le=20)
    documentIds: Optional[list[str]] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    userId: str = Field(..., description="MongoDB User ObjectId string (required for multi-tenant isolation)")
    documentIds: Optional[list[str]] = None


class AnalyzeRequest(BaseModel):
    documentId: str
    fullText: str


# ─── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "service": "ARAS ML Service",
        "version": "2.1.0",
    }


# ─── Document Processing ───────────────────────────────────────────────────────
@app.post("/process-document", tags=["Documents"], dependencies=[Depends(verify_api_key)])
async def process_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
):
    """
    Process a PDF: extract text, chunk, embed (768-dim), store to MongoDB.
    metadata JSON must contain: { documentId: string, userId: string }
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted (.pdf)")

    try:
        content = await file.read()
        result = await process_document_pipeline(file.filename, content, metadata)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"[/process-document] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# ─── Semantic / Hybrid Search ──────────────────────────────────────────────────
@app.post("/search", tags=["Search"], dependencies=[Depends(verify_api_key)])
async def search(req: SearchRequest):
    """
    Hybrid search (vector + BM25). userId is mandatory for multi-tenant isolation.
    """
    try:
        results = await search_pipeline(
            req.query,
            limit=req.limit or 5,
            user_id=req.userId,
            document_ids=req.documentIds,
        )
        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"[/search] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── RAG Chat (Standard) ───────────────────────────────────────────────────────
@app.post("/chat", tags=["Chat"], dependencies=[Depends(verify_api_key)])
async def chat(req: ChatRequest):
    """Standard (non-streaming) RAG chat response."""
    try:
        response = await chat_pipeline(
            req.message,
            user_id=req.userId,
            document_ids=req.documentIds,
        )
        return response
    except Exception as e:
        logger.error(f"[/chat] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── RAG Chat (Streaming SSE) ─────────────────────────────────────────────────
@app.post("/chat/stream", tags=["Chat"], dependencies=[Depends(verify_api_key)])
async def chat_stream(req: ChatRequest):
    """
    Server-Sent Events streaming RAG chat.
    Events: data chunks followed by data: [DONE]
    """
    try:
        return StreamingResponse(
            chat_stream_pipeline(
                req.message,
                user_id=req.userId,
                document_ids=req.documentIds,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        logger.error(f"[/chat/stream] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Document Analysis ────────────────────────────────────────────────────────
@app.post("/analyze-document", tags=["Analysis"], dependencies=[Depends(verify_api_key)])
async def analyze_document(req: AnalyzeRequest):
    """Run Gemini structured analysis on a document's full text."""
    try:
        result = await analyze_document_pipeline(req.documentId, req.fullText)
        return result
    except Exception as e:
        logger.error(f"[/analyze-document] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
