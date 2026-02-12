"""
ARAS - Gemini API Connection Test
Compatible with google-genai >= 1.0
"""

import os
from dotenv import load_dotenv
from google import genai


def main():
    print("=" * 60)
    print("ARAS GEMINI API TEST")
    print("=" * 60)

    # Load environment variables
    load_dotenv()

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")

    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env file")
        return

    print(f"Using model: {model_name}")
    print("Connecting to Gemini...\n")

    try:
        # Initialize client
        client = genai.Client(api_key=api_key)

        # Send test request
        response = client.models.generate_content(
            model=model_name,
            contents="Say: ARAS backend is alive and operational."
        )

        print("✅ Response received:\n")
        print(response.text)

        print("\n" + "=" * 60)
        print("✅ Gemini API test PASSED")
        print("=" * 60)

    except Exception as e:
        print("\n❌ Gemini API test FAILED")
        print(f"Error: {str(e)}")
        print("=" * 60)


if __name__ == "__main__":
    main()
