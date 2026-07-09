import os
import json
import math
import time
import requests
from abc import ABC, abstractmethod

# Abstract Base Class for AI Providers
class AIProvider(ABC):
    @abstractmethod
    def generate_questions(self, system_prompt: str, user_prompt: str) -> str:
        """Generates raw text response (expected to be JSON format) for question generation."""
        pass

    @abstractmethod
    def get_embeddings(self, texts: list) -> list:
        """Returns a list of vector embeddings for the provided list of texts."""
        pass

    @abstractmethod
    def classify_bloom_level(self, question_text: str) -> str:
        """Classifies a question's Bloom's Taxonomy cognitive level."""
        pass

    @abstractmethod
    def estimate_difficulty(self, question_text: str) -> str:
        """Estimates the question's difficulty level."""
        pass


# Hugging Face Inference API Provider
class HuggingFaceProvider(AIProvider):
    def __init__(self, api_key: str = None, endpoint_url: str = None):
        self.api_key = api_key or os.getenv('HF_API_KEY')
        self.endpoint_url = endpoint_url or "https://api-inference.huggingface.co/models/"

    def generate_questions(self, system_prompt: str, user_prompt: str) -> str:
        # Import from routes.ai first so that test mocks work
        try:
            from app.routes.ai import InferenceClient
        except ImportError:
            from huggingface_hub import InferenceClient

        model_id = os.getenv('HF_MODEL_QP', 'Qwen/Qwen2.5-7B-Instruct')
        client = InferenceClient(model=model_id, token=self.api_key)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        output = client.chat_completion(messages=messages, max_tokens=2500, temperature=0.5)
        generated_text = output.choices[0].message.content.strip()
        
        # Clean up any potential markdown wraps
        if "```json" in generated_text:
            generated_text = generated_text.split("```json")[1].split("```")[0].strip()
        elif "```" in generated_text:
            generated_text = generated_text.split("```")[1].split("```")[0].strip()
            
        return generated_text.strip()

    def get_embeddings(self, texts: list) -> list:
        try:
            from app.routes.ai import InferenceClient
        except ImportError:
            from huggingface_hub import InferenceClient

        model_id = os.getenv('HF_MODEL_DUP', 'sentence-transformers/all-MiniLM-L6-v2')
        client = InferenceClient(model=model_id, token=self.api_key)
        
        embeddings = []
        for text in texts:
            try:
                emb = client.feature_extraction(text)
                # Normalize structure
                if len(emb) == 1 and isinstance(emb[0], list):
                    emb = emb[0]
                embeddings.append(emb)
            except Exception:
                time.sleep(1)
                try:
                    emb = client.feature_extraction(text)
                    if len(emb) == 1 and isinstance(emb[0], list):
                        emb = emb[0]
                    embeddings.append(emb)
                except Exception:
                    embeddings.append([0.0] * 384)
        return embeddings

    def classify_bloom_level(self, question_text: str) -> str:
        from .bloom_service import classify_bloom_level as kw_classify
        return kw_classify(question_text)

    def estimate_difficulty(self, question_text: str) -> str:
        from .bloom_service import map_to_difficulty, classify_bloom_level
        return map_to_difficulty(classify_bloom_level(question_text))


