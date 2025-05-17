
import React, { useEffect } from 'react';
import ApiKeyInput from './ApiKeyInput';
import SourceInput from './SourceInput';
import ChatHeader from './chat/ChatHeader';
import ChatMessagesArea from './chat/ChatMessagesArea';
import ChatMessageInput from './chat/ChatMessageInput';
import { useOpenAISetup } from '@/hooks/useOpenAISetup';
import { useChatOperations } from '@/hooks/useChatOperations';

const ChatInterface: React.FC = () => {
  const { apiKeySet, handleApiKeySet } = useOpenAISetup();
  const {
    messages,
    isAgentTyping,
    isProcessingSource,
    handleSourceSubmit,
    handleUserMessage,
    handleClearKnowledge,
    initializeChat
  } = useChatOperations(apiKeySet);
  
  // Initialize chat with welcome message when API key is set
  useEffect(() => {
    initializeChat();
  }, [apiKeySet]);
  
  // If API key is not set, show the API key input form
  if (!apiKeySet) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          <ApiKeyInput onApiKeySet={handleApiKeySet} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <ChatHeader />
      
      <ChatMessagesArea 
        messages={messages} 
        isAgentTyping={isAgentTyping} 
      />
      
      <div className="bg-white p-4 rounded-b-lg border-t border-gray-200">
        <SourceInput onSubmit={handleSourceSubmit} isProcessing={isProcessingSource} />
        <ChatMessageInput 
          onSubmit={handleUserMessage}
          onClearKnowledge={handleClearKnowledge}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
