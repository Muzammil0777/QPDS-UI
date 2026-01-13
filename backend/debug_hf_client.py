
import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()
api_key = os.getenv('HF_API_KEY')
model_id = "mistralai/Mistral-7B-Instruct-v0.2"


print(f"Testing client with token: {api_key[:5]}...")

# Test 1: Chat/Text Gen
print("\n--- Testing Qwen (Text Gen) ---")

try:
    # Qwen 2.5 7B via Chat Completion
    model_id = "Qwen/Qwen2.5-7B-Instruct"
    client = InferenceClient(model=model_id, token=api_key)
    # Using chat_completion API
    out = client.chat_completion(messages=[{"role": "user", "content": "Hello, generate a JSON example."}], max_tokens=20)
    print(f"Qwen Chat Success! Content: {out.choices[0].message.content}")
except Exception as e:
    print(f"Qwen Chat Error: {e}")


# Test 2: MiniLM (Embeddings)
print("\n--- Testing MiniLM (Embeddings) ---")
try:
    client_emb = InferenceClient(model="sentence-transformers/all-MiniLM-L6-v2", token=api_key)
    emb = client_emb.feature_extraction("Test sentence")
    print(f"MiniLM Success! Embedding shape: {len(emb)}")
except Exception as e:
    print(f"MiniLM Error: {e}")


