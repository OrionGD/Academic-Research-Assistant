import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app

# --- Mocking Helper classes for MongoDB/Redis/AI ---
class MockCollection:
    def __init__(self):
        self.find = MagicMock(return_value=self)  # Changed to AsyncMock for consistency if awaited
        self.find_one = AsyncMock(return_value={
            "_id": "6627f1234567890abcdef123", 
            "user_id": "guest_user",  # Updated to guest
            "email": "guest@example.com", 
            "role": "guest", 
            "plan": "free",
            "hashed_password": "mocked_hash"
        })
        self.insert_one = AsyncMock(return_value=MagicMock(inserted_id="123"))
        self.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
        self.delete_many = AsyncMock(return_value=MagicMock(deleted_count=1))
        self.to_list = AsyncMock(return_value=[])
        self.sort = MagicMock(return_value=self)  # Changed to AsyncMock if sort chain is awaited

class MockDB:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection()
        return self.collections[name]
    def __getattr__(self, name):
        return self.__getitem__(name)

@pytest.fixture(autouse=True)
def mock_infrastructure():
    """
    Global mock for all external infrastructure and AI services 
    to prevent blocking route execution during testing.
    """
    mock_db = MockDB()
    
    with (
        patch("app.main.connect_to_mongo", new_callable=AsyncMock),
        patch("app.main.connect_to_redis", new_callable=AsyncMock),
        patch("app.config.database.db_instance", MagicMock()) as m_db_inst,
        patch("app.config.database.get_database", return_value=mock_db),
        patch("app.config.redis_config.redis_client", MagicMock()),
        # Removed patches for session_service, credit_service, and auth
        patch("app.routers.chat.chat_pipeline", new_callable=AsyncMock) as m_chat,
        patch("app.pipelines.ml_search.search_pipeline", new_callable=AsyncMock) as m_search,
        patch("app.core.gemini_client.gemini_client", MagicMock()),
        patch("app.core.chroma_client.chroma_client", MagicMock())
    ):
        
        m_db_inst.db = mock_db
        
        # Default mock behaviors (updated for guest access)
        m_chat.return_value = {"answer": "Mocked AI Response", "sources": []}
        m_search.return_value = []
        
        yield

# ====================================================
# ROOT ENDPOINTS
# ====================================================

def test_root_endpoints(client):
    """Test public root and health endpoints"""
    # GET /
    response = client.get("/")
    assert response.status_code == 200
    
    # GET /health
    response = client.get("/health")
    assert response.status_code == 200
