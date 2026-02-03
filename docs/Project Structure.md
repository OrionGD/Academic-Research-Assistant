# **Complete Project Structure Documentation**

## **Root Directory Structure**

### **📁 .github/ - GitHub Configuration**
Contains GitHub workflows and templates for CI/CD automation and collaboration standards.

**workflows/ci-cd.yml**: Continuous integration and deployment pipeline. Runs tests, builds Docker images, and deploys to staging/production environments on code changes.

**workflows/docker-build.yml**: Automated Docker image building and publishing to container registry. Includes vulnerability scanning and multi-architecture support.

**workflows/tests.yml**: Automated test execution on pull requests. Runs unit tests, integration tests, and generates coverage reports.

**pull_request_template.md**: Standard template for pull requests ensuring code quality and documentation consistency.

### **📁 backend/ - FastAPI Application Backend**
Complete backend service implementing the RAG system with FastAPI, MongoDB, and Firebase integration.

**requirements.txt**: Python dependencies including FastAPI, MongoDB drivers, Firebase SDK, ML libraries, and development tools.

**Dockerfile**: Container configuration for the backend service. Multi-stage build for optimized production images.

**pyproject.toml**: Modern Python project configuration with tool settings, metadata, and dependency management.

### **📁 backend/app/ - Application Source Code**
Main application directory containing all source code organized by architectural layers.

### **📁 backend/app/api/v1/ - API Endpoints Layer**
Contains all RESTful API endpoints organized by version. Each file handles specific domain operations with proper validation and error handling.

**auth.py**: Handles Firebase authentication integration. Provides endpoints for user login, registration, token refresh, and profile management.

**documents.py**: Manages document lifecycle operations. Supports PDF, DOCX, and TXT uploads with chunking, metadata extraction, and document CRUD operations.

**search.py**: Implements search functionality with multiple strategies. Provides vector similarity search, keyword search, hybrid search, and filtering capabilities.

**chat.py**: Processes research queries through the RAG pipeline. Manages conversation context, streaming responses, and citation tracking.

**embeddings.py**: Handles embedding-related operations. Provides endpoints for embedding generation, vector management, and embedding quality analysis.

**admin.py**: Administrative endpoints for system management. Includes user administration, system metrics, and maintenance operations.

### **📁 backend/app/core/ - Core Configuration Layer**
Central configuration and setup modules that initialize and manage application dependencies.

**config.py**: Application configuration management using Pydantic settings. Loads environment variables, defines application settings, and provides type-safe configuration access.

**security.py**: Security middleware and utilities. Implements Firebase authentication, JWT token handling, CORS configuration, and rate limiting.

**database.py**: MongoDB database connection management. Handles connection pooling, indexing, and provides async database operations.

**cache.py**: Redis caching implementation. Manages cache configuration, connection pooling, and provides caching utilities for performance optimization.

**firebase.py**: Firebase Admin SDK integration. Initializes Firebase services, handles token verification, and provides Firebase utilities.

### **📁 backend/app/models/ - Data Models Layer**
MongoDB data models and Pydantic schemas defining the data structure and validation rules.

**user.py**: User data model with Firebase integration. Defines user roles, subscription plans, and user metadata for the academic context.

**document.py**: Document model representing uploaded research papers. Includes metadata extraction, file information, and processing status.

**chunk.py**: Text chunk model with vector embeddings. Stores chunked content with embeddings for semantic search and academic context preservation.

**embedding.py**: Embedding model storing vector representations. Manages embedding metadata, model versions, and quality metrics.

**query.py**: Search query history model. Stores user queries, results, and interaction data for analytics and improvement.

**conversation.py**: Chat conversation model. Manages multi-turn conversations with context preservation and citation tracking.

### **📁 backend/app/services/ - Business Logic Layer**
Service classes implementing business logic and orchestrating different components of the RAG system.

**auth_service.py**: Authentication service handling Firebase integration. Manages user sessions, token generation, and authentication workflows.

**document_service.py**: Document processing service. Orchestrates parsing, chunking, embedding generation, and document management workflows.

**embedding_service.py**: Embedding generation service. Uses sentence transformers and OpenAI models to create vector representations of text.

**vector_service.py**: Vector search service. Implements MongoDB Atlas vector search with similarity scoring and filtering capabilities.

**rag_service.py**: RAG pipeline service. Coordinates retrieval, generation, and post-processing for intelligent question answering.

**llm_service.py**: LLM integration service. Connects to OpenAI, Anthropic, and HuggingFace models for text generation with academic optimization.

**user_service.py**: User management service. Handles user profiles, preferences, and usage tracking for personalized experiences.

**search_service.py**: Search orchestration service. Combines vector search, keyword search, and filtering for comprehensive research discovery.

### **📁 backend/app/utils/ - Utilities Layer**
Reusable utility functions and helper modules for common operations across the application.

