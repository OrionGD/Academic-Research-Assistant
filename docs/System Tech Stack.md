# System Tech Stack

## 1️⃣ Frontend

Handles the user interface for document upload, research queries, and displaying generated responses.

* **React.js** – Component-based UI framework
* **HTML5** – Page structure
* **CSS3 / Tailwind CSS** – Responsive styling
* **JavaScript / TypeScript** – Client-side logic and API communication

---

## 2️⃣ Backend

Manages APIs, document ingestion, query processing, and communication with the AI pipeline.

* **Python** – Core backend language
* **FastAPI** – High-performance API framework for AI services
* **Uvicorn** – ASGI server for running backend applications

---

## 3️⃣ Authentication & User Management

Provides secure login and user identity management.

* **Firebase Authentication** – Secure authentication system supporting email/password login, OAuth providers, and token-based authentication

---

## 4️⃣ Natural Language Processing (NLP)

Processes research documents and generates context-aware responses.

* **Sentence Transformers** – Generate semantic vector embeddings
* **Hugging Face Transformers** – Model loading and inference
* **Large Language Model (LLM)** – Generates responses within the RAG pipeline

---

## 5️⃣ Vector Database

Stores vector embeddings for semantic similarity search.

* **FAISS** – High-performance local vector similarity search engine
  *(Alternatives: ChromaDB, Pinecone, Weaviate)*

---

## 6️⃣ Document Processing

Extracts and prepares content from academic papers.

* **PyPDF2 / pdfminer.six** – PDF text extraction
* **LangChain Text Splitters** – Document chunking and preprocessing

---

## 7️⃣ Data Storage

Stores research document metadata, system data, and references.

* **MongoDB Atlas** – Cloud-hosted NoSQL database used for storing document metadata, research paper details, user queries, and system logs

---

## 8️⃣ AI Pipeline Framework

Coordinates the Retrieval-Augmented Generation workflow.

* **LangChain** – RAG orchestration, document retrieval, and context management
* Embedding model integration for semantic search

---

## 9️⃣ Deployment & Infrastructure

Ensures scalability and portability of the system.

* **Docker** – Containerization for consistent environments
* **AWS / Google Cloud / Azure** – Cloud deployment platforms
* **GitHub Actions** – CI/CD automation

---

## 🔟 Development Tools

* **Git & GitHub** – Version control and collaboration
* **VS Code** – Development environment
* **Postman / Thunder Client** – API testing

---

✅ **Architecture Pattern:**
**Retrieval-Augmented Generation (RAG) + Vector Search based AI Research System**

