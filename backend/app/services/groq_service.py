from ..config.ai_config import get_groq_client
from ..config.settings import settings
from typing import List, Dict

class GroqService:
    def __init__(self):
        self.client = get_groq_client()
        self.model = settings.GROQ_CHAT_MODEL

    async def chat_completion(self, messages: List[Dict[str, str]], stream: bool = False):
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=stream
        )
        return response
