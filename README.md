
# Multi-Agent Adaptive Chatbot

This project implements a multi-agent chatbot system that can learn from web sources and answer questions based on that knowledge.

## Project Structure

The project consists of two main parts:

### Backend (Python FastAPI)

- Located in the `backend/` directory
- Implements the agent system using Python and FastAPI
- Handles API requests, document processing, and OpenAI API integration

### Frontend (HTML, CSS, JavaScript)

- Located in the `frontend/` directory
- Provides a responsive user interface for interacting with the chatbot
- Communicates with the backend API

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Create a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Run the FastAPI server:
```
uvicorn main:app --reload
```

The backend API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```
cd frontend
```

2. Serve the static files using any HTTP server. For example:

Using Python:
```
python -m http.server 8080
```

Using Node.js:
```
npx serve -p 8080
```

The frontend will be available at http://localhost:8080

## Using the Application

1. Open the frontend in your web browser
2. Enter your OpenAI API key when prompted
3. Add URLs to learn from using the source input
4. Ask questions about the sources using the message input
5. Clear knowledge sources if needed

## Features

- Multi-agent architecture with specialized agents:
  - Source Manager: Processes URLs
  - Knowledge Base: Stores and retrieves information
  - Response Agent: Generates answers
- Dynamic learning from web sources
- Vector-based search for relevant information retrieval
- Responsive UI for desktop and mobile

## Requirements

- Python 3.8+
- OpenAI API key
- Modern web browser
