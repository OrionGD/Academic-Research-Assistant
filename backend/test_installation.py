#!/usr/bin/env python3
"""
Comprehensive test script for ARAS backend dependencies
Tests all major libraries and reports their versions
"""

import sys
import platform
import importlib.metadata
from datetime import datetime

print("=" * 60)
print("ARAS BACKEND - INSTALLATION TEST")
print("=" * 60)
print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Python Version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Virtual Environment: {hasattr(sys, 'real_prefix') or sys.base_prefix != sys.prefix}")
print("=" * 60)

# Test categories and their packages
tests = [
    # Core Framework
    {
        "category": "CORE FRAMEWORK",
        "packages": [
            ("fastapi", "FastAPI"),
            ("uvicorn", "Uvicorn"),
            ("pydantic", "Pydantic"),
            ("starlette", "Starlette")
        ]
    },
    
    # Database
    {
        "category": "DATABASE",
        "packages": [
            ("motor", "Motor"),
            ("pymongo", "PyMongo"),
            ("redis", "Redis")
        ]
    },
    
    # ML & AI - Gemini
    {
        "category": "GEMINI & LLM",
        "packages": [
            ("google.genai", "Google Gemini"),
            ("langchain", "LangChain"),
            ("langchain_community", "LangChain Community"),
            ("sentence_transformers", "Sentence Transformers")
        ]
    },
    
    # Document Processing
    {
        "category": "DOCUMENT PROCESSING",
        "packages": [
            ("fitz", "PyMuPDF"),
            ("docx", "python-docx"),
            ("unstructured", "Unstructured")
        ]
    },
    
    # Vector Stores
    {
        "category": "VECTOR STORES",
        "packages": [
            ("faiss", "FAISS"),
            ("chromadb", "ChromaDB")
        ]
    },
    
    # Firebase & Auth
    {
        "category": "FIREBASE & AUTH",
        "packages": [
            ("firebase_admin", "Firebase Admin"),
            ("pyrebase", "Pyrebase4"),
            ("jose", "Python-JOSE"),
            ("passlib", "Passlib"),
            ("bcrypt", "Bcrypt")
        ]
    },
    
    # Utilities
    {
        "category": "UTILITIES",
        "packages": [
            ("dotenv", "python-dotenv"),
            ("celery", "Celery"),
            ("click", "Click")
        ]
    },
    
    # Development & Testing
    {
        "category": "DEVELOPMENT",
        "packages": [
            ("pytest", "Pytest"),
            ("httpx", "HTTPX"),
            ("black", "Black"),
            ("mypy", "Mypy"),
            ("ruff", "Ruff")
        ]
    },
    
    # Monitoring
    {
        "category": "MONITORING",
        "packages": [
            ("prometheus_client", "Prometheus Client"),
            ("sentry_sdk", "Sentry SDK")
        ]
    }
]

# Run tests
passed = 0
failed = 0
failed_packages = []

for category in tests:
    print(f"\n📦 {category['category']}")
    print("-" * 40)
    
    for import_name, display_name in category["packages"]:
        try:
            if import_name == "fitz":
                # Special case for PyMuPDF
                import fitz
                version = fitz.VersionBind
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "docx":
                # python-docx
                import docx
                version = docx.__version__
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "dotenv":
                # python-dotenv
                from dotenv import __version__
                print(f"  ✅ {display_name}: {__version__}")
            elif import_name == "google.genai":
                # Gemini
                import google.genai as genai
                version = getattr(genai, '__version__', 'installed')
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "langchain_community":
                import langchain_community
                version = langchain_community.__version__
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "sentence_transformers":
                import sentence_transformers
                version = sentence_transformers.__version__
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "unstructured":
                import unstructured
                version = unstructured.__version__
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "chromadb":
                import chromadb
                version = chromadb.__version__
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "pyrebase":
                import pyrebase
                version = "installed"
                print(f"  ✅ {display_name}: {version}")
            elif import_name == "jose":
                from jose import __version__
                print(f"  ✅ {display_name}: {__version__}")
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
                version = "installed"
                print(f"  ✅ {display_name}: {version}")
            else:
                # Generic import
                module = __import__(import_name)
                try:
                    version = module.__version__
                except AttributeError:
                    try:
                        version = importlib.metadata.version(import_name)
                    except:
                        version = "installed"
                print(f"  ✅ {display_name}: {version}")
            
            passed += 1
            
        except ImportError as e:
            print(f"  ❌ {display_name}: NOT INSTALLED - {str(e)}")
            failed += 1
            failed_packages.append(display_name)
        except Exception as e:
            print(f"  ⚠️  {display_name}: ERROR - {str(e)}")
            failed += 1
            failed_packages.append(display_name)

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"✅ Passed: {passed} packages")
print(f"❌ Failed: {failed} packages")
print(f"📊 Total: {passed + failed} packages")

if failed_packages:
    print("\n❌ Failed packages:")
    for pkg in failed_packages:
        print(f"  - {pkg}")

# Gemini API Key Test (optional)
print("\n" + "=" * 60)
print("GEMINI API KEY TEST")
print("=" * 60)
print("⚠️  This test requires a valid GEMINI_API_KEY in .env file")
print("   Run this separately with: python test_gemini.py")

print("\n" + "=" * 60)
print("✅ Test script completed!")
print("=" * 60)