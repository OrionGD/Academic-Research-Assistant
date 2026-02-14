# Complete ARAS File System Documentation (Gemini AI Edition)

## Root Directory Files

### Configuration Files
- **`.env.example`**: Template for environment variables. Contains placeholders for:
  - `GEMINI_API_KEY`: Google Gemini API key
  - `GEMINI_EMBEDDING_MODEL`: Which embedding model to use (gemini-embedding-001)
  - `GEMINI_CHAT_MODEL`: Which chat model to use (gemini-2.5-pro, gemini-1.5-pro)
  - `GEMINI_EMBEDDING_DIMENSIONS`: Configurable dimensions (768/1536/3072) using MRL
  - `MONGODB_URI`: MongoDB connection string
  - `FIREBASE_*`: Firebase configuration values
  - `REDIS_URL`: Redis cache connection

- **`.gitignore`**: Specifies which files Git should ignore (node_modules, .env, pycache, etc.)
- **`.dockerignore`**: Files to exclude from Docker builds to keep images small
- **`.pre-commit-config.yaml`**: Git pre-commit hooks for code quality (runs linters, formatters)
- **`pyproject.toml`**: Modern Python project configuration (dependencies, tool settings)
- **`requirements.txt`**: Root Python dependencies list
- **`Makefile`**: Automation commands (make build, make test, make deploy)
- **`docker-compose.yml`**: Root Docker Compose for running entire system
- **`check`**: Custom health check script

## 📁 .github/ - GitHub Configuration

### workflows/
- **`ci-cd.yml`**: Continuous Integration/Deployment pipeline
  - Runs on push to main/develop
  - Executes tests, builds Docker images
  - Deploys to staging/production automatically

- **`docker-build.yml`**: Automated Docker image building
  - Builds multi-architecture images
  - Scans for vulnerabilities
  - Publishes to container registry

- **`tests.yml`**: Test automation
  - Runs unit tests, integration tests
  - Generates coverage reports
  - Runs on pull requests

### Templates
- **`pull_request_template.md`**: Standard PR template
  - Checklist for code quality
  - Testing requirements
  - Documentation updates

## 📁 backend/ - FastAPI Backend Service

### app/api/v1/endpoint/ - API Endpoints
- **`admin.py`**: Administrative endpoints
  - User management (suspend, delete, role changes)
  - System metrics and health checks
  - Usage statistics and billing reports
  - Maintenance operations

- **`auth.py`**: Authentication endpoints
  - `POST /login`: User login with Firebase
  - `POST /register`: New user registration
  - `POST /refresh`: Token refresh
  - `POST /logout`: User logout
  - `GET /profile`: User profile retrieval

- **`chat.py`**: Chat functionality endpoints
  - `POST /chat`: Send message to research assistant
  - `GET /chat/history`: Retrieve conversation history
  - `DELETE /chat/:id`: Delete conversation
  - `POST /chat/stream`: Streaming chat responses

- **`documents.py`**: Document management endpoints
  - `POST /upload`: Upload research papers (PDF, DOCX, TXT)
  - `GET /documents`: List user documents
  - `GET /documents/:id`: Get document details
  - `DELETE /documents/:id`: Delete document
  - `POST /documents/:id/process`: Trigger processing

- **`embeddings.py`**: Embedding operations endpoints
  - `POST /embeddings/generate`: Generate embeddings for text
  - `GET /embeddings/status`: Check embedding job status
  - `POST /embeddings/optimize`: Optimize embedding dimensions

- **`search.py`**: Search endpoints
  - `POST /search`: Execute semantic search
  - `POST /search/hybrid`: Hybrid keyword + vector search
  - `GET /search/filters`: Get available filters
  - `POST /search/feedback`: Submit search feedback

### app/core/ - Core Configuration
- **`__init__.py`**: Makes core a Python package
- **`cache.py`**: Redis cache management
  - Connection pooling
  - Cache invalidation strategies
  - Serialization/deserialization

- **`config.py`**: Application configuration
  - Loads environment variables
  - Pydantic settings validation
  - Environment-specific configs

- **`database.py`**: MongoDB connection
  - Async database client
  - Connection pooling
  - Health checks

- **`dependencies.py`**: FastAPI dependencies
  - Dependency injection setup
  - Common dependencies

