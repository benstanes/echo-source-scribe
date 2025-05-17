
import { SourceDocument, generateId } from './agentTypes';

/**
 * Fetches content from a URL and processes it for the vector store
 */
export async function fetchUrlContent(url: string): Promise<SourceDocument | null> {
  try {
    console.log(`Fetching content from ${url}`);
    
    // In a real implementation, we would use a server-side function or proxy
    // to handle CORS issues. For now, we'll simulate the response.
    
    // This is a mock implementation
    // In a production app, you would use a backend service or edge function
    const mockResponse = await simulateFetch(url);
    
    // Process the content into chunks for embedding
    const chunks = chunkContent(mockResponse.content);
    
    return {
      id: generateId(),
      url: url,
      title: mockResponse.title || url,
      content: mockResponse.content,
      timestamp: new Date(),
      chunks: chunks,
    };
  } catch (error) {
    console.error(`Error fetching URL content: ${error}`);
    return null;
  }
}

/**
 * Simulates fetching content from a URL (for demo purposes)
 */
async function simulateFetch(url: string): Promise<{ title: string, content: string }> {
  // Wait to simulate network request
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate fake content based on URL
  const domain = new URL(url).hostname;
  
  // Different mock content based on domain
  if (domain.includes('wikipedia')) {
    return {
      title: `Wikipedia Article about ${domain.split('.')[0]}`,
      content: `This is a simulated Wikipedia article about ${domain.split('.')[0]}. It contains information about the topic and has multiple paragraphs of text that would be processed and vectorized for retrieval. The main sections include an introduction, history, and key concepts. In a real implementation, this would be the actual HTML content from the page that would be cleaned and processed.`
    };
  } else if (domain.includes('github')) {
    return {
      title: `GitHub Repository: ${url.split('/').pop()}`,
      content: `This is a simulated GitHub repository page. It contains code documentation, README information, and other details about the project. The repository includes information about installation, usage examples, and API documentation. This is just a simulation of what actual content would be extracted from the real page.`
    };
  } else {
    return {
      title: `Content from ${domain}`,
      content: `This is simulated content from ${domain}. In a real implementation, we would fetch the actual HTML content of the page, extract the main text content, and process it for use in our vector database. The page might contain articles, product information, or other text that would be relevant to user queries.`
    };
  }
}

/**
 * Splits content into chunks suitable for embedding
 */
function chunkContent(content: string): string[] {
  // Simple chunking by splitting on paragraphs and limiting chunk size
  // In a real implementation, this would be more sophisticated
  const paragraphs = content.split('\n\n');
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > 500) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
