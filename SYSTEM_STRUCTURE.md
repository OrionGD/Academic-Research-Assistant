# ARAS (Academic Research Assistant System) Project Structure

This document outlines the root structure of the ARAS platform, including the newly migrated Python backend.

## 📁 Root Directory Layout

```text
ARAS/
├── .env                        # Shared environment variables
├── frontend/                   # React (Vite) Frontend application
├── python-backend/             # NEW: FastAPI Python Backend (Migrated)
│   ├── app/
│   │   ├── config/             # DB, Storage, Redis, AI settings
│   │   ├── middleware/         # Auth, Session, Credit gatekeeping
│   │   ├── models/             # Pydantic schemas
│   │   ├── pipelines/          # Document analysis workflows
│   │   ├── routers/            # API endpoints (Auth, Docs, Chat, Admin...)
│   │   ├── services/           # Business logic (Groq, Gemini, Usage...)
│   │   ├── utils/              # Logging, Socket, Audit, Session helpers
│   │   └── workers/            # Arq background task workers
│   ├── Dockerfile              # Backend containerization
│   ├── docker-compose.yml      # Full stack orchestration (App + DB + Redis)
│   ├── requirements.txt        # Python dependencies
│   └── run.py                  # Entry point
├── backend/                    # LEGACY: Node.js/TypeScript Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
├── ml-service/                 # ML Microservice (FastAPI/Python/Rust)
│   ├── pipelines/              # RAG, Ingestion, & Search logic
│   ├── main.py                 # ML Service entry point
│   └── requirements.txt
├── scripts/                    # Utility scripts (Migrations, Seeding)
├── Docs/                       # API Documentation and diagrams
└── README.md                   # Main project documentation
```

## 🛠️ Core Components

### 1. Python Backend (`python-backend/`)
The primary application server responsible for user management, SaaS billing logic, and orchestration of AI tasks.
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Inference**: Groq (Llama-3.1-8b-instant)
- **Embeddings**: Gemini (gemini-embedding-2-preview)
- **Queue**: Arq (Redis-based)

### 2. Frontend (`frontend/`)
The user interface for researchers to interact with the system.
- **Framework**: React + Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **State**: Redux / Context API

### 3. ML Service (`ml-service/`)
A specialized microservice for heavy-lifting vector operations and PDF extraction.
- **Features**: PDF Parsing, Chunking, Vector Database (ChromaDB/Atlas).
- **Communication**: REST / SSE (Server-Sent Events).

### 4. Database Layer
- **MongoDB Atlas**: Primary persistent storage for users, documents, and chat history.
- **Redis**: Used for session state, rate limiting, and background task queuing.
