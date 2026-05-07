import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_upload_url_rag(client):
    """Test full RAG pipeline for URL ingestion"""
    payload = {"url": "https://example.com/research-paper", "title": "Test URL Paper"}
    
    # Mock the ingestion service to return some text
    with patch("app.services.ingestion_service.document_ingestion_service.extract_text_from_url", new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = "This is a mock research paper content from a URL. It discusses RAG systems."
        
        # Mock the pipelines to avoid real AI calls but ensure they are called
        with patch("app.pipelines.ml_process.process_text_pipeline", new_callable=AsyncMock) as mock_process:
            mock_process.return_value = {"status": "completed", "chunksProcessed": 5}
            
            with patch("app.pipelines.ml_analyze.analyze_document_pipeline", new_callable=AsyncMock) as mock_analyze:
                mock_analyze.return_value = {"summary": "Mocked URL summary", "keyInsights": ["Insight 1"]}
                
                response = client.post("/api/documents/upload-url", json=payload)
                
                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "URL upload successful"
                assert data["document"]["title"] == "Test URL Paper"
                assert data["document"]["analysis"]["summary"] == "Mocked URL summary"
                
                mock_extract.assert_called_once_with("https://example.com/research-paper")
                mock_process.assert_called_once()
                mock_analyze.assert_called_once()

@pytest.mark.asyncio
async def test_upload_text_rag(client):
    """Test full RAG pipeline for Plain Text ingestion"""
    payload = {"text": "This is a manually pasted research text. It should be indexed for RAG.", "title": "Pasted Note"}
    
    with patch("app.pipelines.ml_process.process_text_pipeline", new_callable=AsyncMock) as mock_process:
        mock_process.return_value = {"status": "completed", "chunksProcessed": 3}
        
        with patch("app.pipelines.ml_analyze.analyze_document_pipeline", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {"summary": "Mocked text summary", "keyInsights": ["Insight A"]}
            
            response = client.post("/api/documents/upload-text", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Text upload successful"
            assert data["document"]["title"] == "Pasted Note"
            assert data["document"]["analysis"]["summary"] == "Mocked text summary"
            
            mock_process.assert_called_once()
            mock_analyze.assert_called_once()
