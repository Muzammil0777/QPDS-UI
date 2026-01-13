
import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('HF_API_KEY')
if not api_key:
    # Fallback for manual run if env not picked up
    print("HF_API_KEY not found in .env")
    exit(1)

print(f"Testing HF API Key: {api_key[:4]}...{api_key[-3:]}")
headers = {"Authorization": f"Bearer {api_key}"}



# Test OpenAI-compatible Chat Completion
print("\n--- Testing Chat Completion (LLM) ---")
chat_url = "https://router.huggingface.co/v1/chat/completions"
# Phi-3 is very efficient and usually available
model_llm = "microsoft/Phi-3-mini-4k-instruct" 

chat_payload = {
    "model": model_llm,
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 10
}

try:
    resp = requests.post(chat_url, headers=headers, json=chat_payload)
    print(f"Chat Code: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Chat Success: {str(resp.json())[:100]}")
    else:
        print(f"Chat Error: {resp.text[:200]}")
except Exception as e:
    print(f"Chat Ex: {e}")

# Test Embeddings via specific feature-extraction pipeline URL on Router
print("\n--- Testing Embeddings (Router Pipeline) ---")
model_emb = "sentence-transformers/all-MiniLM-L6-v2"
emb_url = f"https://router.huggingface.co/models/{model_emb}" 
# Note: Previous test of router/models/{id} gave 404. 
# But maybe we need to NOT use /v1/embeddings but just the model URL with RAW input?
# If router supports standard inference API behavior on the model path?

emb_payload = {"inputs": "Test sentence"}

try:
    resp = requests.post(emb_url, headers=headers, json=emb_payload)
    print(f"Emb Code: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Emb Success: {str(resp.json())[:100]}")
    else:
        print(f"Emb Error: {resp.text[:200]}")
except Exception as e:
    print(f"Emb Ex: {e}")




