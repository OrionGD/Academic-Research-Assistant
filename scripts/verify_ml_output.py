import requests
import json
import os

ML_SERVICE_URL = "http://localhost:8000"
API_KEY = "28779aa562f5d7c282b36e669c03a8935f1096b190922a199971540d18855e3d"

SAMPLE_TEXT = """
Abstract: This paper presents the Academic Research Assistant System (ARAS), a multi-tenant platform for AI-driven research analysis. 
Methodology: We used a FastAPI backend for ML processing and an Express.js backend for orchestration. 
Summary: The system leverages Gemini 2.0 Flash for structured insights and vector embeddings for semantic search. 
Key Contributions: Efficient scaling of research workflows and multi-agent synergy.
Important Quote: "AI is the ultimate tool for academic acceleration," said the lead researcher on page 5.
"""

def verify_analysis():
    print(f"--- Verifying ML Service Analysis Output ---")
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    payload = {
        "documentId": "test_doc_123",
        "fullText": SAMPLE_TEXT
    }

    try:
        response = requests.post(f"{ML_SERVICE_URL}/analyze-document", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        # 1. Schema Correctness
        required_keys = ["summary", "keyContributions", "keyConcepts", "importantQuotes", "methodology", "results"]
        missing = [k for k in required_keys if k not in data]
        
        if missing:
            print(f"FAIL: Missing keys in response: {missing}")
        else:
            print(f"PASS: Schema is correct.")

        # 2. Content Quality
        if len(data.get("summary", "")) > 10:
            print(f"PASS: Summary is populated.")
        else:
            print(f"FAIL: Summary is empty or too short.")

        if isinstance(data.get("keyContributions"), list) and len(data["keyContributions"]) > 0:
            print(f"PASS: Key contributions are populated.")
        else:
            print(f"FAIL: Key contributions are missing.")

        print(f"--- Verification Complete ---")
        print(json.dumps(data, indent=2))

    except Exception as e:
        print(f"ERROR: Verification failed: {e}")

if __name__ == "__main__":
    verify_analysis()
