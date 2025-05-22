
from typing import Dict, Any, List
from .openai_service import generate_chat_completion

async def generate_response(
    system_prompt: str,
    user_message: str,
    api_key: str,
    temperature: float = 0.7
) -> str:
    """
    Generate a response to the user's message using OpenAI's API.
    """
    try:
        # Prepare the messages for the API call
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        # Generate the response
        response = await generate_chat_completion(
            messages=messages,
            api_key=api_key,
            temperature=temperature,
            model="gpt-4o"  # Use a more capable model for response generation
        )
        
        return response
    
    except Exception as e:
        print(f"Error generating response: {e}")
        return "I'm sorry, I encountered an error while processing your request. Please try again later."
