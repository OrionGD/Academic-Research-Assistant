"""
Document API routes
"""
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from app.services import (
    document_ingestion_service,
    text_processing_service,
    embedding_service,
    analytics_service
)
from app.config.database import db

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentUploadResponse(BaseModel):
    """Response model for document upload"""
    document_id: str
    title: str
    chunk_count: int
    summary: str
    keywords: list
    topics: list
    reading_time: int
    status: str


class UrlUploadRequest(BaseModel):
    """Request model for URL upload"""
    url: str
    title: Optional[str] = None


class TextUploadRequest(BaseModel):
    """Request model for text upload"""
    text: str
    title: Optional[str] = None


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_pdf(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    """
    Upload and process PDF document
    
    Args:
        file: PDF file to upload
        title: Document title
        
    Returns:
        Document metadata and analytics
    """
    try:
        # Save uploaded file
        file_path = f"/tmp/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Extract text
        raw_text = document_ingestion_service.extract_text_from_pdf(file_path)
        
        # Validate
        is_valid, error_msg = document_ingestion_service.validate_text(raw_text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Process
        chunks = text_processing_service.chunk_text(raw_text)
        
        # Generate analytics
        analytics = await analytics_service.analyze_document(
            chunks=chunks,
            document_title=title or file.filename
        )
        
        # Generate embeddings
        document_id = str(uuid.uuid4())
        await embedding_service.generate_embeddings_for_document(
            document_id=document_id,
            chunks=chunks,
            metadata={
                "title": title or file.filename,
                "summary": analytics.get("summary", ""),
                "keywords": analytics.get("keywords", []),
                "topics": analytics.get("topics", [])
            }
        )
        
        # Store metadata in MongoDB
        document_data = {
            "document_id": document_id,
            "title": title or file.filename,
            "summary": analytics.get("summary", ""),
            "keywords": analytics.get("keywords", []),
            "topics": analytics.get("topics", []),
            "chunk_count": len(chunks),
            "reading_time": analytics.get("reading_time", 0),
            "file_name": file.filename,
            "file_path": file_path
        }
        
        await db.documents.insert_one(document_data)
        
        logger.info(f"Document {document_id} uploaded successfully")
        
        return DocumentUploadResponse(
            document_id=document_id,
            title=title or file.filename,
            chunk_count=len(chunks),
            summary=analytics.get("summary", ""),
            keywords=analytics.get("keywords", []),
            topics=analytics.get("topics", []),
            reading_time=analytics.get("reading_time", 0),
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.post("/upload-url", response_model=DocumentUploadResponse)
async def upload_from_url(request: UrlUploadRequest):
    """
    Upload and process document from URL
    
    Args:
        request: URL upload request
        
    Returns:
        Document metadata and analytics
    """
    try:
        # Extract text from URL
        raw_text = document_ingestion_service.extract_text_from_url(request.url)
        
        # Validate
        is_valid, error_msg = document_ingestion_service.validate_text(raw_text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Process
        chunks = text_processing_service.chunk_text(raw_text)
        
        # Generate analytics
        analytics = await analytics_service.analyze_document(
            chunks=chunks,
            document_title=request.title or request.url
        )
        
        # Generate embeddings
        document_id = str(uuid.uuid4())
        await embedding_service.generate_embeddings_for_document(
            document_id=document_id,
            chunks=chunks,
            metadata={
                "title": request.title or request.url,
                "summary": analytics.get("summary", ""),
                "keywords": analytics.get("keywords", []),
                "topics": analytics.get("topics", [])
            }
        )
        
        # Store metadata
        document_data = {
            "document_id": document_id,
            "title": request.title or request.url,
            "summary": analytics.get("summary", ""),
            "keywords": analytics.get("keywords", []),
            "topics": analytics.get("topics", []),
            "chunk_count": len(chunks),
            "reading_time": analytics.get("reading_time", 0),
            "source_url": request.url
        }
        
        await db.documents.insert_one(document_data)
        
        logger.info(f"Document {document_id} from URL uploaded successfully")
        
        return DocumentUploadResponse(
            document_id=document_id,
            title=request.title or request.url,
            chunk_count=len(chunks),
            summary=analytics.get("summary", ""),
            keywords=analytics.get("keywords", []),
            topics=analytics.get("topics", []),
            reading_time=analytics.get("reading_time", 0),
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading from URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.post("/upload-text", response_model=DocumentUploadResponse)
async def upload_text(request: TextUploadRequest):
    """
    Upload and process raw text
    
    Args:
        request: Text upload request
        
    Returns:
        Document metadata and analytics
    """
    try:
        # Validate
        is_valid, error_msg = document_ingestion_service.validate_text(request.text)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Process
        chunks = text_processing_service.chunk_text(request.text)
        
        # Generate analytics
        analytics = await analytics_service.analyze_document(
            chunks=chunks,
            document_title=request.title or "Uploaded Text"
        )
        
        # Generate embeddings
        document_id = str(uuid.uuid4())
        await embedding_service.generate_embeddings_for_document(
            document_id=document_id,
            chunks=chunks,
            metadata={
                "title": request.title or "Uploaded Text",
                "summary": analytics.get("summary", ""),
                "keywords": analytics.get("keywords", []),
                "topics": analytics.get("topics", [])
            }
        )
        
        # Store metadata
        document_data = {
            "document_id": document_id,
            "title": request.title or "Uploaded Text",
            "summary": analytics.get("summary", ""),
            "keywords": analytics.get("keywords", []),
            "topics": analytics.get("topics", []),
            "chunk_count": len(chunks),
            "reading_time": analytics.get("reading_time", 0),
            "text_length": len(request.text)
        }
        
        await db.documents.insert_one(document_data)
        
        logger.info(f"Document {document_id} from text uploaded successfully")
        
        return DocumentUploadResponse(
            document_id=document_id,
            title=request.title or "Uploaded Text",
            chunk_count=len(chunks),
            summary=analytics.get("summary", ""),
            keywords=analytics.get("keywords", []),
            topics=analytics.get("topics", []),
            reading_time=analytics.get("reading_time", 0),
            status="success"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.get("/{document_id}/analytics")
async def get_document_analytics(document_id: str):
    """
    Get document analytics
    
    Args:
        document_id: Document identifier
        
    Returns:
        Document analytics data
    """
    try:
        document = await db.documents.find_one({"document_id": document_id})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "document_id": document_id,
            "title": document.get("title", ""),
            "summary": document.get("summary", ""),
            "keywords": document.get("keywords", []),
            "topics": document.get("topics", []),
            "chunk_count": document.get("chunk_count", 0),
            "reading_time": document.get("reading_time", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_documents(skip: int = 0, limit: int = 10):
    """
    List all documents
    
    Args:
        skip: Number of documents to skip
        limit: Maximum number of documents to return
        
    Returns:
        List of documents
    """
    try:
        documents = await db.documents.find().skip(skip).limit(limit).to_list(length=limit)
        total = await db.documents.count_documents({})
        
        return {
            "total": total,
            "documents": documents,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document
    
    Args:
        document_id: Document identifier
        
    Returns:
        Deletion status
    """
    try:
        # Delete from MongoDB
        result = await db.documents.delete_one({"document_id": document_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete embeddings from ChromaDB
        from app.core.chroma_client import chroma_client
        chroma_client.delete_document_embeddings(document_id)
        
        logger.info(f"Document {document_id} deleted successfully")
        
        return {"status": "success", "message": f"Document {document_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
