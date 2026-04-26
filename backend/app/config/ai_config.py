import groq
import google.generativeai as genai
from .settings import settings

# Groq Config
groq_client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)

# Gemini Config
# Prefer dedicated analysis key for generation tasks; fallback chain preserves compatibility.
_gemini_key = (
    settings.gemini_analysis_api_key.strip()
    or settings.gemini_embedding_api_key.strip()
    or settings.gemini_api_key.strip()
)
if _gemini_key:
    genai.configure(api_key=_gemini_key)

def get_groq_client():
    return groq_client

def get_gemini_model(model_name=None):
    if model_name is None:
        model_name = settings.gemini_chat_model
    return genai.GenerativeModel(model_name)
