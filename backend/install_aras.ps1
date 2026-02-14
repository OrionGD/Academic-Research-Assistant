# ============================================
# ARAS BACKEND - MINIMAL CLEAN INSTALL
# ============================================

Write-Host "?? Starting ARAS Backend Installation..." -ForegroundColor Green

# Create venv
if (-not (Test-Path "venv")) {
    py -3.11 -m venv venv
}

# Activate
& .\venv\Scripts\Activate.ps1

# Upgrade pip
py -m pip install --upgrade pip

# ============================================
# CORE BACKEND
# ============================================
pip install fastapi uvicorn[standard] python-multipart pydantic-settings

# ============================================
# DATABASE
# ============================================
pip install motor redis

# ============================================
# AI STACK
# ============================================
pip install google-genai
pip install langchain langchain-community langchain-google-genai

# ============================================
# VECTOR STORE
# ============================================
pip install chromadb faiss-cpu

# ============================================
# ML / EMBEDDINGS
# ============================================
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install sentence-transformers

# ============================================
# DOCUMENT PROCESSING (Only if needed)
# ============================================
pip install pymupdf python-docx beautifulsoup4

# ============================================
# AUTH
# ============================================
pip install firebase-admin passlib[bcrypt] python-jose python-dotenv

# ============================================
# OPTIONAL MONITORING
# ============================================
pip install prometheus-client sentry-sdk

# ============================================
# VERIFY
# ============================================
pip check
Write-Host "? ARAS Backend Installation Completed!" -ForegroundColor Green     
