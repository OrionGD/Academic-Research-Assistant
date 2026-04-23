"""
Chat API routes
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import embedding_service, retrieval_service, chat_service
from app.config.database import db

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatQueryRequest(BaseModel):
    """Request model for chat query"""
    document_id: str
    query: str
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat"""
    answer: str
    sources: list
    similarity_scores: list
    model: str


@router.post("/query", response_model=ChatResponse)
async def query_document(request: ChatQueryRequest):
    """
    Query a document with AI chat
    
    Args:
        request: Chat query request
        
    Returns:
        AI response with sources and scores
    """
    try:
        # Verify document exists
        document = await db.documents.find_one({"document_id": request.document_id})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Generate query embedding
        query_embedding = await embedding_service.generate_query_embedding(request.query)
        
        # Retrieve relevant chunks
        chunks = await retrieval_service.retrieve_context(
            document_id=request.document_id,
            query_embedding=query_embedding
        )
        
        # Generate response
        response = await chat_service.generate_response(
            query=request.query,
            chunks=chunks,
            summary=document.get("summary", ""),
            keywords=document.get("keywords", [])
        )
        
        # Save chat to database
        chat_data = {
            "document_id": request.document_id,
            "user_id": request.user_id,
            "query": request.query,
            "answer": response["answer"],
            "similarity_scores": response["similarity_scores"],
            "source_count": len(response["sources"])
        }
        await db.chats.insert_one(chat_data)
        
        logger.info(f"Chat query processed for document {request.document_id}")
        
        return ChatResponse(
            answer=response["answer"],
            sources=response["sources"],
            similarity_scores=response["similarity_scores"],
            model=response.get("model", "")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@router.get("/history/{document_id}")
async def get_chat_history(document_id: str, skip: int = 0, limit: int = 20):
    """
    Get chat history for a document
    
    Args:
        document_id: Document identifier
        skip: Number of chats to skip
        limit: Maximum number of chats to return
        
    Returns:
        Chat history
    """
    try:
        chats = await db.chats.find({"document_id": document_id}).skip(skip).limit(limit).to_list(length=limit)
        total = await db.chats.count_documents({"document_id": document_id})
        
        return {
            "document_id": document_id,
            "total": total,
            "chats": chats,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
