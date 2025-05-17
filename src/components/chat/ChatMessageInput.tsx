
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessageInputProps {
  onSubmit: (message: string) => void;
  onClearKnowledge: () => void;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({ onSubmit, onClearKnowledge }) => {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    onSubmit(input.trim());
    setInput('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
        onClick={onClearKnowledge}
        className="text-red-500 hover:text-red-600 border-red-200"
      >
        Clear Knowledge
      </Button>
    </form>
  );
};

export default ChatMessageInput;
