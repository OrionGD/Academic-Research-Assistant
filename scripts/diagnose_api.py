import httpx
import json
import asyncio
import os

ML_URL = "http://localhost:8000"
ML_API_KEY = "28779aa562f5d7c282b36e669c03a8935f1096b190922a199971540d18855e3d"
DOC_PATH = r"E:\PROJECTS\ARAS\backend\local_storage\documents\69b81823030353158caabf15\a6e56c6c-cde4-4ba8-92f5-79f66ce71b9b-s1.pdf"
USER_ID = "69e0817cd7e470c699ce0bdd"
DOC_ID = "diag_test_doc_123"

async def diagnose_ml():
    headers = {"X-API-Key": ML_API_KEY}
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("--- 1. Testing ML Process ---")
        if not os.path.exists(DOC_PATH):
            print(f"File not found at {DOC_PATH}")
            return

        with open(DOC_PATH, "rb") as f:
            pdf_content = f.read()
            print(f"Read {len(pdf_content)} bytes from PDF")

        files = {'file': (os.path.basename(DOC_PATH), pdf_content, 'application/pdf')}
        data = {'metadata': json.dumps({"documentId": DOC_ID, "userId": USER_ID})}
        
        print(f"Sending request to {ML_URL}/process-document...")
        resp = await client.post(f"{ML_URL}/process-document", headers=headers, files=files, data=data)
        print(f"Response Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")

        if resp.status_code == 200:
            print("\n--- 2. Testing ML Search ---")
            search_data = {
                "query": "What is this document about?",
                "userId": USER_ID,
                "documentIds": [DOC_ID]
            }
            resp = await client.post(f"{ML_URL}/search", headers=headers, json=search_data)
            print(f"Search Status: {resp.status_code}")
            print(f"Search Body: {resp.text}")

if __name__ == "__main__":
    asyncio.run(diagnose_ml())
