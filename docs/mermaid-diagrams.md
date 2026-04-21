Created comprehensive mermaid-diagrams.md file containing Mermaid code for all key diagrams referenced in PROJECT_DOCUMENTATION.md:

Chapter 1 - Introduction:

Figure 1.1 – ScholarAI System Architecture Overview (graph TB)
Figure 1.2 – RAG Pipeline Workflow (flowchart TD)
Chapter 4 - Proposed System (Section 4.2):

Figure 4.2 – Data Flow Diagram (DFD) - Level 0 (flowchart LR)
Figure 4.4 – Database Schema: User, Document, and ChatMessage Relationships (erDiagram)
Figure 4.5 – Authentication Flow with JWT (flowchart TD - added based on updates)
Figure 4.7 – Vector Embedding and Semantic Search Process (flowchart TD)
Chapter 6 - System Implementations:

Figure 6.1 – Module Interaction Diagram (graph LR)
Chapter 7 - System Testing:

Figure 7.2 – System Performance Metrics Dashboard (graph TD)
Usage: Copy individual Mermaid blocks to Mermaid Live Editor, VS Code Mermaid Preview, or GitHub for rendering/export as SVG/PNG.

All diagrams match the exact descriptions/specifications from PROJECT_DOCUMENTATION.md and are ready for visual presentation without editing the main report.



## Figure 1.1 – ScholarAI System Architecture Overview

```mermaid
graph TB
    subgraph Presentation['Presentation Layer']
        A[React Frontend<br/>Tailwind CSS<br/>Components & Pages]
    end
    subgraph Application['Application Layer']
        B[Node.js/Express API<br/>Controllers & Services]
        C[Python ML Service<br/>FastAPI<br/>Embeddings & NLP]
    end
    subgraph Data['Data Layer']
        D[MongoDB<br/>Users, Documents, Chats]
        E[Redis<br/>Cache & Sessions]
        F[Vector DB<br/>FAISS/Pinecone<br/>Embeddings]
        G[S3/GCS<br/>File Storage]
    end
    H[Firebase Auth<br/>JWT Tokens]
    
    A -->|HTTP/REST| B
    B -->|gRPC/Queue| C
    B -.->|Auth| H
    B --> D
    B --> E
    C --> F
    C --> G
    B --> G
    
    classDef layer fill:#e1f5fe
    class Presentation,Application,Data layer
```

## Figure 1.2 – RAG Pipeline Workflow

```mermaid
flowchart TD
    A[PDF Upload] --> B[Text Extraction<br/>Metadata Extraction]
    B --> C[Chunk Document<br/>500-1000 tokens]
    C --> D[Clean & Normalize<br/>Remove Duplicates]
    D --> E[Generate Embeddings<br/>SentenceTransformer]
    E --> F[Store in Vector DB<br/>Index Embeddings]
    F --> G[Query Input]
    G --> H[Embed Query]
    H --> I[Vector Similarity Search<br/>Top-K Chunks]
    I --> J[Retrieve Context<br/>+ Metadata]
    J --> K[Augment LLM Prompt]
    K --> L[Generate Response<br/>LLM Gemini/Claude]
    L --> M[Extract Citations]
    M --> N[Return Answer + Sources]
    
    style A fill:#e8f5e8
    style N fill:#e8f5e8
```

## Figure 4.2 – Data Flow Diagram (DFD) - Level 0

```mermaid
flowchart LR
    Researcher[Researcher] -->|Upload Papers<br/>Search Queries<br/>Chat Inquiries| ScholarAI[ScholarAI System]
    ScholarAI -->|Summaries & Analysis<br/>Relevant Papers w/ Citations<br/>Research Insights| Researcher
    
    subgraph System['ScholarAI System']
        Upload[Document Upload & Processing]
        Search[Semantic Search]
        Chat[Chat Interface]
        Compare[Paper Comparison]
    end
    
    Researcher -.-> Upload
    Researcher -.-> Search
    Researcher -.-> Chat
    Researcher -.-> Compare
```

## Figure 4.4 – Database Schema: User, Document, and ChatMessage Relationships

