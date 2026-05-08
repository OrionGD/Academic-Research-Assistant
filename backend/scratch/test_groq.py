import asyncio
from groq import AsyncGroq
import os
from dotenv import load_dotenv

load_dotenv()

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_CHAT_MODEL", "llama-3.1-8b-instant")
    
    print(f"Testing Groq with key: {api_key[:10]}...")
    print(f"Model: {model}")
    
    client = AsyncGroq(api_key=api_key)
    try:
        completion = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.3
        )
        print("Response received:")
        print(completion.choices[0].message.content)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
