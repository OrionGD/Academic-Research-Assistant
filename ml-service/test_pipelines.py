import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import json
import asyncio

# Modern Patch Strategy: Patch the service functions where they are imported
# to avoid connection attempts during import of pipelines.
with patch('services.embedding_service.generate_embeddings_batch', new_callable=AsyncMock), \
     patch('services.embedding_service.generate_embedding', new_callable=AsyncMock):
    
    # We still need to mock services used at top-level if any
    # Since pipelines only import functions, we patch the functions in the pipelines
    try:
        from pipelines.process import process_document_pipeline
        from pipelines.search import search_pipeline
    except ImportError:
        # Handle cases where folder structure might differ in some environments
        import sys
        import os
        sys.path.append(os.getcwd())
        from pipelines.process import process_document_pipeline
        from pipelines.search import search_pipeline

class TestMLPipelines(unittest.IsolatedAsyncioTestCase):

    @patch('pipelines.process.extract_text_from_pdf')
    @patch('pipelines.process.generate_embeddings_batch', new_callable=AsyncMock)
    @patch('pipelines.process.add_document_chunks', new_callable=AsyncMock)
    async def test_process_document_basic(self, mock_add_chunks, mock_embed, mock_extract):
        """Basic Input Test: Normal PDF processing with ChromaDB storage."""
        mock_extract.return_value = ("This is a test document content.", 1)
        mock_embed.return_value = [[0.1] * 768]
        mock_add_chunks.return_value = None
        
        metadata = json.dumps({"documentId": "doc123", "userId": "user456"})
        result = await process_document_pipeline("test.pdf", b"pdfcontent", metadata)
        
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["documentId"], "doc123")
        mock_add_chunks.assert_called_once()
        print("OK: Basic input test (ChromaDB) passed")

    @patch('pipelines.process.extract_text_from_pdf')
    async def test_process_document_edge_empty(self, mock_extract):
        """Edge Case Test: Empty PDF."""
        mock_extract.return_value = ("", 0)
        
        metadata = json.dumps({"documentId": "doc123", "userId": "user456"})
        with self.assertRaises(ValueError) as cm:
            await process_document_pipeline("empty.pdf", b"", metadata)
        
        # Adjusting to match actual error message from process.py
        self.assertIn("appears to have no pages", str(cm.exception))
        print("OK: Edge case (empty PDF) test passed")

    @patch('pipelines.search.generate_embedding', new_callable=AsyncMock)
    @patch('pipelines.search.query_similar_chunks', new_callable=AsyncMock)
    async def test_search_complex(self, mock_query, mock_embed):
        """Complex Input Test: Search using ChromaDB similarity."""
        mock_embed.return_value = [0.1] * 768
        
        mock_query.return_value = [
            {
                "documentId": "doc123",
                "chunkIndex": 0,
                "chunkText": "Relevant chunk content",
                "score": 0.9,
                "metadata": {"section": "abstract"}
            }
        ]
        
        result = await search_pipeline("What is AI?", limit=5, user_id="user456")
        
        self.assertTrue(len(result) > 0)
        self.assertEqual(result[0]["documentId"], "doc123")
        self.assertEqual(result[0]["section"], "abstract")
        mock_query.assert_called_once()
        print("OK: Complex input (ChromaDB search) test passed")

if __name__ == '__main__':
    unittest.main()
