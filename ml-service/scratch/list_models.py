
import os
import sys
from dotenv import load_dotenv
from google import genai

# Load Root .env
load_dotenv(dotenv_path="../.env")

def list_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: No GEMINI_API_KEY found in .env")
        return

    client = genai.Client(api_key=api_key)
    print("--- Available Models ---")
    try:
        for model in client.models.list():
            print(f"Name: {model.name}, Supported Actions: {model.supported_actions}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
