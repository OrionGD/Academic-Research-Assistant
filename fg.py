from google import genai

api_key = input("Enter your Gemini API key: ").strip()

client = genai.Client(api_key=api_key)

models = client.models.list()
for m in models:
    print(m.name)