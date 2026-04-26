# ScholarAI - AI-Powered Academic Business Intelligence Platform

A production-ready full-stack application that processes academic documents, analyzes them semantically, stores embeddings, and enables contextual AI chat using Gemini and Groq APIs.

## System Architecture

### Technology Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (metadata & user storage)
- ChromaDB (vector database for embeddings)
- Gemini API (embeddings & analytics)
- Groq API (conversational responses)

**Frontend:**
- React with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (API client)

### Workflow

#### Document Processing Flow
1. User uploads document (PDF/URL/raw text)
2. Backend extracts document text
3. Text is cleaned and split into semantic chunks (500 words, 100 word overlap)
4. Gemini API generates embeddings for each chunk
5. Gemini API generates document analytics (summary, keywords, topics, reading time)
6. Embeddings are stored in ChromaDB with metadata
7. Document metadata is stored in MongoDB

#### Chat/Query Flow
1. User submits a query
2. Gemini API generates embedding for the query
3. ChromaDB retrieves top 5 relevant chunks (by similarity)
4. AI context prompt is built using:
   - Retrieved chunks
   - Document summary
   - Keywords
5. Groq API generates final conversational answer
6. System returns:
   - Final answer
   - Source chunks
   - Similarity scores
   - Model information

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents.py      # Document upload & management
│   │   │   ├── chat.py           # Chat endpoints
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py         # Configuration management
│   │   │   ├── gemini_client.py  # Gemini API client
│   │   │   ├── groq_client.py    # Groq API client
│   │   │   ├── chroma_client.py  # ChromaDB client
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── ingestion_service.py    # PDF/URL/text extraction
│   │   │   ├── processing_service.py   # Text cleaning & chunking
│   │   │   ├── embedding_service.py    # Embedding generation
│   │   │   ├── analytics_service.py    # Document analytics
│   │   │   ├── retrieval_service.py    # Context retrieval
│   │   │   ├── chat_service.py         # Chat response generation
│   │   │   └── __init__.py
│   │   ├── db/
│   │   │   └── models.py         # Database models
│   │   ├── config/
│   │   │   ├── database.py       # MongoDB connection
│   │   │   ├── redis_config.py   # Redis configuration
│   │   │   └── settings.py
│   │   ├── utils/
│   │   │   └── logger_config.py  # Logging configuration
│   │   └── main.py               # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx     # Document dashboard
│   │   │   ├── UploadPage.tsx        # Document upload
│   │   │   ├── ChatPage.tsx          # AI chat interface
│   │   │   └── AnalyticsPage.tsx     # Document analytics
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── chroma_db/
│   └── chroma.sqlite3               # ChromaDB persistence
└── .env                              # Environment variables
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment variables:**
   - Copy `.env` from project root
   - Ensure all API keys are set:
     - `GEMINI_API_KEY`
     - `GROQ_API_KEY`
     - `MONGODB_URI`
     - `CHROMA_PERSIST_DIR`

3. **Run the backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

The API will be available at `http://localhost:5000`
- API Docs: `http://localhost:5000/docs`
- Health Check: `http://localhost:5000/health`

### Frontend Setup

1. **Install Node dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment variables:**
   - Create `.env.local` in frontend directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Documents

**Upload PDF**
```
POST /api/documents/upload
Content-Type: multipart/form-data
Body: {file: File, title?: string}
Response: {document_id, title, chunk_count, summary, keywords, topics, reading_time, status}
```

**Upload from URL**
```
POST /api/documents/upload-url
Body: {url: string, title?: string}
Response: UploadResponse
```

**Upload Raw Text**
```
POST /api/documents/upload-text
Body: {text: string, title?: string}
Response: UploadResponse
```

**Get Document Analytics**
```
GET /api/documents/{document_id}/analytics
Response: {document_id, title, summary, keywords, topics, chunk_count, reading_time}
```

**List Documents**
```
GET /api/documents/?skip=0&limit=10
Response: {total, documents, skip, limit}
```

**Delete Document**
```
DELETE /api/documents/{document_id}
Response: {status, message}
```

### Chat

**Query Document**
```
POST /api/chat/query
Body: {document_id: string, query: string, user_id?: string}
Response: {answer, sources, similarity_scores, model}
```

**Get Chat History**
```
GET /api/chat/history/{document_id}?skip=0&limit=20
Response: {document_id, total, chats, skip, limit}
```

## Frontend Pages

