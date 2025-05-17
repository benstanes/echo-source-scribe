
import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, ChatMessage as ChatMessageType, AGENT_PROMPTS, generateId } from '@/utils/agentTypes';
import ChatMessage from './ChatMessage';
import AgentTyping from './AgentTyping';
import SourceInput from './SourceInput';
import ApiKeyInput from './ApiKeyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enhancedVectorStore } from '@/utils/enhancedVectorStore';
import { enhancedFetchUrlContent } from '@/utils/enhancedFetchUrlContent';
import { openAIService } from '@/utils/openAIService';
import { toast } from '@/components/ui/sonner';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState<AgentRole | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check if API key is set
    if (openAIService.hasApiKey()) {
      setApiKeySet(true);
    }
    
    // Add initial welcome message only when API key is set
    if (apiKeySet && messages.length === 0) {
      addMessage(AgentRole.SYSTEM, AGENT_PROMPTS[AgentRole.SYSTEM]);
    }
  }, [apiKeySet]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
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
  
  const handleUserMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKeySet) {
      toast.error("Please set your OpenAI API key first");
      return;
    }
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    addMessage(AgentRole.USER, userMessage);
    
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
      const searchResults = await enhancedVectorStore.search(userMessage);
      
      if (searchResults.length === 0) {
        // If no relevant content found, try to ask for a new source
        addMessage(
          AgentRole.RESPONSE_AGENT, 
          "I don't have enough information to answer your question based on my current knowledge sources. Could you provide another URL with information related to your question?"
        );
        return;
      }
      
      // Build context from search results
      const context = searchResults.map(result => `From ${result.title}: ${result.content}`).join("\n\n");
      
      // Use OpenAI to generate a response based on the search results
      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. If the information to answer the question is not present in the context, suggest that the user provide another source of information. Always cite your sources.`;
      
      const aiResponse = await openAIService.generateChatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${userMessage}\n\nPlease answer the question based on the provided context. If you cannot answer the question with the given context, suggest that I provide another URL for more information.` }
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
  
  // If API key is not set, show the API key input form
  if (!apiKeySet) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className="bg-white p-4 rounded-t-lg border-b border-gray-200">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-700 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            Multi-Agent Adaptive Chatbot
          </h1>
          <p className="text-center text-gray-500">
            Provide web sources and ask questions. I'll learn dynamically from the sources you share.
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          <ApiKeyInput onApiKeySet={() => setApiKeySet(true)} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-t-lg border-b border-gray-200">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-700 via-blue-600 to-teal-500 bg-clip-text text-transparent">
          Multi-Agent Adaptive Chatbot
        </h1>
        <p className="text-center text-gray-500">
          Provide web sources and ask questions. I'll learn dynamically from the sources you share.
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isAgentTyping && (
          <div className="mb-4">
            <AgentTyping role={isAgentTyping} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white p-4 rounded-b-lg border-t border-gray-200">
        <SourceInput onSubmit={handleSourceSubmit} isProcessing={isProcessingSource} />
        
        <form onSubmit={handleUserMessage} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Ask a question about your sources..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-teal-600 hover:bg-teal-700"
          >
            Send
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleClearKnowledge}
            className="text-red-500 hover:text-red-600 border-red-200"
          >
            Clear Knowledge
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
