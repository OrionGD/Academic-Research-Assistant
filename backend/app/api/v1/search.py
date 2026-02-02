"""
Search API Endpoints
Handles semantic, hybrid, and filtered search operations.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from enum import Enum

from app.services.search_engine import SearchEngine
from app.services.vector_store import VectorStore
from app.database.models import Document
from app.database.session import get_db
from sqlalchemy.orm import Session

router = APIRouter()


class SearchType(str, Enum):
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class FilterCriteria(BaseModel):
    document_ids: Optional[List[str]] = None
    document_types: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_relevance: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    languages: Optional[List[str]] = None


class SearchRequest(BaseModel):
    query: str
    search_type: SearchType = SearchType.HYBRID
    filters: Optional[FilterCriteria] = None
    top_k: int = Field(default=10, ge=1, le=100)
    include_metadata: bool = True
    include_source_text: bool = True


class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    text: str
    score: float
    metadata: Optional[Dict[str, Any]] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
    start_index: Optional[int] = None
    end_index: Optional[int] = None


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_hits: int
    query_time_ms: float
    search_type: SearchType
    filters_applied: Optional[Dict[str, Any]] = None
    suggested_queries: Optional[List[str]] = None


class AdvancedSearchRequest(BaseModel):
    queries: List[str]
    search_type: SearchType = SearchType.HYBRID
    filters: Optional[FilterCriteria] = None
    top_k_per_query: int = Field(default=5, ge=1, le=20)
    fusion_method: str = "rrf"  # reciprocal rank fusion


class AdvancedSearchResult(BaseModel):
    query: str
    results: List[SearchResult]
    total_hits: int


class AdvancedSearchResponse(BaseModel):
    queries: List[AdvancedSearchResult]
    fused_results: List[SearchResult]
    total_hits: int
    query_time_ms: float


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform semantic search using vector embeddings.
    """
    try:
        search_engine = SearchEngine()
        
        # Convert filters to search engine format
        filter_dict = {}
        if request.filters:
            filter_dict = {
                "document_ids": request.filters.document_ids,
                "document_types": request.filters.document_types,
                "date_range": {
                    "from": request.filters.date_from,
                    "to": request.filters.date_to
                } if request.filters.date_from or request.filters.date_to else None,
                "min_score": request.filters.min_relevance,
                "languages": request.filters.languages
            }
        
        # Perform search
        start_time = datetime.utcnow()
        results = await search_engine.semantic_search(
            query=request.query,
            top_k=request.top_k,
            filters=filter_dict if filter_dict else None,
            include_metadata=request.include_metadata,
            include_source=request.include_source_text
        )
        end_time = datetime.utcnow()
        query_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Format results
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                chunk_id=result.get("chunk_id", ""),
                document_id=result.get("document_id", ""),
                document_title=result.get("document_title", ""),
                text=result.get("text", ""),
                score=result.get("score", 0.0),
                metadata=result.get("metadata"),
                page_number=result.get("page_number"),
                section=result.get("section"),
                start_index=result.get("start_index"),
                end_index=result.get("end_index")
            ))
        
        # Get suggested queries
        suggested_queries = await search_engine.suggest_queries(request.query)
        
        return SearchResponse(
            results=search_results,
            total_hits=len(search_results),
            query_time_ms=query_time_ms,
            search_type=SearchType.SEMANTIC,
            filters_applied=request.filters.dict() if request.filters else None,
            suggested_queries=suggested_queries[:5] if suggested_queries else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/keyword", response_model=SearchResponse)
async def keyword_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform keyword-based search using traditional IR techniques.
    """
    try:
        search_engine = SearchEngine()
        
        # Convert filters to search engine format
        filter_dict = {}
        if request.filters:
            filter_dict = {
                "document_ids": request.filters.document_ids,
                "document_types": request.filters.document_types,
                "date_range": {
                    "from": request.filters.date_from,
                    "to": request.filters.date_to
                } if request.filters.date_from or request.filters.date_to else None,
                "min_score": request.filters.min_relevance,
                "languages": request.filters.languages
            }
        
        # Perform search
        start_time = datetime.utcnow()
        results = await search_engine.keyword_search(
            query=request.query,
            top_k=request.top_k,
            filters=filter_dict if filter_dict else None,
            include_metadata=request.include_metadata,
            include_source=request.include_source_text
        )
        end_time = datetime.utcnow()
        query_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Format results
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                chunk_id=result.get("chunk_id", ""),
                document_id=result.get("document_id", ""),
                document_title=result.get("document_title", ""),
                text=result.get("text", ""),
                score=result.get("score", 0.0),
                metadata=result.get("metadata"),
                page_number=result.get("page_number"),
                section=result.get("section"),
                start_index=result.get("start_index"),
                end_index=result.get("end_index")
            ))
        
        return SearchResponse(
            results=search_results,
            total_hits=len(search_results),
            query_time_ms=query_time_ms,
            search_type=SearchType.KEYWORD,
            filters_applied=request.filters.dict() if request.filters else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform hybrid search combining semantic and keyword approaches.
    """
    try:
        search_engine = SearchEngine()
        
        # Convert filters to search engine format
        filter_dict = {}
        if request.filters:
            filter_dict = {
                "document_ids": request.filters.document_ids,
                "document_types": request.filters.document_types,
                "date_range": {
                    "from": request.filters.date_from,
                    "to": request.filters.date_to
                } if request.filters.date_from or request.filters.date_to else None,
                "min_score": request.filters.min_relevance,
                "languages": request.filters.languages
            }
        
        # Perform hybrid search
        start_time = datetime.utcnow()
        results = await search_engine.hybrid_search(
            query=request.query,
            top_k=request.top_k,
            filters=filter_dict if filter_dict else None,
            include_metadata=request.include_metadata,
            include_source=request.include_source_text
        )
        end_time = datetime.utcnow()
        query_time_ms = (end_time - start_time).total_seconds() * 1000
        
        # Format results
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                chunk_id=result.get("chunk_id", ""),
                document_id=result.get("document_id", ""),
                document_title=result.get("document_title", ""),
                text=result.get("text", ""),
                score=result.get("score", 0.0),
                metadata=result.get("metadata"),
                page_number=result.get("page_number"),
                section=result.get("section"),
                start_index=result.get("start_index"),
                end_index=result.get("end_index")
            ))
        
        # Get suggested queries
        suggested_queries = await search_engine.suggest_queries(request.query)
        
        return SearchResponse(
            results=search_results,
            total_hits=len(search_results),
            query_time_ms=query_time_ms,
            search_type=SearchType.HYBRID,
            filters_applied=request.filters.dict() if request.filters else None,
            suggested_queries=suggested_queries[:5] if suggested_queries else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/advanced", response_model=AdvancedSearchResponse)
async def advanced_search(
    request: AdvancedSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Perform advanced search with multiple queries and result fusion.
    """
    try:
        search_engine = SearchEngine()
        
        # Convert filters to search engine format
        filter_dict = {}
        if request.filters:
            filter_dict = {
                "document_ids": request.filters.document_ids,
                "document_types": request.filters.document_types,
                "date_range": {
                    "from": request.filters.date_from,
                    "to": request.filters.date_to
                } if request.filters.date_from or request.filters.date_to else None,
                "min_score": request.filters.min_relevance,
                "languages": request.filters.languages
            }
        
        start_time = datetime.utcnow()
        
        # Execute all queries
        query_results = []
        all_results = []
        
        for query in request.queries:
            results = await search_engine.hybrid_search(
                query=query,
                top_k=request.top_k_per_query,
                filters=filter_dict if filter_dict else None,
                include_metadata=True,
                include_source=True
            )
            
            # Format results for this query
            search_results = []
            for result in results:
                search_result = SearchResult(
                    chunk_id=result.get("chunk_id", ""),
                    document_id=result.get("document_id", ""),
                    document_title=result.get("document_title", ""),
                    text=result.get("text", ""),
                    score=result.get("score", 0.0),
                    metadata=result.get("metadata"),
                    page_number=result.get("page_number"),
                    section=result.get("section"),
                    start_index=result.get("start_index"),
                    end_index=result.get("end_index")
                )
                search_results.append(search_result)
                all_results.append({
                    "query": query,
                    "result": search_result,
                    "score": result.get("score", 0.0)
                })
            
            query_results.append(AdvancedSearchResult(
                query=query,
                results=search_results,
                total_hits=len(search_results)
            ))
        
        # Fuse results
        fused_results = await search_engine.fuse_results(
            all_results,
            method=request.fusion_method,
            top_k=request.top_k_per_query * len(request.queries)
        )
        
        end_time = datetime.utcnow()
        query_time_ms = (end_time - start_time).total_seconds() * 1000
        
        return AdvancedSearchResponse(
            queries=query_results,
            fused_results=fused_results,
            total_hits=sum(len(qr.results) for qr in query_results),
            query_time_ms=query_time_ms
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")


@router.get("/documents/autocomplete")
async def document_autocomplete(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Autocomplete document titles and metadata.
    """
    try:
        search_engine = SearchEngine()
        suggestions = await search_engine.autocomplete_documents(query, limit)
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autocomplete failed: {str(e)}")


@router.get("/filters/available")
async def get_available_filters(
    db: Session = Depends(get_db)
):
    """
    Get available filters for search refinement.
    """
    try:
        vector_store = VectorStore()
        
        # Get distinct values for filtering
        filters = await vector_store.get_available_filters()
        
        # Get document types from database
        document_types = db.query(Document.metadata['document_type'].astext).distinct().all()
        document_types = [dt[0] for dt in document_types if dt[0]]
        
        # Get languages from database
        languages = db.query(Document.metadata['language'].astext).distinct().all()
        languages = [lang[0] for lang in languages if lang[0]]
        
        return {
            "document_types": document_types,
            "languages": languages,
            "date_range": filters.get("date_range", {}),
            "document_ids": filters.get("document_ids", []),
            "metadata_fields": filters.get("metadata_fields", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get filters: {str(e)}")


@router.get("/statistics")
async def get_search_statistics(
    db: Session = Depends(get_db)
):
    """
    Get search statistics and index information.
    """
    try:
        vector_store = VectorStore()
        statistics = await vector_store.get_statistics()
        
        # Add database statistics
        total_documents = db.query(Document).count()
        processed_documents = db.query(Document).filter(Document.status == "processed").count()
        
        statistics.update({
            "database": {
                "total_documents": total_documents,
                "processed_documents": processed_documents,
                "failed_documents": db.query(Document).filter(Document.status == "failed").count(),
                "processing_documents": db.query(Document).filter(Document.status == "processing").count()
            }
        })
        
        return statistics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")