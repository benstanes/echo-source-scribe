
import { useState } from 'react';
import { AgentRole, ChatMessage as ChatMessageType, AGENT_PROMPTS, generateId } from '@/utils/agentTypes';
import { enhancedVectorStore } from '@/utils/enhancedVectorStore';
import { enhancedFetchUrlContent } from '@/utils/enhancedFetchUrlContent';
import { openAIService } from '@/utils/openAIService';
import { toast } from '@/components/ui/sonner';

export const useChatOperations = (apiKeySet: boolean) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState<AgentRole | null>(null);
  
  const addMessage = (role: AgentRole, content: string, sourceUrl?: string) => {
    const newMessage: ChatMessageType = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      sourceUrl
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  const simulateAgentTyping = async (role: AgentRole, duration: number = 1500) => {
    setIsAgentTyping(role);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsAgentTyping(null);
  };
  
  const handleSourceSubmit = async (url: string) => {
    if (!apiKeySet) {
      toast.error("Please set your OpenAI API key first");
      return;
    }
    
    setIsProcessingSource(true);
    setCurrentUrl(url);
    
    // Add user message about adding the source
    addMessage(AgentRole.USER, `I want to add this source: ${url}`);
    
    // Source Manager responds
    await simulateAgentTyping(AgentRole.SOURCE_MANAGER);
    addMessage(AgentRole.SOURCE_MANAGER, `I'll process this source: ${url}`);
    
    // Knowledge Agent processes the source
    await simulateAgentTyping(AgentRole.KNOWLEDGE_BASE);
    
    try {
      // Use the enhanced fetch function that gets real content
      const document = await enhancedFetchUrlContent(url);
      
      if (!document) {
        addMessage(AgentRole.KNOWLEDGE_BASE, `I couldn't process the URL: ${url}. Please check if it's correct and try again.`);
        setIsProcessingSource(false);
        setCurrentUrl(null);
        return;
      }
      
      // Add to enhanced vector store with real embeddings
      await enhancedVectorStore.addDocument(document);
      
      addMessage(
        AgentRole.KNOWLEDGE_BASE, 
        `I've processed the content from ${url}. The document "${document.title}" has been added to my knowledge base with ${document.chunks.length} chunks of information. You can now ask questions about it!`,
        url
      );
      
      // Generate a response from OpenAI about the document
      const systemPrompt = `You are a helpful assistant that summarizes documents. Summarize the following document titled "${document.title}" in a few sentences.`;
      const documentSummary = await openAIService.generateChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: document.content.substring(0, 4000) } // Limit to 4000 chars
      ], 0.5);
      
      // Response Agent confirms
      await simulateAgentTyping(AgentRole.RESPONSE_AGENT);
      addMessage(
        AgentRole.RESPONSE_AGENT, 
        `Great! I've analyzed the content from ${document.title}. Here's a brief summary:\n\n${documentSummary}\n\nWhat would you like to know about it?`
      );
    } catch (error) {
      console.error('Error processing URL:', error);
      addMessage(AgentRole.KNOWLEDGE_BASE, `Sorry, I encountered an error while processing ${url}. Please try a different source.`);
    } finally {
      setIsProcessingSource(false);
      setCurrentUrl(null);
    }
  };
  
  const handleUserMessage = async (message: string) => {
    if (!apiKeySet) {
      toast.error("Please set your OpenAI API key first");
      return;
    }
    
    // Add user message
    addMessage(AgentRole.USER, message);
    
    // Check if there are any documents in the vector store
    const documents = enhancedVectorStore.getDocuments();
    
    if (documents.length === 0) {
      // If no documents, Source Manager asks for a source
      await simulateAgentTyping(AgentRole.SOURCE_MANAGER);
      addMessage(
        AgentRole.SOURCE_MANAGER, 
        "I don't have any knowledge sources yet. Please provide a URL that I can learn from to answer your question."
      );
      return;
    }
    
    // Response Agent processes the query
    await simulateAgentTyping(AgentRole.RESPONSE_AGENT, 2000);
    
    try {
      // Search the vector store for relevant content
      const searchResults = await enhancedVectorStore.search(message);
      
      // Even if search returns no results, we'll try to use the document content directly
      if (searchResults.length === 0) {
        const firstDoc = documents[0];
        const docContext = `From ${firstDoc.title}: ${firstDoc.chunks.slice(0, 3).join("\n\n")}`;
        
        // Use OpenAI to generate a response based on the document
        const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. Try to answer the question with the information available. If you cannot provide a specific answer, extract any relevant information that might be helpful and suggest what other information might be needed.`;
        
        const aiResponse = await openAIService.generateChatCompletion([
          { role: "system", content: systemPrompt },
          { role: "user", content: `Context:\n${docContext}\n\nQuestion: ${message}\n\nPlease try to answer the question based on the provided context. If you have limited information, share what you can determine from the context.` }
        ]);
        
        addMessage(
          AgentRole.RESPONSE_AGENT, 
          aiResponse,
          firstDoc.url
        );
        return;
      }
      
      // Build context from search results
      const context = searchResults.map(result => `From ${result.title}: ${result.content}`).join("\n\n");
      
      // Use OpenAI to generate a response based on the search results
      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. If the information to answer the question is not complete in the context, try your best to provide a useful answer with what's available. Always cite your sources.`;
      
      const aiResponse = await openAIService.generateChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${message}\n\nPlease answer the question based on the provided context. The information might be incomplete, but provide the best answer you can with what's available.` }
      ]);
      
      addMessage(
        AgentRole.RESPONSE_AGENT, 
        aiResponse,
        searchResults[0].url
      );
    } catch (error) {
      console.error('Error generating response:', error);
      addMessage(
        AgentRole.RESPONSE_AGENT, 
        "I'm sorry, I encountered an error while processing your request. Please try again later."
      );
    }
  };
  
  const handleClearKnowledge = () => {
    enhancedVectorStore.clear();
    addMessage(AgentRole.KNOWLEDGE_BASE, "I've cleared all knowledge sources from my memory. Please provide new URLs to learn from.");
  };
  
  // Initialize with welcome message
  const initializeChat = () => {
    if (messages.length === 0 && apiKeySet) {
      addMessage(AgentRole.SYSTEM, AGENT_PROMPTS[AgentRole.SYSTEM]);
    }
  };
  
  return {
    messages,
    isAgentTyping,
    isProcessingSource,
    currentUrl,
    handleSourceSubmit,
    handleUserMessage,
    handleClearKnowledge,
    initializeChat
  };
};
