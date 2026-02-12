# ============================================
# ARAS BACKEND - COMPLETE INSTALLATION SCRIPT
# USING PYTHON LAUNCHER (py command)
# ============================================

Write-Host "🚀 Starting ARAS Backend Installation..." -ForegroundColor Green
Write-Host "========================================"

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "[1/12] Creating virtual environment..." -ForegroundColor Cyan
    py -3.11 -m venv venv
}

# Activate virtual environment
Write-Host "[2/12] Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "[3/12] Upgrading pip..." -ForegroundColor Cyan
py -m pip install --upgrade pip

# ============================================
# STAGE 1: CORE FRAMEWORK
# ============================================
Write-Host "[4/12] Installing Core Framework..." -ForegroundColor Cyan
pip install fastapi==0.115.8
pip install uvicorn[standard]==0.34.0
pip install python-multipart==0.0.20
pip install pydantic==2.10.6
pip install pydantic-settings==2.7.1
pip install starlette==0.41.3
pip install anyio==3.7.1
pip install typing-extensions==4.12.2

# ============================================
# STAGE 2: DATABASE
# ============================================
Write-Host "[5/12] Installing Database Drivers..." -ForegroundColor Cyan
pip install motor==3.3.2
pip install pymongo==4.5.0
pip install redis==5.0.1

# ============================================
# STAGE 3: GEMINI & LANGCHAIN - FIXED VERSIONS
# ============================================
Write-Host "[6/12] Installing Gemini AI & LangChain..." -ForegroundColor Cyan
pip install google-genai
pip install protobuf==4.25.6
pip install langchain
pip install langchain-community
pip install langchain-core
pip install langchain-google-genai
pip install langsmith==0.1.147

# ============================================
# STAGE 4: PYTORCH CPU
# ============================================
Write-Host "[7/12] Installing PyTorch CPU..." -ForegroundColor Cyan
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cpu
pip install numpy==1.26.4
pip install scipy==1.11.4
pip install scikit-learn==1.3.2
pip install huggingface-hub==0.20.3
pip install transformers==4.36.2
pip install sentence-transformers==2.2.2

# ============================================
# STAGE 5: DOCUMENT PROCESSING
# ============================================
Write-Host "[8/12] Installing Document Processing..." -ForegroundColor Cyan
pip install pymupdf==1.23.8
pip install python-docx==1.1.0
pip install unstructured==0.10.30
pip install lxml==4.9.3
pip install beautifulsoup4==4.12.2
pip install python-magic==0.4.27
pip install chardet==5.2.0
pip install filetype==1.2.0
pip install tabulate==0.9.0
pip install emoji==2.8.0
pip install rapidfuzz==3.6.0

# ============================================
# STAGE 6: VECTOR STORES
# ============================================
Write-Host "[9/12] Installing Vector Stores..." -ForegroundColor Cyan
pip install faiss-cpu==1.7.4
pip install chromadb==0.4.18

# ============================================
# STAGE 7: FIREBASE & AUTH
# ============================================
Write-Host "[10/12] Installing Firebase & Authentication..." -ForegroundColor Cyan
pip install requests==2.28.2
pip install urllib3==1.26.20
pip install requests-toolbelt==0.10.1
pip install pycryptodome==3.19.0
pip install python-jwt==4.1.0
pip install oauth2client==4.1.3
pip install httpx==0.27.2
pip install firebase-admin==6.2.0
pip install pyrebase4==4.6.0
pip install bcrypt==4.1.1
pip install passlib[bcrypt]==1.7.4
pip install python-jose[cryptography]==3.3.0
pip install cryptography==41.0.7

# ============================================
# STAGE 8: UTILITIES
# ============================================
Write-Host "[11/12] Installing Utilities..." -ForegroundColor Cyan
pip install python-dotenv==1.0.0
pip install celery==5.3.4
pip install click==8.1.7
pip install pandas==2.1.4
pip install pillow==10.1.0

# ============================================
# STAGE 9: DEVELOPMENT & TESTING
# ============================================
Write-Host "[12/12] Installing Development Tools..." -ForegroundColor Cyan
pip install pytest==7.4.3
pip install pytest-asyncio==0.21.1
pip install httpx==0.27.2
pip install black==23.11.0
pip install mypy==1.7.0
pip install ruff==0.1.6

# ============================================
# STAGE 10: MONITORING
# ============================================
pip install prometheus-client==0.19.0
pip install sentry-sdk==1.38.0

# ============================================
# STAGE 11: ADDITIONAL DEPENDENCIES
# ============================================
pip install certifi==2024.2.2
pip install charset-normalizer==3.3.2
pip install idna==3.6
pip install six==1.16.0
pip install tqdm==4.66.1
pip install pyyaml==6.0.1
pip install regex==2023.12.25
pip install joblib==1.3.2
pip install nltk==3.8.1
pip install packaging==23.2
pip install setuptools==69.0.3
pip install wheel==0.42.0

# ============================================
# FINAL VERIFICATION
# ============================================
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================"
Write-Host "🔍 Running dependency check..." -ForegroundColor Yellow
pip check

Write-Host "`n📦 Key Packages Installed:" -ForegroundColor Cyan
pip list | Select-String -Pattern "fastapi|langchain|google-genai|torch|anyio|httpx|firebase|pymongo|redis"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎯 ARAS Backend is ready!" -ForegroundColor Green
Write-Host "📝 To deactivate venv: deactivate" -ForegroundColor Yellow
Write-Host "📝 To reactivate later: .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "========================================"