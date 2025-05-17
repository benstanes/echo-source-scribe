
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SourceInputProps {
  onSubmit: (url: string) => void;
  isProcessing: boolean;
}

const SourceInput: React.FC<SourceInputProps> = ({ onSubmit, isProcessing }) => {
  const [url, setUrl] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url) return;
    
    try {
      // Check if it's a valid URL
      new URL(url);
      onSubmit(url);
      setUrl('');
    } catch (error) {
      alert('Please enter a valid URL');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
      <Input
        type="url"
        placeholder="Enter a URL to add to knowledge base..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
        disabled={isProcessing}
      />
      <Button 
        type="submit" 
        disabled={isProcessing || !url} 
        className="bg-purple-700 hover:bg-purple-800"
      >
        {isProcessing ? 'Processing...' : 'Add Source'}
      </Button>
    </form>
  );
};

export default SourceInput;
