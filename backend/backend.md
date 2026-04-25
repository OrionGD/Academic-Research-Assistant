# ARAS Backend - FastAPI Production-Ready Monorepo

## Folder Structure

- `app/config/`: Configuration for MongoDB, Redis, AI services (Groq, Gemini), and app settings.
- `app/middleware/`: Custom middleware for session-based authentication, billing checks, and rate limiting.
- `app/models/`: Pydantic and MongoDB models for data validation and storage.
- `app/routers/`: API route modules (Auth, Documents, Chat, Analysis, Billing, Admin).
- `app/services/`: Core logic for AI services, document management, and usage tracking.
- `app/pipelines/`: AI workflows including PDF extraction, text chunking, and RAG pipelines.
- `app/workers/`: Background job definitions using `arq`.
- `app/utils/`: Helper functions and utilities.

## Session Handling Flow

1. **Login**: User authenticates via `/api/auth/login`.
2. **Session Creation**: Backend generates a unique session ID.
3. **Storage**: Session data (user ID, role, plan, limits) is stored in **Redis** with an expiration time.
4. **Cookie**: Backend sends a secure, `HttpOnly` cookie containing the session ID to the frontend.
5. **Validation**: `SessionMiddleware` intercepts every request, retrieves the session ID from cookies, and fetches user data from Redis.
6. **Access Control**: Role-based and credit-based checks are performed using the session data attached to the request state.

## AI & RAG Workflow

1. **Upload**: User uploads a PDF to `/api/documents/upload`.
2. **Process**: `PDFPipeline` extracts text; `ChunkPipeline` splits text into manageable pieces.
3. **Embed**: `EmbeddingService` uses Gemini to generate vector embeddings for each chunk.
4. **Store**: Chunks and embeddings are stored in **MongoDB Atlas** with a Vector Search index.
5. **Chat**: User sends a query to `/api/chat`.
6. **Retrieve**: `RAGPipeline` performs a semantic search against MongoDB Atlas.
7. **Inference**: `GroqService` (Llama 3.1) generates a context-aware response.
8. **Usage**: `UsageService` updates credits in Redis and MongoDB.

## Best Practices & Scaling

- **Modular Design**: Each service and pipeline is isolated, making it easy to swap components (e.g., changing embedding models).
- **Session-Based**: Avoids JWT complexity and allows for immediate session revocation.
- **Asynchronous**: Built with FastAPI and `asyncio` for high-concurrency handling.
- **Vector Search**: Leverages MongoDB Atlas's native vector search for scalability.
- **Background Jobs**: Uses `arq` for long-running tasks like document processing.