- **`firebase.py`**: Firebase Admin SDK
  - Firebase app initialization
  - Token verification
  - Firebase services setup

- **`gemini_config.py`**: Google Gemini configuration
  - API client initialization
  - Model selection logic
  - Rate limiting configuration
  - Error handling setup

- **`security.py`**: Security utilities
  - CORS configuration
  - Rate limiting
  - JWT handling
  - Password hashing

### app/db/
- **`mongodb.py`**: MongoDB database layer
  - Collection definitions
  - Query builders
  - Index management

### app/middleware/
- **`auth_middleware.py`**: Authentication middleware
  - Validates JWT tokens
  - Extracts user info
  - Handles unauthorized access

- **`logging_middleware.py`**: Request logging
  - Logs all API requests
  - Performance tracking
  - Error logging

### app/models/ - Database Models
- **`base.py`**: Base model class
  - Common fields (id, created_at, updated_at)
  - Serialization methods
  - MongoDB document mapping

- **`chunk.py`**: Document chunk model
  - Text content
  - Vector embeddings (Gemini 3072-dim)
  - Position in document
  - Source reference
  - Metadata (section, page)

- **`conversation.py`**: Chat conversation model
  - User ID
  - Message history
  - Context references
  - Citations
  - Model used (Gemini version)

- **`document.py`**: Document metadata model
  - File information (name, size, type)
  - Processing status
  - Chunk references
  - User ID
  - Upload timestamp
  - Academic metadata (authors, journal, DOI)

- **`embedding.py`**: Embedding metadata
  - Vector ID
  - Model version (gemini-embedding-001)
  - Dimension count (768/1536/3072)
  - Quality metrics
  - Creation timestamp

- **`query.py`**: Search query model
  - Query text
  - Embedding used
  - Results returned
  - User feedback
  - Performance metrics

- **`user.py`**: User profile model
  - Firebase UID
  - Email, name
  - Role (admin, researcher, viewer)
  - Subscription tier
  - Usage limits
  - Preferences

### app/schemas/ - Pydantic Schemas
- **`document.py`**: Document schemas
  - Upload request validation
  - Document response formatting
  - Metadata validation

- **`query.py`**: Query schemas
  - Search request validation
  - Filter options
  - Pagination parameters

- **`response.py`**: Response schemas
  - Standard API responses
  - Error responses
  - Paginated results

- **`user.py`**: User schemas
  - Registration validation
  - Login validation
  - Profile updates

### app/services/ - Business Logic Layer
- **`auth_service.py`**: Authentication logic
  - Firebase token validation
  - Session management
  - Permission checks

- **`cache_service.py`**: Caching operations
  - Result caching
  - Cache invalidation
  - TTL management

- **`chat_service.py`**: Chat processing
  - Conversation management
  - Context window optimization (1M+ tokens)
  - Citation tracking

- **`document_processor.py`**: Document processing
  - Text extraction from PDFs/DOCX
  - Academic structure detection
  - Figure/table extraction (using Gemini multimodal)

- **`document_service.py`**: Document management
  - CRUD operations
  - Version control
  - Access control

- **`embedding_service.py`**: Embedding generation
  - Gemini embedding API calls
  - Batch processing
  - MRL dimension optimization
  - Caching strategies

- **`firebase.py`**: Firebase integration
  - Firebase Admin SDK operations
  - User sync
  - Notification handling

- **`gemini_service.py`**: Primary Gemini service
  - Gemini API client wrapper
  - Model selection logic
  - Prompt engineering
  - Response parsing
  - Error handling and retries

- **`llm_service.py`**: Abstract LLM interface
  - Unified interface for multiple providers
  - Fallback logic
  - Load balancing

- **`rag_service.py`**: RAG pipeline orchestration
  - Retrieval coordination
  - Context assembly
  - Generation with citations
  - Quality checks

- **`search_service.py`**: Search orchestration
  - Query processing
  - Multi-strategy search
  - Result ranking
  - Filter application

- **`user_service.py`**: User management
  - Profile CRUD
  - Usage tracking
  - Subscription management

- **`vector_service.py`**: Vector operations
  - Vector similarity search
  - Index management
  - Dimension optimization

- **`vector_store.py`**: Vector storage abstraction
  - MongoDB Atlas vector search
  - Batch operations
  - Index maintenance

