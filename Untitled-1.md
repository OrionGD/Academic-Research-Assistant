SARA
├── 📁 .github
│   ├── 📁 workflows
│   │   ├── ⚙️ ci-cd.yml
│   │   ├── ⚙️ docker-build.yml
│   │   └── ⚙️ tests.yml
│   └── 📝 pull_request_template.md
├── 📁 backend
│   ├── 📁 app
│   │   ├── 📁 api
│   │   │   ├── 📁 v1
│   │   │   │   ├── 📁 endpoint
│   │   │   │   │   ├── 🐍 admin.py
│   │   │   │   │   ├── 🐍 auth.py
│   │   │   │   │   ├── 🐍 chat.py
│   │   │   │   │   ├── 🐍 documents.py
│   │   │   │   │   ├── 🐍 embeddings.py
│   │   │   │   │   └── 🐍 search.py
│   │   │   │   ├── 🐍 __init__.py
│   │   │   │   └── 🐍 router.py
│   │   │   ├── 🐍 __init__.py
│   │   │   └── 🐍 dependencies.py
│   │   ├── 📁 core
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 cache.py
│   │   │   ├── 🐍 config.py
│   │   │   ├── 🐍 database.py
│   │   │   ├── 🐍 dependencies.py
│   │   │   ├── 🐍 firebase.py
│   │   │   ├── 🐍 gemini_config.py
│   │   │   └── 🐍 security.py
│   │   ├── 📁 db
│   │   │   └── 🐍 mongodb.py
│   │   ├── 📁 middleware
│   │   │   ├── 🐍 auth_middleware.py
│   │   │   └── 🐍 logging_middleware.py
│   │   ├── 📁 models
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 base.py
│   │   │   ├── 🐍 chunk.py
│   │   │   ├── 🐍 conversation.py
│   │   │   ├── 🐍 document.py
│   │   │   ├── 🐍 embedding.py
│   │   │   ├── 🐍 query.py
│   │   │   └── 🐍 user.py
│   │   ├── 📁 schemas
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 document.py
│   │   │   ├── 🐍 query.py
│   │   │   ├── 🐍 response.py
│   │   │   └── 🐍 user.py
│   │   ├── 📁 services
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 auth_service.py
│   │   │   ├── 🐍 cache_service.py
│   │   │   ├── 🐍 chat_service.py
│   │   │   ├── 🐍 document_processor.py
│   │   │   ├── 🐍 document_service.py
│   │   │   ├── 🐍 embedding_service.py
│   │   │   ├── 🐍 firebase.py
│   │   │   ├── 🐍 gemini_service.py
│   │   │   ├── 🐍 llm_service.py
│   │   │   ├── 🐍 rag_service.py
│   │   │   ├── 🐍 search_service.py
│   │   │   ├── 🐍 user_service.py
│   │   │   ├── 🐍 vector_service.py
│   │   │   ├── 🐍 vector_store.py
│   │   │   └── 🐍 vertex_service.py
│   │   ├── 📁 utils
│   │   │   ├── 🐍 __init__.py
│   │   │   ├── 🐍 chunking.py
│   │   │   ├── 🐍 document_parser.py
│   │   │   ├── 🐍 firebase_auth.py
│   │   │   ├── 🐍 gemini_helpers.py
│   │   │   ├── 🐍 logger.py
│   │   │   ├── 🐍 mongodb_helpers.py
│   │   │   └── 🐍 preprocessing.py
│   │   ├── 🐍 __init__.py
│   │   └── 🐍 main.py
│   ├── 📁 scripts
│   │   ├── 🐍 create_indexes.py
│   │   ├── 📄 init_mongo.js
│   │   └── 🐍 seed_data.py
│   ├── 📁 tests
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 conftest.py
│   │   ├── 🐍 test_api.py
│   │   ├── 🐍 test_auth.py
│   │   ├── 🐍 test_gemini.py
│   │   └── 🐍 test_services.py
│   ├── 🐳 Dockerfile
│   ├── 📄 install_aras.ps1
│   ├── ⚙️ pyproject.toml
│   ├── 🐍 test_gemini.py
│   └── 🐍 test_installation.py
├── 📁 docker
│   ├── 📁 nginx
│   │   └── ⚙️ nginx.conf
│   ├── ⚙️ docker-compose.mongo.yml
│   ├── ⚙️ docker-compose.prod.yml
│   └── ⚙️ docker-compose.yml
├── 📁 docs
│   ├── 📁 api
│   │   ├── 🐍 __init__.py
│   │   └── ⚙️ openapi.yaml
│   ├── 📁 architecture
│   │   ├── 🐍 __init__.py
│   │   ├── 📝 mongo_firebase_architecture.md
│   │   └── 📝 system_design.md
│   ├── 📁 deployment
│   │   ├── 🐍 __init__.py
│   │   ├── 📝 deployment_guide.md
│   │   └── 📝 mongodb_setup.md
│   ├── 📁 development
│   │   ├── 🐍 __init__.py
│   │   └── 📝 setup_guide.md
│   ├── 📁 firebase
│   │   ├── 🐍 __init__.py
│   │   └── 📝 firebase_setup.md
│   ├── 📁 gemini
│   │   ├── 🐍 __init__.py
│   │   ├── 📝 embedding_optimization.md
│   │   ├── 📝 gemini_integration.md
│   │   ├── 📝 mrl_dimension_guide.md
│   │   └── 📝 prompt_engineering.md
│   ├── 📝 ARAS.md
│   ├── 🖼️ ARCHITECTURE.png
│   ├── 📄 LICENSE
│   ├── 📝 PS.md
│   ├── 📝 Project Structure.md
│   ├── 📝 README.md
│   ├── 📝 Skeleton.md
│   ├── 📝 Untitled-1.md
│   └── 📝 user_guide.md
├── 📁 firebase
│   ├── ⚙️ firebase.json
│   ├── ⚙️ firestore.indexes.json
│   ├── 📄 firestore.rules
│   ├── 📄 serviceAccountKey.json.example
│   └── 📄 storage.rules
├── 📁 frontend
│   ├── 📁 public
│   │   ├── 📄 firebase-messaging-sw.js
│   │   ├── 🌐 index.html
│   │   └── ⚙️ manifest.json
│   ├── 📁 src
│   │   ├── 📁 components
│   │   │   ├── 📁 Admin
│   │   │   │   ├── 📄 SystemMetrics.jsx
│   │   │   │   └── 📄 UserManagement.jsx
│   │   │   ├── 📁 Auth
│   │   │   │   ├── 📄 AuthGuard.jsx
│   │   │   │   ├── 📄 ForgotPassword.jsx
│   │   │   │   ├── 📄 Login.jsx
│   │   │   │   └── 📄 Register.jsx
│   │   │   ├── 📁 Chat
│   │   │   │   ├── 📄 ChatHistory.jsx
│   │   │   │   ├── 📄 ChatInput.jsx
│   │   │   │   ├── 📄 ChatWindow.jsx
│   │   │   │   └── 📄 MessageBubble.jsx
│   │   │   ├── 📁 Dashboard
│   │   │   │   ├── 📄 ActivityFeed.jsx
│   │   │   │   ├── 📄 RecentDocuments.jsx
│   │   │   │   └── 📄 StatsCard.jsx
│   │   │   ├── 📁 DocumentUpload
│   │   │   │   ├── 📄 DocumentCard.jsx
│   │   │   │   ├── 📄 DocumentList.jsx
│   │   │   │   └── 📄 UploadZone.jsx
│   │   │   ├── 📁 Layout
│   │   │   │   ├── 📄 Footer.jsx
│   │   │   │   ├── 📄 Navbar.jsx
│   │   │   │   └── 📄 Sidebar.jsx
│   │   │   └── 📁 Search
│   │   │       ├── 📄 Filters.jsx
│   │   │       ├── 📄 ResultCard.jsx
│   │   │       ├── 📄 ResultsList.jsx
│   │   │       └── 📄 SearchBar.jsx
│   │   ├── 📁 config
│   │   │   ├── 📄 permissions.js
│   │   │   └── 📄 routes.js
│   │   ├── 📁 contexts
│   │   │   ├── 📄 AuthContext.jsx
│   │   │   ├── 📄 ChatContext.jsx
│   │   │   └── 📄 ThemeContext.jsx
│   │   ├── 📁 hooks
│   │   │   ├── 📄 useAuth.js
│   │   │   ├── 📄 useChat.js
│   │   │   ├── 📄 useDocuments.js
│   │   │   ├── 📄 useFirebaseAuth.js
│   │   │   ├── 📄 useGemini.js
│   │   │   └── 📄 useSearch.js
│   │   ├── 📁 pages
│   │   │   ├── 📄 Admin.jsx
│   │   │   ├── 📄 Chat.jsx
│   │   │   ├── 📄 Dashboard.jsx
│   │   │   ├── 📄 Documents.jsx
│   │   │   ├── 📄 Profile.jsx
│   │   │   └── 📄 Search.jsx
│   │   ├── 📁 services
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 auth.js
│   │   │   │   ├── 📄 chat.js
│   │   │   │   ├── 📄 documents.js
│   │   │   │   ├── 📄 index.js
│   │   │   │   └── 📄 search.js
│   │   │   ├── 📁 firebase
│   │   │   │   ├── 📄 auth.js
│   │   │   │   ├── 📄 config.js
│   │   │   │   ├── 📄 firestore.js
│   │   │   │   └── 📄 storage.js
│   │   │   └── 📁 mongodb
│   │   │       └── 📄 api.js
│   │   ├── 📁 styles
│   │   │   ├── 🎨 components.css
│   │   │   ├── 🎨 firebase-ui.css
│   │   │   ├── 🎨 index.css
│   │   │   └── 📄 tailwind.config.js
│   │   ├── 📁 utils
│   │   │   ├── 📄 constants.js
│   │   │   ├── 📄 firebase-helpers.js
│   │   │   ├── 📄 gemini-helpers.js
│   │   │   ├── 📄 helpers.js
│   │   │   └── 📄 validators.js
│   │   ├── 📄 App.jsx
│   │   ├── 📄 firebase.js
│   │   ├── 📄 main.jsx
│   │   └── 📄 router.jsx
│   ├── 🐳 Dockerfile
│   ├── ⚙️ package.json
│   ├── 📄 tailwind.config.js
│   └── 📄 vite.config.js
├── 📁 ml_pipeline
│   ├── 📁 embedding_models
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 gemini_embeddings.py
│   │   ├── 🐍 mongodb_vector_search.py
│   │   ├── 🐍 sentence_transformer.py
│   │   └── 🐍 embedding_optimizer.py
│   ├── 📁 llm
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 anthropic_integration.py
│   │   ├── 🐍 gemini_integration.py
│   │   ├── 🐍 huggingface_integration.py
│   │   ├── 🐍 local_models.py
│   │   └── 🐍 vertex_integration.py
│   ├── 📁 mongodb_ml
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 aggregations.py
│   │   ├── 🐍 gemini_indexes.py
│   │   ├── 🐍 indexes.py
│   │   └── 🐍 vector_search.py
│   ├── 📁 rag
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 citation_extractor.py
│   │   ├── 🐍 generation.py
│   │   ├── 🐍 multimodal_extractor.py
│   │   ├── 🐍 reranking.py
│   │   └── 🐍 retrieval.py
│   └── 📄 requirements-ml.txt
├── 📁 mongodb
│   ├── 📁 config
│   │   ├── ⚙️ mongod.conf
│   │   └── ⚙️ mongos.conf
│   ├── 📁 scripts
│   │   ├── 📄 create-users.js
│   │   ├── 📄 enable-vector-search.js
│   │   ├── 📄 init-replica.js
│   │   └── 📄 optimize-gemini-indexes.js
│   ├── 🐳 Dockerfile
│   ├── 📝 README.md
│   └── ⚙️ docker-compose.mongo.yml
├── 📁 monitoring
│   ├── 📁 grafana_dashboards
│   │   ├── ⚙️ gemini_performance.json
│   │   └── ⚙️ mongodb_dashboard.json
│   ├── ⚙️ alerts.yml
│   ├── ⚙️ gemini_cost_tracking.py
│   ├── ⚙️ logging_config.yaml
│   └── ⚙️ prometheus.yml
├── 📁 notebooks
│   ├── 📒 data_exploration.ipynb
│   ├── 📒 embedding_experiments.ipynb
│   ├── 📒 gemini_benchmarks.ipynb
│   └── 📒 rag_evaluation.ipynb
├── 📁 scripts
│   ├── 📄 backup_mongodb.sh
│   ├── 🐍 data_migration.py
│   ├── 📄 init_mongodb.sh
│   ├── 🐍 optimize_embedding_dimensions.py
│   ├── 📄 setup_environment.sh
│   ├── 📄 setup_firebase.sh
│   └── 📄 setup_gemini.sh
├── 📁 vector_db
│   ├── 🐍 __init__.py
│   ├── 🐍 chroma_integration.py
│   ├── 🐍 mongodb_atlas.py
│   ├── 🐍 pinecone_integration.py
│   └── 🐍 qdrant_integration.py
├── ⚙️ .dockerignore
├── ⚙️ .env.example
├── ⚙️ .gitignore
├── ⚙️ .pre-commit-config.yaml
├── 📄 Makefile
├── 📄 check
├── ⚙️ docker-compose.yml
├── ⚙️ pyproject.toml
└── 📄 requirements.txt
