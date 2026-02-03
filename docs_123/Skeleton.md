ARAS/
├── 📁 .github/                          # GitHub workflows
│   ├── workflows/
│   │   ├── ci-cd.yml
│   │   ├── docker-build.yml
│   │   └── tests.yml
│   └── pull_request_template.md
│
├── 📁 backend/                         # FastAPI Backend with MongoDB
│   ├── 📁 app/
│   │   ├── 📁 api/                    # API endpoints
│   │   │   ├── 📁 v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py           # Firebase auth endpoints
│   │   │   │   ├── documents.py      # Document CRUD
│   │   │   │   ├── search.py         # Vector/search endpoints
│   │   │   │   ├── chat.py           # RAG chat endpoints
│   │   │   │   ├── embeddings.py     # Embedding management
│   │   │   │   └── admin.py          # Admin endpoints
│   │   │   ├── __init__.py
│   │   │   └── dependencies.py       # FastAPI dependencies
│   │   │
│   │   ├── 📁 core/                   # Core configurations
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # App configurations
│   │   │   ├── security.py           # Firebase auth integration
│   │   │   ├── database.py           # MongoDB connection
│   │   │   ├── cache.py              # Redis cache
│   │   │   └── firebase.py           # Firebase admin setup
│   │   │
│   │   ├── 📁 models/                 # MongoDB models
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User model (MongoDB)
│   │   │   ├── document.py           # Document model
│   │   │   ├── chunk.py              # Text chunks model
│   │   │   ├── embedding.py          # Embedding model
│   │   │   ├── query.py              # Query history model
│   │   │   └── conversation.py       # Chat conversation model
│   │   │
│   │   ├── 📁 services/               # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py       # Firebase auth service
│   │   │   ├── document_service.py   # Document processing
│   │   │   ├── embedding_service.py  # Embedding generation
│   │   │   ├── vector_service.py     # Vector DB operations
│   │   │   ├── rag_service.py        # RAG pipeline
│   │   │   ├── llm_service.py        # LLM interactions
│   │   │   ├── user_service.py       # User management
│   │   │   ├── search_service.py     # Search operations
│   │   │   └── cache_service.py      # Redis operations
│   │   │
│   │   ├── 📁 utils/                  # Utilities
│   │   │   ├── __init__.py
│   │   │   ├── document_parser.py    # PDF/text parsing
│   │   │   ├── chunking.py           # Text chunking
│   │   │   ├── preprocessing.py      # Text normalization
│   │   │   ├── logger.py             # Logging setup
│   │   │   ├── firebase_auth.py      # Firebase auth helpers
│   │   │   └── mongodb_helpers.py    # MongoDB helpers
│   │   │
│   │   ├── 📁 schemas/                # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User schemas
│   │   │   ├── document.py           # Document schemas
│   │   │   ├── query.py              # Query schemas
│   │   │   └── response.py           # Response schemas
│   │   │
│   │   ├── __init__.py
│   │   └── main.py                   # FastAPI app
│   │
│   ├── 📁 tests/                      # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_api.py
│   │   ├── test_services.py
│   │   └── test_auth.py
│   │
│   ├── 📁 scripts/                    # MongoDB scripts
│   │   ├── init_mongo.js
│   │   ├── create_indexes.py
│   │   └── seed_data.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── .env.example
│
├── 📁 frontend/                       # React + Firebase Auth Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── firebase-messaging-sw.js  # Firebase messaging
│   │
│   ├── src/
│   │   ├── 📁 components/            # React components
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── AuthGuard.jsx
│   │   │   ├── DocumentUpload/
│   │   │   │   ├── UploadZone.jsx
│   │   │   │   ├── DocumentList.jsx
│   │   │   │   └── DocumentCard.jsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── Filters.jsx
│   │   │   │   ├── ResultsList.jsx
│   │   │   │   └── ResultCard.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   └── ChatHistory.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── RecentDocuments.jsx
│   │   │   │   └── ActivityFeed.jsx
│   │   │   └── Admin/
│   │   │       ├── UserManagement.jsx
│   │   │       └── SystemMetrics.jsx
│   │   │
│   │   ├── 📁 pages/                # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Admin.jsx
│   │   │
│   │   ├── 📁 services/             # API & Firebase services
│   │   │   ├── api/
│   │   │   │   ├── index.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── documents.js
│   │   │   │   ├── search.js
│   │   │   │   └── chat.js
│   │   │   ├── firebase/
│   │   │   │   ├── config.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── firestore.js
│   │   │   │   └── storage.js
│   │   │   └── mongodb/
│   │   │       └── api.js
│   │   │
│   │   ├── 📁 contexts/            # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ChatContext.jsx
│   │   │
│   │   ├── 📁 hooks/              # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useFirebaseAuth.js
│   │   │   ├── useDocuments.js
│   │   │   ├── useSearch.js
│   │   │   └── useChat.js
│   │   │
│   │   ├── 📁 utils/              # Frontend utilities
│   │   │   ├── helpers.js
│   │   │   ├── validators.js
│   │   │   ├── constants.js
│   │   │   └── firebase-helpers.js
│   │   │
│   │   ├── 📁 styles/             # Styling (Tailwind/CSS)
│   │   │   ├── tailwind.config.js
│   │   │   ├── index.css
│   │   │   ├── components.css
│   │   │   └── firebase-ui.css
│   │   │
│   │   ├── 📁 config/             # Configuration
│   │   │   ├── routes.js
│   │   │   └── permissions.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── firebase.js
│   │   └── router.jsx
│   │
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.local
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── 📁 ml_pipeline/                   # ML/NLP pipeline
│   ├── 📁 embedding_models/
│   │   ├── __init__.py
│   │   ├── sentence_transformer.py
│   │   ├── openai_embeddings.py
│   │   └── mongodb_vector_search.py
│   │
│   ├── 📁 llm/
│   │   ├── __init__.py
│   │   ├── openai_integration.py
│   │   ├── anthropic_integration.py
│   │   ├── huggingface_integration.py
│   │   └── local_models.py
│   │
│   ├── 📁 rag/
│   │   ├── __init__.py
│   │   ├── retrieval.py
│   │   ├── generation.py
│   │   ├── reranking.py
│   │   └── citation_extractor.py
│   │
│   ├── 📁 mongodb_ml/               # MongoDB for ML
│   │   ├── __init__.py
│   │   ├── vector_search.py
│   │   ├── aggregations.py
│   │   └── indexes.py
│   │
│   └── requirements-ml.txt
│
├── 📁 mongodb/                       # MongoDB setup
│   ├── 📁 scripts/
│   │   ├── init-replica.js
│   │   ├── create-users.js
│   │   └── enable-vector-search.js
│   │
│   ├── 📁 config/
│   │   ├── mongod.conf
│   │   └── mongos.conf
│   │
│   ├── Dockerfile
│   ├── docker-compose.mongo.yml
│   └── README.md
│
├── 📁 firebase/                      # Firebase configuration
│   ├── firebase.json
│   ├── firestore.indexes.json
│   ├── firestore.rules
│   ├── storage.rules
│   └── serviceAccountKey.json.example
│
├── 📁 vector_db/                     # Vector database (MongoDB Atlas)
│   ├── __init__.py
│   ├── mongodb_atlas.py
│   ├── pinecone_integration.py
│   ├── chroma_integration.py
│   └── qdrant_integration.py
│
├── 📁 docker/                        # Docker configurations
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── docker-compose.mongo.yml
│   └── nginx/
│       └── nginx.conf
│
├── 📁 docs/                          # Documentation
│   ├── api/
│   │   ├── __init__.py
│   │   └── openapi.yaml
│   ├── architecture/
│   │   ├── __init__.py
│   │   ├── system_design.md
│   │   └── mongo_firebase_architecture.md
│   ├── deployment/
│   │   ├── __init__.py
│   │   ├── deployment_guide.md
│   │   └── mongodb_setup.md
│   ├── firebase/
│   │   ├── __init__.py
│   │   └── firebase_setup.md
│   └── development/
│       └── setup_guide.md
│
├── 📁 scripts/                       # Utility scripts
│   ├── setup_environment.sh
│   ├── init_mongodb.sh
│   ├── setup_firebase.sh
│   ├── data_migration.py
│   └── backup_mongodb.sh
│
├── 📁 monitoring/                    # Monitoring
│   ├── prometheus.yml
│   ├── grafana_dashboards/
│   │   └── mongodb_dashboard.json
│   ├── logging_config.yaml
│   └── alerts.yml
│
├── .env.example
├── .gitignore
├── .dockerignore
├── .pre-commit-config.yaml
├── pyproject.toml
├── README.md
├── LICENSE
├── Makefile
└── docker-compose.yml