- **`vertex_service.py`**: Google Vertex AI integration
  - Enterprise-grade Gemini access
  - VPC-SC compliance
  - Audit logging
  - Custom model deployment

### app/utils/ - Utilities
- **`chunking.py`**: Text chunking strategies
  - Semantic chunking
  - Academic section preservation
  - Overlap strategies
  - Token counting (for Gemini 8K context)

- **`document_parser.py`**: Document parsing
  - PDF text extraction
  - DOCX parsing
  - Academic metadata extraction
  - Citation detection

- **`firebase_auth.py`**: Firebase auth helpers
  - Token validation
  - User lookup
  - Custom claims

- **`gemini_helpers.py`**: Gemini-specific utilities
  - API rate limiting
  - Batch request optimization
  - Cost calculation
  - Prompt templates for academic tasks
  - MRL dimension scaling

- **`logger.py`**: Logging configuration
  - Structured logging
  - Log levels
  - File rotation
  - Cloud logging integration

- **`mongodb_helpers.py`**: MongoDB utilities
  - ObjectId conversion
  - Query building
  - Aggregation pipelines

- **`preprocessing.py`**: Text preprocessing
  - Cleaning academic text
  - Normalization
  - Stopword removal
  - STEM-specific handling

### backend/scripts/
- **`create_indexes.py`**: MongoDB index creation
  - Text indexes
  - Vector indexes (for Gemini 3072-dim)
  - Compound indexes
  - Performance optimization

- **`init_mongo.js`**: MongoDB initialization
  - Database creation
  - User setup
  - Collection creation
  - Replica set config

- **`seed_data.py`**: Test data seeding
  - Sample documents
  - Test users
  - Benchmark queries

### backend/tests/
- **`conftest.py`**: Pytest fixtures
  - Database fixtures
  - Mock services
  - Test client
  - Test data

- **`test_api.py`**: API endpoint tests
  - End-to-end tests
  - Response validation
  - Error cases

- **`test_auth.py`**: Authentication tests
  - Login flows
  - Token validation
  - Permission tests

- **`test_gemini.py`**: Gemini integration tests
  - Embedding generation
  - Chat completion
  - RAG pipeline validation
  - Cost tracking tests

- **`test_services.py`**: Service layer tests
  - Unit tests
  - Mocked dependencies
  - Edge cases

### Root backend files
- **`Dockerfile`**: Backend container definition
  - Multi-stage build
  - Dependency installation
  - Production optimization

- **`install_aras.ps1`**: Windows installation script
  - Environment setup
  - Dependency installation
  - Configuration

- **`pyproject.toml`**: Python project config
  - Dependencies
  - Tool configurations

- **`test_gemini.py`**: Standalone Gemini test
- **`test_installation.py`**: Installation verification

## 📁 docker/ - Docker Configuration

### nginx/
- **`nginx.conf`**: Nginx web server config
  - Reverse proxy
  - SSL termination
  - Load balancing
  - Static file serving

### Compose files
- **`docker-compose.mongo.yml`**: MongoDB-only compose
- **`docker-compose.prod.yml`**: Production compose
- **`docker-compose.yml`**: Development compose

## 📁 docs/ - Documentation

### api/
- **`openapi.yaml`**: OpenAPI specification
  - All endpoints documented
  - Request/response schemas
  - Authentication details

### architecture/
- **`mongo_firebase_architecture.md`**: Database architecture
- **`system_design.md`**: Overall system design

### deployment/
- **`deployment_guide.md`**: Production deployment
- **`mongodb_setup.md`**: MongoDB setup guide

### development/
- **`setup_guide.md`**: Development environment setup

### firebase/
- **`firebase_setup.md`**: Firebase configuration

### gemini/
- **`embedding_optimization.md`**: MRL dimension optimization strategies
- **`gemini_integration.md`**: Complete Gemini integration guide
- **`mrl_dimension_guide.md`**: Matryoshka Representation Learning guide
- **`prompt_engineering.md`**: Academic prompt templates for Gemini

### Root docs
- **`ARAS.md`**: Project overview
- **`ARCHITECTURE.png`**: Architecture diagram
- **`LICENSE`**: Project license
- **`PS.md`**: Problem statement
- **`Project Structure.md`**: Structure documentation
- **`README.md`**: Main readme
- **`Skeleton.md`**: Project skeleton
- **`user_guide.md`**: End-user documentation