**document_parser.py**: Specialized parsers for academic document formats. Extracts text with layout preservation, detects citations, and recognizes mathematical equations.

**chunking.py**: Advanced text segmentation strategies. Implements semantic chunking for academic content, preserving section boundaries and academic structure.

**preprocessing.py**: Text normalization and cleaning utilities. Handles academic-specific formatting, removes irrelevant content, and prepares text for embedding.

**logger.py**: Centralized logging configuration. Provides structured logging with different levels, context preservation, and monitoring integration.

**firebase_auth.py**: Firebase authentication helpers. Provides utilities for token validation, user lookup, and Firebase operations.

**mongodb_helpers.py**: MongoDB utility functions. Includes helpers for ObjectId conversion, query building, and aggregation pipeline construction.

### **📁 backend/app/schemas/ - Pydantic Schemas Layer**
Request/response schemas for API validation and serialization, ensuring type safety and data consistency.

**user.py**: User-related schemas for registration, login, profile updates, and user responses with proper validation rules.

**document.py**: Document schemas for upload requests, metadata updates, search responses, and document status tracking.

**query.py**: Query schemas for search requests, filter options, pagination, and search result formatting.

**response.py**: Standardized response schemas for API responses. Includes error responses, paginated results, and standardized formats.

### **📁 backend/tests/ - Test Suite**
Comprehensive test suite following industry standards with proper mocking and isolation.

**conftest.py**: Shared pytest fixtures providing database sessions, mocked services, test data, and configuration for all test modules.

**test_api.py**: End-to-end API tests with mocked dependencies. Tests request validation, error handling, and response formats for all endpoints.

**test_services.py**: Unit tests for business logic services. Tests service layer in isolation with mocked dependencies and edge case coverage.

**test_auth.py**: Authentication-specific tests covering Firebase integration, token validation, and security scenarios.

### **📁 backend/scripts/ - MongoDB Scripts**
Utility scripts for MongoDB setup, maintenance, and data operations.

**init_mongo.js**: MongoDB initialization script. Sets up replica sets, creates users, and configures initial database structure.

**create_indexes.py**: Index creation script. Creates optimal indexes for performance and enables vector search capabilities.

**seed_data.py**: Data seeding script. Populates the database with test data for development and demonstration purposes.

## **Frontend Directory Structure**

### **📁 frontend/ - React Application Frontend**
Modern React application with Firebase authentication and responsive design for academic researchers.

**package.json**: Node.js dependencies and scripts. Includes React, Firebase SDK, UI libraries, and build tools configuration.

**Dockerfile**: Frontend container configuration. Optimized build process with Nginx for serving static files.

**vite.config.js**: Vite build configuration. Provides fast development server, hot module replacement, and production optimization.

**tailwind.config.js**: Tailwind CSS configuration. Defines custom design system, colors, and responsive breakpoints for academic interface.

### **📁 frontend/public/ - Static Assets**
Publicly accessible static files and assets served directly by the web server.

**index.html**: Main HTML entry point. Contains base structure, meta tags, and script references for the React application.

**manifest.json**: Web app manifest for PWA support. Defines app metadata, icons, and offline capabilities.

**firebase-messaging-sw.js**: Firebase Cloud Messaging service worker. Handles push notifications and background messaging.

### **📁 frontend/src/ - Source Code**
Main source code directory containing all React components, services, and utilities.

### **📁 frontend/src/components/ - React Components**
Reusable UI components organized by functionality for modular development.

