
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
import re

async def process_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Fetches URL content and processes it into a document format
    with title, content, and chunked text.
    """
    try:
        # Fetch the URL content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = soup.title.string if soup.title else url
        
        # Remove script, style elements and comments
        for element in soup(['script', 'style', 'header', 'footer', 'nav']):
            element.decompose()
        
        # Get the main content (focus on main content tags if available)
        main_content = soup.find('main') or soup.find('article') or soup.find('div', {'class': re.compile(r'content|main|article', re.I)})
        
        # If no main content found, use body
        if not main_content:
            main_content = soup.body
        
        # Extract text content
        if main_content:
            # Get all paragraph texts
            paragraphs = main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'li'])
            content = ' '.join([p.get_text().strip() for p in paragraphs])
        else:
            # Fallback to all visible text
            content = soup.get_text(separator=' ', strip=True)
        
        # Clean up the content (remove extra whitespace)
        content = re.sub(r'\s+', ' ', content).strip()
        
        # Create chunks with overlap
        chunks = chunk_text(content, chunk_size=500, overlap=100)
        
        # Create the document
        document = {
            'url': url,
            'title': title,
            'content': content,
            'chunks': chunks,
        }
        
        return document
    
    except Exception as e:
        print(f"Error processing URL {url}: {e}")
        return None

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks of approximately equal size.
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Find the end of the current chunk
        end = start + chunk_size
        
        # If we're at the end of the text, just take the rest
        if end >= len(text):
            chunks.append(text[start:])
            break
        
        # Try to end at a period, question mark, or exclamation point
        # Look for these within the last 100 characters of the chunk
        last_part = text[end-100:end]
        
        # Find the last sentence boundary in the last part
        boundaries = [last_part.rfind('.'), last_part.rfind('!'), last_part.rfind('?')]
        last_boundary = max(boundaries)
        
        if last_boundary != -1:
            # Adjust end to include the sentence boundary
            end = end - 100 + last_boundary + 1
        
        chunks.append(text[start:end])
        
        # Move the start position, accounting for overlap
        start = end - overlap
    
    return chunks
