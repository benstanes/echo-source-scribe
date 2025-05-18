import { SourceDocument, generateId } from './agentTypes';

/**
 * Fetches real content from a URL and processes it for the vector store
 */
export async function enhancedFetchUrlContent(url: string): Promise<SourceDocument | null> {
  try {
    console.log(`Fetching content from ${url}`);
    
    // Use a proxy service to avoid CORS issues
    // This can be replaced with a serverless function in production
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;
    
    // Enhanced HTML to text conversion
    const content = extractTextFromHtml(html);
    
    // Process the content into smaller chunks for better embedding
    const chunks = chunkContent(content);
    
    return {
      id: generateId(),
      url: url,
      title: title,
      content: content,
      timestamp: new Date(),
      chunks: chunks,
    };
  } catch (error) {
    console.error(`Error fetching URL content: ${error}`);
    
    // Fallback to mock data if real fetch fails
    return getFallbackContent(url);
  }
}

/**
 * Extract text content from HTML - Improved extraction
 */
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and HTML comments
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ') // Remove navigation
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' '); // Remove footer

  // Extract content from main, article, and content divs with higher priority
  let mainContent = '';
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const contentMatch = text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  
  if (mainMatch) mainContent += mainMatch[1] + ' ';
  if (articleMatch) mainContent += articleMatch[1] + ' ';
  if (contentMatch) mainContent += contentMatch[1] + ' ';
  
  // If we found some main content, prioritize it but still keep the rest
  const processedText = mainContent ? 
    extractTextFromHtmlFragment(mainContent) + ' ' + extractTextFromHtmlFragment(text) : 
    extractTextFromHtmlFragment(text);
  
  return processedText;
}

/**
 * Helper function to extract text from HTML fragment
 */
function extractTextFromHtmlFragment(html: string): string {
  // Remove HTML tags and decode entities
  let text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  
  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

/**
 * Splits content into smaller chunks suitable for embedding
 * Modified to create smaller, more focused chunks for better retrieval
 */
function chunkContent(content: string): string[] {
  // Create even smaller chunks with more overlap for better context matching
  const paragraphs = content.split('\n\n');
  const chunks: string[] = [];
  
  let currentChunk = '';
  const maxChunkSize = 250; // Further reduced from 300
  const overlap = 150; // Increased overlap for better context
  
  for (const paragraph of paragraphs) {
    // If paragraph itself is too long, split it further
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.split(/(?<=\.|\?|\!) /);
      let sentenceChunk = '';
      
      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length > maxChunkSize) {
          chunks.push(sentenceChunk);
          // Keep more overlap with previous chunk
          sentenceChunk = sentenceChunk.split(' ').slice(-overlap/10).join(' ') + ' ' + sentence;
        } else {
          sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
        }
      }
      
      if (sentenceChunk) {
        chunks.push(sentenceChunk);
      }
    } else if (currentChunk.length + paragraph.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // Ensure we have chunks by using the whole content if needed
  if (chunks.length === 0) {
    // Split content into chunks of maxChunkSize with overlap
    for (let i = 0; i < content.length; i += maxChunkSize - overlap) {
      chunks.push(content.substring(i, Math.min(i + maxChunkSize, content.length)));
    }
  }
  
  return chunks;
}

/**
 * Generate fallback content when real fetch fails
 */
function getFallbackContent(url: string): SourceDocument | null {
  // Generate fallback content based on URL
  try {
    const domain = new URL(url).hostname;
    
    // Different mock content based on domain
    let title, content;
    
    if (domain.includes('wikipedia')) {
      title = `Wikipedia Article about ${domain.split('.')[0]}`;
      content = `This is a simulated Wikipedia article about ${domain.split('.')[0]}. It contains information about the topic and has multiple paragraphs of text that would be processed and vectorized for retrieval. The main sections include an introduction, history, and key concepts.`;
    } else if (domain.includes('github')) {
      title = `GitHub Repository: ${url.split('/').pop()}`;
      content = `This is a simulated GitHub repository page. It contains code documentation, README information, and other details about the project. The repository includes information about installation, usage examples, and API documentation.`;
    } else {
      title = `Content from ${domain}`;
      content = `This is simulated content from ${domain}. The page might contain articles, product information, or other text that would be relevant to user queries.`;
    }
    
    // Create multiple chunks for better testing
    const chunks = [
      `${content} - Part 1: Introduction and overview.`,
      `${content} - Part 2: Details and specifications.`,
      `${content} - Part 3: Additional information and examples.`
    ];
    
    return {
      id: generateId(),
      url: url,
      title: title,
      content: content,
      timestamp: new Date(),
      chunks: chunks,
    };
  } catch (error) {
    console.error("Error creating fallback content:", error);
    return null;
  }
}
