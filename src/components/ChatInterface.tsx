
import React, { useState, useEffect, useRef } from 'react';
import { AgentRole, ChatMessage as ChatMessageType, AGENT_PROMPTS, generateId } from '@/utils/agentTypes';
import ChatMessage from './ChatMessage';
import AgentTyping from './AgentTyping';
import SourceInput from './SourceInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { vectorStore } from '@/utils/vectorStore';
import { fetchUrlContent } from '@/utils/fetchUrlContent';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState<AgentRole | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add initial welcome message
    addMessage(AgentRole.SYSTEM, AGENT_PROMPTS[AgentRole.SYSTEM]);
  }, []);
  
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
      const document = await fetchUrlContent(url);
      
      if (!document) {
        addMessage(AgentRole.KNOWLEDGE_BASE, `I couldn't process the URL: ${url}. Please check if it's correct and try again.`);
        setIsProcessingSource(false);
        setCurrentUrl(null);
        return;
      }
      
      // Add to vector store
      await vectorStore.addDocument(document);
      
      addMessage(
        AgentRole.KNOWLEDGE_BASE, 
        `I've processed the content from ${url}. The document "${document.title}" has been added to my knowledge base with ${document.chunks.length} chunks of information. You can now ask questions about it!`,
        url
      );
      
      // Response Agent confirms
      await simulateAgentTyping(AgentRole.RESPONSE_AGENT);
      addMessage(
        AgentRole.RESPONSE_AGENT, 
        `Great! I can now answer questions about the content from ${document.title}. What would you like to know about it?`
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
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    addMessage(AgentRole.USER, userMessage);
    
    // Check if there are any documents in the vector store
    const documents = vectorStore.getDocuments();
    
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
    
    // Search the vector store for relevant content
    const searchResults = await vectorStore.search(userMessage);
    
    if (searchResults.length === 0) {
      // If no relevant content found, try to ask for a new source
      addMessage(
        AgentRole.RESPONSE_AGENT, 
        "I don't have enough information to answer your question based on my current knowledge sources. Could you provide another URL with information related to your question?"
      );
      return;
    }
    
    // Generate a response based on the search results
    const sources = searchResults.map(result => result.title).join(", ");
    const responseContent = searchResults.map(result => result.content).join("\n\n");
    
    addMessage(
      AgentRole.RESPONSE_AGENT, 
      `Based on information from ${sources}, here's what I found:\n\n${responseContent}`,
      searchResults[0].url
    );
  };
  
  const handleClearKnowledge = () => {
    vectorStore.clear();
    addMessage(AgentRole.KNOWLEDGE_BASE, "I've cleared all knowledge sources from my memory. Please provide new URLs to learn from.");
  };
  
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
