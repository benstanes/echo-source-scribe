
# Multi-Agent Chatbot Backend

This is a FastAPI backend for the Multi-Agent Chatbot system.

## Setup

1. Install dependencies:
```
pip install -r requirements.txt
```

2. Run the server:
```
uvicorn main:app --reload
```

The server will be available at http://localhost:8000

## API Endpoints

- POST `/api/validate-key`: Validate an OpenAI API key
- POST `/api/process-url`: Process a URL and add to knowledge base
- POST `/api/send-message`: Send a message to the chatbot
- POST `/api/clear-knowledge`: Clear all knowledge sources
- GET `/api/messages`: Get all chat messages

## Project Structure

- `main.py`: FastAPI application with API endpoints
- `agents/`: Contains the agent modules
  - `source_agent.py`: Handles URL processing
  - `knowledge_agent.py`: Manages the knowledge base
  - `response_agent.py`: Generates responses to user queries
  - `openai_service.py`: Handles OpenAI API calls
