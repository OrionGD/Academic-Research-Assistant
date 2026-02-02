# **Complete Project Structure Documentation**

## **Backend Directory Structure**

### **📁 backend/app/api/v1/ - API Endpoints Layer**
This directory contains all RESTful API endpoints organized by version. Each file represents a logical grouping of related endpoints following FastAPI best practices.

**documents.py**: Handles all document-related operations including upload, management, and retrieval. Supports PDF, DOCX, and TXT formats with validation. Implements chunking strategies and metadata extraction.

**search.py**: Manages semantic and hybrid search operations. Provides endpoints for vector similarity search, keyword search, and filtered searches by document type or date range.

**chat.py**: Processes research queries through the RAG pipeline. Manages conversation context, handles follow-up questions, and streams responses for better user experience.

### **📁 backend/app/core/ - Core Configuration Layer**
Contains application-wide configurations and shared dependencies.

**config.py**: Centralized configuration management using Pydantic settings. Loads environment variables, defines application settings (database connections, API keys, feature flags), and provides different configurations for development, testing, and production.

**security.py**: Implements authentication and authorization mechanisms. Handles JWT token generation/validation, password hashing, API key validation, and role-based access control for academic institutions.

**dependencies.py**: FastAPI dependency injection definitions. Includes database session management, authentication dependencies, rate limiting, and request validation utilities.

### **📁 backend/app/models/ - Data Models Layer**
Defines the data structures and schemas used throughout the application.

**database.py**: SQLAlchemy ORM models representing database tables. Includes User, Document, DocumentChunk, SearchHistory, and Conversation models with relationships and constraints.

**schemas.py**: Pydantic schemas for request/response validation. Defines strict typing for API contracts, input validation rules, and serialization formats for frontend communication.

**embeddings.py**: Data structures for vector embeddings. Defines embedding models, similarity metrics, and result ranking algorithms used in semantic search operations.

### **📁 backend/app/services/ - Business Logic Layer**
Contains the core business logic and service orchestration.

**document_service.py**: Orchestrates document processing pipeline. Manages file uploads, text extraction, chunking, metadata extraction, and storage coordination between databases.

**embedding_service.py**: Handles text-to-vector transformations. Integrates with various embedding models (Sentence Transformers, OpenAI), manages model caching, and provides batch processing capabilities.

**vector_service.py**: Manages vector database operations. Provides CRUD operations for vector indices, similarity searches, and maintenance tasks like re-indexing and cleanup.

**rag_service.py**: Implements the Retrieval-Augmented Generation pipeline. Coordinates document retrieval, context assembly, prompt engineering, and response generation with source attribution.

**llm_service.py**: Abstracts LLM provider integrations. Supports multiple providers (OpenAI, Anthropic, local models), handles API rate limiting, response streaming, and cost optimization.

### **📁 backend/app/utils/ - Utilities Layer**
Reusable utility functions and helper modules.

**document_parser.py**: Specialized parsers for academic document formats. Handles PDF text extraction with layout preservation, reference/citation detection, and equation/formula recognition.

**chunking.py**: Advanced text segmentation strategies. Implements semantic chunking, sliding window approaches, and academic-specific chunking (by sections, paragraphs, or semantic boundaries).

**preprocessing.py**: Text normalization and cleaning. Removes irrelevant content, standardizes academic formatting, handles special characters, and prepares text for embedding generation.

**logger.py**: Centralized logging configuration. Provides structured logging with different levels, context preservation, and integration with monitoring systems.

### **📁 backend/tests/ - Testing Suite**
Comprehensive test suite following industry standards.

**test_api.py**: End-to-end API tests with mocked dependencies. Tests request validation, error handling, and response formats for all endpoints.

**test_services.py**: Unit tests for business logic. Tests service layer in isolation with mocked dependencies and edge case coverage.

**conftest.py**: Shared pytest fixtures. Provides database sessions, mocked services, test data, and configuration for all test modules.

### **📁 backend/alembic/ - Database Migrations**
Manages database schema evolution and version control.

**env.py**: Alembic environment configuration. Sets up database connections and migration context for SQLAlchemy models.

**alembic.ini**: Migration configuration file. Defines database URLs, migration directory, and other Alembic settings.

