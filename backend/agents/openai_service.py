
import openai
from typing import List, Dict, Any

async def validate_api_key(api_key: str) -> bool:
    """Validate an OpenAI API key by making a simple request."""
    try:
        # Set the API key
        client = openai.OpenAI(api_key=api_key)
        
        # Make a simple request to validate the key
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, this is a test."}
            ],
            max_tokens=10
        )
        
        # If we get here without an exception, the key is valid
        return True
    
    except Exception as e:
        print(f"API key validation error: {e}")
        return False

async def generate_embeddings(text: str, api_key: str) -> List[float]:
    """Generate embeddings for the given text using OpenAI's API."""
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise

async def generate_chat_completion(
    messages: List[Dict[str, str]],
    api_key: str,
    temperature: float = 0.7,
    model: str = "gpt-4o-mini"
) -> str:
    """Generate a completion using OpenAI's Chat Completion API."""
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating chat completion: {e}")
        raise