# Google Gemini Provider
class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = None, endpoint_url: str = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')

    def generate_questions(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\nUser Request: {user_prompt}"
                }]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=60)
        if response.status_code != 200:
            raise Exception(f"Gemini API generation failed: {response.text}")
            
        res_data = response.json()
        try:
            text = res_data['candidates'][0]['content']['parts'][0]['text']
        except KeyError:
            raise Exception(f"Unexpected Gemini API response structure: {res_data}")
            
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return text

    def get_embeddings(self, texts: list) -> list:
        if not self.api_key:
            return [[0.0] * 768] * len(texts)
            
        embeddings = []
        for text in texts:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key={self.api_key}"
            payload = {
                "model": "models/embedding-001",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            response = requests.post(url, json=payload, timeout=20)
            if response.status_code == 200:
                emb = response.json().get('embedding', {}).get('values', [])
                embeddings.append(emb)
            else:
                embeddings.append([0.0] * 768)
        return embeddings

    def classify_bloom_level(self, question_text: str) -> str:
        from .bloom_service import classify_bloom_level as kw_classify
        return kw_classify(question_text)

    def estimate_difficulty(self, question_text: str) -> str:
        from .bloom_service import map_to_difficulty, classify_bloom_level
        return map_to_difficulty(classify_bloom_level(question_text))


# On-Premise OpenAI-Compatible Provider (e.g. vLLM, Ollama, Local llama.cpp)
class OnPremiseProvider(AIProvider):
    def __init__(self, api_key: str = None, endpoint_url: str = None):
        self.endpoint_url = endpoint_url or os.getenv('LOCAL_AI_URL', 'http://localhost:11434/v1')
        self.api_key = api_key or os.getenv('LOCAL_AI_KEY', '')

    def _get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def generate_questions(self, system_prompt: str, user_prompt: str) -> str:
        url = f"{self.endpoint_url.rstrip('/')}/chat/completions"
        model = os.getenv('LOCAL_AI_MODEL', 'qwen2.5-7b')
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload, timeout=90)
            if response.status_code != 200:
                raise Exception(f"On-Premise server failed ({response.status_code}): {response.text}")
            
            res_data = response.json()
            text = res_data['choices'][0]['message']['content'].strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return text
        except Exception as e:
            fallback_url = f"{self.endpoint_url.rstrip('/')}/completions"
            payload_raw = {
                "model": model,
                "prompt": f"System: {system_prompt}\nUser: {user_prompt}\nAssistant:",
                "max_tokens": 1500
            }
            response = requests.post(fallback_url, headers=self._get_headers(), json=payload_raw, timeout=90)
            if response.status_code != 200:
                raise Exception(f"On-Premise raw fallback failed: {response.text}")
            return response.json()['choices'][0]['text'].strip()

    def get_embeddings(self, texts: list) -> list:
        url = f"{self.endpoint_url.rstrip('/')}/embeddings"
        model = os.getenv('LOCAL_AI_EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
        
        embeddings = []
        for text in texts:
            payload = {
                "model": model,
                "input": text
            }
            try:
                response = requests.post(url, headers=self._get_headers(), json=payload, timeout=20)
                if response.status_code == 200:
                    emb = response.json().get('data', [{}])[0].get('embedding', [])
                    embeddings.append(emb)
                else:
                    embeddings.append([0.0] * 384)
            except Exception:
                embeddings.append([0.0] * 384)
        return embeddings

    def classify_bloom_level(self, question_text: str) -> str:
        from .bloom_service import classify_bloom_level as kw_classify
        return kw_classify(question_text)

    def estimate_difficulty(self, question_text: str) -> str:
        from .bloom_service import map_to_difficulty, classify_bloom_level
        return map_to_difficulty(classify_bloom_level(question_text))


# Helper Factory function to retrieve active AI Provider based on settings
def get_active_ai_provider(db_settings: dict = None) -> AIProvider:
    provider_name = "HUGGING_FACE"
    endpoint_url = None
    
    if db_settings:
        provider_name = db_settings.get("active_ai_provider", "HUGGING_FACE")
        endpoint_url = db_settings.get("ai_endpoint_url", None)
    else:
        provider_name = os.getenv('ACTIVE_AI_PROVIDER', 'HUGGING_FACE')
        endpoint_url = os.getenv('AI_ENDPOINT_URL', None)
        
    if provider_name == "GEMINI":
        return GeminiProvider(endpoint_url=endpoint_url)
    elif provider_name == "ON_PREMISE":
        return OnPremiseProvider(endpoint_url=endpoint_url)
    else:
        return HuggingFaceProvider(endpoint_url=endpoint_url)
