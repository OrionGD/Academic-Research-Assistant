import pytest
import pytest_asyncio
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock
from dotenv import load_dotenv
from fastapi.testclient import TestClient

# Removed pytest_plugins to avoid non-top-level issue


# --------------------------------------------------
# Load test environment variables from .env.test
# --------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    env_file = Path(__file__).resolve().parent.parent / ".env.test"
    load_dotenv(env_file, override=True)


class MockCursor:
    def __init__(self, data):
        self._data = data

    def sort(self, *args, **kwargs):
        return self

    def skip(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    async def to_list(self, length=None):
        return self._data


class MockCollection:
    def __init__(self, collection_name):
        if collection_name == "chat_history":
            self._data = [
                {
                    "_id": "msg1",
                    "role": "user",
                    "content": "Hello",
                    "timestamp": "2023-01-01T00:00:00"
                }
            ]
        else:
            self._data = [
                {"_id": "1", "title": "Doc1", "documentId": "test_id", "userId": "test_user_123"}
            ]

        self.find_one = AsyncMock(return_value={
            "_id": "6627f1234567890abcdef123",
            "user_id": "guest_user",
            "email": "guest@example.com",
            "role": "guest",
            "plan": "free",
            "hashed_password": "mocked_hash"
        })

        self.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="123")
        )

        self.update_one = AsyncMock(
            return_value=MagicMock(modified_count=1)
        )

        self.delete_many = AsyncMock(
            return_value=MagicMock(deleted_count=1)
        )

    def find(self, *args, **kwargs):
        return MockCursor(self._data)

    async def count_documents(self, *args, **kwargs):
        return 1


class MockDB:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def __getattr__(self, name):
        return self.__getitem__(name)
# --------------------------------------------------
# Global mock for all external infrastructure
# --------------------------------------------------
@pytest.fixture(autouse=True)
def mock_infrastructure():
    mock_db = MockDB()

    with (
        patch("app.main.connect_to_mongo", new_callable=AsyncMock),
        patch("app.main.connect_to_redis", new_callable=AsyncMock),
        patch("app.config.database.db_instance.db", mock_db),
        patch("app.config.redis_config.redis_client", MagicMock()),

        # ✅ chat pipeline
        patch("app.routers.chat.chat_pipeline", new_callable=AsyncMock) as m_chat,

        # ✅ search pipeline
        patch("app.pipelines.ml_search.search_pipeline", new_callable=AsyncMock) as m_search,

        # ✅ document pipeline (IMPORTANT FIX)
        patch(
            "app.pipelines.ml_process.process_document_pipeline",
            new_callable=AsyncMock
        ) as m_doc_pipeline,

        patch("app.core.gemini_client.gemini_client", MagicMock()),
        patch("app.core.chroma_client.chroma_client", MagicMock())
    ):
        m_chat.return_value = {"answer": "Mock Answer", "sources": []}
        m_search.return_value = {"results": []}

        # ✅ critical for upload route
        m_doc_pipeline.return_value = {
            "fullText": "Mock PDF content"
        }

        yield


# --------------------------------------------------
# Mock database (session-scoped for conftest.py fixtures)
# --------------------------------------------------
# @pytest.fixture(scope="session", autouse=True)
# def mock_db_session():
#     with patch("app.config.database.db") as mock:
#         # Documents collection
#         mock.documents.insert_one = AsyncMock(
#             return_value=MagicMock(inserted_id="test_id")
#         )

#         mock.documents.find_one = AsyncMock(
#             return_value={
#                 "document_id": "test_id",
#                 "title": "Test Doc",
#                 "summary": "Test Summary",
#                 "keywords": ["mock"],
#                 "topics": ["test"],
#                 "chunk_count": 1,
#                 "reading_time": 1
#             }
#         )

#         mock.documents.count_documents = AsyncMock(return_value=1)

#         mock.documents.find = MagicMock()
#         mock.documents.find.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
#             return_value=[{"document_id": "test_id", "title": "Test Doc"}]
#         )

#         mock.documents.delete_one = AsyncMock(
#             return_value=MagicMock(deleted_count=1)
#         )

#         # Chats collection
#         mock.chats.insert_one = AsyncMock(
#             return_value=MagicMock(inserted_id="chat_id")
#         )

#         mock.chats.count_documents = AsyncMock(return_value=1)

#         mock.chats.find = MagicMock()
#         mock.chats.find.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
#             return_value=[{
#                 "document_id": "test_id",
#                 "answer": "Mock Answer"
#             }]
#         )

#         yield mock


# --------------------------------------------------
# Mock services (session-scoped for conftest.py fixtures)
# --------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def mock_services_session():
    with (
        patch("app.api.documents.document_ingestion_service") as mock_ingestion,
        patch("app.api.documents.text_processing_service") as mock_text,
        patch("app.api.documents.embedding_service") as mock_doc_embedding,
        patch("app.api.documents.analytics_service") as mock_analytics,
        patch("app.api.chat.embedding_service") as mock_chat_embedding,
        patch("app.api.chat.retrieval_service") as mock_retrieval,
        patch("app.api.chat.chat_service") as mock_chat,
        patch("app.api.documents.chroma_client", create=True) as mock_chroma
    ):

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
    
    # Mock redis_client to support await
    async_mock = AsyncMock()
    async_mock.close = AsyncMock()
    
    with patch("app.config.redis_config.redis_client", async_mock):
        with TestClient(app) as test_client:
            yield test_client