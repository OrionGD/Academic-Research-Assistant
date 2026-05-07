import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.pipelines.ml_process import process_text_pipeline

@pytest.mark.asyncio
async def test_process_text_pipeline_logic():
    """Unit test for the new text pipeline logic"""
    text = "This is a test document about artificial intelligence. It has multiple sentences to test chunking."
    metadata = {"documentId": "test-rag-123", "userId": "user-456"}
    
    # Mock dependencies
    with patch("app.pipelines.ml_process.clean_text", side_effect=lambda x: x) as mock_clean:
        with patch("app.pipelines.ml_process.chunk_text_with_sections") as mock_chunk:
            mock_chunk.return_value = [{"text": "chunk1", "index": 0}, {"text": "chunk2", "index": 1}]
            
            with patch("app.pipelines.ml_process.embedding_service.generate_embeddings", new_callable=AsyncMock) as mock_embed:
                mock_embed.return_value = [[0.1]*3072, [0.2]*3072]
                
                with patch("app.pipelines.ml_process.add_document_chunks", new_callable=AsyncMock) as mock_add:
                    result = await process_text_pipeline(text, metadata)
                    
                    assert result["status"] == "completed"
                    assert result["documentId"] == "test-rag-123"
                    assert result["chunksProcessed"] == 2
                    
                    mock_clean.assert_called_once()
                    mock_chunk.assert_called_once()
                    mock_embed.assert_called_once()
                    mock_add.assert_called_once()
