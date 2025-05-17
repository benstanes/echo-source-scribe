
import { SourceDocument } from './agentTypes';

/**
 * Simple in-memory vector store simulation
 * In a real application, this would use actual vector embeddings and similarity search
 */
export class VectorStore {
  private documents: SourceDocument[] = [];
  
  /**
   * Adds a document to the vector store
   */
  async addDocument(document: SourceDocument): Promise<void> {
    // In a real implementation, this would generate actual vector embeddings
    // using a model like OpenAI's embeddings API or a local model
    
    // Simulate generating vector embeddings
    const simulatedVectors = document.chunks.map(() => {
      // Generate a random 10-dimensional vector for demonstration
      return Array.from({ length: 10 }, () => Math.random());
    });
    
    // Store the document with its vectors
    this.documents.push({
      ...document,
      vectors: simulatedVectors
    });
    
    console.log(`Added document "${document.title}" to vector store`);
  }
  
  /**
   * Removes a document from the store
   */
  removeDocument(url: string): void {
    this.documents = this.documents.filter(doc => doc.url !== url);
    console.log(`Removed document with URL ${url} from vector store`);
  }
  
  /**
   * Searches the vector store for relevant content
   */
  async search(query: string): Promise<{ content: string, url: string, title: string }[]> {
    console.log(`Searching for: "${query}"`);
    
    if (this.documents.length === 0) {
      return [];
    }
    
    // In a real implementation, this would:
    // 1. Convert the query to a vector embedding
    // 2. Find similar vectors using cosine similarity
    // 3. Return the corresponding text chunks
    
    // For this demo, we'll use simple keyword matching
    const results: { content: string, url: string, title: string, score: number }[] = [];
    
    const queryTerms = query.toLowerCase().split(' ');
    
    for (const document of this.documents) {
      for (let i = 0; i < document.chunks.length; i++) {
        const chunk = document.chunks[i];
        
        // Calculate a simple relevance score
        let score = 0;
        for (const term of queryTerms) {
          if (chunk.toLowerCase().includes(term)) {
            score += 1;
          }
        }
        
        if (score > 0) {
          results.push({
            content: chunk,
            url: document.url,
            title: document.title,
            score: score / queryTerms.length
          });
        }
      }
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ content, url, title }) => ({ content, url, title }));
  }
  
  /**
   * Returns all documents in the store
   */
  getDocuments(): SourceDocument[] {
    return this.documents;
  }
  
  /**
   * Checks if a URL is already in the store
   */
  hasDocument(url: string): boolean {
    return this.documents.some(doc => doc.url === url);
  }
  
  /**
   * Clears all documents from the store
   */
  clear(): void {
    this.documents = [];
    console.log('Cleared all documents from vector store');
  }
}

// Create singleton instance
export const vectorStore = new VectorStore();
