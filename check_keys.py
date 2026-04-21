"""
ARAS -- System Runtime Controller & API Health Checker
=======================================================
Boot Order:
  1. Validate required environment variables
  2. Connect MongoDB
  3. Connect Redis (SYNC MODE fallback if down)
  4. Validate Gemini  -- embedding-2-preview + gemini-2.5-flash
  5. Validate Groq    -- llama-3.1-8b-instant (ONLY chat LLM)
  6. Optional: OpenAI, Anthropic, Firebase, SMTP

Rules:
  - Gemini = ONLY embedding provider (gemini-embedding-2-preview)
  - Groq   = ONLY chat/generation LLM
  - SDK    = google-genai  (NOT the deprecated google-generativeai)
  - Keys   = always loaded from .env / os.environ, NEVER hardcoded
"""

import os
import sys
import smtplib

# ── Force UTF-8 on Windows terminals ──────────────────────────────────────────
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── ANSI colours ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

results: list[tuple[str, bool, str]] = []
SYNC_MODE = False   # set True if Redis is unavailable


def ok(service: str, detail: str = "") -> None:
    results.append((service, True, detail))
    print(f"  {GREEN}OK  {service}{RESET}  {YELLOW}{detail}{RESET}")


def fail(service: str, detail: str = "") -> None:
    results.append((service, False, detail))
    print(f"  {RED}FAIL  {service}{RESET}  {detail}")


def warn(msg: str) -> None:
    print(f"  {YELLOW}WARN  {msg}{RESET}")


def section(title: str) -> None:
    print(f"\n{CYAN}{BOLD}>>  {title}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Validate required environment variables
# ══════════════════════════════════════════════════════════════════════════════
REQUIRED_VARS = [
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "MONGODB_URI",
    "REDIS_HOST",
    "REDIS_PORT",
    "JWT_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
]

OPTIONAL_VARS = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]


def validate_env() -> bool:
    section("STEP 1 — Environment Variable Validation")
    missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
    for var in REQUIRED_VARS:
        val = os.getenv(var, "")
        if val:
            print(f"  {GREEN}SET{RESET}  {var}")
        else:
            print(f"  {RED}MISSING{RESET}  {var}")
    for var in OPTIONAL_VARS:
        val = os.getenv(var, "")
        status = f"{GREEN}SET{RESET}" if val else f"{YELLOW}NOT SET (optional){RESET}"
        print(f"  {status}  {var}")

    if missing:
        print(f"\n{RED}{BOLD}  SYSTEM NOT INITIALIZED: Missing required API keys: {', '.join(missing)}{RESET}")
        return False
    print(f"\n  {GREEN}All required variables present.{RESET}")
    return True


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 — MongoDB Atlas
# ══════════════════════════════════════════════════════════════════════════════
def check_mongodb() -> bool:
    section("STEP 2 — MongoDB Atlas")
    uri = os.getenv("MONGODB_URI", "")
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        client = MongoClient(uri, server_api=ServerApi("1"), serverSelectionTimeoutMS=6000)
        info = client.server_info()
        ok("MongoDB", f"version {info.get('version', '?')}")
        client.close()
        return True
    except ImportError:
        fail("MongoDB", "pymongo not installed  ->  pip install pymongo")
    except Exception as e:
        fail("MongoDB", str(e)[:120])
    return False


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Redis (SYNC MODE fallback)
# ══════════════════════════════════════════════════════════════════════════════
def check_redis() -> None:
    global SYNC_MODE
    section("STEP 3 — Redis")
    host = os.getenv("REDIS_HOST", "127.0.0.1")
    port = int(os.getenv("REDIS_PORT", 6379))
    try:
        import redis
        r = redis.Redis(host=host, port=port, socket_connect_timeout=4)
        r.ping()
        ok("Redis", f"Connected to {host}:{port}")
    except ImportError:
        fail("Redis", "redis not installed  ->  pip install redis")
        SYNC_MODE = True
    except Exception as e:
        SYNC_MODE = True
        warn(f"Redis unavailable ({str(e)[:80]}) -- switching to SYNC MODE (RAG still works, queues disabled)")
        results.append(("Redis [SYNC MODE]", False, "Background queues disabled"))


