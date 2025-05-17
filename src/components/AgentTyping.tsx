
import React from 'react';
import { AgentRole } from '@/utils/agentTypes';

interface AgentTypingProps {
  role: AgentRole;
}

const AgentTyping: React.FC<AgentTypingProps> = ({ role }) => {
  // Determine the color based on agent role
  const getColor = () => {
    switch (role) {
      case AgentRole.SOURCE_MANAGER:
        return 'bg-agent-source';
      case AgentRole.KNOWLEDGE_BASE:
        return 'bg-agent-knowledge';
      case AgentRole.RESPONSE_AGENT:
        return 'bg-agent-response';
      default:
        return 'bg-agent-system';
    }
  };
  
  return (
    <div className="flex items-center space-x-1 p-2">
      <div className={`h-2 w-2 rounded-full ${getColor()} animate-bounce delay-100`}></div>
      <div className={`h-2 w-2 rounded-full ${getColor()} animate-bounce delay-200`}></div>
      <div className={`h-2 w-2 rounded-full ${getColor()} animate-bounce delay-300`}></div>
    </div>
  );
};

export default AgentTyping;
