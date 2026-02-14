#!/usr/bin/env python3
"""
Comprehensive test script for ARAS backend dependencies
Tests all major libraries and reports their versions
"""

import sys
import platform
import importlib.metadata
from datetime import datetime
import subprocess
import os
from importlib.metadata import distributions

print("=" * 60)
print("ARAS BACKEND - INSTALLATION TEST")
print("=" * 60)
print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Python Version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Virtual Environment: {hasattr(sys, 'real_prefix') or sys.base_prefix != sys.prefix}")
print("=" * 60)

# Get all installed packages for version lookup
installed_packages = {}
try:
    for dist in distributions():
        installed_packages[dist.metadata['Name'].lower()] = dist.version
except:
    pass

def get_version(import_name, package_name=None):
    """Helper function to get version from various sources"""
    if package_name is None:
        package_name = import_name
    
    try:
        # Try importlib.metadata first (Python 3.8+)
        return importlib.metadata.version(package_name)
    except (importlib.metadata.PackageNotFoundError, AttributeError):
        try:
            # Try our collected packages
            return installed_packages.get(package_name.lower(), 'unknown')
        except:
            return 'installed'

# Test categories and their packages with correct import names
tests = [
    # Core Framework
    {
        "category": "CORE FRAMEWORK",
        "packages": [
            ("fastapi", "FastAPI", "fastapi"),
            ("uvicorn", "Uvicorn", "uvicorn"),
            ("pydantic", "Pydantic", "pydantic"),
            ("starlette", "Starlette", "starlette"),
            ("anyio", "AnyIO", "anyio"),
            ("typing_extensions", "Typing Extensions", "typing-extensions")
        ]
    },
    
    # Database
    {
        "category": "DATABASE",
        "packages": [
            ("motor", "Motor", "motor"),
            ("pymongo", "PyMongo", "pymongo"),
            ("redis", "Redis", "redis")
        ]
    },
    
    # Gemini & LLM
    {
        "category": "GEMINI & LLM",
        "packages": [
            ("google.genai", "Google GenAI", "google-genai"),
            ("langchain", "LangChain", "langchain"),
            ("langchain_community", "LangChain Community", "langchain-community"),
            ("sentence_transformers", "Sentence Transformers", "sentence-transformers"),
            ("transformers", "HuggingFace Transformers", "transformers"),
            ("torch", "PyTorch", "torch")
        ]
    },
    
    # Document Processing
    {
        "category": "DOCUMENT PROCESSING",
        "packages": [
            ("fitz", "PyMuPDF", "pymupdf"),
            ("docx", "python-docx", "python-docx"),
            ("unstructured", "Unstructured", "unstructured"),
            ("lxml", "lxml", "lxml"),
            ("bs4", "BeautifulSoup4", "beautifulsoup4")
        ]
    },
    
    # Vector Stores
    {
        "category": "VECTOR STORES",
        "packages": [
            ("faiss", "FAISS", "faiss-cpu"),
            ("chromadb", "ChromaDB", "chromadb")
        ]
    },
    
    # Firebase & Auth
    {
        "category": "FIREBASE & AUTH",
        "packages": [
            ("firebase_admin", "Firebase Admin", "firebase-admin"),
            ("pyrebase", "Pyrebase4", "pyrebase4"),
            ("jose", "Python-JOSE", "python-jose"),
            ("passlib", "Passlib", "passlib"),
            ("bcrypt", "Bcrypt", "bcrypt"),
            ("cryptography", "Cryptography", "cryptography")
        ]
    },
    
    # Utilities
    {
        "category": "UTILITIES",
        "packages": [
            ("dotenv", "python-dotenv", "python-dotenv"),
            ("celery", "Celery", "celery"),
            ("click", "Click", "click"),
            ("requests", "Requests", "requests"),
            ("urllib3", "urllib3", "urllib3")
        ]
    },
    
    # Development & Testing
    {
        "category": "DEVELOPMENT",
        "packages": [
            ("pytest", "Pytest", "pytest"),
            ("httpx", "HTTPX", "httpx"),
            ("black", "Black", "black"),
            ("mypy", "Mypy", "mypy"),
            ("ruff", "Ruff", "ruff")
        ]
    },
    
    # Monitoring
    {
        "category": "MONITORING",
        "packages": [
            ("prometheus_client", "Prometheus Client", "prometheus-client"),
            ("sentry_sdk", "Sentry SDK", "sentry-sdk")
        ]
    },
    
    # Scientific Computing
    {
        "category": "SCIENTIFIC COMPUTING",
        "packages": [
            ("numpy", "NumPy", "numpy"),
            ("scipy", "SciPy", "scipy"),
            ("scikit_learn", "scikit-learn", "scikit-learn"),
            ("pandas", "Pandas", "pandas"),
            ("pillow", "Pillow", "pillow")
        ]
    }
]