## 📁 firebase/ - Firebase Configuration

- **`firebase.json`**: Firebase project config
- **`firestore.indexes.json`**: Firestore indexes
- **`firestore.rules`**: Firestore security rules
- **`serviceAccountKey.json.example`**: Service account template
- **`storage.rules`**: Storage security rules

## 📁 frontend/ - React Frontend

### public/
- **`firebase-messaging-sw.js`**: Firebase service worker for notifications
- **`index.html`**: Main HTML entry point
- **`manifest.json`**: PWA manifest

### src/components/Admin/
- **`SystemMetrics.jsx`**: System performance dashboard
- **`UserManagement.jsx`**: Admin user controls

### src/components/Auth/
- **`AuthGuard.jsx`**: Route protection component
- **`ForgotPassword.jsx`**: Password reset form
- **`Login.jsx`**: Login form
- **`Register.jsx`**: Registration form

### src/components/Chat/
- **`ChatHistory.jsx`**: Conversation history view
- **`ChatInput.jsx`**: Message input with file attachment
- **`ChatWindow.jsx`**: Main chat interface
- **`MessageBubble.jsx`**: Individual message display with citations

### src/components/Dashboard/
- **`ActivityFeed.jsx`**: Recent activity stream
- **`RecentDocuments.jsx`**: Recently accessed papers
- **`StatsCard.jsx`**: Usage statistics cards

### src/components/DocumentUpload/
- **`DocumentCard.jsx`**: Document preview card
- **`DocumentList.jsx`**: Document grid/list view
- **`UploadZone.jsx`**: Drag-drop file upload

### src/components/Layout/
- **`Footer.jsx`**: Page footer
- **`Navbar.jsx`**: Navigation bar
- **`Sidebar.jsx`**: Collapsible sidebar

### src/components/Search/
- **`Filters.jsx`**: Search filters (date, author, journal)
- **`ResultCard.jsx`**: Search result display
- **`ResultsList.jsx`**: Paginated results
- **`SearchBar.jsx`**: Search input with suggestions

### src/config/
- **`permissions.js`**: Role-based permissions
- **`routes.js`**: Route definitions

### src/contexts/
- **`AuthContext.jsx`**: Authentication state
- **`ChatContext.jsx`**: Chat state management
- **`ThemeContext.jsx`**: Dark/light theme

### src/hooks/
- **`useAuth.js`**: Authentication hook
- **`useChat.js`**: Chat operations hook
- **`useDocuments.js`**: Document management hook
- **`useFirebaseAuth.js`**: Firebase-specific auth
- **`useGemini.js`**: Gemini API interactions
- **`useSearch.js`**: Search functionality hook

### src/pages/
- **`Admin.jsx`**: Admin dashboard page
- **`Chat.jsx`**: Research assistant chat page
- **`Dashboard.jsx`**: Main user dashboard
- **`Documents.jsx`**: Document management page
- **`Profile.jsx`**: User profile page
- **`Search.jsx`**: Advanced search page

### src/services/api/
- **`auth.js`**: Auth API calls
- **`chat.js`**: Chat API integration
- **`documents.js`**: Document API calls
- **`index.js`**: API client setup
- **`search.js`**: Search API integration

### src/services/firebase/
- **`auth.js`**: Firebase auth methods
- **`config.js`**: Firebase initialization
- **`firestore.js`**: Firestore operations
- **`storage.js`**: File storage operations

### src/services/mongodb/
- **`api.js`**: Direct MongoDB API client

### src/styles/
- **`components.css`**: Component-specific styles
- **`firebase-ui.css`**: Firebase UI overrides
- **`index.css`**: Global styles
- **`tailwind.config.js`**: Tailwind configuration

### src/utils/
- **`constants.js`**: App constants
- **`firebase-helpers.js`**: Firebase utilities
- **`gemini-helpers.js`**: Gemini frontend utilities
- **`helpers.js`**: General utilities
- **`validators.js`**: Form validation

### Root frontend files
- **`App.jsx`**: Main app component
- **`firebase.js`**: Firebase initialization
- **`main.jsx`**: Entry point
- **`router.jsx`**: Route configuration
- **`Dockerfile`**: Frontend container
- **`package.json`**: NPM dependencies
- **`tailwind.config.js`**: Tailwind config
- **`vite.config.js`**: Vite build config

