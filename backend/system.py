# =========================
# 📦 Setup
# =========================
import requests
import json
from pprint import pprint

BASE_URL = "http://localhost:2022"  # 🔥 CHANGE THIS

results = {}

def check(name, condition):
    results[name] = "✅" if condition else "❌"


def safe_request(method, url, **kwargs):
    try:
        res = requests.request(method, url, timeout=10, **kwargs)
        return res
    except Exception as e:
        print(f"ERROR in {url}: {e}")
        return None


# =========================
# 🌐 ROOT + HEALTH
# =========================
res = safe_request("GET", f"{BASE_URL}/")
check("GET /", res is not None and res.status_code == 200)

res = safe_request("GET", f"{BASE_URL}/health")
check("GET /health", res is not None and res.status_code == 200)


# =========================
# 📄 DOCUMENTS API
# =========================
res = safe_request("GET", f"{BASE_URL}/api/documents/")
check("GET /api/documents/", res and res.status_code == 200)

# Upload TEXT (used to generate document_id)
doc_id = None
res = safe_request("POST", f"{BASE_URL}/api/documents/upload-text", json={
    "text": "Test document content",
    "title": "Test Doc"
})
if res and res.status_code == 200:
    data = res.json()
    doc_id = data["document"]["documentId"]
    check("POST /upload-text", True)
else:
    check("POST /upload-text", False)

# Upload URL
res = safe_request("POST", f"{BASE_URL}/api/documents/upload-url", json={
    "url": "https://example.com",
    "title": "URL Doc"
})
check("POST /upload-url", res and res.status_code == 200)

# Upload first PDF (using real PDF from Knowledge base)
pdf1_path = r"e:\PROJECTS\ARAS\Knowledge base\simplilearn ai.pdf"
doc_id_pdf1 = None
try:
    with open(pdf1_path, "rb") as f:
        pdf_content = f.read()
    files = {"file": ("simplilearn ai.pdf", pdf_content, "application/pdf")}
    res = safe_request("POST", f"{BASE_URL}/api/documents/upload", files=files, data={"title": "Simplilearn AI PDF"})
    if res and res.status_code == 200:
        data = res.json()
        doc_id_pdf1 = data["document"]["documentId"]
    check("POST /upload (PDF1)", res and res.status_code == 200)
except FileNotFoundError:
    print(f"⚠️ PDF file not found: {pdf1_path}")
    files = {"file": ("test.pdf", b"fake content", "application/pdf")}
    res = safe_request("POST", f"{BASE_URL}/api/documents/upload", files=files, data={"title": "PDF"})
    check("POST /upload (PDF1)", res and res.status_code == 200)
except Exception as e:
    print(f"⚠️ Error reading PDF: {e}")
    files = {"file": ("test.pdf", b"fake content", "application/pdf")}
    res = safe_request("POST", f"{BASE_URL}/api/documents/upload", files=files, data={"title": "PDF"})
    check("POST /upload (PDF1)", res and res.status_code == 200)

# Upload second PDF for comparison
pdf2_path = r"e:\PROJECTS\ARAS\Knowledge base\screenshot.pdf"
doc_id_pdf2 = None
try:
    with open(pdf2_path, "rb") as f:
        pdf_content = f.read()
    files = {"file": ("screenshot.pdf", pdf_content, "application/pdf")}
    res = safe_request("POST", f"{BASE_URL}/api/documents/upload", files=files, data={"title": "Screenshot PDF"})
    if res and res.status_code == 200:
        data = res.json()
        doc_id_pdf2 = data["document"]["documentId"]
    check("POST /upload (PDF2)", res and res.status_code == 200)
except FileNotFoundError:
    print(f"⚠️ PDF file not found: {pdf2_path}")
    check("POST /upload (PDF2)", False)
except Exception as e:
    print(f"⚠️ Error reading PDF: {e}")
    check("POST /upload (PDF2)", False)

