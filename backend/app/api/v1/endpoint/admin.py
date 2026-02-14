"""
Administrative endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta

from app.core.dependencies import get_current_user, get_admin_user
from app.db.mongodb import users, documents, chunks, conversations, search_history

router = APIRouter()


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    role: str = None,
    status: str = None,
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """List all users (admin only)"""
    try:
        query = {}
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        
        cursor = users.find(query).skip(skip).limit(limit).sort("created_at", -1)
        user_list = await cursor.to_list(length=limit)
        
        total = await users.count_documents(query)
        
        return {
            "users": [
                {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "display_name": user.get("display_name"),
                    "role": user.get("role", "user"),
                    "status": user.get("status", "active"),
                    "created_at": user.get("created_at"),
                    "document_count": await documents.count_documents({"user_id": user["_id"]})
                }
                for user in user_list
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


@router.get("/stats")
async def get_system_stats(
    days: int = 7,
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Get system statistics (admin only)"""
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # User statistics
        total_users = await users.count_documents({})
        active_users = await users.count_documents({"status": "active"})
        new_users = await users.count_documents({"created_at": {"$gte": start_date}})
        
        # Document statistics
        total_documents = await documents.count_documents({})
        documents_last_week = await documents.count_documents({"created_at": {"$gte": start_date}})
        
        # Chunk statistics
        total_chunks = await chunks.count_documents({})
        chunks_with_embeddings = await chunks.count_documents({"embedding_vector": {"$ne": None}})
        
        # Conversation statistics
        total_conversations = await conversations.count_documents({})
        
        # Search statistics
        total_searches = await search_history.count_documents({})
        
        # Daily activity
        daily_pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        daily_docs_cursor = documents.aggregate(daily_pipeline)
        daily_docs = await daily_docs_cursor.to_list(length=days)
        
        daily_searches_cursor = search_history.aggregate(daily_pipeline)
        daily_searches = await daily_searches_cursor.to_list(length=days)
        
        return {
            "time_period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": days
            },
            "users": {
                "total": total_users,
                "active": active_users,
                "new_last_week": new_users
            },
            "documents": {
                "total": total_documents,
                "last_week": documents_last_week,
                "daily": daily_docs
            },
            "chunks": {
                "total": total_chunks,
                "with_embeddings": chunks_with_embeddings,
                "embedding_rate": chunks_with_embeddings / total_chunks if total_chunks > 0 else 0
            },
            "conversations": {
                "total": total_conversations
            },
            "searches": {
                "total": total_searches,
                "daily": daily_searches
            },
            "storage_estimate": {
                "documents_mb": (total_documents * 0.1),  # Estimate
                "embeddings_mb": (chunks_with_embeddings * 0.006),  # 1536 floats
                "total_mb": (total_documents * 0.1) + (chunks_with_embeddings * 0.006)
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Update user role (admin only)"""
    from bson import ObjectId
    
    try:
        valid_roles = ["user", "admin", "researcher"]
        if role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {valid_roles}"
            )
        
        result = await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        updated_user = await users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "User role updated successfully",
            "user": {
                "id": str(updated_user["_id"]),
                "email": updated_user["email"],
                "role": updated_user["role"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str,
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Update user status (admin only)"""
    from bson import ObjectId
    
    try:
        valid_statuses = ["active", "inactive", "suspended"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        result = await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        updated_user = await users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "User status updated successfully",
            "user": {
                "id": str(updated_user["_id"]),
                "email": updated_user["email"],
                "status": updated_user["status"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Delete user and all their data (admin only)"""
    from bson import ObjectId
    
    try:
        # Get user first
        user = await users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user's documents and related data
        await documents.delete_many({"user_id": ObjectId(user_id)})
        await chunks.delete_many({"user_id": ObjectId(user_id)})
        await conversations.delete_many({"user_id": ObjectId(user_id)})
        await search_history.delete_many({"user_id": ObjectId(user_id)})
        
        # Delete user
        await users.delete_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "User and all associated data deleted successfully",
            "user_id": user_id,
            "email": user["email"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/system-health")
async def system_health_check(
    admin: Dict[str, Any] = Depends(get_admin_user)
) -> Dict[str, Any]:
    """Check system health (admin only)"""
    try:
        from app.db.mongodb import db_instance
        import psutil
        import os
        
        # Database health
        db_healthy = False
        if db_instance.client:
            try:
                await db_instance.client.admin.command('ping')
                db_healthy = True
            except:
                db_healthy = False
        
        # Disk usage
        disk_usage = psutil.disk_usage('/')
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Process info
        process = psutil.Process(os.getpid())
        
        # Check external services
        services = {
            "mongodb": db_healthy,
            "openai": await check_openai_health(),
            "firebase": await check_firebase_health()
        }
        
        return {
            "timestamp": datetime.utcnow(),
            "services": services,
            "system": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": memory.percent,
                "disk_percent": disk_usage.percent,
                "process_memory_mb": process.memory_info().rss / 1024 / 1024,
                "process_threads": process.num_threads()
            },
            "overall": all(services.values())
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


async def check_openai_health() -> bool:
    """Check OpenAI API health"""
    try:
        from openai import OpenAI
        from app.core.config import settings
        
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        client.models.list()
        return True
    except:
        return False


async def check_firebase_health() -> bool:
    """Check Firebase health"""
    try:
        from app.services.firebase import FirebaseService
        service = FirebaseService.get_instance()
        # Simple check - if service initialized
        return True
    except:
        return False
