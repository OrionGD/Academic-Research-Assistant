"""
Embedding service using OpenAI
"""
from typing import List, Optional
import numpy as np
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans

from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for texts"""
        try:
            # Clean texts
            texts = [text.strip() for text in texts if text.strip()]
            
            if not texts:
                return []
            
            # Call OpenAI API
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            
            # Extract embeddings
            embeddings = [data.embedding for data in response.data]
            return embeddings
        
        except Exception as e:
            print(f"Embedding generation error: {e}")
            # Fallback to random embeddings for testing
            if settings.OPENAI_API_KEY == "":
                return [np.random.randn(self.dimension).tolist() for _ in texts]
            raise
    
    async def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate cosine similarity between two texts"""
        embeddings = await self.generate_embeddings([text1, text2])
        
        if len(embeddings) < 2:
            return 0.0
        
        # Calculate cosine similarity
        similarity = cosine_similarity(
            [embeddings[0]],
            [embeddings[1]]
        )[0][0]
        
        return float(similarity)
    
    async def cluster_embeddings(self, embeddings: List[List[float]], n_clusters: int = 5) -> List[int]:
        """Cluster embeddings using KMeans"""
        if len(embeddings) < n_clusters:
            # Return all points in cluster 0
            return [0] * len(embeddings)
        
        # Convert to numpy array
        X = np.array(embeddings)
        
        # Apply KMeans clustering
        kmeans = KMeans(n_clusters=min(n_clusters, len(embeddings)), random_state=42)
        labels = kmeans.fit_predict(X)
        
        return labels.tolist()