# ══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Gemini: Embedding + Generative  (google-genai SDK)
#   Embedding provider: gemini-embedding-2-preview  (Matryoshka, dim=768)
#   Fallback embedding: gemini-embedding-001
#   Generative check:  gemini-2.5-flash
# ══════════════════════════════════════════════════════════════════════════════
def check_gemini() -> tuple[bool, bool]:
    """Returns (embedding_ok, generative_ok)"""
    section("STEP 4 — Gemini (Embedding + Generative)  [google-genai SDK]")
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        fail("Gemini", "GEMINI_API_KEY not set"); return False, False

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        fail("Gemini", "google-genai not installed  ->  pip install google-genai")
        return False, False

    client = genai.Client(api_key=key)
    embed_ok = False
    gen_ok   = False

    # 4a. List models
    try:
        models = list(client.models.list())
        ok("Gemini (Model List)", f"{len(models)} models available")
    except Exception as e:
        fail("Gemini (Model List)", str(e)[:120])

    # 4b. Embedding check  (ARAS CRITICAL -- only Gemini provider)
    primary_embed  = "gemini-embedding-2-preview"
    fallback_embed = "gemini-embedding-001"

    try:
        response = client.models.embed_content(
            model=primary_embed,
            contents="hello world",
            config=types.EmbedContentConfig(output_dimensionality=768),
        )
        vector = response.embeddings[0].values
        ok("Gemini (Embedding)", f"Model: {primary_embed} | Dim: {len(vector)}")
        embed_ok = True
    except Exception as primary_err:
        warn(f"Primary embedding model failed ({str(primary_err)[:60]}), trying fallback...")
        try:
            response = client.models.embed_content(
                model=fallback_embed,
                contents="hello world",
            )
            vector = response.embeddings[0].values
            ok("Gemini (Embedding)", f"Fallback: {fallback_embed} | Dim: {len(vector)}")
            embed_ok = True
        except Exception as e:
            fail("Gemini (Embedding)", str(e)[:120])

    # 4c. Generative check  (NON-CRITICAL for ARAS -- Groq handles chat)
    gen_model = "gemini-2.5-flash"
    try:
        resp = client.models.generate_content(
            model=gen_model,
            contents="Say HELLO in exactly one word.",
        )
        text = resp.text.strip() if resp.text else "EMPTY"
        ok("Gemini (Generative)", f"Model: {gen_model} | Response: '{text[:60]}'")
        gen_ok = True
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            warn("Gemini (Generative): 429 quota limit -- key is VALID, free-tier cap reached (non-critical: Groq handles all chat)")
            results.append(("Gemini (Generative) [quota]", False, "Key valid, free-tier exhausted"))
        else:
            # Try gemini-2.0-flash as secondary fallback
            try:
                resp = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents="Say HELLO in exactly one word.",
                )
                text = resp.text.strip() if resp.text else "EMPTY"
                ok("Gemini (Generative)", f"Fallback: gemini-2.0-flash | Response: '{text[:60]}'")
                gen_ok = True
            except Exception as e2:
                fail("Gemini (Generative)", str(e2)[:120])

    return embed_ok, gen_ok


# ══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Groq  (ONLY chat LLM for ARAS)
# ══════════════════════════════════════════════════════════════════════════════
def check_groq() -> bool:
    section("STEP 5 — Groq Chat LLM  [ARAS Primary Chat Provider]")
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        fail("Groq", "GROQ_API_KEY not set"); return False
    try:
        from groq import Groq
        client = Groq(api_key=key)
        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Say HELLO in exactly one word."}],
            max_tokens=10,
        )
        text = chat.choices[0].message.content.strip()
        ok("Groq", f"Model: llama-3.1-8b-instant | Response: '{text[:60]}'")
        return True
    except ImportError:
        fail("Groq", "groq not installed  ->  pip install groq")
    except Exception as e:
        fail("Groq", str(e)[:120])
    return False


# ══════════════════════════════════════════════════════════════════════════════
# OPTIONAL — OpenAI  (fallback LLM only, never used if Groq is healthy)
# ══════════════════════════════════════════════════════════════════════════════
def check_openai() -> None:
    section("OPTIONAL — OpenAI  [Fallback LLM]")
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        warn("OPENAI_API_KEY not set (optional fallback -- skipping)"); return
    try:
        from openai import OpenAI
        client = OpenAI(api_key=key)
        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say HELLO in exactly one word."}],
            max_tokens=10,
        )
        text = chat.choices[0].message.content.strip()
        ok("OpenAI (fallback)", f"Response: '{text[:60]}'")
    except ImportError:
        fail("OpenAI (fallback)", "openai not installed  ->  pip install openai")
    except Exception as e:
        fail("OpenAI (fallback)", str(e)[:120])


