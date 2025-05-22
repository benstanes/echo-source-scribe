
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime
import asyncio

# Import agent modules
from agents.source_agent import process_url
from agents.knowledge_agent import add_to_knowledge_base, search_knowledge_base, clear_knowledge_base
from agents.response_agent import generate_response
from agents.openai_service import validate_api_key

app = FastAPI(title="Multi-Agent Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ApiKeyRequest(BaseModel):
    api_key: str

class UrlRequest(BaseModel):
    url: str
    api_key: str

class MessageRequest(BaseModel):
    message: str
    api_key: str

class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    sourceUrl: Optional[str] = None

# Global storage (for demo purposes - use a real database in production)
openai_api_key = None
messages_history = []

@app.post("/api/validate-key")
async def validate_key(request: ApiKeyRequest):
    try:
        is_valid = await validate_api_key(request.api_key)
        if is_valid:
            global openai_api_key
            openai_api_key = request.api_key
            return {"valid": True}
        return {"valid": False}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-url")
async def process_source(request: UrlRequest):
    if not openai_api_key and request.api_key:
        await validate_key(ApiKeyRequest(api_key=request.api_key))
    
    if not openai_api_key:
        raise HTTPException(status_code=401, detail="API key not set")
    
    try:
        # Add user message
        user_message = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": f"I want to add this source: {request.url}",
            "timestamp": datetime.now().isoformat()
        }
        messages_history.append(user_message)
        
        # Add source manager response
        source_manager_message = {
            "id": str(uuid.uuid4()),
            "role": "source_manager",
            "content": f"I'll process this source: {request.url}",
            "timestamp": datetime.now().isoformat()
        }
        messages_history.append(source_manager_message)
        
        # Process URL and get document
        document = await process_url(request.url)
        if not document:
            error_message = {
                "id": str(uuid.uuid4()),
                "role": "knowledge_base",
                "content": f"I couldn't process the URL: {request.url}. Please check if it's correct and try again.",
                "timestamp": datetime.now().isoformat()
            }
            messages_history.append(error_message)
            return {"success": False, "messages": messages_history}
        
        # Add to knowledge base
        await add_to_knowledge_base(document, openai_api_key)
        
        # Add knowledge base response
        kb_message = {
            "id": str(uuid.uuid4()),
            "role": "knowledge_base",
            "content": f"I've processed the content from {request.url}. The document \"{document['title']}\" has been added to my knowledge base with {len(document['chunks'])} chunks of information. You can now ask questions about it!",
            "timestamp": datetime.now().isoformat(),
            "sourceUrl": request.url
        }
        messages_history.append(kb_message)
        
        # Generate summary response about the document
        summary = await generate_response(
            system_prompt=f"You are a helpful assistant that summarizes documents. Summarize the following document titled \"{document['title']}\" in a few sentences.",
            user_message=document['content'][:6000],
            api_key=openai_api_key
        )
        
        # Add response agent message
        response_message = {
            "id": str(uuid.uuid4()),
            "role": "response_agent",
            "content": f"Great! I've analyzed the content from {document['title']}. Here's a brief summary:\n\n{summary}\n\nWhat would you like to know about it?",
            "timestamp": datetime.now().isoformat()
        }
        messages_history.append(response_message)
        
        return {"success": True, "messages": messages_history}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-message")
async def send_message(request: MessageRequest):
    if not openai_api_key and request.api_key:
        await validate_key(ApiKeyRequest(api_key=request.api_key))
    
    if not openai_api_key:
        raise HTTPException(status_code=401, detail="API key not set")
    
    try:
        # Add user message to history
        user_message = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        }
        messages_history.append(user_message)
        
        # Check if knowledge base has documents
        knowledge_exists = await search_knowledge_base("test query", 1, openai_api_key)
        
        if not knowledge_exists:
            # If no documents, ask for source
            source_message = {
                "id": str(uuid.uuid4()),
                "role": "source_manager",
                "content": "I don't have any knowledge sources yet. Please provide a URL that I can learn from to answer your question.",
                "timestamp": datetime.now().isoformat()
            }
            messages_history.append(source_message)
            return {"success": True, "messages": messages_history}
        
        # Search knowledge base for relevant context
        search_results = await search_knowledge_base(request.message, 5, openai_api_key)
        
        # Prepare context from search results
        context = "\n\n".join([f"From {result['title']}: {result['content']}" for result in search_results])
        
        # Generate response
        system_prompt = """You are a helpful AI assistant that answers questions based on the provided context.
        Your goal is to provide accurate, detailed answers using ONLY the information in the context.
        If the exact answer isn't in the context, try to provide the most relevant information available.
        Don't say you don't have enough information or suggest providing more URLs.
        Instead, work with what you have to give the most helpful response possible."""
        
        user_prompt = f"Context:\n{context}\n\nQuestion: {request.message}\n\nProvide a detailed answer based ONLY on the information in the context."
        
        response = await generate_response(
            system_prompt=system_prompt,
            user_message=user_prompt,
            api_key=openai_api_key
        )
        
        # Add response to history
        response_message = {
            "id": str(uuid.uuid4()),
            "role": "response_agent",
            "content": response,
            "timestamp": datetime.now().isoformat(),
            "sourceUrl": search_results[0]['url'] if search_results else None
        }
        messages_history.append(response_message)
        
        return {"success": True, "messages": messages_history}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clear-knowledge")
async def clear_knowledge():
    try:
        await clear_knowledge_base()
        
        # Add message to history
        message = {
            "id": str(uuid.uuid4()),
            "role": "knowledge_base",
            "content": "I've cleared all knowledge sources from my memory. Please provide new URLs to learn from.",
            "timestamp": datetime.now().isoformat()
        }
        messages_history.append(message)
        
        return {"success": True, "messages": messages_history}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/messages")
async def get_messages():
    return {"messages": messages_history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
