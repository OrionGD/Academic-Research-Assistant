"""
Chat API Endpoints
Handles research queries through the RAG pipeline with conversation context.
"""
import json
import uuid
from datetime import datetime
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from enum import Enum

from app.services.rag_pipeline import RAGPipeline
from app.services.search_engine import SearchEngine
from app.database.models import Conversation, Message
from app.database.crud import conversation_crud, message_crud
from app.database.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageType(str, Enum):
    TEXT = "text"
    CITATION = "citation"
    SEARCH_RESULTS = "search_results"
    ERROR = "error"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    type: MessageType = MessageType.TEXT
    metadata: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConversationRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    search_depth: str = Field(default="balanced", regex="^(quick|balanced|deep)$")
    include_sources: bool = True
    stream: bool = False
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=None, ge=100, le=4000)


class Citation(BaseModel):
    document_id: str
    document_title: str
    chunk_id: str
    text: str
    page_number: Optional[int] = None
    confidence: float
    metadata: Optional[dict] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    content: str
    citations: List[Citation]
    search_results: Optional[List[dict]] = None
    processing_time_ms: float
    token_count: Optional[int] = None
    finish_reason: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    messages: List[ChatMessage]


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    page: int
    page_size: int


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    request: ConversationRequest,
    db: Session = Depends(get_db)
):
    """
    Process a research query through the RAG pipeline.
    """
    try:
        rag_pipeline = RAGPipeline()
        
        # Get or create conversation
        conversation = None
        if request.conversation_id:
            conversation = conversation_crud.get(db, request.conversation_id)
        
        if not conversation:
            # Generate conversation title from first message
            title = await generate_conversation_title(request.message)
            conversation = Conversation(
                id=str(uuid.uuid4()),
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Save user message
        user_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=request.message,
            type=MessageType.TEXT,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        
        # Process query through RAG pipeline
        start_time = datetime.utcnow()
        
        response = await rag_pipeline.process_query(
            query=request.message,
            conversation_history=get_conversation_history(db, conversation.id),
            search_depth=request.search_depth,
            include_sources=request.include_sources,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        end_time = datetime.utcnow()
        processing_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Format citations
        citations = []
        if response.get("citations"):
            for citation_data in response["citations"]:
                citations.append(Citation(
                    document_id=citation_data.get("document_id", ""),
                    document_title=citation_data.get("document_title", ""),
                    chunk_id=citation_data.get("chunk_id", ""),
                    text=citation_data.get("text", ""),
                    page_number=citation_data.get("page_number"),
                    confidence=citation_data.get("confidence", 0.0),
                    metadata=citation_data.get("metadata")
                ))
        
        # Save assistant response
        assistant_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response.get("answer", ""),
            type=MessageType.TEXT,
            metadata={
                "citations": [c.dict() for c in citations],
                "processing_time": processing_time_ms,
                "token_count": response.get("token_count"),
                "search_results": response.get("search_results")
            },
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        
        # Update conversation
        conversation.updated_at = datetime.utcnow()
        conversation.message_count = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .count()
        )
        
        db.commit()
        
        return ChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            content=response.get("answer", ""),
            citations=citations,
            search_results=response.get("search_results"),
            processing_time_ms=processing_time_ms,
            token_count=response.get("token_count"),
            finish_reason=response.get("finish_reason")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


@router.post("/query/stream")
async def chat_query_stream(
    request: ConversationRequest,
    db: Session = Depends(get_db)
):
    """
    Stream response for a research query.
    """
    async def response_generator():
        try:
            rag_pipeline = RAGPipeline()
            
            # Get or create conversation
            conversation = None
            if request.conversation_id:
                conversation = conversation_crud.get(db, request.conversation_id)
            
            if not conversation:
                title = await generate_conversation_title(request.message)
                conversation = Conversation(
                    id=str(uuid.uuid4()),
                    title=title,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(conversation)
                db.commit()
                db.refresh(conversation)
            
            # Save user message
            user_message = Message(
                id=str(uuid.uuid4()),
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content=request.message,
                type=MessageType.TEXT,
                created_at=datetime.utcnow()
            )
            db.add(user_message)
            db.commit()
            
            # Get conversation history
            history = get_conversation_history(db, conversation.id)
            
            # Stream response
            assistant_message_id = str(uuid.uuid4())
            full_response = ""
            citations = []
            search_results = []
            
            # Send initial metadata
            yield json.dumps({
                "type": "metadata",
                "conversation_id": conversation.id,
                "message_id": assistant_message_id
            }) + "\n"
            
            # Stream chunks from RAG pipeline
            async for chunk in rag_pipeline.stream_query(
                query=request.message,
                conversation_history=history,
                search_depth=request.search_depth,
                include_sources=request.include_sources,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                if chunk.get("type") == "text":
                    full_response += chunk.get("content", "")
                    yield json.dumps({
                        "type": "text",
                        "content": chunk.get("content", "")
                    }) + "\n"
                
                elif chunk.get("type") == "citation":
                    citations.append(chunk.get("data", {}))
                    yield json.dumps({
                        "type": "citation",
                        "data": chunk.get("data", {})
                    }) + "\n"
                
                elif chunk.get("type") == "search_result":
                    search_results.append(chunk.get("data", {}))
                    yield json.dumps({
                        "type": "search_result",
                        "data": chunk.get("data", {})
                    }) + "\n"
            
            # Save assistant response
            assistant_message = Message(
                id=assistant_message_id,
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=full_response,
                type=MessageType.TEXT,
                metadata={
                    "citations": citations,
                    "search_results": search_results
                },
                created_at=datetime.utcnow()
            )
            db.add(assistant_message)
            
            # Update conversation
            conversation.updated_at = datetime.utcnow()
            conversation.message_count = (
                db.query(Message)
                .filter(Message.conversation_id == conversation.id)
                .count()
            )
            
            db.commit()
            
            # Send completion signal
            yield json.dumps({
                "type": "complete",
                "message_id": assistant_message_id
            }) + "\n"
            
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "error": str(e)
            }) + "\n"
    
    return StreamingResponse(
        response_generator(),
        media_type="text/event-stream"
    )


@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat interactions.
    """
    await websocket.accept()
    
    try:
        rag_pipeline = RAGPipeline()
        
        # Get or create conversation
        conversation = conversation_crud.get(db, conversation_id)
        if not conversation:
            await websocket.send_json({
                "type": "error",
                "error": "Conversation not found"
            })
            await websocket.close()
            return
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "message":
                user_message = data.get("content", "")
                
                # Save user message
                user_msg = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conversation.id,
                    role=MessageRole.USER,
                    content=user_message,
                    type=MessageType.TEXT,
                    created_at=datetime.utcnow()
                )
                db.add(user_msg)
                db.commit()
                
                # Get conversation history
                history = get_conversation_history(db, conversation.id)
                
                # Send typing indicator
                await websocket.send_json({
                    "type": "typing",
                    "status": True
                })
                
                # Stream response
                assistant_message_id = str(uuid.uuid4())
                full_response = ""
                citations = []
                
                async for chunk in rag_pipeline.stream_query(
                    query=user_message,
                    conversation_history=history,
                    search_depth="balanced",
                    include_sources=True
                ):
                    if chunk.get("type") == "text":
                        content = chunk.get("content", "")
                        full_response += content
                        await websocket.send_json({
                            "type": "text",
                            "content": content
                        })
                    
                    elif chunk.get("type") == "citation":
                        citations.append(chunk.get("data", {}))
                        await websocket.send_json({
                            "type": "citation",
                            "data": chunk.get("data", {})
                        })
                
                # Save assistant response
                assistant_message = Message(
                    id=assistant_message_id,
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=full_response,
                    type=MessageType.TEXT,
                    metadata={"citations": citations},
                    created_at=datetime.utcnow()
                )
                db.add(assistant_message)
                
                # Update conversation
                conversation.updated_at = datetime.utcnow()
                conversation.message_count = (
                    db.query(Message)
                    .filter(Message.conversation_id == conversation.id)
                    .count()
                )
                
                db.commit()
                
                # Send completion
                await websocket.send_json({
                    "type": "complete",
                    "message_id": assistant_message_id
                })
                
            elif message_type == "ping":
                await websocket.send_json({
                    "type": "pong"
                })
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for conversation {conversation_id}")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
        await websocket.close()


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List all conversations.
    """
    query = db.query(Conversation).order_by(Conversation.updated_at.desc())
    
    total = query.count()
    conversations = query.offset(skip).limit(limit).all()
    
    return ConversationListResponse(
        conversations=[
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=conv.message_count,
                messages=get_conversation_messages(db, conv.id)
            )
            for conv in conversations
        ],
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific conversation with all messages.
    """
    conversation = conversation_crud.get(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=conversation.message_count,
        messages=get_conversation_messages(db, conversation.id)
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its messages.
    """
    conversation = conversation_crud.get(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    
    # Delete conversation
    conversation_crud.remove(db, conversation_id)
    
    return {"message": f"Conversation {conversation_id} deleted successfully"}


@router.post("/conversations/{conversation_id}/title")
def update_conversation_title(
    conversation_id: str,
    title: str,
    db: Session = Depends(get_db)
):
    """
    Update conversation title.
    """
    conversation = conversation_crud.get(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    conversation.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Title updated successfully"}


@router.post("/follow-up")
async def follow_up_question(
    conversation_id: str = Form(...),
    message: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Handle follow-up questions within an existing conversation context.
    """
    try:
        rag_pipeline = RAGPipeline()
        
        # Get conversation
        conversation = conversation_crud.get(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Save user message
        user_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=message,
            type=MessageType.TEXT,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        
        # Get conversation history
        history = get_conversation_history(db, conversation.id)
        
        # Process follow-up question
        response = await rag_pipeline.process_query(
            query=message,
            conversation_history=history,
            search_depth="balanced",
            include_sources=True
        )
        
        # Save assistant response
        assistant_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response.get("answer", ""),
            type=MessageType.TEXT,
            metadata={
                "citations": response.get("citations", []),
                "is_follow_up": True
            },
            created_at=datetime.utcnow()
        )
        db.add(assistant_message)
        
        # Update conversation
        conversation.updated_at = datetime.utcnow()
        conversation.message_count += 2  # User + Assistant messages
        
        db.commit()
        
        return ChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            content=response.get("answer", ""),
            citations=response.get("citations", []),
            processing_time_ms=response.get("processing_time_ms", 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Follow-up processing failed: {str(e)}")


# Helper functions
def get_conversation_history(db: Session, conversation_id: str, limit: int = 10) -> List[dict]:
    """Get recent conversation history."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    
    # Return in chronological order
    messages.reverse()
    
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.created_at.isoformat()
        }
        for msg in messages
    ]


def get_conversation_messages(db: Session, conversation_id: str) -> List[ChatMessage]:
    """Get all messages for a conversation."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    
    return [
        ChatMessage(
            role=msg.role,
            content=msg.content,
            type=msg.type,
            metadata=msg.metadata,
            timestamp=msg.created_at
        )
        for msg in messages
    ]


async def generate_conversation_title(query: str) -> str:
    """Generate a title for a conversation based on the first query."""
    try:
        # Simple title generation - take first few words
        words = query.split()
        if len(words) <= 5:
            return query
        else:
            return " ".join(words[:5]) + "..."
    except:
        return "New Conversation"