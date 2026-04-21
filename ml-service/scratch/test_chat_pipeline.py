
import asyncio
import os
import sys

# Add the parent directory to sys.path so we can import modules properly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipelines.chat import chat_pipeline
from services.config import CHAT_MODEL
from services.db import connect_to_mongo, close_mongo_connection

async def test_chat():
    print(f"--- Starting ML Chat Pipeline Test ---")
    await connect_to_mongo()
    print(f"Model: {CHAT_MODEL}")
    
    mock_user_id = "60f7c2a5e4b0f2a5e4b0f2a5" # Valid 24-char hex
    message = "Hello! Can you tell me what your primary function is as ARAS?"
    
    try:
        print(f"Sending message: '{message}'")
        response = await chat_pipeline(message, user_id=mock_user_id)
        
        print("\n--- RESPONSE ---")
        print(f"ID: {response['message']['id']}")
        print(f"Role: {response['message']['role']}")
        print(f"Content:\n{response['message']['content']}")
        print("\n--- METADATA ---")
        print(f"Context Chunks Used: {response['contextChunksUsed']}")
        print(f"Citations: {len(response['citations'])}")
        
        if response['message']['content']:
            print("\nSUCCESS: Chat pipeline responded correctly.")
        else:
            print("\nFAILURE: Chat pipeline returned an empty response.")
            
    except Exception as e:
        print(f"\nERROR during chat pipeline execution: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_chat())
