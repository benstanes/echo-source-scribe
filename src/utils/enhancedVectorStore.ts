
import { SourceDocument } from './agentTypes';
import { openAIService } from './openAIService';
import { toast } from '@/components/ui/sonner';

/**
 * Enhanced vector store that uses real embeddings from OpenAI
 */
export class EnhancedVectorStore {
  private documents: SourceDocument[] = [];
  
  /**
   * Adds a document to the vector store with real embeddings
   */
  async addDocument(document: SourceDocument): Promise<void> {
    try {
      // Generate real vector embeddings using OpenAI
      if (!openAIService.hasApiKey()) {
        throw new Error("OpenAI API key is not set");
      }
      
      const embeddings = await openAIService.generateEmbeddings(document.chunks);
      
      // Store the document with its vectors
      this.documents.push({
        ...document,
        vectors: embeddings
      });
      
      console.log(`Added document "${document.title}" to vector store with real embeddings`);
    } catch (error) {
      console.error("Error adding document to vector store:", error);
      toast.error("Failed to process document. Please check your API key and try again.");
      throw error;
    }
  }
  
  /**
   * Removes a document from the store
   */
  removeDocument(url: string): void {
    this.documents = this.documents.filter(doc => doc.url !== url);
    console.log(`Removed document with URL ${url} from vector store`);
  }
  
  /**
   * Searches the vector store for relevant content using cosine similarity
   */
  async search(query: string): Promise<{ content: string, url: string, title: string }[]> {
    console.log(`Searching for: "${query}"`);
    
    if (this.documents.length === 0) {
      return [];
    }
    
    try {
      if (!openAIService.hasApiKey()) {
        throw new Error("OpenAI API key is not set");
      }
      
      // Convert the query to a vector embedding
      const queryEmbedding = (await openAIService.generateEmbeddings([query]))[0];
      
      // Find similar vectors using cosine similarity
      const results: { content: string, url: string, title: string, similarity: number }[] = [];
      
      for (const document of this.documents) {
        if (!document.vectors) continue;
        
        for (let i = 0; i < document.chunks.length; i++) {
          const chunk = document.chunks[i];
          const vector = document.vectors[i];
          
          if (!vector) continue;
          
          // Calculate cosine similarity
          const similarity = this.cosineSimilarity(queryEmbedding, vector);
          
          if (similarity > 0.7) { // Threshold for relevance
            results.push({
              content: chunk,
              url: document.url,
              title: document.title,
              similarity: similarity
            });
          }
        }
      }
      
      // Sort by similarity score and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(({ content, url, title }) => ({ content, url, title }));
    } catch (error) {
      console.error("Error searching vector store:", error);
      
      // Fallback to simple keyword search if API fails
      return this.keywordSearch(query);
    }
  }
  
  /**
   * Simple keyword search as fallback method
   */
  private keywordSearch(query: string): { content: string, url: string, title: string }[] {
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
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ content, url, title }) => ({ content, url, title }));
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
export const enhancedVectorStore = new EnhancedVectorStore();
