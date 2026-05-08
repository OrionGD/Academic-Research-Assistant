# ScholarAI System Flow

## Architecture Overview

```mermaid
graph TB
    subgraph User["👤 User"]
        Browser["Browser\n(React App)"]
    end

    subgraph Frontend["🖥️ Frontend — Vite/React (Port 5173)"]
        direction TB
        AuthCtx["AuthContext\n(Session State)"]
        AppRouter["App.tsx Router\n(React Router v6)"]
        Pages["Pages\n(Landing/Login/Signup/Dashboard...)"]
        ApiClient["Axios Client\n(withCredentials: true)"]
    end

    subgraph Backend["⚙️ Backend — FastAPI (Port 5000)"]
        direction TB
        AuthRoute["POST /api/auth/login\nPOST /api/auth/register\nPOST /api/auth/logout\nGET  /api/auth/me"]
        AuthMW["SessionMiddleware\n(Redis-backed)"]
        ProtectedRoutes["Protected Routes\n/documents /search /chat\n/analysis /billing /admin"]
        Controllers["Routers\n(Auth/Doc/Chat/Analysis...)"]
        Services["Services\n(Gemini/Storage/Session...)"]
        MongoDB[("MongoDB\nUsers, Docs, Metadata")]
        Redis[("Redis\nSessions + Cache")]
    end

    subgraph MLService["🤖 ML Service — FastAPI (Port 8000)"]
        direction TB
        MLRoutes["POST /process-document\nPOST /search\nPOST /chat\nPOST /chat/stream\nPOST /analyze-document"]
        MLAuth["X-API-Key Auth"]
        Pipelines["Pipelines\n(Process/Search/Chat/Analyze)"]
        ChromaDB[("ChromaDB\nVector Store\n(Embeddings)")]
        GeminiAPI["Gemini API\n(Embeddings + Generation)"]
    end

    Browser --> Frontend
    ApiClient -->|"HTTP + Session Cookie"| Backend
    Backend -->|"Internal X-API-Key"| MLService
    Backend --> MongoDB
    Backend --> Redis
    MLService --> ChromaDB
    MLService --> GeminiAPI
    MLService --> MongoDB
```

---

## 1. Frontend Routing Flow

```mermaid
flowchart TD
    Start([App loads]) --> AuthProvider
    AuthProvider -->|"GET /api/auth/me"| SessionCheck{Session valid?}
    SessionCheck -->|"Yes → setUser()"| LoggedIn
    SessionCheck -->|"No → user = null"| LoggedOut

    LoggedOut --> PublicRoutes["Public Routes\n/ → LandingPage\n/login → LoginPage\n/signup → SignupPage\n/pricing → PricingPage\n/documentation\n/api-reference\n/support"]

    LoggedIn --> ProtectedCheck{Route protected?}
    ProtectedCheck -->|"Yes"| AppLayout["AppLayout + Protected Route\n/dashboard\n/upload → /library\n/search → /chat\n/insights/:paperId\n/settings → /billing\n/comparison"]
    ProtectedCheck -->|"Admin"| AdminRoutes["AdminRoute\n/admin\n/admin/notifications\n/admin/chat/:userId"]

    LoggedOut -.->|"Try protected route"| RedirectLogin["/login redirect"]
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as MongoDB
    participant Sess as Redis (Sessions)

    Note over U,Sess: LOGIN
    U->>FE: Enter email + password
    FE->>BE: POST /api/auth/login { email, password }
    BE->>DB: findOne({ email })
    DB-->>BE: User document
    BE->>BE: pwd_context.verify(password, hash)
    BE->>Sess: SessionService.create_session(user_data)
    BE-->>FE: 200 { user: { id, email, name, role, planTier } } (Set-Cookie: scholarai_session)
    FE->>FE: setUser(response.user)
    FE->>FE: Navigate → /dashboard

    Note over U,Sess: SUBSEQUENT REQUESTS
    U->>FE: Visit /dashboard
    FE->>BE: GET /api/auth/me [cookie: aras_session]
    BE->>Sess: Resolve session
    Sess-->>BE: Session data
    BE->>DB: findById(session.user_id)
    DB-->>BE: Full user profile
    BE-->>FE: 200 { user }

    Note over U,Sess: LOGOUT
    U->>FE: Click logout
    FE->>BE: POST /api/auth/logout
    BE->>Sess: SessionService.delete_session(session_id)
    BE-->>FE: 200 { message: "Logged out" }
    FE->>FE: setUser(null), redirect → /
```

---

## 3. Document Upload & Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend (Port 5000)
    participant ML as ML Service (Port 8000)
    participant S as Storage (Local/Cloud)
    participant C as ChromaDB
    participant G as Gemini API

    U->>FE: Upload PDF
    FE->>BE: POST /api/documents/upload [multipart, cookie]
    BE->>BE: authMiddleware (session check)
    BE->>S: Store raw PDF
    BE->>ML: POST /process-document [X-API-Key, file]
    ML->>ML: Extract PDF text (PyMuPDF)
    ML->>ML: Chunk text
    ML->>G: Embed chunks (768-dim vectors)
    G-->>ML: Embeddings
    ML->>C: Store chunks + vectors (userId-scoped)
    ML-->>BE: { chunks_processed, status }
    BE->>MongoDB: Save Document record (metadata)
    BE-->>FE: 200 { document }
    FE->>FE: Show success, update library
