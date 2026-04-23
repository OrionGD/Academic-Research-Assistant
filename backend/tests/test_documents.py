import pytest
import io

def test_upload_pdf(client):
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    data = {"title": "Test Title"}
    
    response = client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "document_id" in res_data
    assert res_data["title"] == "Test Title"
    assert res_data["status"] == "success"

def test_upload_from_url(client):
    data = {"url": "https://example.com/test", "title": "Example URL"}
    response = client.post("/api/documents/upload-url", json=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "document_id" in res_data
    assert res_data["title"] == "Example URL"
    assert res_data["status"] == "success"

def test_upload_text(client):
    data = {"text": "This is test text for upload", "title": "Test Text"}
    response = client.post("/api/documents/upload-text", json=data)
    assert response.status_code == 200
    res_data = response.json()
    assert "document_id" in res_data
    assert res_data["title"] == "Test Text"
    assert res_data["status"] == "success"

def test_get_document_analytics(client):
    response = client.get("/api/documents/test_id/analytics")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["document_id"] == "test_id"
    assert res_data["title"] == "Test Doc"

def test_list_documents(client):
    response = client.get("/api/documents/")
    assert response.status_code == 200
    res_data = response.json()
    assert "documents" in res_data
    assert res_data["total"] == 1
    assert len(res_data["documents"]) == 1

def test_delete_document(client):
    response = client.delete("/api/documents/test_id")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert "deleted" in res_data["message"]
