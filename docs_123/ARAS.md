# **How to Run the Academic Research Assistant (ARAS)**

## **🚀 Quick Start**

### **Prerequisites**
- **Docker & Docker Compose** (recommended) OR
- **Manual Setup**: Python 3.10+, Node.js 18+, MongoDB 7.0+, Redis 7.0+
- **Firebase Account** for authentication
- **OpenAI/Anthropic API Key** (optional for LLM features)

---

## **Option 1: Docker Compose (Recommended)**

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <repository-url>
cd academic-research-assistant-rag

# Copy environment template
cp .env.example .env
```

### **2. Configure Environment Variables**
Edit `.env` file with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# MongoDB (Optional - defaults to Docker container)
MONGODB_URI=mongodb://aras_user:aras_password@mongodb:27017
MONGODB_DB_NAME=aras_db

# Redis (Optional - defaults to Docker container)
REDIS_URL=redis://:redis_password@redis:6379/0

# LLM Configuration (Optional - for advanced features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### **3. Setup Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Email/Password & Google
4. Create a Web App and get configuration
5. Generate Service Account Key:
   - Project Settings → Service Accounts → Generate New Private Key
   - Save as `firebase/serviceAccountKey.json`

### **4. Start All Services**
```bash
# Build and start all containers
docker-compose up --build

# OR run in detached mode
docker-compose up -d --build
```

### **5. Verify Services**
Check if all services are running:
```bash
docker-compose ps
```

Access applications:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **MongoDB Express**: http://localhost:8081 (admin/admin123)
- **Health Check**: http://localhost:8000/health

---

## **Option 2: Manual Setup (Without Docker)**

### **1. Backend Setup**
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install ML dependencies
pip install -r ../ml_pipeline/requirements-ml.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### **2. MongoDB Setup**
```bash
# Install MongoDB 7.0+
# For Ubuntu/Debian:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Initialize MongoDB
mongosh < ../mongodb/scripts/init-replica.js
```

### **3. Redis Setup**
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### **4. Frontend Setup**
```bash
# Navigate to frontend
cd ../frontend

# Install Node.js dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### **5. Start Services**
#### **Terminal 1 - Backend**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m app.main
```

#### **Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```

#### **Terminal 3 - MongoDB** (if not running as service)
```bash
mongod --replSet rs0 --bind_ip_all --auth
```

---

## **Option 3: Development Mode with Hot Reload**

### **1. Using Docker Compose with Development Volumes**
```bash
# Use development docker-compose (if separate)
docker-compose -f docker-compose.dev.yml up --build

# With hot reload for backend
docker-compose up --build
# Backend will auto-reload on code changes
```

### **2. Running Tests**
```bash
# Run all tests
cd backend
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py -v
```

### **3. Database Migrations**
```bash
# Apply migrations (if using Alembic)
cd backend
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"
```

---

## **📊 Service Ports & Access**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | React application |
| Backend API | 8000 | http://localhost:8000 | FastAPI backend |
| API Docs | 8000 | http://localhost:8000/docs | Swagger UI |
| MongoDB | 27017 | mongodb://localhost:27017 | Database |
| MongoDB Express | 8081 | http://localhost:8081 | Web UI for MongoDB |
| Redis | 6379 | redis://localhost:6379 | Caching |

---

## **🔧 Common Operations**

### **Reset Everything**
```bash
# Stop and remove all containers
docker-compose down -v

# Remove volumes (caution: deletes data)
docker-compose down -v --remove-orphans

# Rebuild and start fresh
docker-compose up --build
```

### **View Logs**
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### **Database Operations**
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u aras_user -p aras_password --authenticationDatabase admin

# Backup MongoDB
docker-compose exec mongodb mongodump --uri="mongodb://aras_user:aras_password@localhost:27017/aras_db" --archive=/backup/aras-backup.archive

# Restore MongoDB
docker-compose exec mongodb mongorestore --uri="mongodb://aras_user:aras_password@localhost:27017/aras_db" --archive=/backup/aras-backup.archive
```

### **Create Admin User**
```bash
# Access MongoDB
docker-compose exec mongodb mongosh -u aras_user -p aras_password --authenticationDatabase admin aras_db

# Create admin user
db.users.insertOne({
  email: "admin@example.com",
  firebase_uid: "custom_admin_uid",
  role: "admin",
  is_active: true,
  created_at: new Date()
})
```

---

## **🐛 Troubleshooting**

### **Common Issues & Solutions**

#### **1. MongoDB Connection Issues**
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Reinitialize replica set
docker-compose exec mongodb mongosh --eval "rs.initiate()"
```

#### **2. Firebase Authentication Issues**
- Verify Firebase project is created
- Check `firebase/serviceAccountKey.json` exists
- Verify Firebase API keys in `.env` are correct
- Enable required authentication methods in Firebase Console

#### **3. Port Already in Use**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :27017

# Kill process
sudo kill -9 <PID>
```

#### **4. Docker Build Failures**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### **5. Memory Issues**
```bash
# Check memory usage
docker stats

# Increase Docker memory (Docker Desktop)
# Settings → Resources → Memory (increase to 4GB+)
```

---

## **🚀 Production Deployment**

### **1. Production Environment File**
```bash
# Create production environment
cp .env.example .env.production

# Configure for production
# Set ENVIRONMENT=production
# Set DEBUG=False
# Use production MongoDB/Redis URLs
# Configure proper CORS origins
```

### **2. Production Docker Compose**
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d --build

# With specific environment file
docker-compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### **3. HTTPS/SSL Configuration**
```bash
# Generate SSL certificates
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/private.key \
  -out docker/nginx/ssl/certificate.crt
```

### **4. Monitoring Setup**
```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

---

## **📈 Health Checks**

### **Verify System Health**
```bash
# Backend health
curl http://localhost:8000/health

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker-compose exec redis redis-cli ping
```

### **System Status Endpoints**
- `GET /health` - Overall system health
- `GET /health/db` - Database health
- `GET /health/cache` - Redis cache health
- `GET /metrics` - System metrics (Prometheus format)

---

## **🎯 Quick Test**

After setup, test the system:

1. **Open Frontend**: http://localhost:3000
2. **Register/Login** using Firebase authentication
3. **Upload a PDF** research paper
4. **Ask questions** about the paper in the chat
5. **Search** across uploaded documents

---

## **🔄 Update Instructions**

### **Update Code**
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend alembic upgrade head
```

### **Update Dependencies**
```bash
# Backend dependencies
cd backend
pip install -r requirements.txt --upgrade

# Frontend dependencies
cd frontend
npm update

# Rebuild Docker images
docker-compose build --no-cache
```

---

## **📞 Support**

### **Getting Help**
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check Firebase Console for authentication issues
4. Ensure MongoDB replica set is initialized

### **Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
docker-compose up --build
```

This comprehensive guide should help you successfully run the Academic Research Assistant RAG system in any environment. The system is designed to be flexible and can run on everything from a local laptop to cloud infrastructure.