# Remaining endpoints (require doc_id)
if doc_id:
    res = safe_request("GET", f"{BASE_URL}/api/documents/{doc_id}")
    check("GET /document/{id}", res and res.status_code == 200)

    res = safe_request("GET", f"{BASE_URL}/api/documents/{doc_id}/view")
    check("GET /view", res and res.status_code == 200)

    res = safe_request("GET", f"{BASE_URL}/api/documents/{doc_id}/download")
    check("GET /download", res and res.status_code == 200)

    res = safe_request("GET", f"{BASE_URL}/api/documents/{doc_id}/analytics")
    check("GET /analytics", res and res.status_code == 200)

    res = safe_request("POST", f"{BASE_URL}/api/documents/{doc_id}/analyze")
    check("POST /analyze", res and res.status_code == 200)

    res = safe_request("DELETE", f"{BASE_URL}/api/documents/{doc_id}")
    check("DELETE /document", res and res.status_code == 200)
else:
    print("⚠️ Skipping document-specific tests (no doc_id)")


# Compare
doc_ids_for_compare = []
if doc_id:
    doc_ids_for_compare.append(doc_id)
if doc_id_pdf1:
    doc_ids_for_compare.append(doc_id_pdf1)
if doc_id_pdf2:
    doc_ids_for_compare.append(doc_id_pdf2)

res = safe_request("POST", f"{BASE_URL}/api/documents/compare", json={
    "documentIds": doc_ids_for_compare
})
check("POST /compare", res and res.status_code == 200)


# =========================
# 💬 CHAT API
# =========================
if doc_id:
    res = safe_request("GET", f"{BASE_URL}/api/chat/history/{doc_id}")
    check("GET /chat/history", res and res.status_code == 200)

res = safe_request("POST", f"{BASE_URL}/api/chat/query", json={
    "document_id": doc_id,
    "query": "Summarize"
})
check("POST /chat/query", res and res.status_code == 200)


# =========================
# 📊 ANALYSIS API
# =========================
res = safe_request("POST", f"{BASE_URL}/api/analysis/", json={
    "documentId": doc_id,
    "fullText": "Sample text"
})
check("POST /analysis", res and res.status_code == 200)

if doc_id:
    res = safe_request("GET", f"{BASE_URL}/api/analysis/document/{doc_id}")
    check("GET /analysis/document", res and res.status_code == 200)

    res = safe_request("GET", f"{BASE_URL}/api/analysis/{doc_id}")
    check("GET /analysis/{id}", res and res.status_code == 200)

res = safe_request("POST", f"{BASE_URL}/api/analysis/start", json={
    "documentId": doc_id
})
check("POST /analysis/start", res and res.status_code == 200)

res = safe_request("POST", f"{BASE_URL}/api/analysis/compare", json={
    "documentIds": doc_ids_for_compare
})
check("POST /analysis/compare", res and res.status_code == 200)


# =========================
# 🔍 SEARCH
# =========================
res = safe_request("POST", f"{BASE_URL}/api/search/", json={
    "query": "test",
    "page": 1,
    "limit": 5
})
check("POST /search", res and res.status_code == 200)


# =========================
# 🔑 API KEYS
# =========================
res = safe_request("GET", f"{BASE_URL}/api/keys/keys")
check("GET /keys", res and res.status_code == 200)

res = safe_request("POST", f"{BASE_URL}/api/keys/keys", json={"name": "Test API Key"})
prefix = None
if res and res.status_code == 200:
    prefix = res.json().get("prefix")
    check("POST /keys", True)
else:
    check("POST /keys", False)

if prefix:
    res = safe_request("DELETE", f"{BASE_URL}/api/keys/keys/{prefix}")
    check("DELETE /keys", res and res.status_code == 200)


# =========================
# 🧑‍💻 SUPPORT
# =========================
res = safe_request("POST", f"{BASE_URL}/api/support/chat", json={
    "message": "Hello support"
})
check("POST /support/chat", res and res.status_code == 200)


# =========================
# 📊 FINAL SUMMARY
# =========================
print("\n==============================")
print("🚀 ENDPOINT TEST SUMMARY")
print("==============================")

passed = 0
total = len(results)

for k, v in results.items():
    print(f"{v}  {k}")
    if v == "✅":
        passed += 1

print("\n------------------------------")
print(f"✅ Passed: {passed}/{total}")
print(f"❌ Failed: {total - passed}/{total}")
print("==============================")
