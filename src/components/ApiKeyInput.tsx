
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openAIService } from '@/utils/openAIService';
import { toast } from '@/components/ui/sonner';

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Check if API key is already in localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      openAIService.setApiKey(savedApiKey);
      onApiKeySet();
    }
  }, [onApiKeySet]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error("Please enter your OpenAI API key");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Set and verify the API key
      openAIService.setApiKey(apiKey);
      
      // Simple verification by making a minimal API call
      await openAIService.generateEmbeddings(['test']);
      
      // Store API key in localStorage
      localStorage.setItem('openai_api_key', apiKey);
      
      toast.success("API key verified successfully!");
      onApiKeySet();
    } catch (error) {
      console.error("API key verification failed:", error);
      toast.error("Invalid API key. Please check and try again.");
      openAIService.setApiKey('');
      localStorage.removeItem('openai_api_key');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">OpenAI API Key Required</h2>
      <p className="mb-4 text-gray-600">
        To use this chatbot, please enter your OpenAI API key. 
        The key will be stored locally in your browser and never sent to our servers.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key is stored locally in your browser.
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={isVerifying || !apiKey.trim()} 
          className="w-full bg-purple-700 hover:bg-purple-800"
        >
          {isVerifying ? 'Verifying...' : 'Set API Key'}
        </Button>
      </form>
    </div>
  );
};

export default ApiKeyInput;
