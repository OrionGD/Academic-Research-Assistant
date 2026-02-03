"""
Chat endpoints for RAG conversations
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import json

from app.core.dependencies import get_current_user
from app.services.chat_service import ChatService
from app.db.mongodb import conversations
from datetime import datetime

router = APIRouter()
chat_service = ChatService()


@router.post("/query")
async def chat_query(
    query: str,
    conversation_id: Optional[str] = None,
    document_ids: Optional[List[str]] = Query(None),
    stream: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Process a chat query with RAG"""
    try:
        if stream:
            return StreamingResponse(
                chat_service.stream_chat_response(
                    query=query,
                    user_id=str(current_user["_id"]),
                    conversation_id=conversation_id,
                    document_ids=document_ids
                ),
                media_type="text/event-stream"
            )
        
        # Non-streaming response
        result = await chat_service.process_chat_query(
            query=query,
            user_id=str(current_user["_id"]),
            conversation_id=conversation_id,
            document_ids=document_ids
        )
        
        # Save conversation
        await save_conversation(
            user_id=current_user["_id"],
            conversation_id=result["conversation_id"],
            query=query,
            response=result["response"],
            sources=result["sources"]
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


async def save_conversation(
    user_id: str,
    conversation_id: str,
    query: str,
    response: str,
    sources: List[Dict[str, Any]]
):
    """Save conversation to database"""
    from bson import ObjectId
    
    try:
        message = {
            "query": query,
            "response": response,
            "sources": sources,
            "timestamp": datetime.utcnow()
        }
        
        # Check if conversation exists
        conv = await conversations.find_one({"_id": ObjectId(conversation_id)})
        
        if conv:
            # Update existing conversation
            await conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        else:
            # Create new conversation
            await conversations.insert_one({
                "_id": ObjectId(conversation_id),
                "user_id": ObjectId(user_id),
                "messages": [message],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
    
    except Exception as e:
        print(f"Failed to save conversation: {e}")


@router.get("/conversations")
async def list_conversations(
    skip: int = 0,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """List user's conversations"""
    try:
        cursor = conversations.find({"user_id": current_user["_id"]}) \
            .sort("updated_at", -1) \
            .skip(skip) \
            .limit(limit)
        
        convs = await cursor.to_list(length=limit)
        
        total = await conversations.count_documents({"user_id": current_user["_id"]})
        
        return {
            "conversations": [
                {
                    "id": str(conv["_id"]),
                    "message_count": len(conv.get("messages", [])),
                    "last_message": conv.get("messages", [])[-1]["query"] if conv.get("messages") else "",
                    "created_at": conv["created_at"],
                    "updated_at": conv["updated_at"]
                }
                for conv in convs
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


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get conversation details"""
    from bson import ObjectId
    
    try:
        conv = await conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": current_user["_id"]
        })
        
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return {
            "id": str(conv["_id"]),
            "messages": [
                {
                    "query": msg["query"],
                    "response": msg["response"],
                    "sources": msg.get("sources", []),
                    "timestamp": msg["timestamp"]
                }
                for msg in conv.get("messages", [])
            ],
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete a conversation"""
    from bson import ObjectId
    
    try:
        result = await conversations.delete_one({
            "_id": ObjectId(conversation_id),
            "user_id": current_user["_id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return {
            "message": "Conversation deleted successfully",
            "id": conversation_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )