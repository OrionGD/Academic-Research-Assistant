import groq
import google.generativeai as genai
from .settings import settings

# Groq Config
groq_client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)

# Gemini Config
genai.configure(api_key=settings.GEMINI_API_KEY)

def get_groq_client():
    return groq_client

def get_gemini_model(model_name="gemini-1.5-flash"):
    return genai.GenerativeModel(model_name)