**versions/**: Contains individual migration scripts. Each file represents a schema change with upgrade and downgrade operations.

### **Backend Root Files**
**requirements.txt**: Python dependencies with version pinning. Includes FastAPI, SQLAlchemy, PyTorch, transformers, and other essential packages.

**Dockerfile**: Container definition for backend service. Multi-stage build optimizing for size and security, with proper layer caching for dependencies.

**main.py**: FastAPI application entry point. Sets up middleware, routes, exception handlers, and starts the ASGI server.

---

## **Frontend Directory Structure**

### **📁 frontend/public/ - Static Assets**
Contains static files served directly by the web server.

**index.html**: Main HTML entry point. Includes meta tags for SEO, PWA manifest links, and root div for React mounting.

**favicon.ico**: Application icon. Multiple sizes provided for different devices and browser requirements.

### **📁 frontend/src/components/ - React Components**
Reusable UI components following atomic design principles.

**Layout/**: Application layout components. Includes Header, Sidebar, Footer, and MainContainer with responsive design and theme support.

**DocumentUpload/**: Interactive document upload interface. Features drag-and-drop, file preview, progress tracking, and batch upload capabilities.

**SearchInterface/**: Advanced search components. Includes search bar with auto-suggest, filters panel, date range selectors, and document type filters.

**ResultsDisplay/**: Search results presentation. Shows documents in list/grid views, relevance scores, snippets preview, and pagination controls.

**ChatInterface/**: Interactive research assistant. Features message threading, source citations, follow-up suggestions, and response streaming visualization.

### **📁 frontend/src/pages/ - Page Components**
Top-level page components representing application routes.

**Dashboard.jsx**: Main dashboard page. Shows recent documents, search history, quick actions, and system statistics.

**Documents.jsx**: Document management page. Provides document listing, filtering, bulk operations, and metadata editing.

**Search.jsx**: Advanced search page. Combines search interface with results display and saved search functionality.

**Settings.jsx**: User preferences and system settings. Includes API configuration, theme selection, and notification preferences.

### **📁 frontend/src/services/ - API Integration Layer**
Handles communication with backend API.

**api.js**: Centralized API client. Configures axios instances with interceptors for authentication, error handling, and request/response transformation.

**documentService.js**: Document-related API calls. Abstracts upload, search, and management operations with proper error handling and progress reporting.

### **📁 frontend/src/utils/ - Frontend Utilities**
Client-side helper functions.

**helpers.js**: General utility functions. Includes date formatting, file size conversion, text truncation, and validation helpers.

### **📁 frontend/src/styles/ - Styling Assets**
CSS styles organized by component and functionality.

**main.css**: Global styles and CSS variables. Defines color schemes, typography, spacing system, and responsive breakpoints.

**components.css**: Component-specific styles. Modular CSS following BEM methodology for maintainability.

### **Frontend Root Files**
**package.json**: NPM dependencies and scripts. Includes React, Axios, Material-UI, and development tools with version control.

**Dockerfile**: Frontend container definition. Builds optimized production bundle with proper caching and serving configuration.

**.env.local**: Frontend environment variables. API endpoints, feature flags, and third-party service configurations.

**App.jsx**: Main React application component. Sets up routing, theme provider, and application context.

**index.js**: ReactDOM entry point. Renders the application with error boundaries and strict mode.

---

## **Cross-Directory Integration Points**

### **Data Flow Between Layers**
1. **Frontend → API Layer**: User actions in React components call API services which communicate with backend endpoints
2. **API Layer → Services**: FastAPI endpoints delegate to service layer for business logic processing
3. **Services → ML Pipeline**: Business services call ML components for embeddings, RAG, and LLM operations
4. **Services → Storage**: Document and vector storage operations coordinated through storage abstraction
5. **Monitoring → All Layers**: Centralized logging and metrics collection across all components

### **Key Architectural Patterns**
- **Dependency Injection**: Core services injected into API endpoints for testability
- **Repository Pattern**: Database abstraction for clean separation of concerns
- **Factory Pattern**: Service instantiation based on configuration
- **Strategy Pattern**: Pluggable algorithms for chunking, embedding, and search
- **Observer Pattern**: Real-time updates for document processing status

### **Performance Considerations**
- **Caching Layer**: Redis integration for frequent queries and embeddings
- **Async Processing**: Background tasks for document processing and embedding generation
- **Connection Pooling**: Database and vector store connection management
- **Lazy Loading**: Frontend code splitting for optimal initial load time
- **Streaming Responses**: Progressive rendering for large document processing

### **Security Implementation**
- **API Gateway Pattern**: Centralized authentication and rate limiting
- **Input Validation**: Multi-layer validation at API and service levels
- **Data Encryption**: TLS for transit, encryption for sensitive data at rest
- **Access Control**: Role-based permissions for document access
- **Audit Logging**: Comprehensive activity tracking across all operations

### **Scalability Design**
- **Horizontal Scaling**: Stateless backend services allow multiple instances
- **Database Sharding**: Potential for document collection partitioning
- **Vector Store Clustering**: Distributed vector indices for large document sets
- **Load Balancing**: Frontend and backend load distribution
- **Queue System**: Background job processing for intensive operations

This architecture supports the enterprise requirements of:
- **High Availability**: Redundant components and failover mechanisms
- **Maintainability**: Clear separation of concerns and comprehensive testing
- **Extensibility**: Pluggable components for new document types and ML models
- **Observability**: Complete monitoring and logging infrastructure
- **Security**: Defense-in-depth approach with multiple security layers

The structure enables seamless collaboration between frontend developers, backend engineers, ML researchers, and DevOps specialists while maintaining clear boundaries and well-defined interfaces.
