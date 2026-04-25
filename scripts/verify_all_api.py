import httpx
import json
import time
import os
import asyncio

# CONFIG
ML_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:2022/api"
ML_API_KEY = "28779aa562f5d7c282b36e669c03a8935f1096b190922a199971540d18855e3d"
# Use Bearer Token for Backend
BE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTA4MTdjZDdlNDcwYzY5OWNlMGJkZCIsImlhdCI6MTc3Njc4NzE2MiwiZXhwIjoxNzc2ODczNTYyfQ.SDhAIchhMF3UiV1dRfBo4LkgRM6yZ71kmZ_U0jHoVSE"
USER_ID = "69e0817cd7e470c699ce0bdd"
DOC_PATH = r"E:\PROJECTS\ARAS\frontend\uploads\text.pdf"
DOC_ID = f"test_doc_final_{int(time.time())}"
SESSION_ID = f"test_session_final_{int(time.time())}"

RESULTS = []

def log_result(name, method, url, status_code, duration, success, error=None):
    RESULTS.append({
        "name": name,
        "method": method,
        "url": url,
        "status": status_code,
        "duration": f"{duration:.2f}s",
        "result": "PASS" if success else "FAIL",
        "error": error[:200] if error else ""
    })

async def test_endpoint(client, name, method, url, **kwargs):
    print(f"Testing {name} [{method}] {url}...")
    try:
        start_time = time.time()
        
        if method == "GET":
            resp = await client.get(url, **kwargs)
        elif method == "POST":
            resp = await client.post(url, **kwargs)
            
        duration = time.time() - start_time
        success = resp.status_code < 400
        print(f"  Result: {'PASS' if success else 'FAIL'} ({resp.status_code}) in {duration:.2f}s")
        if not success:
            print(f"  Error Detail: {resp.text}")
        log_result(name, method, url, resp.status_code, duration, success, resp.text if not success else None)
        return resp
    except Exception as e:
        print(f"  ERROR: {e}")
        log_result(name, method, url, 0, 0, False, str(e))
        return None

async def test_sse(client, name, url, **kwargs):
    print(f"Testing SSE Streaming {name} [{url}]...")
    try:
        start_time = time.time()
        chunks = 0
        
        async with client.stream("POST", url, **kwargs) as response:
            if response.status_code >= 400:
                body = await response.aread()
                print(f"  Failed ({response.status_code}): {body.decode()}")
                log_result(name, "POST (SSE)", url, response.status_code, 0, False, body.decode())
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    chunks += 1
                    if chunks > 50: break # don't read too much
        
        duration_total = time.time() - start_time
        success = chunks > 0
        print(f"  Result: {'PASS' if success else 'FAIL'} received {chunks} chunks in {duration_total:.2f}s")
        log_result(name, "POST (SSE)", url, response.status_code, duration_total, success)
    except Exception as e:
        print(f"  ERROR: {e}")
        log_result(name, "POST (SSE)", url, 0, 0, False, str(e))

async def run_all_tests():
    headers_ml = {"x-api-key": ML_API_KEY}
    headers_backend = {"Authorization": f"Bearer {BE_TOKEN}"}
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        print("\n" + "="*50)
        print("### 1. ML SERVICE ENDPOINT TESTS ###")
        print("="*50)
        
        await test_endpoint(client, "ML Health", "GET", f"{ML_URL}/health")
        
        # Process
        with open(DOC_PATH, "rb") as f:
            pdf_content = f.read()
        files = {'file': (os.path.basename(DOC_PATH), pdf_content, 'application/pdf')}
        data = {'metadata': json.dumps({"documentId": DOC_ID, "userId": USER_ID})}
        await test_endpoint(client, "ML Process", "POST", f"{ML_URL}/process-document", headers=headers_ml, files=files, data=data)

        # Search
        await test_endpoint(client, "ML Search", "POST", f"{ML_URL}/search", headers=headers_ml, json={
            "query": "this is a test",
            "userId": USER_ID,
            "documentIds": [DOC_ID]
        })
        
        # Chat
        await test_endpoint(client, "ML Chat", "POST", f"{ML_URL}/chat", headers=headers_ml, json={
            "message": "summarize this",
            "userId": USER_ID,
            "documentIds": [DOC_ID]
        })

        print("\n" + "="*50)
        print("### 2. BACKEND ENDPOINT TESTS ###")
        print("="*50)
        
        await test_endpoint(client, "BE Health", "GET", f"{BACKEND_URL}/health")
        await test_endpoint(client, "BE List Docs", "GET", f"{BACKEND_URL}/documents", headers=headers_backend)
        
        # BE Chat
        await test_endpoint(client, "BE Chat", "POST", f"{BACKEND_URL}/chat", headers=headers_backend, json={
            "sessionId": SESSION_ID,
            "message": "hello",
            "documentId": DOC_ID
        })
        
        await test_sse(client, "BE Chat Stream", f"{BACKEND_URL}/chat/stream", headers=headers_backend, json={
            "sessionId": SESSION_ID,
            "message": "tell me a story",
            "documentId": DOC_ID
        })

    print("\n" + "="*50)
    print("### API TEST SUMMARY ###")
    print("="*50)
    for r in RESULTS:
        print(f"{r['name']:<25} | {r['status']:<4} | {r['result']:<6} | {r['duration']}")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