# ══════════════════════════════════════════════════════════════════════════════
# OPTIONAL — Anthropic  (fallback LLM only)
# ══════════════════════════════════════════════════════════════════════════════
def check_anthropic() -> None:
    section("OPTIONAL — Anthropic Claude  [Fallback LLM]")
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        warn("ANTHROPIC_API_KEY not set (optional fallback -- skipping)"); return
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)
        msg = client.messages.create(
            model="claude-haiku-20240307",
            max_tokens=20,
            messages=[{"role": "user", "content": "Say HELLO in exactly one word."}],
        )
        text = msg.content[0].text.strip()
        ok("Anthropic (fallback)", f"Response: '{text[:60]}'")
    except ImportError:
        fail("Anthropic (fallback)", "anthropic not installed  ->  pip install anthropic")
    except Exception as e:
        fail("Anthropic (fallback)", str(e)[:120])


# ══════════════════════════════════════════════════════════════════════════════
# OPTIONAL — Firebase Admin
# ══════════════════════════════════════════════════════════════════════════════
def check_firebase() -> None:
    section("OPTIONAL — Firebase Admin")
    project_id   = os.getenv("FIREBASE_PROJECT_ID", "")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    private_key  = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")

    if not all([project_id, client_email, private_key]):
        warn("FIREBASE_* vars not set -- skipping"); return
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        app_name = "aras_checker"
        try:
            app = firebase_admin.get_app(app_name)
        except ValueError:
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            app = firebase_admin.initialize_app(cred, name=app_name)
        auth.list_users(app=app, max_results=1)
        ok("Firebase Admin", f"project={project_id}  auth OK")
    except ImportError:
        fail("Firebase Admin", "firebase-admin not installed  ->  pip install firebase-admin")
    except Exception as e:
        fail("Firebase Admin", str(e)[:120])


# ══════════════════════════════════════════════════════════════════════════════
# OPTIONAL — SMTP (Mailtrap)
# ══════════════════════════════════════════════════════════════════════════════
def check_smtp() -> None:
    section("OPTIONAL — SMTP (Mailtrap)")
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", 2525))
    user = os.getenv("SMTP_USER", "")
    pwd  = os.getenv("SMTP_PASS", "")
    if not all([host, user, pwd]):
        fail("SMTP", "SMTP_HOST / SMTP_USER / SMTP_PASS not set"); return
    try:
        with smtplib.SMTP(host, port, timeout=8) as s:
            s.starttls()
            s.login(user, pwd)
        ok("SMTP", f"{host}:{port}  login OK")
    except Exception as e:
        fail("SMTP", str(e)[:120])


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY + BOOT DECISION
# ══════════════════════════════════════════════════════════════════════════════
def print_summary(boot_ok: bool) -> None:
    total  = len(results)
    passed = sum(1 for _, f, _ in results if f)
    failed = total - passed

    print(f"\n{'='*62}")
    print(f"{BOLD}  SUMMARY  --  {passed}/{total} checks passed{RESET}")
    print(f"{'='*62}")
    for svc, ok_flag, _ in results:
        icon  = f"{GREEN}OK  {RESET}" if ok_flag else f"{RED}FAIL{RESET}"
        label = f"{GREEN}{svc}{RESET}" if ok_flag else f"{RED}{svc}{RESET}"
        print(f"  [{icon}]  {label}")

    print(f"\n{'='*62}")
    if boot_ok:
        sync_note = f"  {YELLOW}(SYNC MODE active -- Redis unavailable){RESET}" if SYNC_MODE else ""
        print(f"{GREEN}{BOLD}  SYSTEM READY -- API services may start.{RESET}{sync_note}")
    else:
        print(f"{RED}{BOLD}  SYSTEM NOT INITIALIZED -- resolve failures above before starting.{RESET}")
    print(f"{'='*62}\n")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print(f"\n{BOLD}{CYAN}{'='*62}")
    print("  ARAS -- System Runtime Controller  |  Boot Validation")
    print(f"{'='*62}{RESET}")

    # --- STEP 1: env validation (STOP if required vars missing) ---
    if not validate_env():
        sys.exit(1)

    # --- STEPS 2-5: core service checks ---
    mongo_ok  = check_mongodb()
    check_redis()                      # Redis failure -> SYNC MODE, not abort
    gemini_embed_ok, _ = check_gemini()  # Only embedding is critical for ARAS
    groq_ok   = check_groq()

    # --- OPTIONAL services ---
    check_openai()
    check_anthropic()
    check_firebase()
    check_smtp()

    # --- Boot decision: MongoDB + Gemini embedding + Groq must all pass ---
    boot_ready = mongo_ok and gemini_embed_ok and groq_ok
    print_summary(boot_ready)

    sys.exit(0 if boot_ready else 1)
