import requests
import json
import time
import os

ML_SERVICE_URL = "http://localhost:8000"
API_KEY = "28779aa562f5d7c282b36e669c03a8935f1096b190922a199971540d18855e3d"
USER_ID = "test_user_456"
DOC_ID = "test_doc_rag_final"

# Find a real PDF in the local storage to use for test
REAL_PDF_PATH = r"E:\PROJECTS\ARAS\backend\local_storage\documents\69b81823030353158caabf15\a6e56c6c-cde4-4ba8-92f5-79f66ce71b9b-s1.pdf"

def test_rag():
    headers = {"X-API-Key": API_KEY}
    
    if not os.path.exists(REAL_PDF_PATH):
        print(f"ERROR: Real PDF not found at {REAL_PDF_PATH}. Aborting.")
        return

    print(f"--- 1. Testing Document Processing (/process-document) ---")
    with open(REAL_PDF_PATH, "rb") as f:
        pdf_content = f.read()
    
    metadata = json.dumps({"documentId": DOC_ID, "userId": USER_ID})
    files = {'file': (os.path.basename(REAL_PDF_PATH), pdf_content, 'application/pdf')}
    data = {'metadata': metadata}
    
    try:
        resp = requests.post(f"{ML_SERVICE_URL}/process-document", headers=headers, files=files, data=data)
        if resp.status_code != 200:
            print(f"FAIL: Status {resp.status_code}. Detail: {resp.text}")
            return
            
        print(f"PASS: Document processed. {resp.json().get('chunksProcessed')} chunks stored.")
        
        print(f"\n--- 2. Testing RAG Chat (/chat) ---")
        chat_payload = {
            "message": "Summarize the main topic of this document in one sentence.",
            "userId": USER_ID,
            "documentIds": [DOC_ID]
        }
        
        resp = requests.post(f"{ML_SERVICE_URL}/chat", headers=headers, json=chat_payload)
        resp.raise_for_status()
        answer = resp.json().get("answer", "")
        print(f"Answer received: {answer}")
        
        if len(answer) > 20:
            print(f"PASS: Retrieval response received via Gemini.")
        else:
            print(f"FAIL: Response too short or empty.")
            
    except Exception as e:
        print(f"ERROR: RAG pipeline test failed: {e}")

if __name__ == "__main__":
    test_rag()
