import asyncio
import traceback
import json
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

prompt = """You are an expert academic paper analysis AI. Analyze the provided research paper text and extract structured information.

Return a JSON object with these exact fields:
- summary: A comprehensive 2-3 paragraph summary of the paper
- methodology: Description of the research methodology used
- keyContributions: An array of 5-8 key contributions or findings (strings)
- keyConcepts: An array of objects with { "term": string, "definition": string } for core terminology
- importantQuotes: An array of objects with { "text": string, "page": number/string } for critical verbatim quotes
- results: Main results and findings (2-3 paragraphs)
- limitations: Known limitations acknowledged in the paper
- confidenceScore: Your confidence in this analysis (0.0 to 1.0)


Research Paper Text:
---
Abstract: This paper presents the Academic Research Assistant System (ARAS), a multi-tenant platform for AI-driven research analysis. 
Methodology: We used a FastAPI backend for ML processing and an Express.js backend for orchestration. 
Summary: The system leverages Gemini 2.0 Flash for structured insights and vector embeddings for semantic search. 
Key Contributions: Efficient scaling of research workflows and multi-agent synergy.
Important Quote: "AI is the ultimate tool for academic acceleration," said the lead researcher on page 5.
---

Return ONLY valid JSON, no markdown fences."""

async def test_api():
    try:
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash", # user requested Gemini 3.1 Pro? No, setting said Gemini 3.1 Pro (High), wait, Gemini 3 
            # actually I'll test 2.0-flash first
            contents=prompt,
            config={
                "temperature": 0.2,
            }
        )
        print("Success!")
        print(response.text)
    except Exception as e:
        print("FAILED!")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api())
