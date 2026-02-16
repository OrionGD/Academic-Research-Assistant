"""
Document management endpoints
"""
import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime

from app.core.dependencies import get_current_user
from app.db.mongodb import documents, chunks, users
from app.models.document import DocumentCreate, DocumentUpdate, DocumentStatus, DocumentType
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStoreService

router = APIRouter()
document_processor = DocumentProcessor()
vector_store = VectorStoreService()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: bool = Form(False),
    tags: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Upload and process a document"""
    try:
        # Validate file type
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ["pdf", "docx", "txt", "md"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_extension}"
            )
        
        # Create document record
        document_data = DocumentCreate(
            user_id=current_user["_id"],
            title=title,
            description=description,
            file_type=DocumentType(file_extension),
            is_public=is_public,
            tags=tags.split(",") if tags else []
        )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.{file_extension}"
        file_path = f"uploads/{filename}"
        
        # Save file temporarily
        os.makedirs("uploads", exist_ok=True)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Update document data with file info
        document_dict = document_data.dict(by_alias=True)
        document_dict.update({
            "file_path": file_path,
            "file_size": len(content),
            "status": DocumentStatus.UPLOADING
        })
        
        # Insert document
        result = await documents.insert_one(document_dict)
        document_id = result.inserted_id
        
        # Process document asynchronously
        await document_processor.process_document(str(document_id), file_path)
        
        return {
            "id": str(document_id),
            "message": "Document uploaded successfully. Processing started.",
            "status": "uploading"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/")
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """List user's documents"""
    try:
        query = {"user_id": current_user["_id"]}
        
        if search:
            query["$text"] = {"$search": search}
        
        if tags:
            tag_list = tags.split(",")
            query["tags"] = {"$all": tag_list}
        
        # Get documents
        cursor = documents.find(query).skip(skip).limit(limit).sort("created_at", -1)
        docs = await cursor.to_list(length=limit)
        
        # Get total count
        total = await documents.count_documents(query)
        
        return {
            "documents": [
                {
                    "id": str(doc["_id"]),
                    "title": doc["title"],
                    "description": doc.get("description"),
                    "file_type": doc["file_type"],
                    "status": doc["status"],
                    "created_at": doc["created_at"],
                    "chunk_count": doc.get("chunk_count", 0),
                    "tags": doc.get("tags", [])
                }
                for doc in docs
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get document details"""
    from bson import ObjectId
    
    try:
        doc = await documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["_id"]
        })
        
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Get chunks for this document
        chunk_cursor = chunks.find({"document_id": ObjectId(document_id)})
        doc_chunks = await chunk_cursor.to_list(length=100)
        
        return {
            "id": str(doc["_id"]),
            "title": doc["title"],
            "description": doc.get("description"),
            "file_type": doc["file_type"],
            "status": doc["status"],
            "file_size": doc.get("file_size"),
            "created_at": doc["created_at"],
            "processed_at": doc.get("processed_at"),
            "chunk_count": doc.get("chunk_count", 0),
            "tags": doc.get("tags", []),
            "metadata": doc.get("metadata", {}),
            "chunks": [
                {
                    "id": str(chunk["_id"]),
                    "content": chunk["content"],
                    "chunk_index": chunk["chunk_index"],
                    "page_number": chunk.get("page_number"),
                    "section": chunk.get("section")
                }
                for chunk in doc_chunks
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{document_id}")
async def update_document(
    document_id: str,
    update_data: DocumentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update document metadata"""
    from bson import ObjectId
    
    try:
        update_dict = update_data.dict(exclude_unset=True)
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await documents.update_one(
            {
                "_id": ObjectId(document_id),
                "user_id": current_user["_id"]
            },
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Get updated document
        updated_doc = await documents.find_one({"_id": ObjectId(document_id)})
        
        return {
            "id": str(updated_doc["_id"]),
            "title": updated_doc["title"],
            "description": updated_doc.get("description"),
            "tags": updated_doc.get("tags", []),
            "is_public": updated_doc.get("is_public", False)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete a document and its chunks"""
    from bson import ObjectId
    
    try:
        # Get document first
        doc = await documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["_id"]
        })
        
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete chunks from vector store
        await vector_store.delete_document_chunks(document_id)
        
        # Delete chunks from database
        await chunks.delete_many({"document_id": ObjectId(document_id)})
        
        # Delete document
        await documents.delete_one({"_id": ObjectId(document_id)})
        
        # Delete file if exists
        if doc.get("file_path") and os.path.exists(doc["file_path"]):
            os.remove(doc["file_path"])
        
        return {
            "message": "Document deleted successfully",
            "id": document_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Reprocess a document"""
    from bson import ObjectId
    
    try:
        doc = await documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user["_id"]
        })
        
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if not doc.get("file_path"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document file not found"
            )
        
        # Update status
        await documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": DocumentStatus.PROCESSING}}
        )
        
        # Delete existing chunks
        await chunks.delete_many({"document_id": ObjectId(document_id)})
        await vector_store.delete_document_chunks(document_id)
        
        # Reprocess
        await document_processor.process_document(document_id, doc["file_path"])
        
        return {
            "message": "Document reprocessing started",
            "id": document_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
