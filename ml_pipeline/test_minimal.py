#!/usr/bin/env python3
"""
Minimal test script for ARAS ML Pipeline.
Verifies essential components are installed.
"""

import sys
import importlib

def check_package(package_name):
    """Check if a package is installed."""
    try:
        module = importlib.import_module(package_name)
        version = getattr(module, '__version__', 'unknown')
        return True, version
    except ImportError:
        return False, None

def main():
    print("ARAS ML Pipeline - Minimal Installation Test")
    print("=" * 50)
    
    # Essential packages
    essential = [
        "numpy",
        "pydantic",
        "aiohttp",
        "tenacity",
        "nltk"
    ]
    
    # Check which embedding package is installed
    embedding_packages = ["gemini", "sentence_transformers", "google.generativeai"]
    embedding_found = False
    
    # Check which vector DB is installed
    vector_packages = ["pymongo", "chromadb", "qdrant_client"]
    vector_found = False
    
    # Check which LLM is installed
    llm_packages = ["gemini", "anthropic", "google.generativeai", "ollama"]
    llm_found = False
    
    print("\nChecking essential packages:")
    for pkg in essential:
        installed, version = check_package(pkg)
        status = "✅" if installed else "❌"
        print(f"  {status} {pkg}: {version if installed else 'missing'}")
        if not installed and pkg in essential:
            print(f"     WARNING: {pkg} is required but missing!")
    
    print("\nChecking embedding provider:")
    for pkg in embedding_packages:
        installed, version = check_package(pkg)
        if installed:
            print(f"  ✅ {pkg} (v{version})")
            embedding_found = True
            break
    
    if not embedding_found:
        print("  ❌ No embedding package found!")
    
    print("\nChecking vector database:")
    for pkg in vector_packages:
        installed, version = check_package(pkg)
        if installed:
            print(f"  ✅ {pkg} (v{version})")
            vector_found = True
            break
    
    if not vector_found:
        print("  ❌ No vector database package found!")
    
    print("\nChecking LLM provider:")
    for pkg in llm_packages:
        installed, version = check_package(pkg)
        if installed:
            print(f"  ✅ {pkg} (v{version})")
            llm_found = True
            break
    
    if not llm_found:
        print("  ❌ No LLM package found!")
    
    print("\n" + "=" * 50)
    
    # Summary
    if embedding_found and vector_found and llm_found:
        print("✅ All core components installed successfully!")
    else:
        print("⚠️  Some components are missing:")
        if not embedding_found: print("   - Embedding provider")
        if not vector_found: print("   - Vector database")
        if not llm_found: print("   - LLM provider")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
