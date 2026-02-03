#!/usr/bin/env python3
"""
ARAS Backend Installation Script
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.9 or higher."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print(f"❌ Python 3.9+ required. Found Python {version.major}.{version.minor}")
        sys.exit(1)
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")

def create_virtual_env():
    """Create virtual environment if it doesn't exist."""
    venv_path = Path("venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"])
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment already exists")

def get_pip_path():
    """Get pip path based on platform."""
    if os.name == "nt":  # Windows
        return "venv\\Scripts\\pip.exe"
    else:  # Unix/Linux/Mac
        return "venv/bin/pip"

def install_system_dependencies():
    """Install system-level dependencies."""
    if os.name != "nt":  # Not Windows
        print("Installing system dependencies...")
        try:
            # For Ubuntu/Debian
            subprocess.run([
                "sudo", "apt-get", "update"
            ], check=True)
            subprocess.run([
                "sudo", "apt-get", "install", "-y",
                "build-essential",
                "python3-dev",
                "libmagic1",
                "poppler-utils",
                "tesseract-ocr",
                "tesseract-ocr-eng",
                "ghostscript",
                "ffmpeg"
            ], check=True)
            print("✅ System dependencies installed")
        except subprocess.CalledProcessError:
            print("⚠️  Could not install system dependencies. Some features may not work.")

def install_python_packages(profile="full", use_gpu=False):
    """Install Python packages based on profile."""
    pip_path = get_pip_path()
    
    # Upgrade pip first
    print("Upgrading pip...")
    subprocess.run([pip_path, "install", "--upgrade", "pip"], check=True)
    
    profiles = {
        "minimal": [
            "fastapi==0.104.1",
            "uvicorn[standard]==0.24.0",
            "sqlalchemy==2.0.23",
            "pydantic==2.5.0",
            "asyncpg==0.29.0",
            "python-dotenv==1.0.0",
            "httpx==0.25.1",
            "python-jose[cryptography]==3.3.0",
            "passlib[bcrypt]==1.7.4",
        ],
        "standard": [
            # All core packages without dev/test
        ]
    }
    
    if profile == "full":
        print("Installing all dependencies from requirements.txt...")
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
    elif profile == "minimal":
        print("Installing minimal dependencies...")
        for package in profiles["minimal"]:
            subprocess.run([pip_path, "install", package], check=True)
    
    if use_gpu:
        print("Installing GPU support...")
        subprocess.run([pip_path, "install", "torch", "--index-url", "https://download.pytorch.org/whl/cu121"], check=True)
        subprocess.run([pip_path, "install", "faiss-gpu==1.7.4"], check=True)
    
    print(f"✅ Python packages installed ({profile} profile)")

def download_nlp_models():
    """Download NLP models and data."""
    pip_path = get_pip_path()
    python_path = get_pip_path().replace("/pip", "/python").replace("\\pip.exe", "\\python.exe")
    
    print("Downloading NLP models...")
    
    # Download spaCy model
    try:
        subprocess.run([pip_path, "install", "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl"], 
                      check=True)
    except:
        print("⚠️  Could not download spaCy model. Install manually with: python -m spacy download en_core_web_sm")
    
    # Download NLTK data
    try:
        nltk_code = """
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')
print('NLTK data downloaded')
        """
        subprocess.run([python_path, "-c", nltk_code], check=True)
    except:
        print("⚠️  Could not download NLTK data")
    
    print("✅ NLP models downloaded")

def main():
    parser = argparse.ArgumentParser(description="Install ARAS Backend")
    parser.add_argument("--profile", choices=["minimal", "standard", "full"], 
                       default="full", help="Installation profile")
    parser.add_argument("--gpu", action="store_true", help="Enable GPU support")
    parser.add_argument("--no-venv", action="store_true", help="Skip virtual environment creation")
    parser.add_argument("--no-system", action="store_true", help="Skip system dependencies")
    parser.add_argument("--no-models", action="store_true", help="Skip model downloads")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ARAS Backend Installation")
    print("=" * 50)
    
    check_python_version()
    
    if not args.no_venv:
        create_virtual_env()
    
    if not args.no_system:
        install_system_dependencies()
    
    install_python_packages(args.profile, args.gpu)
    
    if not args.no_models:
        download_nlp_models()
    
    print("\n" + "=" * 50)
    print("✅ Installation Complete!")
    print("\nNext steps:")
    print("1. Activate virtual environment:")
    print("   - Linux/Mac: source venv/bin/activate")
    print("   - Windows: venv\\Scripts\\activate")
    print("\n2. Configure environment variables:")
    print("   cp .env.example .env")
    print("   # Edit .env with your settings")
    print("\n3. Run database migrations:")
    print("   alembic upgrade head")
    print("\n4. Start the server:")
    print("   uvicorn app.main:app --reload")
    print("=" * 50)

if __name__ == "__main__":
    main()