```

---

## 4. RAG Chat / Search Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant ML as ML Service
    participant C as ChromaDB
    participant G as Gemini API

    U->>FE: Submit chat message
    FE->>BE: POST /api/chat { message, documentIds } [cookie]
    BE->>BE: authMiddleware + plan check
    BE->>ML: POST /chat { message, userId, documentIds } [X-API-Key]
    ML->>G: Embed query
    G-->>ML: Query vector
    ML->>C: Semantic search (userId-scoped)
    C-->>ML: Top-K relevant chunks
    ML->>G: RAG prompt (query + context chunks)
    G-->>ML: Generated response
    ML-->>BE: { response, sources }
    BE->>MongoDB: Log UsageEvent (query count++)
    BE-->>FE: { response, sources }
    FE->>U: Display AI response
```

---

## 5. Backend API Route Map

| Route | Auth | Rate Limiter | Handler |
|-------|------|-------------|---------|
| `GET  /api/health` | ❌ Public | None | healthRoutes |
| `GET  /api/docs` | ❌ Public | None | docsController |
| `POST /api/auth/login` | ❌ Public | authLimiter (20/5min) | authController.login |
| `POST /api/auth/register` | ❌ Public | authLimiter | authController.register |
| `POST /api/auth/logout` | ❌ Public | authLimiter | authController.logout |
| `GET  /api/auth/me` | ✅ Session | authLimiter | authController.getProfile |
| `*    /api/documents/*` | ✅ Session | — | documentController |
| `*    /api/search/*` | ✅ Session | — | searchController |
| `*    /api/analysis/*` | ✅ Session | — | analysisController |
| `*    /api/chat/*` | ✅ Session | — | chatController |
| `*    /api/admin/*` | ✅ Session + adminRole | — | adminController |
| `*    /api/support/*` | ✅ Session | — | supportChatController |
| `*    /api/upgrade/*` | ✅ Session | — | upgradeController |
| `*    /api/billing/*` | ✅ Session | — | billingController |
| `*    /api/keys/*` | ✅ Session | — | apiKeyController |

---

## 6. ML Service Route Map

| Route | Auth | Description |
|-------|------|-------------|
| `GET  /health` | ❌ Public | Health check |
| `POST /process-document` | ✅ X-API-Key | PDF → chunks → embed → ChromaDB |
| `POST /search` | ✅ X-API-Key | Semantic similarity search |
| `POST /chat` | ✅ X-API-Key | Standard RAG response |
| `POST /chat/stream` | ✅ X-API-Key | Streaming SSE RAG response |
| `POST /analyze-document` | ✅ X-API-Key | Gemini structured analysis |

---

## 7. Rate Limiting Strategy

| Limiter | Window | Limit (by Plan) | Applied To |
|---------|--------|-----------------|-----------|
| `authLimiter` | 5 min | 20 req | Login/Register/Logout |
| `userApiLimiter` | 1 min | FREE=15, BASIC=30, STD=50, PRO=100 | All user APIs |
| `adminApiLimiter` | 60 min | 50 req | Admin routes |
| `aiHeavyLimiter` | 15 min | PRO=50, others=5 | Heavy AI ops |

> **Note:** All rate limiters use Redis (distributed). All are **skipped in development** (`NODE_ENV !== 'production'`).

---

## 8. Data Models Summary

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `User` | email, password (bcrypt), role, planTier, subscriptionStatus | Identity + billing tier |
| `Document` | userId, filename, status, chunkCount | PDF metadata |
| `DocumentChunk` | documentId, userId, text, embedding | Vector chunks |
| `ChatMessage` | userId, documentIds, role, content | Chat history |
| `Subscription` | userId, plan, status, renewalDate | Plan management |
| `UsageEvent` | userId, type (upload/query), timestamp | Metered billing |
| `ApiKey` | userId, key (hashed), plan, rateLimit | External API access |
| `AuditLog` | userId, action, resource, timestamp | Admin audit trail |
| `AdminChat` | adminId, userId, messages | Admin↔User messaging |
| `UpgradeRequest` | userId, currentPlan, requestedPlan | Upgrade workflow |

---

## 9. Seeded Users (Auto-created on Startup)

| Name | Email | Role | Plan |
|------|-------|------|------|
| Godfrey Admin | godfrey.cs23@krct.ac.in | admin | PRO |
| Hari Prakash | hariprakash@scholarai.ai | user | PRO |
| Oppo User | oppo@aras.ai | user | BASIC |
| Grish | grish@aras.ai | user | STANDARD |

> Default password for all seeded users: `Password123`

---

## 10. Key Integration Points & Potential Issues

> [!WARNING]
> **`/api/auth/profile` (PUT) is missing from `authRoutes.ts`** — the frontend `authService.updateProfile()` calls `PUT /auth/profile` but no such route is registered. This will result in a 404.

> [!WARNING]
> **`authRoutes.ts` has `/register` & `/login`** as direct session-based routes. The previous Firebase-based `verify-firebase` endpoint has been fully removed — this is consistent.

> [!NOTE]
> **Rate limiters depend on Redis** (`config/redis`). If Redis is unavailable, the in-memory fallback is used but rate limiting becomes non-distributed.

> [!NOTE]
> **ML Service authentication**: The backend passes `ML_SERVICE_API_KEY` via `X-API-Key` header to the ML service. The ML service will skip auth entirely if `ML_SERVICE_API_KEY` is not set (dev mode).

> [!TIP]
> **Session cookie name is `aras_session`** (configured in `settings.py`). The client uses `withCredentials: true` for all Axios requests, ensuring cookies flow correctly across the Vite dev proxy.
