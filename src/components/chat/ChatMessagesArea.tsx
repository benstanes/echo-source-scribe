
import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, AgentRole } from '@/utils/agentTypes';
import ChatMessage from '@/components/ChatMessage';
import AgentTyping from '@/components/AgentTyping';

interface ChatMessagesAreaProps {
  messages: ChatMessageType[];
  isAgentTyping: AgentRole | null;
}

const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = ({ messages, isAgentTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
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
  );
};

export default ChatMessagesArea;
