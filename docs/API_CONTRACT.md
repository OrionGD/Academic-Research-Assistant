# ARAS API Contract (Backend ↔ ML Service)

This document defines the strict communication contract between the Node.js backend and the Python ML service.

## General Principles
- **Authentication**: All requests to ML service must include `X-API-Key`.
- **Content-Type**: `application/json` (except for `/process-document` which is `multipart/form-data`).
- **Standardized Error Codes**:
    - `400 Bad Request`: Malformed payload or validation error.
    - `401 Unauthorized`: Missing or invalid API key.
    - `413 Payload Too Large`: Request body exceeds limits.
    - `429 Too Many Requests`: Rate limit exceeded.
    - `502 Bad Gateway`: External AI provider failure.
    - `503 Service Unavailable`: Internal dependency (Mongo/Redis) down.

---

## 1. Chat (RAG)
**Endpoint**: `POST /chat` and `POST /chat/stream`

### Request Schema
```json
{
  "message": "string (1-2000 chars)",
  "userId": "string (MongoDB ObjectId hex pattern)",
  "documentIds": ["string array (optional)"]
}
```

### Response Schema (Standard)
```json
{
  "message": {
    "id": "string",
    "role": "assistant",
    "content": "string"
  },
  "citations": [
    {
      "index": "number",
      "documentId": "string",
      "chunkIndex": "number",
      "section": "string",
      "relevanceScore": "number"
    }
  ],
  "sources": ["string (documentId array)"],
  "contextChunksUsed": "number"
}
```

---

## 2. Hybrid Search
**Endpoint**: `POST /search`

### Request Schema
```json
{
  "query": "string (1-1000 chars)",
  "userId": "string (required)",
  "limit": "number (default: 5, max: 20)",
  "documentIds": ["string array (optional)"]
}
```

---

## 3. Policy & Limits
- **Max PDF size**: 10MB.
- **Max text length (Analysis)**: 120,000 characters.
- **Rate Limit (Free Tier)**: 10 requests per minute per key.
- **Rotation**: Systems rotates 5 active Gemini API keys for the Chat endpoints.
