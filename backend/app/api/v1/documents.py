"""
Document Management API Endpoints
Handles document upload, management, and retrieval operations.
"""
import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from enum import Enum

from app.core.config import settings
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStore
from app.database.models import Document, DocumentStatus
from app.database.crud import document_crud
from app.database.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class DocumentFormat(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    MD = "md"
    HTML = "html"


class DocumentMetadata(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    source: Optional[str] = None
    document_type: Optional[str] = None
    language: Optional[str] = "en"
    publish_date: Optional[datetime] = None
    keywords: Optional[List[str]] = None


class DocumentUploadRequest(BaseModel):
    metadata: Optional[DocumentMetadata] = None
    chunk_size: int = Field(default=1000, ge=500, le=5000)
    chunk_overlap: int = Field(default=200, ge=0, le=1000)
    generate_summary: bool = True
    extract_keywords: bool = True


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    format: str
    status: str
    upload_date: datetime
    processed_date: Optional[datetime] = None
    num_chunks: Optional[int] = 0
    metadata: Optional[dict] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    page_size: int


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    generate_summary: bool = Form(True),
    extract_keywords: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Upload a document for processing and indexing.
    Supports PDF, DOCX, TXT, MD, and HTML formats.
    """
    # Validate file format
    file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_extension not in [fmt.value for fmt in DocumentFormat]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {[fmt.value for fmt in DocumentFormat]}"
        )
    
    # Parse metadata if provided
    metadata_dict = {}
    if metadata:
        try:
            import json
            metadata_dict = json.loads(metadata)
        except:
            raise HTTPException(status_code=400, detail="Invalid metadata JSON format")
    
    # Generate unique document ID
    doc_id = str(uuid.uuid4())
    
    # Save uploaded file temporarily
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{doc_id}.{file_extension}")
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create document record in database
        document = Document(
            id=doc_id,
            filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            format=file_extension,
            status=DocumentStatus.UPLOADED,
            upload_date=datetime.utcnow(),
            metadata=metadata_dict
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Schedule background processing
        background_tasks.add_task(
            process_document_background,
            doc_id,
            file_path,
            file_extension,
            chunk_size,
            chunk_overlap,
            generate_summary,
            extract_keywords,
            metadata_dict
        )
        
        return DocumentResponse(
            id=doc_id,
            filename=file.filename,
            file_size=len(content),
            format=file_extension,
            status=document.status.value,
            upload_date=document.upload_date,
            metadata=metadata_dict
        )
        
    except Exception as e:
        # Clean up file if error occurs
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")


async def process_document_background(
    doc_id: str,
    file_path: str,
    format: str,
    chunk_size: int,
    chunk_overlap: int,
    generate_summary: bool,
    extract_keywords: bool,
    metadata: dict
):
    """
    Background task to process and index a document.
    """
    from app.database.session import SessionLocal
    db = SessionLocal()
    
    try:
        # Update document status to processing
        document = document_crud.get(db, doc_id)
        if not document:
            return
        
        document.status = DocumentStatus.PROCESSING
        db.commit()
        
        # Initialize processors
        doc_processor = DocumentProcessor()
        vector_store = VectorStore()
        
        # Process document
        chunks, document_info = await doc_processor.process_document(
            file_path=file_path,
            format=format,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            metadata=metadata
        )
        
        # Generate summary if requested
        summary = None
        if generate_summary:
            summary = await doc_processor.generate_summary(chunks)
        
        # Extract keywords if requested
        keywords = None
        if extract_keywords:
            keywords = await doc_processor.extract_keywords(chunks)
        
        # Store chunks in vector database
        if chunks:
            await vector_store.add_document(
                document_id=doc_id,
                chunks=chunks,
                metadata={
                    "filename": document.filename,
                    "format": format,
                    **metadata,
                    **document_info
                }
            )
        
        # Update document record
        document.status = DocumentStatus.PROCESSED
        document.processed_date = datetime.utcnow()
        document.num_chunks = len(chunks)
        document.summary = summary
        document.keywords = keywords
        document.metadata = {**(document.metadata or {}), **document_info}
        
        db.commit()
        
    except Exception as e:
        # Update document status to failed
        document = document_crud.get(db, doc_id)
        if document:
            document.status = DocumentStatus.FAILED
            db.commit()
        print(f"Error processing document {doc_id}: {str(e)}")
    
    finally:
        db.close()
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Get document information by ID.
    """
    document = document_crud.get(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        file_size=document.file_size,
        format=document.format,
        status=document.status.value,
        upload_date=document.upload_date,
        processed_date=document.processed_date,
        num_chunks=document.num_chunks,
        metadata=document.metadata,
        summary=document.summary,
        keywords=document.keywords
    )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    format: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all documents with optional filtering.
    """
    query = db.query(Document)
    
    if status:
        query = query.filter(Document.status == status)
    if format:
        query = query.filter(Document.format == format)
    
    total = query.count()
    documents = query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                format=doc.format,
                status=doc.status.value,
                upload_date=doc.upload_date,
                processed_date=doc.processed_date,
                num_chunks=doc.num_chunks,
                metadata=doc.metadata,
                summary=doc.summary,
                keywords=doc.keywords
            )
            for doc in documents
        ],
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Delete a document and its associated chunks from the vector store.
    """
    document = document_crud.get(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Schedule background deletion from vector store
    background_tasks.add_task(delete_document_from_vector_store, document_id)
    
    # Delete from database
    document_crud.remove(db, document_id)
    
    return JSONResponse(
        status_code=200,
        content={"message": f"Document {document_id} deleted successfully"}
    )


async def delete_document_from_vector_store(document_id: str):
    """
    Background task to delete document chunks from vector store.
    """
    try:
        vector_store = VectorStore()
        await vector_store.delete_document(document_id)
    except Exception as e:
        print(f"Error deleting document {document_id} from vector store: {str(e)}")


@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    db: Session = Depends(get_db)
):
    """
    Reprocess a document with new chunking parameters.
    """
    document = document_crud.get(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.status == DocumentStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Document is currently being processed")
    
    # Check if original file still exists
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=400, detail="Original file no longer exists")
    
    # Schedule reprocessing
    background_tasks.add_task(
        reprocess_document_background,
        document_id,
        document.file_path,
        document.format,
        chunk_size,
        chunk_overlap
    )
    
    return JSONResponse(
        status_code=200,
        content={"message": f"Document {document_id} scheduled for reprocessing"}
    )


async def reprocess_document_background(
    doc_id: str,
    file_path: str,
    format: str,
    chunk_size: int,
    chunk_overlap: int
):
    """
    Background task to reprocess a document.
    """
    from app.database.session import SessionLocal
    db = SessionLocal()
    
    try:
        document = document_crud.get(db, doc_id)
        if not document:
            return
        
        # Delete existing chunks
        vector_store = VectorStore()
        await vector_store.delete_document(doc_id)
        
        # Update status
        document.status = DocumentStatus.PROCESSING
        db.commit()
        
        # Process with new parameters
        doc_processor = DocumentProcessor()
        chunks, document_info = await doc_processor.process_document(
            file_path=file_path,
            format=format,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            metadata=document.metadata or {}
        )
        
        # Store new chunks
        if chunks:
            await vector_store.add_document(
                document_id=doc_id,
                chunks=chunks,
                metadata={
                    "filename": document.filename,
                    "format": format,
                    **(document.metadata or {}),
                    **document_info
                }
            )
        
        # Update document record
        document.status = DocumentStatus.PROCESSED
        document.processed_date = datetime.utcnow()
        document.num_chunks = len(chunks)
        
        db.commit()
        
    except Exception as e:
        document = document_crud.get(db, doc_id)
        if document:
            document.status = DocumentStatus.FAILED
            db.commit()
        print(f"Error reprocessing document {doc_id}: {str(e)}")
    
    finally:
        db.close()