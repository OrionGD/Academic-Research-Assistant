
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
import requests

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(dotenv_path)

def check_gemini():
    print("\n--- Checking Gemini ---")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[!] GEMINI_API_KEY not found in .env")
        return False
    
    try:
        # Using simple REST API for check
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        response = requests.get(url)
        if response.status_code == 200:
            print("[OK] Gemini API Key is VALID")
            models = response.json().get('models', [])
            print(f"   Found {len(models)} models available.")
            return True
        else:
            print(f"[ERROR] Gemini API Key is INVALID (Status: {response.status_code})")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Gemini check failed: {str(e)}")
        return False

def check_groq():
    print("\n--- Checking Groq ---")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("[!] GROQ_API_KEY not found in .env")
        return False
    
    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        # Try to list models
        models = client.models.list()
        print("[OK] Groq API Key is VALID")
        print(f"   Found {len(models.data)} models available.")
        return True
    except Exception as e:
        print(f"[ERROR] Groq API Key check failed: {str(e)}")
        return False

def check_hf():
    print("\n--- Checking Hugging Face ---")
    token = os.getenv("HF_TOKEN")
    if not token:
        print("[!] HF_TOKEN not found in .env")
        return False
    
    try:
        from huggingface_hub import HfApi
        api = HfApi(token=token)
        user = api.whoami()
        print("[OK] Hugging Face Token is VALID")
        print(f"   Authenticated as: {user.get('name')} ({user.get('type')})")
        return True
    except Exception as e:
        print(f"[ERROR] Hugging Face Token check failed: {str(e)}")
        return False

def check_mongodb():
    print("\n--- Checking MongoDB ---")
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("[!] MONGODB_URI not found in .env")
        return False
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("[OK] MongoDB connection is SUCCESSFUL")
        dbs = client.list_database_names()
        print(f"   Databases found: {', '.join(dbs)}")
        return True
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting service health check...")
    results = {
        "Gemini": check_gemini(),
        "Groq": check_groq(),
        "Hugging Face": check_hf(),
        "MongoDB": check_mongodb()
    }
    
    print("\n" + "="*30)
    print("SUMMARY")
    print("="*30)
    for service, status in results.items():
        print(f"{service:15}: {'PASS' if status else 'FAIL'}")
    print("="*30)