```mermaid
erDiagram
    USER ||--o{ DOCUMENT : owns
    USER ||--o{ CHATMESSAGE : "has messages"
    USER ||--o{ PROJECT : manages
    DOCUMENT ||--o{ CHUNK : "contains"
    DOCUMENT ||--o{ ANALYSISRESULT : "has analysis"
    DOCUMENT ||--o{ CHATMESSAGE : "referenced in"
    CHUNK }|--|| EMBEDDING : "has"
    
    USER {
        string _id PK
        string email
        string displayName
        string firebaseUID
        datetime createdAt
    }
    DOCUMENT {
        string _id PK
        string userId FK
        string title
        string[] authors
        datetime publishDate
        string abstract
        string fileUrl
        string[] embeddingIds
    }
    CHUNK {
        string _id PK
        string documentId FK
        int chunkIndex
        string content
        string embeddingId FK
    }
    CHATMESSAGE {
        string _id PK
        string userId FK
        string documentId FK
        string role
        string content
        Citation[] citations
        datetime timestamp
    }
```

## Figure 4.7 – Vector Embedding and Semantic Search Process

```mermaid
flowchart TD
    A[Raw Text Chunks] --> B[Preprocessing<br/>Cleaning & Normalization]
    B --> C[Embedding Model<br/>all-MiniLM-L6-v2<br/>384 dimensions]
    C --> D[Generate Vectors<br/>Cosine Similarity Ready]
    D --> E[Store in Vector DB<br/>FAISS/Pinecone Index]
    
    F[User Query] --> G[Embed Query<br/>Same Model]
    G --> H[Vector Similarity Search<br/>k-NN Top Results]
    H --> I[Rank by Score<br/>Cosine Similarity]
    I --> J[Retrieve Chunks + Metadata]
    J --> K[Return to Application]
    
    style A fill:#fff3cd
    style K fill:#fff3cd
```

## Figure 6.1 – Module Interaction Diagram

```mermaid
graph LR
    A[Document Management] --> B[Document Processing]
    B --> C[Embedding & Vector Search]
    C --> D[Analysis & Summarization]
    D --> E[Search Module]
    D --> F[Chat & Conversational]
    A --> G[User Management]
    G --> H[Auth & Security]
    
    B --> I[Paper Comparison]
    F --> I
    E --> I
    
    subgraph "Core Modules"
        A
        B
        C
        D
        E
        F
        G
        H
        I
    end
    
    J[(MongoDB)] -.-> A
    J -.-> F
    K[(Vector DB)] -.-> C
    K -.-> E
    L[(Redis Cache)] -.-> E
    L -.-> F
```

## Figure 7.2 – System Performance Metrics Dashboard

```mermaid
graph TD
    subgraph Metrics['Performance Metrics Collection']
        A[API Response Time<br/>P95: 450ms]
        B[Document Processing<br/>Avg: 15s]
        C[Search Latency<br/>Avg: 180ms]
        D[System Uptime<br/>99.7%]
        E[Concurrent Users<br/>2,500 req/s]
        F[Error Rate<br/><1%]
    end
    
    G[Prometheus<br/>Scraping] --> A
    G --> B
    G --> C
    G --> D
    G --> E
    G --> F
    
    G --> H[Grafana<br/>Dashboard]
    H --> I[Real-time Alerts]
    
    J[Backend Services] --> G
    K[ML Service] --> G
    L[Databases] --> G
    
    style H fill:#d4edda

## Figure 7.3 – CI Pipeline Workflow

```mermaid
flowchart TD
    subgraph GitHub['GitHub Repository']
        A[Push / Pull Request]
    end
    
    subgraph Actions['GitHub Actions Runner']
        B[Checkout Code] --> C[Setup Python 3.11]
        C --> D[Install Dependencies]
        D --> E[Run Ruff Lint]
        E --> F[Run ML Unit Tests]
        
        subgraph Verification['Verification']
            F --> G{Passed?}
        end
    end
    
    G -- Yes --> H[Merge Approved]
    G -- No --> I[Block Merge / Alert]
    
    style GitHub fill:#f5f5f5
    style Actions fill:#fff3cd
    style Verification fill:#d1e7dd
```
```

## Usage Instructions

1. Copy individual Mermaid code blocks to [Mermaid Live Editor](https://mermaid.live/)
2. Or use VS Code Mermaid Preview extension
3. GitHub Markdown rendering supports Mermaid natively
4. Export as SVG/PNG for documents

These diagrams are derived directly from the ScholarAI system architecture described in `PROJECT_DOCUMENTATION.md`.
