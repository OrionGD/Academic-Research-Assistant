# ARAS Platform - Quick Start Guide

Get the ARAS AI-Powered Academic Business Intelligence Platform up and running in minutes!

## 🚀 5-Minute Quick Start

### Prerequisites
- Python 3.9+ ([Download](https://www.python.org/downloads/))
- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Free tier available)
- API Keys:
  - [Gemini API Key](https://makersuite.google.com/app/apikey)
  - [Groq API Key](https://console.groq.com/keys)

### Step 1: Clone or Download the Project
```bash
# Navigate to the project directory
cd ARAS
```

### Step 2: Configure Environment Variables
```bash
# Copy and edit the .env file
# Add your API keys and database URL
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
```

### Step 3: Start the Application

**On Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**On Windows:**
```bash
start.bat
```

**Manual Start:**

Terminal 1 - Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 2022
```

Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Access the Application
- **Frontend:** http://localhost:3033
- **API:** http://localhost:2022/api
- **Docs:** http://localhost:2022/docs

---

## 📋 Detailed Setup

### Backend Setup

1. **Create Python Virtual Environment**
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure Database & APIs**
Edit `.env` file with:
```
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
MONGODB_URI=your_connection_string
CHROMA_PERSIST_DIR=./chroma_storage
JWT_SECRET=your_random_secret_key
```

4. **Run Backend**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 2022
```

Test with: `curl http://localhost:2022/health`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Configure Environment**
Create `.env.local`:
```
VITE_API_URL=http://localhost:2022/api
```

3. **Run Development Server**
```bash
npm run dev
```

Access at: `http://localhost:3033`

---

## 🎯 First Steps

### Upload Your First Document

1. Go to http://localhost:3033/aras/upload
2. Choose upload method:
   - **PDF:** Upload a PDF file
   - **URL:** Paste a webpage URL
   - **Text:** Paste raw text
3. (Optional) Add a title
4. Click "Upload Document"
5. Wait for processing to complete

### Chat with Your Document

1. Go to Dashboard (http://localhost:3033/aras/dashboard)
2. Click the chat button on your uploaded document
3. Ask questions about the document
4. View AI responses with source references

### View Analytics

1. From Dashboard, click on a document
2. Go to Analytics tab
3. See:
   - Document summary
   - Keywords and topics
   - Reading time estimate
   - Chunk count

---

## 🔧 Configuration Guide

### Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env`:
```
GEMINI_API_KEY=AIza...
GEMINI_EMBEDDING_MODEL=gemini-embedding-2-preview
```

### Groq API Setup

1. Visit [Groq Console](https://console.groq.com/)
2. Create new API key
3. Add to `.env`:
```
GROQ_API_KEY=gsk_...
GROQ_CHAT_MODEL=llama-3.1-8b-instant
```

### MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
# Connection string: mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aras_db
```

---

## 📚 Key Features

### Document Processing
- ✅ PDF upload with text extraction
- ✅ URL content extraction
- ✅ Raw text input
- ✅ Semantic text chunking (500 tokens, 100 overlap)
- ✅ Automatic analytics generation

### AI Capabilities
- ✅ Semantic embeddings (Gemini API)
- ✅ Document summarization
- ✅ Keyword & topic extraction
- ✅ Contextual Q&A (Groq API)
- ✅ Multi-turn conversations

### Data Management
- ✅ MongoDB metadata storage
- ✅ ChromaDB vector storage
- ✅ Document history
- ✅ Chat history
- ✅ Analytics dashboard

---

## 🐛 Troubleshooting

### Backend Won't Start

**Issue:** "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Issue:** "GEMINI_API_KEY not set"
```bash
# Solution: Check .env file is in root directory
# Add GEMINI_API_KEY=your_key
```

**Issue:** "MongoDB connection failed"
```bash
# Solution: Check MONGODB_URI in .env
# Verify network access if using MongoDB Atlas
# Whitelist your IP in Atlas security settings
```

### Frontend Won't Load

**Issue:** "Cannot find module '@vitejs/plugin-react'"
```bash
# Solution: Install dependencies
cd frontend
npm install
```

**Issue:** "API call fails from frontend"
```bash
# Solution: Check VITE_API_URL in .env.local
# Ensure backend is running on port 5000
# Check CORS settings in backend
```

### API Errors

**Issue:** "Internal server error" when uploading
- Check API keys are valid
- Ensure MongoDB is running
- Check network connectivity

**Issue:** "No embeddings generated"
- Verify Gemini API key is correct
- Check internet connection
- Check API quota

---

## 📖 Documentation

- **Full Setup Guide:** See [PRODUCTION_README.md](./PRODUCTION_README.md)
- **API Reference:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **System Architecture:** See [SYSTEM_STRUCTURE.md](./SYSTEM_STRUCTURE.md)

---

## 🚢 Production Deployment

### Backend Deployment

**Using Gunicorn:**
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

**Using Docker:**
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:2022"]
```

### Frontend Deployment

**Build for Production:**
```bash
cd frontend
npm run build
```

**Deploy dist/ directory to:**
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static host

---

## 📊 System Requirements

**Minimum:**
- 2GB RAM
- 1GB disk space
- Internet connection

**Recommended (for production):**
- 8GB+ RAM
- 10GB+ disk space
- SSD storage
- Dedicated database server
- Load balancer

---

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Groq API Documentation](https://groq.com/docs)

---

## 💬 Getting Help

1. **Check the documentation:** PRODUCTION_README.md
2. **Review API docs:** http://localhost:2022/docs
3. **Check logs:** Backend terminal output
4. **Browser console:** Frontend Chrome DevTools

---

## 📝 License

MIT License - See LICENSE file for details

---

## ✨ What's Next?

1. ✅ Upload your first document
2. ✅ Ask questions using AI chat
3. ✅ Explore document analytics
4. ✅ Build on the platform for your use case
5. ✅ Deploy to production

Happy analyzing! 🎉