# Run tests
passed = 0
failed = 0
failed_packages = []
version_errors = []

print("\n📦 TESTING INSTALLED PACKAGES")
print("=" * 60)

for category in tests:
    print(f"\n📦 {category['category']}")
    print("-" * 40)
    
    for import_name, display_name, package_name in category["packages"]:
        try:
            # Special import cases
            if import_name == "fitz":
                import fitz
                version = fitz.VersionBind
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "docx":
                import docx
                version = docx.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "dotenv":
                from dotenv import __version__ as version
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "google.genai":
                from google import genai
                version = get_version(import_name, "google-genai")
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "langchain_community":
                import langchain_community
                version = langchain_community.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "sentence_transformers":
                import sentence_transformers
                version = sentence_transformers.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "transformers":
                import transformers
                version = transformers.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "torch":
                import torch
                version = torch.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "unstructured":
                import unstructured
                version = get_version(import_name, "unstructured")
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "chromadb":
                import chromadb
                version = chromadb.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "faiss":
                import faiss
                version = faiss.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "pyrebase":
                import pyrebase
                version = get_version(import_name, "pyrebase4")
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "jose":
                from jose import __version__ as version
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "passlib":
                import passlib
                version = passlib.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "celery":
                import celery
                version = celery.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "ruff":
                import ruff
                version = get_version(import_name, "ruff")
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "bs4":
                from bs4 import __version__ as version
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "scikit_learn":
                import sklearn
                version = sklearn.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "pandas":
                import pandas
                version = pandas.__version__
                print(f"  ✅ {display_name}: {version}")
                
            elif import_name == "pillow":
                from PIL import __version__ as version
                print(f"  ✅ {display_name}: {version}")
                
            else:
                # Generic import
                module = __import__(import_name)
                version = get_version(import_name, package_name)
                print(f"  ✅ {display_name}: {version}")
            
            passed += 1
            
        except ImportError as e:
            print(f"  ❌ {display_name}: NOT INSTALLED - {str(e)}")
            failed += 1
            failed_packages.append(display_name)
        except AttributeError as e:
            version = get_version(import_name, package_name)
            print(f"  ⚠️  {display_name}: {version} (no __version__ attribute)")
            passed += 1
        except Exception as e:
            print(f"  ⚠️  {display_name}: ERROR - {str(e)}")
            version_errors.append(f"{display_name}: {str(e)}")
            passed += 1

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"✅ Passed: {passed} packages")
print(f"❌ Failed: {failed} packages")
print(f"📊 Total: {passed + failed} packages")

if failed_packages:
    print("\n❌ Failed packages (not installed):")
    for pkg in sorted(set(failed_packages)):
        print(f"  - {pkg}")

if version_errors:
    print("\n⚠️  Packages with version detection issues:")
    for error in version_errors[:5]:
        print(f"  - {error}")

# Environment info
print("\n" + "=" * 60)
print("ENVIRONMENT INFORMATION")
print("=" * 60)

if os.path.exists('.env'):
    print("✅ .env file found")
else:
    print("⚠️  .env file not found")

gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key:
    print("✅ GEMINI_API_KEY found in environment")
else:
    print("⚠️  GEMINI_API_KEY not found in environment")

print(f"📦 Total installed packages: {len(installed_packages)}")

print("\n" + "=" * 60)
print("NEXT STEPS")
print("=" * 60)
print("1. Run Gemini API test: python test_gemini.py")
print("2. Start FastAPI server: uvicorn app.main:app --reload")
print("3. Access API docs: http://localhost:8000/docs")
print("=" * 60)

print("\n" + "=" * 60)
print("✅ Test script completed!")
print("=" * 60)
