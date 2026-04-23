from ..config.database import get_database
from ..services.embedding_service import EmbeddingService
from typing import List, Dict, Any

class RAGPipeline:
    def __init__(self):
        self.db = get_database()
        self.embedding_service = EmbeddingService()
        self.collection_name = "document_chunks"

    async def search(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        query_vector = await self.embedding_service.generate_embedding(query)
        
        # MongoDB Atlas Vector Search Pipeline
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 100,
                    "limit": limit,
                    "filter": {"user_id": user_id}
                }
            },
            {
                "$project": {
                    "text": 1,
                    "metadata": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        results = await self.db[self.collection_name].aggregate(pipeline).to_list(length=limit)
        return results

    def format_context(self, search_results: List[Dict[str, Any]]) -> str:
        return "\n\n".join([r['text'] for r in search_results])
