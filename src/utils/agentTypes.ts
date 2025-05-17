
// Agent roles in the system
export enum AgentRole {
  USER = 'user',
  SYSTEM = 'system',
  SOURCE_MANAGER = 'source',
  KNOWLEDGE_BASE = 'knowledge',
  RESPONSE_AGENT = 'response'
}

// Chat message structure
export interface ChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  sourceUrl?: string;
}

// Source document structure
export interface SourceDocument {
  id: string;
  url: string;
  content: string;
  title: string;
  timestamp: Date;
  chunks: string[];
  vectors?: number[][];
}

// Knowledge base state
export interface KnowledgeState {
  documents: SourceDocument[];
  currentSourceUrl: string | null;
  isProcessingSource: boolean;
}

// System prompts for different agents
export const AGENT_PROMPTS = {
  [AgentRole.SOURCE_MANAGER]: "I manage knowledge sources. I'll help you add new sources by providing URLs.",
  [AgentRole.KNOWLEDGE_BASE]: "I process and index content to make it searchable. Let me extract knowledge from your sources.",
  [AgentRole.RESPONSE_AGENT]: "I provide answers based on the available knowledge sources.",
  [AgentRole.SYSTEM]: "Welcome! I'm a multi-agent chatbot that can learn from URLs you provide. To get started, please share a URL you'd like me to learn from."
};

// Helper function to generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