### Dashboard Page
- **Route:** `/aras/dashboard`
- **Features:**
  - Display total documents, chunks, keywords, topics
  - List all uploaded documents
  - View document summaries
  - Access chat and deletion options

### Upload Page
- **Route:** `/aras/upload`
- **Features:**
  - Upload PDF files
  - Submit URLs
  - Paste raw text
  - View processing progress
  - Display extracted analytics

### Chat Page
- **Route:** `/aras/chat/{documentId}`
- **Features:**
  - Ask questions about documents
  - View AI responses with sources
  - Display similarity scores
  - Show relevant chunks
  - Maintain chat history

### Analytics Page
- **Route:** `/aras/analytics/{documentId}`
- **Features:**
  - Display document summary
  - Show keywords and topics
  - Visualize document statistics
  - View reading time and chunk count

## Configuration

### Environment Variables

**Backend (.env)**
```
# Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-2-preview

# Groq API
GROQ_API_KEY=your_groq_api_key
GROQ_CHAT_MODEL=llama-3.1-8b-instant

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_storage

# JWT
JWT_SECRET=your_secret_key_change_in_production

# Server
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000

# Text Processing
CHUNK_SIZE=500
CHUNK_OVERLAP=100

# Vector Search
VECTOR_NUM_CANDIDATES=200
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schemas

### Documents Collection
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Academic Paper",
  "summary": "Summary text...",
  "keywords": ["keyword1", "keyword2"],
  "topics": ["topic1", "topic2"],
  "chunk_count": 50,
  "reading_time": 15,
  "file_name": "paper.pdf",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Chats Collection
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "query": "What is the main topic?",
  "answer": "The main topic is...",
  "similarity_scores": [0.95, 0.87, 0.82],
  "source_count": 3,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Model Configuration

**Gemini:**
- Model: `gemini-embedding-2-preview`
- Purpose: Text embeddings and document analytics

**Groq:**
- Model: `llama-3.1-8b-instant`
- Purpose: Conversational responses and context-aware answering

## Performance Optimization

### Chunking Strategy
- **Chunk Size:** 500 tokens
- **Overlap:** 100 tokens
- **Splitter:** Recursive character-based splitting

### Embedding Storage
- **Vector Database:** ChromaDB with persistent storage
- **Retrieval:** Top-5 similarity search
- **Metadata:** Indexed for fast retrieval

## Error Handling

The system includes comprehensive error handling:
- API validation errors with detailed messages
- Database connection error recovery
- Graceful degradation for failed API calls
- User-friendly error notifications

## Security Considerations

- JWT authentication for protected routes
- API key management through environment variables
- CORS configuration for frontend access
- Input validation on all endpoints
- Password hashing with bcrypt

## Scalability

The architecture supports scaling through:
- Stateless FastAPI backend (horizontal scaling)
- MongoDB indexing for efficient queries
- ChromaDB persistent storage
- Async request handling with FastAPI

## Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Development

### Code Organization
- Modular service architecture
- Separation of concerns (ingestion, processing, embedding, retrieval, chat)
- Reusable components and services
- Type-safe TypeScript frontend

### Adding New Features
1. Add service methods in appropriate modules
2. Create API endpoints in `api/` folder
3. Add React components/pages in `src/pages/`
4. Update types in `src/types/`
5. Test endpoints with API documentation

## Production Deployment

### Backend
```bash
# Use production ASGI server
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Build for production
npm run build

# Deploy build/ directory to static hosting
```

### Environment Setup
- Use managed MongoDB service (Atlas, AWS, etc.)
- Configure Redis for caching (optional)
- Set secure JWT secret
- Use production API keys
- Enable HTTPS
- Configure proper CORS origins

## Troubleshooting

### Common Issues

**"GEMINI_API_KEY not found"**
- Ensure `.env` file exists in project root
- Check API key is correctly set

**"ChromaDB connection failed"**
- Ensure `CHROMA_PERSIST_DIR` directory is writable
- Check disk space availability

**"MongoDB connection failed"**
- Verify `MONGODB_URI` is correct
- Check internet connection
- Ensure IP is whitelisted in MongoDB Atlas

**"Frontend cannot reach backend"**
- Verify backend is running on configured port
- Check `VITE_API_URL` in frontend `.env.local`
- Ensure CORS origins are correctly configured

## License

This project is licensed under the MIT License.

## Support

For issues, feature requests, or questions, please refer to the project documentation or submit an issue.
