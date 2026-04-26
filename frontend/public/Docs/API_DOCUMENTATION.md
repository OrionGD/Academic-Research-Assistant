# ScholarAI API Documentation

Complete API reference for the ARAS Platform

## Base URL
```
http://localhost:5000/api
```

## Health & Status

### Health Check
```
GET /health
```
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "service": "ScholarAI API"
}
```

### Root Endpoint
```
GET /
```
Returns welcome message and API information.

**Response:**
```json
{
  "message": "Welcome to ScholarAI API",
  "version": "1.0.0",
  "documentation": "/docs"
}
```

---

## Documents API

### Upload PDF Document

**Endpoint:**
```
POST /documents/upload
```

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (File, required): PDF file to upload
- `title` (String, optional): Document title

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=My Research Paper"
```

**Response (200 OK):**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Research Paper",
  "chunk_count": 45,
  "summary": "This paper discusses...",
  "keywords": ["machine learning", "AI", "neural networks"],
  "topics": ["Deep Learning", "Classification"],
  "reading_time": 12,
  "status": "success"
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Text is too short (minimum 50 characters)"
}
```

---

### Upload Document from URL

**Endpoint:**
```
POST /documents/upload-url
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "url": "https://example.com/document",
  "title": "Document Title (optional)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/documents/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/document",
    "title": "Research Article"
  }'
```

**Response:** Same as PDF upload response

---

### Upload Raw Text

**Endpoint:**
```
POST /documents/upload-text
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "text": "Document text content here...",
  "title": "Document Title (optional)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/documents/upload-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a document about machine learning...",
    "title": "ML Overview"
  }'
```

**Response:** Same as PDF upload response

---

### Get Document Analytics

**Endpoint:**
```
GET /documents/{document_id}/analytics
```

**Parameters:**
- `document_id` (String, path parameter): The ID of the document

**Example Request:**
```bash
curl http://localhost:5000/api/documents/550e8400-e29b-41d4-a716-446655440000/analytics
```

**Response (200 OK):**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Research Paper",
  "summary": "This paper discusses the application of machine learning...",
  "keywords": [
    "machine learning",
    "neural networks",
    "deep learning",
    "classification",
    "regression"
  ],
  "topics": [
    "Supervised Learning",
    "Model Architecture",
    "Performance Evaluation"
  ],
  "chunk_count": 45,
  "reading_time": 12
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Document not found"
}
```

---

### List All Documents

**Endpoint:**
```
GET /documents/?skip=0&limit=10
```

**Query Parameters:**
- `skip` (Integer, optional, default: 0): Number of documents to skip
- `limit` (Integer, optional, default: 10): Maximum number of documents to return

**Example Request:**
```bash
curl "http://localhost:5000/api/documents/?skip=0&limit=20"
```

**Response (200 OK):**
```json
{
  "total": 15,
  "documents": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Paper 1",
      "summary": "...",
      "keywords": ["keyword1", "keyword2"],
      "topics": ["topic1"],
      "chunk_count": 45,
      "reading_time": 12,
      "created_at": "2024-01-01T00:00:00Z"
    },
    ...
  ],
  "skip": 0,
  "limit": 10
}
```

---

### Delete Document

**Endpoint:**
```
DELETE /documents/{document_id}
```

**Parameters:**
- `document_id` (String, path parameter): The ID of the document to delete

**Example Request:**
```bash
curl -X DELETE http://localhost:5000/api/documents/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Document 550e8400-e29b-41d4-a716-446655440000 deleted"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Document not found"
}
```

---

## Chat API

### Query Document

**Endpoint:**
```
POST /chat/query
```

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "What is the main topic of this document?",
  "user_id": "user123 (optional)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "550e8400-e29b-41d4-a716-446655440000",
    "query": "What are the main findings?",
    "user_id": "user123"
  }'
```

**Response (200 OK):**
```json
{
  "answer": "The main findings of the study show that...",
  "sources": [
    {
      "text": "The study found that neural networks...",
      "score": 0.95,
      "chunk_index": 5
    },
    {
      "text": "Results indicate that the model achieved...",
      "score": 0.87,
      "chunk_index": 12
    }
  ],
  "similarity_scores": [0.95, 0.87, 0.82],
  "model": "llama-3.1-8b-instant"
}
```

**Error Responses:**

404 Not Found:
```json
{
  "detail": "Document not found"
}
```

500 Internal Server Error:
```json
{
  "detail": "Error processing query: ..."
}
```

---

### Get Chat History

**Endpoint:**
```
GET /chat/history/{document_id}?skip=0&limit=20
```

**Parameters:**
- `document_id` (String, path parameter): The ID of the document
- `skip` (Integer, optional, default: 0): Number of chats to skip
- `limit` (Integer, optional, default: 20): Maximum number of chats to return

**Example Request:**
```bash
curl "http://localhost:5000/api/chat/history/550e8400-e29b-41d4-a716-446655440000?skip=0&limit=10"
```

**Response (200 OK):**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "total": 5,
  "chats": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user123",
      "query": "What is the main topic?",
      "answer": "The main topic is...",
      "similarity_scores": [0.95, 0.87, 0.82],
      "source_count": 3,
      "created_at": "2024-01-01T10:00:00Z"
    },
    ...
  ],
  "skip": 0,
  "limit": 20
}
```

---

## Error Handling

### Common Error Codes

**400 Bad Request**
- Invalid input parameters
- Missing required fields
- Invalid file format

**404 Not Found**
- Document not found
- Resource does not exist

**500 Internal Server Error**
- Server-side processing error
- API service error (Gemini, Groq, MongoDB)

### Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production deployment, consider implementing:
- Per-user rate limits
- Per-IP rate limits
- API key-based rate limiting

---

## Authentication

The API currently does not require authentication. For production deployment, implement:
- JWT authentication
- API key authentication
- OAuth 2.0

---

## API Versioning

Current version: **1.0.0**

Future versions will be backward compatible when possible.

---

## Response Format

All successful responses return HTTP 200-299 status codes with JSON data.

### Standard Response Structure
```json
{
  "data": { /* response data */ },
  "status": "success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Pagination

Endpoints that return lists support pagination through query parameters:
- `skip`: Number of items to skip (0-indexed)
- `limit`: Maximum number of items to return

**Example:**
```
GET /documents/?skip=20&limit=10
```

---

## Interactive API Documentation

Access the interactive API documentation at:
```
GET /docs
```

This provides:
- Swagger UI for testing endpoints
- Request/response schemas
- Live API testing capability

---

## WebSocket Support (Future)

Planned feature for real-time chat and notifications.

---

## Changelog

### Version 1.0.0
- Initial release
- Document ingestion (PDF, URL, text)
- Document analytics and insights
- AI-powered chat interface
- Embedding-based retrieval
