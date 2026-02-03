"""
Search endpoints
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.dependencies import get_current_user
from app.services.search_service import SearchService
from app.db.mongodb import search_history
from datetime import datetime

router = APIRouter()
search_service = SearchService()


@router.post("/vector")
async def vector_search(
    query: str,
    document_ids: Optional[List[str]] = Query(None),
    top_k: int = 10,
    threshold: float = 0.7,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Vector similarity search"""
    try:
        results = await search_service.vector_search(
            query=query,
            user_id=str(current_user["_id"]),
            document_ids=document_ids,
            top_k=top_k,
            similarity_threshold=threshold
        )
        
        # Log search
        await search_history.insert_one({
            "user_id": current_user["_id"],
            "query": query,
            "type": "vector",
            "result_count": len(results),
            "created_at": datetime.utcnow()
        })
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/keyword")
async def keyword_search(
    query: str,
    document_ids: Optional[List[str]] = Query(None),
    skip: int = 0,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Keyword/text search"""
    try:
        results = await search_service.keyword_search(
            query=query,
            user_id=str(current_user["_id"]),
            document_ids=document_ids,
            skip=skip,
            limit=limit
        )
        
        # Log search
        await search_history.insert_one({
            "user_id": current_user["_id"],
            "query": query,
            "type": "keyword",
            "result_count": len(results),
            "created_at": datetime.utcnow()
        })
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/hybrid")
async def hybrid_search(
    query: str,
    document_ids: Optional[List[str]] = Query(None),
    top_k: int = 10,
    vector_weight: float = 0.7,
    keyword_weight: float = 0.3,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Hybrid vector + keyword search"""
    try:
        results = await search_service.hybrid_search(
            query=query,
            user_id=str(current_user["_id"]),
            document_ids=document_ids,
            top_k=top_k,
            vector_weight=vector_weight,
            keyword_weight=keyword_weight
        )
        
        # Log search
        await search_history.insert_one({
            "user_id": current_user["_id"],
            "query": query,
            "type": "hybrid",
            "result_count": len(results),
            "created_at": datetime.utcnow()
        })
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/filters")
async def get_search_filters(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get available search filters"""
    try:
        from app.db.mongodb import documents
        
        # Get user's tags
        pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        tags_cursor = documents.aggregate(pipeline)
        tags = await tags_cursor.to_list(length=50)
        
        # Get document types
        type_pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {"$group": {"_id": "$file_type", "count": {"$sum": 1}}}
        ]
        
        types_cursor = documents.aggregate(type_pipeline)
        types = await types_cursor.to_list(length=10)
        
        # Get date ranges
        date_pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {"$group": {
                "_id": None,
                "min_date": {"$min": "$created_at"},
                "max_date": {"$max": "$created_at"}
            }}
        ]
        
        date_cursor = documents.aggregate(date_pipeline)
        dates = await date_cursor.to_list(length=1)
        
        return {
            "tags": [{"tag": tag["_id"], "count": tag["count"]} for tag in tags],
            "document_types": [{"type": t["_id"], "count": t["count"]} for t in types],
            "date_range": dates[0] if dates else {}
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history")
async def get_search_history(
    skip: int = 0,
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get user's search history"""
    try:
        cursor = search_history.find({"user_id": current_user["_id"]}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit)
        
        history = await cursor.to_list(length=limit)
        
        total = await search_history.count_documents({"user_id": current_user["_id"]})
        
        return {
            "history": [
                {
                    "id": str(item["_id"]),
                    "query": item["query"],
                    "type": item.get("type", "unknown"),
                    "result_count": item.get("result_count", 0),
                    "created_at": item["created_at"]
                }
                for item in history
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