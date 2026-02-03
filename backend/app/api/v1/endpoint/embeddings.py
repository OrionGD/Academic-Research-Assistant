"""
Embedding management endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.services.embedding_service import EmbeddingService
from app.db.mongodb import documents, chunks

router = APIRouter()
embedding_service = EmbeddingService()


@router.post("/generate")
async def generate_embeddings(
    texts: List[str],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Generate embeddings for given texts"""
    try:
        embeddings = await embedding_service.generate_embeddings(texts)
        
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats")
async def get_embedding_stats(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get embedding statistics"""
    try:
        # Count documents with embeddings
        doc_pipeline = [
            {"$match": {"user_id": current_user["_id"]}},
            {"$lookup": {
                "from": "chunks",
                "localField": "_id",
                "foreignField": "document_id",
                "as": "chunks"
            }},
            {"$unwind": "$chunks"},
            {"$match": {"chunks.embedding_vector": {"$ne": None}}},
            {"$group": {
                "_id": "$_id",
                "chunk_count": {"$sum": 1}
            }}
        ]
        
        doc_cursor = documents.aggregate(doc_pipeline)
        docs_with_embeddings = await doc_cursor.to_list(length=100)
        
        # Count total embeddings
        total_embeddings = await chunks.count_documents({
            "user_id": current_user["_id"],
            "embedding_vector": {"$ne": None}
        })
        
        # Get embedding dimension
        sample = await chunks.find_one({
            "user_id": current_user["_id"],
            "embedding_vector": {"$ne": None}
        })
        
        dimension = len(sample["embedding_vector"]) if sample and sample.get("embedding_vector") else 0
        
        return {
            "documents_with_embeddings": len(docs_with_embeddings),
            "total_embeddings": total_embeddings,
            "embedding_dimension": dimension,
            "documents": [
                {
                    "document_id": str(doc["_id"]),
                    "chunk_count": doc["chunk_count"]
                }
                for doc in docs_with_embeddings
            ]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/similarity")
async def calculate_similarity(
    text1: str,
    text2: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Calculate similarity between two texts"""
    try:
        similarity = await embedding_service.calculate_similarity(text1, text2)
        
        return {
            "text1": text1,
            "text2": text2,
            "similarity": similarity,
            "interpretation": interpret_similarity(similarity)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


def interpret_similarity(score: float) -> str:
    """Interpret similarity score"""
    if score >= 0.9:
        return "Very similar"
    elif score >= 0.7:
        return "Similar"
    elif score >= 0.5:
        return "Somewhat related"
    elif score >= 0.3:
        return "Slightly related"
    else:
        return "Not related"


@router.post("/cluster")
async def cluster_embeddings(
    document_id: str,
    n_clusters: int = 5,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Cluster document chunks"""
    from bson import ObjectId
    
    try:
        # Get all chunks for document
        chunk_cursor = chunks.find({
            "document_id": ObjectId(document_id),
            "user_id": current_user["_id"],
            "embedding_vector": {"$ne": None}
        })
        
        doc_chunks = await chunk_cursor.to_list(length=1000)
        
        if not doc_chunks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No embeddings found for this document"
            )
        
        # Extract embeddings
        embeddings = [chunk["embedding_vector"] for chunk in doc_chunks]
        chunk_ids = [str(chunk["_id"]) for chunk in doc_chunks]
        contents = [chunk["content"] for chunk in doc_chunks]
        
        # Perform clustering
        clusters = await embedding_service.cluster_embeddings(
            embeddings=embeddings,
            n_clusters=n_clusters
        )
        
        # Organize results
        cluster_results = []
        for i in range(n_clusters):
            cluster_indices = [j for j, label in enumerate(clusters) if label == i]
            
            if cluster_indices:
                cluster_chunks = []
                for idx in cluster_indices[:5]:  # Show top 5 per cluster
                    cluster_chunks.append({
                        "chunk_id": chunk_ids[idx],
                        "content_preview": contents[idx][:100] + "...",
                        "chunk_index": doc_chunks[idx]["chunk_index"]
                    })
                
                cluster_results.append({
                    "cluster_id": i,
                    "size": len(cluster_indices),
                    "sample_chunks": cluster_chunks
                })
        
        return {
            "document_id": document_id,
            "total_chunks": len(doc_chunks),
            "n_clusters": n_clusters,
            "clusters": cluster_results
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )