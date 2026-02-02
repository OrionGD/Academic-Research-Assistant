# How to Run the Academic Research Assistant (ARAS)

## Overview

The **Academic Research Assistant (ARAS)** is a full-stack, Retrieval-Augmented Generation (RAG) system designed to help users upload academic documents, perform semantic search, and interact with content using LLM-powered chat.

The system consists of:

* **Backend**: FastAPI + RAG services
* **Frontend**: React application
* **ML Pipeline**: Embeddings, retrieval, and generation
* **Vector DB**: FAISS / Chroma / Pinecone (pluggable)
* **Infrastructure**: Docker-based deployment

---

## Quick Start

### Prerequisites

```text
Python: 3.9 / 3.10 / 3.11
Node.js: 18+
Docker & Docker Compose (recommended)
Git
```

---

## Method 1: Docker (Recommended)

### Clone Repository

```bash
git clone https://github.com/OrionGD/Academic-Research-Assistant.git
cd Academic-Research-Assistant
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with required values
```

### Start Services

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

---

## Access Points

| Service            | URL                                                      |
| ------------------ | -------------------------------------------------------- |
| Frontend           | [http://localhost:3000](http://localhost:3000)           |
| Backend API        | [http://localhost:8000](http://localhost:8000)           |
| API Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Prometheus         | [http://localhost:9090](http://localhost:9090)           |

---

## Method 2: Local Development Setup

### Backend Setup

```bash
cd backend
python -m venv venv
```

Activate environment:

```bash
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Set environment variables:

```bash
cp ../.env.example .env
```

Run backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

```bash
npm start
```

Frontend will be available at:

```
http://localhost:3000
```

---

## Environment Configuration

### Backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/academic_db
REDIS_URL=redis://localhost:6379/0

SECRET_KEY=change-this-secret
ALGORITHM=HS256

OPENAI_API_KEY=your-openai-key

VECTOR_DB_TYPE=faiss
STORAGE_TYPE=local

DEBUG=true
```

---

### Frontend (`frontend/.env.local`)

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

## Project Structure (High-Level)

```text
backend/        FastAPI backend & RAG services
frontend/       React frontend
ml_pipeline/    Embeddings, LLMs, RAG logic
vector_db/      Vector database integrations
database/       SQL models and initialization
docker/         Docker & Nginx configs
docs/           System documentation
scripts/        Utility scripts
```

---

## Running Tests

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

---

## Common Issues

### Port Already in Use

```bash
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

### Docker Reset (Development Only)

```bash
docker-compose down -v
docker system prune -a
```

---

## Academic Notes

* The project follows **modular RAG architecture**
* Supports **multiple vector databases**
* Designed for **research, learning, and experimentation**
* Suitable for **final year projects / capstone submissions**

---

## License

This project is licensed under the **MIT License**.

---

## Author

**Godfrey T. R**

B.E – Computer Science and Engineering

GitHub: [OrionGD](https://github.com/OrionGD)

---
