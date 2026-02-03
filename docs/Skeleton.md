ARAS/
├── 📁 .github/                          # GitHub workflows
│   ├── workflows/
│   │   ├── ci-cd.yml
│   │   ├── docker-build.yml
│   │   └── tests.yml
│   └── pull_request_template.md
│
backend/
├── Dockerfile
├── requirements.txt
├── pyproject.toml
├── .env.example
├── uploads/                    # File upload directory
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration settings
│   │   ├── dependencies.py     # FastAPI dependencies
│   │   └── security.py         # Security utilities
│   ├── db/
│   │   ├── __init__.py
│   │   └── mongodb.py          # MongoDB connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py             # Base models
│   │   ├── user.py             # User models
│   │   └── document.py         # Document models
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py     # Authentication endpoints
│   │           ├── documents.py # Document management
│   │           ├── search.py   # Search endpoints
│   │           ├── chat.py     # Chat endpoints
│   │           ├── embeddings.py # Embedding endpoints
│   │           └── admin.py    # Admin endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── firebase.py         # Firebase service
│   │   ├── document_processor.py # Document processing
│   │   ├── embedding_service.py # Embedding service
│   │   ├── search_service.py   # Search service
│   │   ├── chat_service.py     # Chat service
│   │   └── vector_store.py     # Vector store service
│   └── middleware/
│       ├── __init__.py
│       ├── auth_middleware.py  # Auth middleware
│       └── logging_middleware.py # Logging middleware
├── tests/                      # Test directory
│   ├── __init__.py
│   ├── test_api.py
│   └── test_services.py
└── scripts/                    # Utility scripts
|    ├── __init__.py
|   └── init_db.py              # Database initialization
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