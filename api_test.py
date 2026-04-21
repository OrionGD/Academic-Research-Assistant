from google import genai

client = genai.Client(api_key="AIzaSyAbT7KAV-Sfady-PaRLQBC1Pcyphvo3DKU")

for model in client.models.list():
    print(model.name)

#
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain SQL injection attack"
)

print(response.text)
