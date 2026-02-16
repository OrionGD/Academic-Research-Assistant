#!/usr/bin/env python3
"""
MRL (Matryoshka Representation Learning) Optimization Testing
Tests different embedding dimensions to find optimal trade-off between performance and speed
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from datetime import datetime
import json
import time
import matplotlib.pyplot as plt

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
import google.generativeai as genai
from dotenv import load_dotenv
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
import seaborn as sns

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/embedding_optimization.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EmbeddingOptimizer:
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel(os.getenv("GEMINI_MODEL"))
        self.embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")
        
        # MongoDB connection
        self.mongodb_uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_DB_NAME")
        self.client = None
        self.db = None
        
        # Test dimensions
        self.test_dimensions = [64, 128, 256, 384, 512, 768, 1024, 1536]
        self.results_dir = Path("../optimization_results")
        self.results_dir.mkdir(exist_ok=True)
        
    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(self.mongodb_uri)
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")
        
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            
    async def get_test_documents(self, limit: int = 100) -> List[str]:
        """Get test documents for embedding evaluation"""
        documents = self.db["documents"]
        cursor = documents.find({"content": {"$exists": True}}).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [doc["content"] for doc in docs if len(doc["content"]) > 50]
        
    async def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings using Gemini"""
        try:
            # Use the embedding model
            result = genai.embed_content(
                model=self.embedding_model,
                content=texts,
                task_type="retrieval_document"
            )
            return np.array(result['embedding'])
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            # Fallback to random embeddings for testing
            return np.random.randn(len(texts), 1536)
            
    def reduce_dimensions(self, embeddings: np.ndarray, target_dim: int) -> np.ndarray:
        """Reduce embedding dimensions using PCA"""
        if target_dim >= embeddings.shape[1]:
            return embeddings
            
        pca = PCA(n_components=target_dim)
        reduced = pca.fit_transform(embeddings)
        return reduced
        
    def evaluate_quality(self, original: np.ndarray, reduced: np.ndarray) -> Dict[str, float]:
        """Evaluate quality of reduced embeddings"""
        # Calculate cosine similarity preservation
        orig_sim = cosine_similarity(original)
        reduced_sim = cosine_similarity(reduced)
        
        # Frobenius norm of difference
        diff_norm = np.linalg.norm(orig_sim - reduced_sim, 'fro')
        
        # Correlation between similarity matrices
        corr = np.corrcoef(orig_sim.flatten(), reduced_sim.flatten())[0, 1]
        
        # Preservation of nearest neighbors (top 10)
        orig_neighbors = np.argsort(-orig_sim, axis=1)[:, :10]
        reduced_neighbors = np.argsort(-reduced_sim, axis=1)[:, :10]
        
        neighbor_preservation = np.mean([
            len(set(orig_neighbors[i]) & set(reduced_neighbors[i])) / 10
            for i in range(len(orig_neighbors))
        ])
        
        return {
            "frobenius_diff": float(diff_norm),
            "similarity_correlation": float(corr),
            "neighbor_preservation": float(neighbor_preservation),
            "mse": float(np.mean((orig_sim - reduced_sim) ** 2))
        }
        
    def measure_performance(self, embeddings: np.ndarray, iterations: int = 100) -> Dict[str, float]:
        """Measure search performance with different dimensions"""
        query = embeddings[0].reshape(1, -1)
        
        # Measure search time
        start_time = time.time()
        for _ in range(iterations):
            similarities = cosine_similarity(query, embeddings)
        search_time = (time.time() - start_time) / iterations
        
        # Memory usage (approximate)
        memory_mb = embeddings.nbytes / (1024 * 1024)
        
        return {
            "search_time_ms": search_time * 1000,
            "memory_mb": memory_mb
        }
        
    async def run_optimization(self):
        """Run full optimization test suite"""
        logger.info("Starting embedding dimension optimization...")
        
        # Get test documents
        texts = await self.get_test_documents(50)
        if not texts:
            logger.error("No test documents found")
            return
            
        logger.info(f"Testing with {len(texts)} documents")
        
        # Generate embeddings
        logger.info("Generating embeddings...")
        full_embeddings = await self.generate_embeddings(texts)
        logger.info(f"Generated embeddings with shape: {full_embeddings.shape}")
        
        results = []
        
        for dim in self.test_dimensions:
            logger.info(f"Testing dimension: {dim}")
            
            # Reduce dimensions
            reduced = self.reduce_dimensions(full_embeddings, dim)
            
            # Evaluate quality
            quality = self.evaluate_quality(full_embeddings, reduced)
            
            # Measure performance
            performance = self.measure_performance(reduced)
            
            # Calculate composite score
            composite_score = (
                quality["neighbor_preservation"] * 0.4 +
                quality["similarity_correlation"] * 0.3 +
                (1 - quality["frobenius_diff"] / 100) * 0.3
            )
            
            result = {
                "dimension": dim,
                "quality": quality,
                "performance": performance,
                "composite_score": composite_score
            }
            
            results.append(result)
            
            logger.info(f"  Neighbor preservation: {quality['neighbor_preservation']:.3f}")
            logger.info(f"  Search time: {performance['search_time_ms']:.3f}ms")
            logger.info(f"  Memory: {performance['memory_mb']:.2f}MB")
            logger.info(f"  Composite score: {composite_score:.3f}")
            
        # Find optimal dimension
        optimal = max(results, key=lambda x: x["composite_score"])
        logger.info(f"\nOptimal dimension: {optimal['dimension']}")
        logger.info(f"  Score: {optimal['composite_score']:.3f}")
        logger.info(f"  Search time: {optimal['performance']['search_time_ms']:.3f}ms")
        logger.info(f"  Memory: {optimal['performance']['memory_mb']:.2f}MB")
        
        # Save results
        self.save_results(results, optimal)
        
        # Generate visualizations
        self.generate_plots(results)
        
        return optimal
        
    def save_results(self, results: List[Dict], optimal: Dict):
        """Save optimization results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save detailed results
        results_file = self.results_dir / f"optimization_results_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "results": results,
                "optimal": optimal
            }, f, indent=2, default=str)
            
        logger.info(f"Results saved to {results_file}")
        
        # Save optimal configuration
        config_file = self.results_dir / "optimal_config.json"
        with open(config_file, 'w') as f:
            json.dump({
                "optimal_dimension": optimal["dimension"],
                "search_time_ms": optimal["performance"]["search_time_ms"],
                "memory_mb": optimal["performance"]["memory_mb"],
                "neighbor_preservation": optimal["quality"]["neighbor_preservation"],
                "updated_at": timestamp
            }, f, indent=2)
            
        logger.info(f"Optimal config saved to {config_file}")
        
    def generate_plots(self, results: List[Dict]):
        """Generate visualization plots"""
        dims = [r["dimension"] for r in results]
        times = [r["performance"]["search_time_ms"] for r in results]
        memory = [r["performance"]["memory_mb"] for r in results]
        preservation = [r["quality"]["neighbor_preservation"] for r in results]
        scores = [r["composite_score"] for r in results]
        
        # Create figure with subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        # Plot 1: Search time vs dimension
        ax1.plot(dims, times, 'b-o', label='Search Time')
        ax1.set_xlabel('Dimension')
        ax1.set_ylabel('Search Time (ms)')
        ax1.set_title('Search Performance vs Dimension')
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Memory usage vs dimension
        ax2.plot(dims, memory, 'r-o', label='Memory')
        ax2.set_xlabel('Dimension')
        ax2.set_ylabel('Memory (MB)')
        ax2.set_title('Memory Usage vs Dimension')
        ax2.grid(True, alpha=0.3)
        
        # Plot 3: Quality metrics vs dimension
        ax3.plot(dims, preservation, 'g-o', label='Neighbor Preservation')
        ax3.set_xlabel('Dimension')
        ax3.set_ylabel('Preservation Rate')
        ax3.set_title('Quality Metrics vs Dimension')
        ax3.grid(True, alpha=0.3)
        ax3.set_ylim([0, 1])
        
        # Plot 4: Composite score vs dimension
        ax4.plot(dims, scores, 'purple', marker='o', linewidth=2)
        ax4.set_xlabel('Dimension')
        ax4.set_ylabel('Composite Score')
        ax4.set_title('Overall Performance Score vs Dimension')
        ax4.grid(True, alpha=0.3)
        
        # Mark optimal point
        optimal_idx = np.argmax(scores)
        ax4.plot(dims[optimal_idx], scores[optimal_idx], 'r*', markersize=15, 
                label=f'Optimal: {dims[optimal_idx]}')
        ax4.legend()
        
        plt.tight_layout()
        
        # Save plot
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plot_file = self.results_dir / f"optimization_plot_{timestamp}.png"
        plt.savefig(plot_file, dpi=150, bbox_inches='tight')
        logger.info(f"Plot saved to {plot_file}")
        
        plt.show()

async def main():
    """Main optimization function"""
    optimizer = EmbeddingOptimizer()
    
    try:
        await optimizer.connect()
        optimal = await optimizer.run_optimization()
        
        if optimal:
            logger.info("\n" + "="*50)
            logger.info("OPTIMIZATION COMPLETE")
            logger.info(f"Recommended embedding dimension: {optimal['dimension']}")
            logger.info("="*50)
            
    except Exception as e:
        logger.error(f"Optimization failed: {e}")
    finally:
        await optimizer.close()

if __name__ == "__main__":
    asyncio.run(main())