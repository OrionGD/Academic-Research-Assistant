"""
ML-specific index configurations and optimization strategies.
Provides index management for vector search, text search, and hybrid queries.
"""

from typing import List, Dict, Any, Optional, Union
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT, GEOSPHERE
from pymongo.collection import Collection
from pymongo.operations import IndexModel
import logging
from datetime import datetime
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IndexManager:
    """
    Manage ML-specific indexes for optimal query performance.
    Handles vector indexes, text indexes, and compound indexes.
    """
    
    def __init__(
        self,
        connection_string: str,
        database_name: str
    ):
        """
        Initialize index manager.
        
        Args:
            connection_string: MongoDB connection string
            database_name: Database name
        """
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        
        logger.info(f"Initialized IndexManager for {database_name}")
    
    def create_vector_search_index(
        self,
        collection_name: str,
        index_name: str = "vector_index",
        path: str = "embedding",
        num_dimensions: int = 1536,
        similarity: str = "cosine",  # 'cosine', 'euclidean', 'dotProduct'
        wait_for_completion: bool = True,
        timeout_seconds: int = 300
    ) -> Dict[str, Any]:
        """
        Create a vector search index in MongoDB Atlas.
        
        Args:
            collection_name: Collection name
            index_name: Name of the vector index
            path: Field path containing vectors
            num_dimensions: Vector dimension
            similarity: Similarity metric
            wait_for_completion: Wait for index creation to complete
            timeout_seconds: Timeout for waiting
            
        Returns:
            Index creation status
        """
        collection = self.db[collection_name]
        
        # Define vector index
        index_definition = {
            "name": index_name,
            "type": "vectorSearch",
            "definition": {
                "fields": [
                    {
                        "type": "vector",
                        "path": path,
                        "numDimensions": num_dimensions,
                        "similarity": similarity
                    }
                ]
            }
        }
        
        try:
            # Create the index
            result = collection.create_search_index(index_definition)
            logger.info(f"Created vector search index: {index_name}")
            
            if wait_for_completion:
                self._wait_for_index_ready(collection, index_name, timeout_seconds)
            
            return {
                "status": "created",
                "index_name": index_name,
                "details": result
            }
            
        except Exception as e:
            logger.error(f"Error creating vector index: {e}")
            return {
                "status": "error",
                "index_name": index_name,
                "error": str(e)
            }
    
    def create_text_search_index(
        self,
        collection_name: str,
        index_name: str = "text_search",
        fields: Optional[List[str]] = None,
        weights: Optional[Dict[str, int]] = None,
        default_language: str = "english"
    ) -> Dict[str, Any]:
        """
        Create a text search index.
        
        Args:
            collection_name: Collection name
            index_name: Index name
            fields: Fields to index for text search
            weights: Field weights for scoring
            default_language: Default language for text search
            
        Returns:
            Index creation status
        """
        collection = self.db[collection_name]
        
        if fields is None:
            fields = ["text", "title", "description"]
        
        # Create text index definition
        index_keys = [(field, TEXT) for field in fields]
        
        index_options = {
            "name": index_name,
            "default_language": default_language
        }
        
        if weights:
            index_options["weights"] = weights
        
        try:
            result = collection.create_index(index_keys, **index_options)
            logger.info(f"Created text search index: {result}")
            
            return {
                "status": "created",
                "index_name": result,
                "fields": fields
            }
            
        except Exception as e:
            logger.error(f"Error creating text index: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    def create_compound_indexes(
        self,
        collection_name: str,
        indexes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create multiple compound indexes.
        
        Args:
            collection_name: Collection name
            indexes: List of index specifications
                Each spec: {
                    "name": str,
                    "fields": [(field, direction), ...],
                    "unique": bool,
                    "sparse": bool,
                    "background": bool
                }
            
        Returns:
            Index creation results
        """
        collection = self.db[collection_name]
        results = []
        
        for idx_spec in indexes:
            try:
                # Prepare index keys
                keys = []
                for field, direction in idx_spec["fields"]:
                    if direction == "asc":
                        keys.append((field, ASCENDING))
                    elif direction == "desc":
                        keys.append((field, DESCENDING))
                    elif direction == "text":
                        keys.append((field, TEXT))
                    elif direction == "geo":
                        keys.append((field, GEOSPHERE))
                    else:
                        keys.append((field, direction))
                
                # Prepare options
                options = {
                    "name": idx_spec.get("name"),
                    "unique": idx_spec.get("unique", False),
                    "sparse": idx_spec.get("sparse", False),
                    "background": idx_spec.get("background", True)
                }
                
                # Remove None values
                options = {k: v for k, v in options.items() if v is not None}
                
                # Create index
                result = collection.create_index(keys, **options)
                
                results.append({
                    "status": "created",
                    "index_name": result,
                    "specification": idx_spec
                })
                
                logger.info(f"Created compound index: {result}")
                
            except Exception as e:
                results.append({
                    "status": "error",
                    "specification": idx_spec,
                    "error": str(e)
                })
        
        return {
            "collection": collection_name,
            "indexes_created": len([r for r in results if r["status"] == "created"]),
            "results": results
        }
    
    def create_hybrid_search_indexes(
        self,
        collection_name: str,
        vector_dimensions: int = 1536
    ) -> Dict[str, Any]:
        """
        Create a comprehensive set of indexes for hybrid search.
        
        Args:
            collection_name: Collection name
            vector_dimensions: Vector dimension
            
        Returns:
            Index creation results
        """
        results = {}
        
        # 1. Vector search index
        vector_result = self.create_vector_search_index(
            collection_name=collection_name,
            index_name="vector_index",
            num_dimensions=vector_dimensions
        )
        results["vector_index"] = vector_result
        
        # 2. Text search index
        text_result = self.create_text_search_index(
            collection_name=collection_name,
            index_name="text_index",
            fields=["text", "title"],
            weights={"text": 2, "title": 3}
        )
        results["text_index"] = text_result
        
        # 3. Compound indexes for filtering
        compound_indexes = [
            {
                "name": "user_doc_idx",
                "fields": [("user_id", "asc"), ("document_id", "asc")],
                "background": True
            },
            {
                "name": "doc_created_idx",
                "fields": [("document_id", "asc"), ("created_at", "desc")],
                "background": True
            },
            {
                "name": "user_created_idx",
                "fields": [("user_id", "asc"), ("created_at", "desc")],
                "background": True
            },
            {
                "name": "metadata_type_idx",
                "fields": [("metadata.type", "asc"), ("created_at", "desc")],
                "background": True,
                "sparse": True
            }
        ]
        
        compound_result = self.create_compound_indexes(collection_name, compound_indexes)
        results["compound_indexes"] = compound_result
        
        return results
    
    def optimize_existing_indexes(
        self,
        collection_name: str,
        analyze_usage: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze and optimize existing indexes.
        
        Args:
            collection_name: Collection name
            analyze_usage: Whether to analyze index usage
            
        Returns:
            Optimization recommendations
        """
        collection = self.db[collection_name]
        
        # Get current indexes
        current_indexes = list(collection.list_indexes())
        
        # Get index statistics
        stats = self.db.command("collstats", collection_name)
        
        recommendations = {
            "collection": collection_name,
            "total_indexes": len(current_indexes),
            "total_index_size_mb": stats.get("totalIndexSize", 0) / (1024 * 1024),
            "indexes": [],
            "recommendations": []
        }
        
        for idx in current_indexes:
            idx_name = idx["name"]
            idx_size = stats.get("indexSizes", {}).get(idx_name, 0) / (1024 * 1024)
            
            idx_info = {
                "name": idx_name,
                "keys": idx["key"],
                "size_mb": idx_size,
                "unique": idx.get("unique", False),
                "sparse": idx.get("sparse", False)
            }
            
            # Check for potential issues
            if len(idx["key"]) > 3:
                recommendations["recommendations"].append({
                    "index": idx_name,
                    "issue": "Large compound index",
                    "suggestion": "Consider if all fields are necessary"
                })
            
            if idx_size > 100:  # > 100MB
                recommendations["recommendations"].append({
                    "index": idx_name,
                    "issue": "Large index size",
                    "suggestion": "Consider if index is still needed or can be optimized"
                })
            
            # Check for redundant indexes
            for other_idx in current_indexes:
                if other_idx["name"] != idx_name:
                    if self._is_prefix_index(idx["key"], other_idx["key"]):
                        recommendations["recommendations"].append({
                            "index": idx_name,
                            "issue": "Potential redundant index",
                            "suggestion": f"Index may be prefix of {other_idx['name']}"
                        })
            
            recommendations["indexes"].append(idx_info)
        
        if analyze_usage:
            # Check index usage statistics
            usage_stats = self.db.command("aggregate", collection_name, pipeline=[
                {"$indexStats": {}}
            ])
            
            usage_by_index = {stat["name"]: stat for stat in usage_stats["cursor"]["firstBatch"]}
            
            for idx_info in recommendations["indexes"]:
                usage = usage_by_index.get(idx_info["name"], {})
                idx_info["usage"] = {
                    "accesses": usage.get("accesses", {}).get("ops", 0),
                    "since": usage.get("accesses", {}).get("since")
                }
                
                if idx_info["usage"]["accesses"] == 0 and idx_info["name"] != "_id_":
                    recommendations["recommendations"].append({
                        "index": idx_info["name"],
                        "issue": "Unused index",
                        "suggestion": "Consider dropping this unused index"
                    })
        
        return recommendations
    
    def _is_prefix_index(self, keys1: List, keys2: List) -> bool:
        """
        Check if keys1 is a prefix of keys2.
        
        Args:
            keys1: First index keys
            keys2: Second index keys
            
        Returns:
            True if keys1 is prefix of keys2
        """
        if len(keys1) >= len(keys2):
            return False
        
        for i, (field1, dir1) in enumerate(keys1):
            if i >= len(keys2):
                return False
            field2, dir2 = list(keys2[i].items())[0]
            if field1 != field2 or dir1 != dir2:
                return False
        
        return True
    
    def _wait_for_index_ready(
        self,
        collection: Collection,
        index_name: str,
        timeout_seconds: int
    ):
        """
        Wait for index to be ready.
        
        Args:
            collection: MongoDB collection
            index_name: Index name
            timeout_seconds: Timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout_seconds:
            try:
                indexes = collection.list_search_indexes()
                for index in indexes:
                    if index["name"] == index_name and index.get("status") == "READY":
                        logger.info(f"Index {index_name} is ready")
                        return
            except:
                pass
            
            time.sleep(2)
        
        logger.warning(f"Timeout waiting for index {index_name} to be ready")
    
    def drop_index(
        self,
        collection_name: str,
        index_name: str
    ) -> Dict[str, Any]:
        """
        Drop an index.
        
        Args:
            collection_name: Collection name
            index_name: Index name to drop
            
        Returns:
            Drop operation result
        """
        collection = self.db[collection_name]
        
        try:
            collection.drop_index(index_name)
            logger.info(f"Dropped index: {index_name}")
            return {
                "status": "dropped",
                "index_name": index_name
            }
        except Exception as e:
            logger.error(f"Error dropping index {index_name}: {e}")
            return {
                "status": "error",
                "index_name": index_name,
                "error": str(e)
            }
    
    def get_index_recommendations(
        self,
        collection_name: str,
        query_patterns: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Get index recommendations based on query patterns.
        
        Args:
            collection_name: Collection name
            query_patterns: List of typical query patterns
            
        Returns:
            Index recommendations
        """
        recommendations = []
        
        for pattern in query_patterns:
            # Extract fields used in query
            fields = set()
            sort_fields = []
            
            # Parse query
            query = pattern.get("query", {})
            sort = pattern.get("sort", {})
            
            # Add query fields
            for key in query.keys():
                if key not in ["$text", "$vector"]:
                    fields.add(key)
            
            # Add sort fields
            for key in sort.keys():
                sort_fields.append((key, sort[key]))
            
            if fields or sort_fields:
                # Create index recommendation
                index_fields = []
                
                # Add equality fields first
                for field in fields:
                    if field not in [f[0] for f in sort_fields]:
                        index_fields.append((field, 1))
                
                # Add sort fields
                for field, direction in sort_fields:
                    index_fields.append((field, direction))
                
                recommendations.append({
                    "based_on_pattern": pattern,
                    "recommended_index": {
                        "fields": index_fields,
                        "name": f"rec_{'_'.join([f[0] for f in index_fields])}"
                    },
                    "reason": f"Covers query on {', '.join(fields)} with sorting"
                })
        
        return recommendations
    
    def close(self):
        """Close MongoDB connection."""
        self.client.close()
        logger.info("Closed MongoDB connection")