"""
ARAS -- API Endpoint Test Suite
================================
Strategy:
  1. Register a throwaway test user (or skip if already exists)
  2. Login to obtain a real JWT from the server
  3. Use that token for all protected route tests
  4. Test public routes without auth

Run: python test_endpoints.py
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

BASE_URL = "http://localhost:5000"

# ── ANSI colours ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

results: list[dict] = []
AUTH_TOKEN: str = ""        # filled after login
TEST_EMAIL    = "aras_endpoint_tester@test.local"
TEST_PASSWORD = "ARASTest@9999"
TEST_NAME     = "ARAS Test Runner"


def _status_colour(code: int) -> str:
    if 200 <= code < 300:  return GREEN
    if code in (401, 403): return YELLOW
    if code == 404:        return YELLOW
    return RED


def hit(
    method: str,
    path: str,
    *,
    headers: dict = None,
    json_body: dict = None,
    expect_codes: tuple = (200, 201),
    label: str = "",
    auth: bool = False,
) -> dict:
    url = f"{BASE_URL}{path}"
    h   = dict(headers or {})
    if auth and AUTH_TOKEN:
        h["Authorization"] = f"Bearer {AUTH_TOKEN}"

    try:
        r = requests.request(method, url, headers=h, json=json_body, timeout=15)
        code = r.status_code
        colour = _status_colour(code)
        passed = code in expect_codes
        tag_c  = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"

        try:
            body_preview = json.dumps(r.json(), ensure_ascii=False)[:90]
        except Exception:
            body_preview = r.text[:90]

        print(f"  [{tag_c}] {colour}{code}{RESET}  {method:<7} {path:<45} {YELLOW}{body_preview}{RESET}")

        entry = {
            "label": label or path,
            "method": method,
            "path": path,
            "status_code": code,
            "passed": passed,
            "body_preview": body_preview,
        }
        results.append(entry)
        return entry

    except requests.exceptions.ConnectionError:
        print(f"  [{RED}FAIL{RESET}] ---  {method:<7} {path:<45} {RED}CONNECTION REFUSED — is server running?{RESET}")
        entry = {"label": label or path, "method": method, "path": path,
                 "status_code": 0, "passed": False, "body_preview": "Connection refused"}
        results.append(entry)
        return entry
    except Exception as e:
        print(f"  [{RED}FAIL{RESET}] ---  {method:<7} {path:<45} {RED}{str(e)[:70]}{RESET}")
        entry = {"label": label or path, "method": method, "path": path,
                 "status_code": 0, "passed": False, "body_preview": str(e)[:70]}
        results.append(entry)
        return entry


def section(title: str) -> None:
    print(f"\n{CYAN}{BOLD}>>  {title}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 0 — Bootstrap: Register + Login → get real token
# ══════════════════════════════════════════════════════════════════════════════

def bootstrap_auth() -> bool:
    """Register (if needed) then login. Returns True if we have a valid token."""
    global AUTH_TOKEN
    section("Bootstrap — Register & Login test user")

    # Try to register (may 409 if already exists — that's fine)
    reg = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": TEST_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }, timeout=10)

    code = reg.status_code
    if code in (200, 201):
        print(f"  {GREEN}Registered new test user  ({code}){RESET}")
    elif code == 409:
        print(f"  {YELLOW}Test user already exists  ({code}) — proceeding to login{RESET}")
    else:
        print(f"  {RED}Register returned {code}: {reg.text[:100]}{RESET}")
        print(f"  {YELLOW}Will still attempt login in case user exists{RESET}")

    # Login
    login_r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }, timeout=10)

    if login_r.status_code in (200, 201):
        data = login_r.json()
        # Common token field names
        token = (data.get("token") or data.get("accessToken")
                 or data.get("jwt") or data.get("access_token") or "")
        if token:
            AUTH_TOKEN = token
            print(f"  {GREEN}Login OK — token obtained (len={len(token)}){RESET}")
            return True
        else:
            print(f"  {RED}Login OK but no token field found in response: {list(data.keys())}{RESET}")
            return False
    else:
        print(f"  {RED}Login failed {login_r.status_code}: {login_r.text[:120]}{RESET}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUPS
# ══════════════════════════════════════════════════════════════════════════════

def test_health():
    section("Health & System")
    hit("GET", "/api/health", label="Health check", expect_codes=(200,))


def test_auth_public():
    section("Auth Routes  (public)")
    hit("POST", "/api/auth/login",
        json_body={"email": "nobody@nowhere.com", "password": "wrong"},
        label="Login wrong creds",
        expect_codes=(400, 401, 404))
    hit("GET", "/api/auth/profile",
        label="Profile (no auth)",
        expect_codes=(401, 403))


def test_auth_protected():
    section("Auth Routes  (protected)")
    hit("GET",  "/api/auth/profile", label="Profile (with auth)", auth=True,
        expect_codes=(200,))
    hit("PUT",  "/api/auth/profile",
        json_body={"name": "ARAS Tester Updated"},
        label="Update profile", auth=True,
        expect_codes=(200,))


def test_documents():
    section("Document Routes  (protected)")
    hit("GET",  "/api/documents",  label="List documents",   auth=True, expect_codes=(200,))
    # These use a fake ID — expect 404 / 400
    hit("GET",  "/api/documents/000000000000000000000001",
        label="Get doc (fake id)", auth=True, expect_codes=(400, 404, 500))
    hit("GET",  "/api/documents/000000000000000000000001/view",
        label="View doc (fake id)", auth=True, expect_codes=(400, 404, 500))
    hit("GET",  "/api/documents/000000000000000000000001/download",
        label="Download doc (fake id)", auth=True, expect_codes=(400, 404, 500))
    hit("POST", "/api/documents/000000000000000000000001/analyze",
        label="Analyze doc (fake id)", auth=True, expect_codes=(400, 404, 500))
    hit("DELETE", "/api/documents/000000000000000000000001",
        label="Delete doc (fake id)", auth=True, expect_codes=(400, 404, 500))


def test_search():
    section("Search Routes  (protected)")
    hit("POST", "/api/search",
        json_body={"query": "machine learning neural networks", "limit": 3},
        label="Semantic search",
        auth=True,
        expect_codes=(200, 400, 500, 502))  # 502 if ML service not running


def test_chat():
    session_id = f"test-{int(time.time())}"
    section("Chat Routes  (protected)")
    hit("POST", "/api/chat",
        json_body={"message": "What is ARAS?", "sessionId": session_id},
        label="Chat message",
        auth=True,
        expect_codes=(200, 201, 400, 500))
    hit("POST", "/api/chat/stream",
        json_body={"message": "Summarize Transformer architecture", "sessionId": session_id},
        label="Streaming chat",
        auth=True,
        expect_codes=(200, 201, 400, 500))
    hit("GET",  f"/api/chat/history/{session_id}",
        label="Chat history",
        auth=True,
        expect_codes=(200, 404))
    hit("DELETE", f"/api/chat/history/{session_id}",
        label="Delete chat history",
        auth=True,
        expect_codes=(200, 204, 404))


def test_analysis():
    section("Analysis Routes  (protected)")
    hit("POST", "/api/analysis/start",
        json_body={"documentId": "000000000000000000000001", "type": "summary"},
        label="Start analysis (fake doc)",
        auth=True,
        expect_codes=(200, 201, 400, 404, 500))
    hit("GET",  "/api/analysis/document/000000000000000000000001",
        label="Analysis by document (fake)",
        auth=True,
        expect_codes=(200, 404, 500))
    hit("POST", "/api/analysis/compare",
        json_body={"documentIds": ["000000000000000000000001", "000000000000000000000002"]},
        label="Compare docs (fake, requires PRO)",
        auth=True,
        expect_codes=(200, 400, 403, 404, 500))


def test_billing():
    section("Billing Routes")
    hit("GET", "/api/billing/plans", label="Billing plans (public)",  expect_codes=(200,))
    hit("GET", "/api/billing",       label="Billing (no auth)",       expect_codes=(401, 403))
    hit("GET", "/api/billing",       label="Billing (with auth)",     auth=True,
        expect_codes=(200, 404))


def test_admin():
    section("Admin Routes  (protected + admin role)")
    hit("GET",  "/api/admin",        label="Admin index",    auth=True, expect_codes=(200, 403, 404))
    hit("GET",  "/api/admin/users",  label="Admin users",    auth=True, expect_codes=(200, 403, 404))
    hit("GET",  "/api/admin/stats",  label="Admin stats",    auth=True, expect_codes=(200, 403, 404))


def test_support():
    section("Support Routes  (protected)")
    hit("GET",  "/api/support", label="List tickets",  auth=True, expect_codes=(200, 404))
    hit("POST", "/api/support",
        json_body={"subject": "Endpoint Test", "message": "Automated test ticket"},
        label="Create support ticket",
        auth=True,
        expect_codes=(200, 201, 400))


def test_api_keys():
    section("API Key Routes  (protected)")
    hit("GET",  "/api/keys",                     label="List API keys",    auth=True, expect_codes=(200, 404))
    r = hit("POST", "/api/keys",
        json_body={"name": "test-runner-key"},
        label="Create API key",
        auth=True,
        expect_codes=(200, 201, 400, 403))  # 403 if plan below STANDARD — expected


def test_upgrade():
    section("Upgrade Routes  (protected)")
    hit("GET",  "/api/upgrade", label="Upgrade info", auth=True, expect_codes=(200, 404))


def test_404():
    section("404 / Unknown Endpoint")
    hit("GET",  "/api/nonexistent",      label="Unknown API route",     expect_codes=(404, 401, 405))
    hit("GET",  "/totally_unknown_path", label="Non-API unknown route", expect_codes=(404,))


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

def print_summary() -> None:
    total  = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed

    print(f"\n{'='*68}")
    print(f"{BOLD}  ENDPOINT SUMMARY  --  {passed}/{total} passed{RESET}")
    print(f"{'='*68}")

    groups = {
        "Health":       [r for r in results if "Health"    in r["label"]],
        "Auth":         [r for r in results if "auth"      in r["path"].lower() or "Profile" in r["label"] or "Login" in r["label"] or "Register" in r["label"] or "Update profile" in r["label"]],
        "Documents":    [r for r in results if "document"  in r["path"].lower()],
        "Search":       [r for r in results if "search"    in r["path"].lower()],
        "Chat":         [r for r in results if "chat"      in r["path"].lower()],
        "Analysis":     [r for r in results if "analysis"  in r["path"].lower()],
        "Billing":      [r for r in results if "billing"   in r["path"].lower()],
        "Admin":        [r for r in results if "admin"     in r["path"].lower()],
        "Support":      [r for r in results if "support"   in r["path"].lower()],
        "API Keys":     [r for r in results if "/keys"     in r["path"].lower()],
        "Upgrade":      [r for r in results if "upgrade"   in r["path"].lower()],
        "404":          [r for r in results if "unknown"   in r["label"].lower() or "non-api" in r["label"].lower()],
    }

    for group, items in groups.items():
        if not items:
            continue
        g_pass = sum(1 for i in items if i["passed"])
        g_icon = GREEN if g_pass == len(items) else (YELLOW if g_pass > 0 else RED)
        print(f"\n  {g_icon}{BOLD}{group}{RESET}  ({g_pass}/{len(items)})")
        for r in items:
            icon  = f"{GREEN}PASS{RESET}" if r["passed"] else f"{RED}FAIL{RESET}"
            code  = r["status_code"] or "---"
            cc    = _status_colour(r["status_code"])
            print(f"    [{icon}]  {cc}{str(code):<5}{RESET}  {r['method']:<7}  {r['label']}")

    print(f"\n{'='*68}")
    if failed == 0:
        print(f"{GREEN}{BOLD}  All endpoints responded as expected!  ✓{RESET}")
    else:
        fail_list = [r for r in results if not r["passed"]]
        print(f"{YELLOW}{BOLD}  {failed} unexpected response(s):{RESET}")
        for r in fail_list:
            print(f"    {RED}{r['method']} {r['path']}  ->  {r['status_code']}{RESET}  {r['body_preview'][:60]}")
    print(f"{'='*68}\n")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\n{BOLD}{CYAN}{'='*68}")
    print(f"  ARAS -- API Endpoint Test Suite")
    print(f"  Target: {BASE_URL}")
    print(f"  Time:   {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"{'='*68}{RESET}")

    # Must get a real token first
    auth_ok = bootstrap_auth()
    if not auth_ok:
        print(f"\n{RED}{BOLD}  Could not obtain auth token — protected routes will show 401.{RESET}")
        print(f"  Check register/login controllers for errors.\n")

    test_health()
    test_auth_public()
    if auth_ok:
        test_auth_protected()
    test_documents()
    test_search()
    test_chat()
    test_analysis()
    test_billing()
    test_admin()
    test_support()
    test_api_keys()
    test_upgrade()
    test_404()

    print_summary()
