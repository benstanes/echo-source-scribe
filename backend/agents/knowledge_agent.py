
from typing import Dict, List, Any, Optional
import os
import json
import numpy as np
import asyncio
from .openai_service import generate_embeddings

# In-memory vector store for simplicity
# In a production app, use a proper vector database like Pinecone, Weaviate, etc.
documents = []
document_embeddings = []

async def add_to_knowledge_base(document: Dict[str, Any], api_key: str) -> None:
    """
    Add a document to the knowledge base with embeddings.
    """
    global documents, document_embeddings
    
    # Generate embeddings for each chunk
    for i, chunk in enumerate(document['chunks']):
        try:
            embedding = await generate_embeddings(chunk, api_key)
            
            # Store the embedding and document chunk
            documents.append({
                'url': document['url'],
                'title': document['title'],
                'content': chunk,
                'chunk_id': i
            })
            document_embeddings.append(embedding)
        
        except Exception as e:
            print(f"Error generating embedding for chunk {i}: {e}")
            # Continue with other chunks even if one fails

async def search_knowledge_base(
    query: str, 
    top_k: int = 3, 
    api_key: str = None
) -> List[Dict[str, Any]]:
    """
    Search the knowledge base for chunks similar to the query.
    Returns top_k most relevant chunks.
    """
    global documents, document_embeddings
    
    # If knowledge base is empty, return empty list
    if not documents or not document_embeddings:
        return []
    
    try:
        # Generate embedding for the query
        query_embedding = await generate_embeddings(query, api_key)
        
        # Calculate similarities using cosine similarity
        similarities = cosine_similarity(query_embedding, document_embeddings)
        
        # Get indices of top_k results
        similarity_threshold = 0.6  # Lower threshold to be more inclusive
        
        # Get all indices where similarity is above threshold
        above_threshold_indices = [
            i for i, sim in enumerate(similarities)
            if sim > similarity_threshold
        ]
        
        # If no results above threshold, take the top 3 anyway
        if not above_threshold_indices:
            top_indices = np.argsort(similarities)[-top_k:][::-1]
        else:
            # Sort by similarity and take top_k
            top_indices = sorted(
                above_threshold_indices, 
                key=lambda i: similarities[i], 
                reverse=True
            )[:top_k]
        
        # Return the top documents
        return [documents[i] for i in top_indices]
    
    except Exception as e:
        print(f"Error searching knowledge base: {e}")
        
        # Fallback: return recent documents if embeddings fail
        if documents:
            return documents[-top_k:]
        return []

async def clear_knowledge_base() -> None:
    """
    Clear all documents from the knowledge base.
    """
    global documents, document_embeddings
    documents = []
    document_embeddings = []

def cosine_similarity(vec1: List[float], vecs: List[List[float]]) -> List[float]:
    """
    Calculate cosine similarity between a vector and a list of vectors.
    """
    # Convert to numpy arrays
    vec1 = np.array(vec1)
    vecs = np.array(vecs)
    
    # Normalize the vectors
    vec1_norm = np.linalg.norm(vec1)
    vecs_norm = np.linalg.norm(vecs, axis=1)
    
    # Avoid division by zero
    if vec1_norm == 0 or np.any(vecs_norm == 0):
        return [0] * len(vecs)
    
    # Calculate cosine similarity
    similarity = np.dot(vecs, vec1) / (vecs_norm * vec1_norm)
    
    return similarity.tolist()
