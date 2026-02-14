"""
Complex aggregation pipelines for analytics and ML feature extraction.
Provides pipelines for time-series analysis, user behavior, and document insights.
"""

from typing import List, Dict, Any, Optional, Union, Tuple
from pymongo import MongoClient
from pymongo.collection import Collection
from datetime import datetime, timedelta
import logging
from bson import ObjectId
import numpy as np
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AggregationPipelines:
    """
    Advanced aggregation pipelines for ML feature extraction and analytics.
    """
    
    def __init__(
        self,
        connection_string: str,
        database_name: str
    ):
        """
        Initialize aggregation pipelines.
        
        Args:
            connection_string: MongoDB connection string
            database_name: Database name
        """
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        
        logger.info(f"Initialized AggregationPipelines for {database_name}")
    
    def document_insights_pipeline(
        self,
        document_id: str,
        include_chunk_stats: bool = True
    ) -> Dict[str, Any]:
        """
        Generate comprehensive insights about a document.
        
        Args:
            document_id: Document ID
            include_chunk_stats: Whether to include chunk-level statistics
            
        Returns:
            Document insights
        """
        pipeline = [
            # Match the document
            {"$match": {"document_id": document_id}},
            
            # Group by document
            {
                "$group": {
                    "_id": "$document_id",
                    "total_chunks": {"$sum": 1},
                    "avg_chunk_size": {"$avg": {"$strLenCP": "$text"}},
                    "min_chunk_size": {"$min": {"$strLenCP": "$text"}},
                    "max_chunk_size": {"$max": {"$strLenCP": "$text"}},
                    "chunk_ids": {"$push": "$chunk_id"},
                    "created_at": {"$first": "$created_at"},
                    "user_id": {"$first": "$user_id"}
                }
            },
            
            # Add document metadata
            {
                "$lookup": {
                    "from": "documents",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "document_metadata"
                }
            },
            
            # Unwind metadata
            {"$unwind": "$document_metadata"}
        ]
        
        if include_chunk_stats:
            # Add chunk-level statistics
            pipeline.extend([
                {
                    "$lookup": {
                        "from": "embeddings",
                        "let": {"doc_id": "$_id"},
                        "pipeline": [
                            {"$match": {"$expr": {"$eq": ["$document_id", "$$doc_id"]}}},
                            {
                                "$group": {
                                    "_id": None,
                                    "avg_embedding_norm": {"$avg": {"$sqrt": {
                                        "$sum": {"$map": {
                                            "input": "$embedding",
                                            "as": "val",
                                            "in": {"$pow": ["$$val", 2]}
                                        }}
                                    }}},
                                    "embedding_stats": {"$push": "$embedding"}
                                }
                            }
                        ],
                        "as": "embedding_stats"
                    }
                },
                {"$unwind": {"path": "$embedding_stats", "preserveNullAndEmptyArrays": True}}
            ])
        
        results = list(self.db.embeddings.aggregate(pipeline))
        
        if not results:
            return {}
        
        result = results[0]
        
        # Format the response
        insights = {
            "document_id": str(result["_id"]),
            "title": result["document_metadata"].get("title", "Unknown"),
            "user_id": result.get("user_id"),
            "uploaded_at": result["document_metadata"].get("uploadedAt"),
            "chunk_statistics": {
                "total_chunks": result["total_chunks"],
                "avg_chunk_size_chars": result["avg_chunk_size"],
                "min_chunk_size_chars": result["min_chunk_size"],
                "max_chunk_size_chars": result["max_chunk_size"]
            }
        }
        
        if include_chunk_stats and "embedding_stats" in result and result["embedding_stats"]:
            insights["embedding_statistics"] = {
                "avg_embedding_norm": result["embedding_stats"].get("avg_embedding_norm")
            }
        
        return insights
    
    def user_activity_pipeline(
        self,
        user_id: str,
        days: int = 30,
        granularity: str = "day"  # 'hour', 'day', 'week', 'month'
    ) -> Dict[str, Any]:
        """
        Analyze user activity patterns.
        
        Args:
            user_id: User ID
            days: Number of days to analyze
            granularity: Time granularity
            
        Returns:
            User activity analysis
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Determine date grouping format
        date_formats = {
            "hour": "%Y-%m-%d %H:00",
            "day": "%Y-%m-%d",
            "week": "%Y-W%U",
            "month": "%Y-%m"
        }
        date_format = date_formats.get(granularity, "%Y-%m-%d")
        
        pipeline = [
            # Filter by user and date
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date}
                }
            },
            
            # Add date bucket
            {
                "$addFields": {
                    "date_bucket": {
                        "$dateToString": {
                            "format": date_format,
                            "date": "$created_at"
                        }
                    }
                }
            },
            
            # Group by document and date
            {
                "$facet": {
                    "document_activity": [
                        {
                            "$group": {
                                "_id": {
                                    "document_id": "$document_id",
                                    "date": "$date_bucket"
                                },
                                "chunks_accessed": {"$sum": 1}
                            }
                        },
                        {
                            "$group": {
                                "_id": "$_id.document_id",
                                "activity_by_date": {
                                    "$push": {
                                        "date": "$_id.date",
                                        "chunks": "$chunks_accessed"
                                    }
                                },
                                "total_accesses": {"$sum": "$chunks_accessed"}
                            }
                        },
                        {
                            "$lookup": {
                                "from": "documents",
                                "localField": "_id",
                                "foreignField": "_id",
                                "as": "document_info"
                            }
                        },
                        {"$unwind": "$document_info"},
                        {
                            "$project": {
                                "document_id": "$_id",
                                "title": "$document_info.title",
                                "total_accesses": 1,
                                "activity_by_date": 1,
                                "_id": 0
                            }
                        },
                        {"$sort": {"total_accesses": -1}}
                    ],
                    
                    "time_series": [
                        {
                            "$group": {
                                "_id": "$date_bucket",
                                "total_interactions": {"$sum": 1},
                                "unique_documents": {"$addToSet": "$document_id"}
                            }
                        },
                        {
                            "$project": {
                                "date": "$_id",
                                "total_interactions": 1,
                                "unique_documents": {"$size": "$unique_documents"},
                                "_id": 0
                            }
                        },
                        {"$sort": {"date": 1}}
                    ],
                    
                    "summary": [
                        {
                            "$group": {
                                "_id": None,
                                "total_interactions": {"$sum": 1},
                                "unique_documents": {"$addToSet": "$document_id"},
                                "avg_interactions_per_day": {"$avg": 1}
                            }
                        },
                        {
                            "$project": {
                                "_id": 0,
                                "total_interactions": 1,
                                "unique_documents": {"$size": "$unique_documents"},
                                "avg_interactions_per_day": {
                                    "$divide": ["$total_interactions", days]
                                }
                            }
                        }
                    ]
                }
            }
        ]
        
        results = list(self.db.embeddings.aggregate(pipeline))
        
        if not results:
            return {}
        
        return results[0]
    
    def document_similarity_matrix(
        self,
        document_ids: List[str],
        similarity_threshold: float = 0.7
    ) -> Dict[str, Any]:
        """
        Create a similarity matrix for a set of documents.
        
        Args:
            document_ids: List of document IDs
            similarity_threshold: Minimum similarity to include
            
        Returns:
            Similarity matrix and clusters
        """
        # Get document summaries
        docs_pipeline = [
            {"$match": {"document_id": {"$in": document_ids}}},
            {
                "$group": {
                    "_id": "$document_id",
                    "avg_embedding": {"$avg": "$embedding"},
                    "chunk_count": {"$sum": 1},
                    "sample_text": {"$first": "$text"}
                }
            }
        ]
        
        doc_summaries = list(self.db.embeddings.aggregate(docs_pipeline))
        
        # Calculate similarity matrix
        doc_embeddings = {}
        for doc in doc_summaries:
            doc_embeddings[str(doc["_id"])] = np.array(doc["avg_embedding"])
        
        doc_ids = list(doc_embeddings.keys())
        n_docs = len(doc_ids)
        
        similarity_matrix = np.zeros((n_docs, n_docs))
        for i in range(n_docs):
            for j in range(i, n_docs):
                emb_i = doc_embeddings[doc_ids[i]]
                emb_j = doc_embeddings[doc_ids[j]]
                
                # Cosine similarity
                norm_i = np.linalg.norm(emb_i)
                norm_j = np.linalg.norm(emb_j)
                
                if norm_i > 0 and norm_j > 0:
                    similarity = np.dot(emb_i, emb_j) / (norm_i * norm_j)
                else:
                    similarity = 0
                
                similarity_matrix[i, j] = similarity
                similarity_matrix[j, i] = similarity
        
        # Find document clusters (simple threshold-based)
        clusters = []
        visited = set()
        
        for i in range(n_docs):
            if i in visited:
                continue
            
            cluster = [doc_ids[i]]
            visited.add(i)
            
            for j in range(i + 1, n_docs):
                if j not in visited and similarity_matrix[i, j] >= similarity_threshold:
                    cluster.append(doc_ids[j])
                    visited.add(j)
            
            if len(cluster) > 1:
                clusters.append(cluster)
        
        return {
            "document_ids": doc_ids,
            "similarity_matrix": similarity_matrix.tolist(),
            "clusters": clusters,
            "document_details": doc_summaries
        }
    
    def temporal_trends_pipeline(
        self,
        days: int = 90,
        interval: str = "week",
        metric: str = "interactions"
    ) -> List[Dict[str, Any]]:
        """
        Analyze temporal trends in document interactions.
        
        Args:
            days: Number of days to analyze
            interval: Time interval ('day', 'week', 'month')
            metric: Metric to track ('interactions', 'unique_users', 'new_documents')
            
        Returns:
            Temporal trends data
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Map interval to date format
        interval_formats = {
            "day": "%Y-%m-%d",
            "week": "%Y-W%U",
            "month": "%Y-%m"
        }
        date_format = interval_formats.get(interval, "%Y-%m-%d")
        
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$addFields": {
                    "time_bucket": {
                        "$dateToString": {
                            "format": date_format,
                            "date": "$created_at"
                        }
                    }
                }
            }
        ]
        
        if metric == "interactions":
            pipeline.extend([
                {
                    "$group": {
                        "_id": "$time_bucket",
                        "count": {"$sum": 1},
                        "unique_documents": {"$addToSet": "$document_id"},
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                }
            ])
        elif metric == "unique_users":
            pipeline.extend([
                {
                    "$group": {
                        "_id": "$time_bucket",
                        "users": {"$addToSet": "$user_id"}
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "count": {"$size": "$users"}
                    }
                }
            ])
        elif metric == "new_documents":
            # Get new documents from documents collection
            docs_pipeline = [
                {"$match": {"uploadedAt": {"$gte": start_date}}},
                {
                    "$addFields": {
                        "time_bucket": {
                            "$dateToString": {
                                "format": date_format,
                                "date": "$uploadedAt"
                            }
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$time_bucket",
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            return list(self.db.documents.aggregate(docs_pipeline))
        
        pipeline.extend([
            {
                "$project": {
                    "_id": 1,
                    "count": 1,
                    "unique_documents": {"$size": "$unique_documents"},
                    "unique_users": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        )
        
        return list(self.db.embeddings.aggregate(pipeline))
    
    def semantic_clusters_pipeline(
        self,
        min_cluster_size: int = 3,
        max_clusters: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Identify semantic clusters in the document collection.
        
        Args:
            min_cluster_size: Minimum cluster size
            max_clusters: Maximum number of clusters
            
        Returns:
            Semantic clusters
        """
        # Get document summaries
        pipeline = [
            {
                "$group": {
                    "_id": "$document_id",
                    "avg_embedding": {"$avg": "$embedding"},
                    "chunks": {"$push": "$text"},
                    "sample_text": {"$first": "$text"},
                    "user_id": {"$first": "$user_id"}
                }
            },
            {
                "$lookup": {
                    "from": "documents",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "doc_info"
                }
            },
            {"$unwind": "$doc_info"},
            {
                "$project": {
                    "document_id": "$_id",
                    "title": "$doc_info.title",
                    "avg_embedding": 1,
                    "chunk_count": {"$size": "$chunks"},
                    "sample_text": 1,
                    "user_id": 1
                }
            }
        ]
        
        docs = list(self.db.embeddings.aggregate(pipeline))
        
        if len(docs) < min_cluster_size:
            return []
        
        # Simple K-means clustering
        from sklearn.cluster import KMeans
        
        # Prepare embeddings
        embeddings = np.array([doc["avg_embedding"] for doc in docs])
        
        # Determine number of clusters
        n_clusters = min(max_clusters, len(docs) // min_cluster_size)
        if n_clusters < 2:
            n_clusters = 2
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(embeddings)
        
        # Group documents by cluster
        clusters = []
        for i in range(n_clusters):
            cluster_docs = [
                {
                    "document_id": str(docs[j]["document_id"]),
                    "title": docs[j]["title"],
                    "chunk_count": docs[j]["chunk_count"],
                    "sample_text": docs[j]["sample_text"][:200] + "..."
                }
                for j in range(len(docs)) if labels[j] == i
            ]
            
            if len(cluster_docs) >= min_cluster_size:
                # Calculate cluster centroid
                centroid = kmeans.cluster_centers_[i].tolist()
                
                clusters.append({
                    "cluster_id": i,
                    "size": len(cluster_docs),
                    "centroid": centroid,
                    "documents": cluster_docs
                })
        
        # Sort clusters by size
        clusters.sort(key=lambda x: x["size"], reverse=True)
        
        return clusters
    
    def close(self):
        """Close MongoDB connection."""
        self.client.close()
        logger.info("Closed MongoDB connection")