**Layout/**: Layout components defining the overall application structure and navigation.

**Auth/**: Authentication components for login, registration, password reset, and authentication state management.

**DocumentUpload/**: Document management components for file upload, document listing, and metadata viewing.

**Search/**: Search interface components including search bars, filters, and result displays.

**Chat/**: Chat interface components for research queries, conversation management, and citation viewing.

**Dashboard/**: Dashboard components showing statistics, recent activity, and system metrics.

**Admin/**: Administrative components for user management, system configuration, and analytics.

### **📁 frontend/src/pages/ - Page Components**
Top-level page components representing different routes in the application.

**Dashboard.jsx**: Main dashboard page showing overview statistics, recent documents, and quick actions.

**Documents.jsx**: Document management page for uploading, browsing, and managing research papers.

**Search.jsx**: Advanced search page with multiple search modes, filters, and result visualization.

**Chat.jsx**: Research assistant chat interface for asking questions and exploring documents conversationally.

**Profile.jsx**: User profile page for managing account settings, preferences, and usage statistics.

**Admin.jsx**: Administration panel for system management, user administration, and analytics.

### **📁 frontend/src/services/ - Service Layer**
Service modules for API communication, Firebase integration, and business logic.

**api/**: HTTP client configuration and API service modules for backend communication.

**firebase/**: Firebase SDK integration modules for authentication, Firestore, and storage operations.

**mongodb/**: MongoDB API client utilities for direct database operations when needed.

### **📁 frontend/src/contexts/ - React Contexts**
React context providers for global state management across the application.

**AuthContext.jsx**: Authentication context managing user state, login status, and authentication methods.

**ThemeContext.jsx**: Theme context for dark/light mode switching and consistent styling.

**ChatContext.jsx**: Chat context managing conversation state, history, and streaming responses.

### **📁 frontend/src/hooks/ - Custom React Hooks**
Reusable custom hooks for common functionality and state management patterns.

**useAuth.js**: Authentication hook providing user state, login/logout methods, and token management.

**useFirebaseAuth.js**: Firebase-specific authentication hook for Firebase SDK integration.

**useDocuments.js**: Document management hook for CRUD operations and document state.

**useSearch.js**: Search functionality hook for executing searches and managing search state.

**useChat.js**: Chat functionality hook for managing conversations and streaming responses.

### **📁 frontend/src/utils/ - Utility Functions**
Helper functions and utilities for data transformation, validation, and common operations.

**helpers.js**: General utility functions for date formatting, string manipulation, and common operations.

**validators.js**: Form validation utilities for user input validation and data integrity.

**constants.js**: Application constants for configuration, error messages, and static values.

**firebase-helpers.js**: Firebase-specific utility functions for data transformation and SDK helpers.

### **📁 frontend/src/styles/ - Styling Assets**
CSS and styling configuration for the application's visual design.

**tailwind.config.js**: Tailwind CSS configuration with custom design tokens and component extensions.

**index.css**: Global CSS styles, Tailwind directives, and custom base styles.

**components.css**: Component-specific CSS styles for custom UI components.

**firebase-ui.css**: Styling for Firebase UI components and authentication flows.

### **📁 frontend/src/config/ - Configuration Files**
Application configuration and routing definitions.

**routes.js**: Route configuration defining all application routes and their components.

**permissions.js**: Permission definitions and role-based access control rules.

## **Machine Learning Pipeline**

### **📁 ml_pipeline/ - ML/NLP Pipeline**
Machine learning components for embeddings, LLM integration, and RAG operations.

**requirements-ml.txt**: Machine learning specific dependencies including PyTorch, transformers, and ML libraries.

### **📁 ml_pipeline/embedding_models/ - Embedding Models**
Embedding generation models and utilities for text vectorization.

**sentence_transformer.py**: Sentence transformer implementations for academic text embedding with domain-specific fine-tuning.

**openai_embeddings.py**: OpenAI embedding API integration with caching and batch processing.

**mongodb_vector_search.py**: MongoDB-specific vector search implementations and optimizations.

### **📁 ml_pipeline/llm/ - Large Language Models**
LLM integration modules for different model providers and local deployments.

**openai_integration.py**: OpenAI GPT model integration with academic prompt engineering and response formatting.

**anthropic_integration.py**: Anthropic Claude model integration with research-specific optimizations.

**huggingface_integration.py**: HuggingFace model integration for local and hosted LLMs.

**local_models.py**: Local LLM deployment with quantization and optimization for academic use cases.

### **📁 ml_pipeline/rag/ - RAG Pipeline**
Retrieval-Augmented Generation pipeline components for intelligent question answering.

**retrieval.py**: Advanced retrieval strategies including dense retrieval, sparse retrieval, and hybrid approaches.

**generation.py**: Response generation with context integration, citation tracking, and academic tone.

**reranking.py**: Result reranking algorithms for improving retrieval quality and relevance.

**citation_extractor.py**: Citation extraction and validation for academic source attribution.

### **📁 ml_pipeline/mongodb_ml/ - MongoDB ML Integration**
MongoDB-specific machine learning utilities and optimizations.

**vector_search.py**: Advanced vector search implementations using MongoDB Atlas vector search.

**aggregations.py**: Complex aggregation pipelines for analytics and ML feature extraction.

**indexes.py**: ML-specific index configurations and optimization strategies.

## **Database & Storage**

### **📁 mongodb/ - MongoDB Setup & Configuration**
MongoDB deployment configuration, scripts, and management utilities.

**Dockerfile**: MongoDB container configuration with replica set support and optimized settings.

**docker-compose.mongo.yml**: MongoDB-specific Docker Compose configuration for development and testing.

### **📁 mongodb/scripts/ - MongoDB Scripts**
Initialization and maintenance scripts for MongoDB deployment.

**init-replica.js**: Replica set initialization script with user creation and basic configuration.

**create-users.js**: User and role management scripts for database access control.

**enable-vector-search.js**: Vector search enablement script for MongoDB Atlas configuration.

### **📁 mongodb/config/ - Configuration Files**
MongoDB server configuration files for different deployment scenarios.

**mongod.conf**: MongoDB daemon configuration with security, storage, and network settings.

**mongos.conf**: MongoDB sharding router configuration for scaled deployments.

### **📁 firebase/ - Firebase Configuration**
Firebase project configuration files for authentication, storage, and Firestore.

**firebase.json**: Firebase project configuration with hosting, functions, and emulator settings.

**firestore.indexes.json**: Firestore database index definitions for query optimization.

**firestore.rules**: Firestore security rules for data access control and validation.

**storage.rules**: Firebase Storage security rules for file access control.

**serviceAccountKey.json.example**: Example service account key file template for Firebase Admin SDK.

### **📁 vector_db/ - Vector Database Integration**
Vector database client implementations and integration utilities.

**mongodb_atlas.py**: MongoDB Atlas vector search integration with optimized query patterns.

**pinecone_integration.py**: Pinecone vector database integration for scalable vector storage.

**chroma_integration.py**: ChromaDB integration for local vector storage and retrieval.

**qdrant_integration.py**: Qdrant vector database integration with advanced filtering capabilities.

### **📁 storage/ - Document Storage**
File storage abstraction layer supporting multiple storage backends.

**local_storage.py**: Local filesystem storage implementation for development and small-scale deployments.

**cloud_storage.py**: Cloud storage integration for Firebase Storage, S3, and Azure Blob Storage.

**file_manager.py**: Unified file management interface with caching, versioning, and lifecycle management.

## **DevOps & Infrastructure**

### **📁 docker/ - Docker Configuration**
Container orchestration and deployment configuration files.

**docker-compose.yml**: Main Docker Compose configuration for local development with all services.

**docker-compose.prod.yml**: Production Docker Compose configuration with optimizations and scaling.

**docker-compose.mongo.yml**: MongoDB-specific Docker Compose configuration for database services.

### **📁 docker/nginx/ - Nginx Configuration**
Reverse proxy configuration for production deployments.

**nginx.conf**: Nginx configuration with SSL termination, load balancing, and security headers.

### **📁 docs/ - Documentation**
Comprehensive documentation for developers, users, and administrators.

**api/**: API documentation with OpenAPI specifications and endpoint references.

**architecture/**: System architecture diagrams, design decisions, and technical specifications.

**deployment/**: Deployment guides for different environments and scaling strategies.

**firebase/**: Firebase-specific setup and configuration documentation.

**development/**: Development environment setup and contribution guidelines.

**user/**: User guides, tutorials, and feature documentation for end users.

### **📁 scripts/ - Utility Scripts**
Automation scripts for setup, deployment, and maintenance tasks.

**setup_environment.sh**: Environment setup script for development and production deployment.

**init_mongodb.sh**: MongoDB initialization script with replica set configuration.

**setup_firebase.sh**: Firebase project setup and configuration script.

**data_migration.py**: Data migration utilities for database schema changes and data transformations.

**backup_mongodb.sh**: MongoDB backup and restoration scripts for data protection.

**health_check.py**: System health check utilities for monitoring and alerting.

### **📁 monitoring/ - Monitoring & Observability**
Monitoring configuration for production deployment observability.

**prometheus.yml**: Prometheus monitoring configuration for metrics collection.

**grafana_dashboards/**: Grafana dashboard definitions for system monitoring and analytics.

**logging_config.yaml**: Centralized logging configuration with structured logging and log aggregation.

**alerts.yml**: Alert rules and notification configurations for system monitoring.

### **📁 notebooks/ - Jupyter Notebooks**
Experimental notebooks for data exploration, model testing, and analysis.

**embedding_experiments.ipynb**: Notebooks for testing embedding models and evaluating quality.

**rag_evaluation.ipynb**: RAG pipeline evaluation notebooks with metrics and analysis.

**data_exploration.ipynb**: Data exploration notebooks for understanding document structure and content.

## **Root Configuration Files**

### **Root Configuration Files**
Top-level configuration and documentation files for the entire project.

**.env.example**: Environment variable template with all required configuration values.

**.gitignore**: Git ignore rules for excluding build artifacts, dependencies, and sensitive files.

**.dockerignore**: Docker ignore rules for optimizing image builds and reducing size.

**.pre-commit-config.yaml**: Pre-commit hooks configuration for code quality and security checks.

**pyproject.toml**: Modern Python project configuration with tool settings and metadata.

**README.md**: Main project documentation with overview, setup instructions, and features.

**LICENSE**: Project license file defining usage terms and distribution rights.

**Makefile**: Build automation commands for common development and deployment tasks.

**docker-compose.yml**: Root Docker Compose configuration for running the complete system.

**requirements.txt**: Root Python dependencies for the entire project ecosystem.

This comprehensive structure provides a scalable, maintainable, and production-ready academic RAG system with clear separation of concerns, modern technology choices, and thorough documentation for all components.