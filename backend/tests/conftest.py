import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock
from dotenv import load_dotenv
from fastapi.testclient import TestClient


# --------------------------------------------------
# Load test environment variables from .env.test
# --------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    env_file = Path(__file__).resolve().parent.parent / ".env.test"
    load_dotenv(env_file, override=True)


# --------------------------------------------------
# Mock database
# --------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def mock_db():
    with patch("app.config.database.db") as mock:
        # Documents collection
        mock.documents.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="test_id")
        )

        mock.documents.find_one = AsyncMock(
            return_value={
                "document_id": "test_id",
                "title": "Test Doc",
                "summary": "Test Summary",
                "keywords": ["mock"],
                "topics": ["test"],
                "chunk_count": 1,
                "reading_time": 1
            }
        )

        mock.documents.count_documents = AsyncMock(return_value=1)

        mock.documents.find = MagicMock()
        mock.documents.find.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
            return_value=[{"document_id": "test_id", "title": "Test Doc"}]
        )

        mock.documents.delete_one = AsyncMock(
            return_value=MagicMock(deleted_count=1)
        )

        # Chats collection
        mock.chats.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="chat_id")
        )

        mock.chats.count_documents = AsyncMock(return_value=1)

        mock.chats.find = MagicMock()
        mock.chats.find.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
            return_value=[{
                "document_id": "test_id",
                "answer": "Mock Answer"
            }]
        )

        yield mock


# --------------------------------------------------
# Mock services
# --------------------------------------------------
@pytest.fixture(scope="function", autouse=True)
def mock_services():
    with patch("app.api.documents.document_ingestion_service") as mock_ingestion, \
         patch("app.api.documents.text_processing_service") as mock_text, \
         patch("app.api.documents.embedding_service") as mock_doc_embedding, \
         patch("app.api.documents.analytics_service") as mock_analytics, \
         patch("app.api.chat.embedding_service") as mock_chat_embedding, \
         patch("app.api.chat.retrieval_service") as mock_retrieval, \
         patch("app.api.chat.chat_service") as mock_chat, \
         patch("app.api.documents.chroma_client", create=True) as mock_chroma:

        # Ingestion
        mock_ingestion.extract_text_from_pdf.return_value = "Extracted text"
        mock_ingestion.extract_text_from_url.return_value = "Extracted text from URL"
        mock_ingestion.validate_text.return_value = (True, "")

        # Text chunking
        mock_text.chunk_text.return_value = ["chunk1", "chunk2"]

        # Analytics
        mock_analytics.analyze_document = AsyncMock(
            return_value={
                "summary": "Mock Summary",
                "keywords": ["mock"],
                "topics": ["test"],
                "reading_time": 5
            }
        )

        # Embeddings
        mock_doc_embedding.generate_embeddings_for_document = AsyncMock()
        mock_chat_embedding.generate_query_embedding = AsyncMock(
            return_value=[0.1, 0.2, 0.3]
        )

        # Retrieval
        mock_retrieval.retrieve_context = AsyncMock(
            return_value=["chunk1"]
        )

        # Chat response
        mock_chat.generate_response = AsyncMock(
            return_value={
                "answer": "Mock Answer",
                "sources": ["chunk1"],
                "similarity_scores": [0.9],
                "model": "mock-model"
            }
        )

        # Chroma
        mock_chroma.delete_document_embeddings = MagicMock()

        yield


# --------------------------------------------------
# FastAPI test client
# --------------------------------------------------
@pytest.fixture(scope="function")
def client():
    from app.main import app
    with TestClient(app) as test_client:
        yield test_client