## 📁 ml_pipeline/ - Machine Learning Pipeline

### embedding_models/
- **`__init__.py`**: Package initialization
- **`gemini_embeddings.py`**: Gemini embedding implementation
  - `gemini-embedding-001` API calls
  - Batch processing
  - 8K token handling
  - Dimension scaling via MRL
- **`mongodb_vector_search.py`**: Vector search utilities
- **`sentence_transformer.py`**: Local embedding models
- **`embedding_optimizer.py`**: MRL optimization
  - Dimension reduction strategies
  - Performance testing
  - Cost optimization

### llm/
- **`__init__.py`**: Package initialization
- **`anthropic_integration.py`**: Claude API client
- **`gemini_integration.py`**: Primary Gemini LLM integration
  - Gemini 2.5 Pro for complex reasoning
  - Gemini 1.5 Pro for balanced tasks
  - Gemini 1.5 Flash for high throughput
  - Streaming support
  - Function calling
- **`huggingface_integration.py`**: HuggingFace models
- **`local_models.py`**: Local LLM deployment
- **`vertex_integration.py`**: Vertex AI enterprise

### mongodb_ml/
- **`__init__.py`**: Package initialization
- **`aggregations.py`**: ML aggregation pipelines
- **`gemini_indexes.py`**: MongoDB indexes for Gemini embeddings
- **`indexes.py`**: General ML indexes
- **`vector_search.py`**: Vector search implementation

### rag/
- **`__init__.py`**: Package initialization
- **`citation_extractor.py`**: Academic citation detection
- **`generation.py`**: Response generation with Gemini
- **`multimodal_extractor.py`**: Figure/table extraction using Gemini Vision
- **`reranking.py`**: Result reranking algorithms
- **`retrieval.py`**: Document retrieval strategies

### Root ML files
- **`requirements-ml.txt`**: ML-specific dependencies

## 📁 mongodb/ - MongoDB Configuration

### config/
- **`mongod.conf`**: MongoDB server config
- **`mongos.conf`**: MongoDB sharding config

### scripts/
- **`create-users.js`**: Database user creation
- **`enable-vector-search.js`**: Enable Atlas Vector Search
- **`init-replica.js`**: Replica set initialization
- **`optimize-gemini-indexes.js`**: Index optimization for Gemini

### Root MongoDB files
- **`Dockerfile`**: MongoDB container
- **`README.md`**: MongoDB setup guide
- **`docker-compose.mongo.yml`**: MongoDB compose

## 📁 monitoring/ - Observability

### grafana_dashboards/
- **`gemini_performance.json`**: Gemini API performance dashboard
- **`mongodb_dashboard.json`**: MongoDB metrics dashboard

### Root monitoring files
- **`alerts.yml`**: Alert rules for monitoring
- **`gemini_cost_tracking.py`**: Cost tracking utility
- **`logging_config.yaml`**: Centralized logging config
- **`prometheus.yml`**: Prometheus metrics collection

## 📁 notebooks/ - Jupyter Notebooks

- **`data_exploration.ipynb`**: Document data exploration
- **`embedding_experiments.ipynb`**: Embedding model testing
- **`gemini_benchmarks.ipynb`**: Gemini performance benchmarking
- **`rag_evaluation.ipynb`**: RAG pipeline evaluation

## 📁 scripts/ - Utility Scripts

- **`backup_mongodb.sh`**: MongoDB backup automation
- **`data_migration.py`**: Data migration between versions
- **`init_mongodb.sh`**: MongoDB initialization
- **`optimize_embedding_dimensions.py`**: MRL optimization testing
- **`setup_environment.sh`**: Dev environment setup
- **`setup_firebase.sh`**: Firebase project setup
- **`setup_gemini.sh`**: Gemini API key and model setup

## 📁 vector_db/ - Vector Database Integrations

- **`__init__.py`**: Package initialization
- **`chroma_integration.py`**: ChromaDB client
- **`mongodb_atlas.py`**: MongoDB Atlas Vector Search
- **`pinecone_integration.py`**: Pinecone client
- **`qdrant_integration.py`**: Qdrant client

---

This comprehensive file system documentation shows how each component contributes to the academic RAG system powered by Google's Gemini AI, from the frontend user interface through the backend services to the ML pipeline that delivers intelligent research assistance.
