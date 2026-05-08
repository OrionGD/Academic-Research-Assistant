import pytest
from unittest.mock import patch, AsyncMock, MagicMock

def test_query_document(client):
    with patch("app.routers.chat.chat_pipeline", new_callable=AsyncMock) as mock_pipeline:
        mock_pipeline.return_value = {"answer": "Mock Answer", "sources": []}

        data = {
            "document_id": "test_id",
            "query": "What is this document about?",
            "user_id": "guest_user"
        }

        response = client.post("/api/chat/query", json=data)

        assert response.status_code == 200
        res_data = response.json()

        assert "answer" in res_data
        assert res_data["answer"] == "Mock Answer"
        assert "sources" in res_data


def test_get_chat_history(client):
    response = client.get("/api/chat/history/test_id")

    assert response.status_code == 200
    res_data = response.json()

    assert res_data["document_id"] == "test_id"
    assert "chats" in res_data
    assert len(res_data["chats"]) == 1
    assert res_data["total"] == 1
