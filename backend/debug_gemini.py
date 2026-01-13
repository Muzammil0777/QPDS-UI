
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

print(f"Using API Key: {api_key[:5]}...{api_key[-3:]}")

genai.configure(api_key=api_key)

print("\nListing available models:")
try:
    available = False
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            available = True
    
    if not available:
        print("No models found that support generateContent.")
        
except Exception as e:
    print(f"Error listing models: {e}")
