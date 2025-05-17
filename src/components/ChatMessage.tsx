
import React from 'react';
import { ChatMessage as ChatMessageType, AgentRole } from '@/utils/agentTypes';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, content, sourceUrl } = message;
  
  // Determine agent name and style based on role
  const getAgentDetails = () => {
    switch (role) {
      case AgentRole.USER:
        return {
          name: 'You',
          bgColor: 'bg-gray-100',
          textColor: 'text-agent-user',
          align: 'items-end'
        };
      case AgentRole.SOURCE_MANAGER:
        return {
          name: 'Source Agent',
          bgColor: 'bg-purple-100',
          textColor: 'text-agent-source',
          align: 'items-start'
        };
      case AgentRole.KNOWLEDGE_BASE:
        return {
          name: 'Knowledge Agent',
          bgColor: 'bg-blue-100',
          textColor: 'text-agent-knowledge',
          align: 'items-start'
        };
      case AgentRole.RESPONSE_AGENT:
        return {
          name: 'Response Agent',
          bgColor: 'bg-teal-100',
          textColor: 'text-agent-response',
          align: 'items-start'
        };
      default:
        return {
          name: 'System',
          bgColor: 'bg-gray-100',
          textColor: 'text-agent-system',
          align: 'items-start'
        };
    }
  };
  
  const { name, bgColor, textColor, align } = getAgentDetails();
  
  return (
    <div className={`flex ${role === AgentRole.USER ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-3/4 ${bgColor} p-3 rounded-lg shadow`}>
        <div className={`font-medium ${textColor} text-sm mb-1`}>{name}</div>
        <div className="text-gray-800 whitespace-pre-wrap">{content}</div>
        {sourceUrl && (
          <div className="mt-2 text-xs text-blue-600">
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Source: {sourceUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
