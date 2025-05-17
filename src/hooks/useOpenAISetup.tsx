
import { useState, useEffect } from 'react';
import { openAIService } from '@/utils/openAIService';

export const useOpenAISetup = () => {
  const [apiKeySet, setApiKeySet] = useState(false);
  
  useEffect(() => {
    // Check if API key is set
    if (openAIService.hasApiKey()) {
      setApiKeySet(true);
    }
  }, []);
  
  const handleApiKeySet = () => {
    setApiKeySet(true);
  };
  
  return { apiKeySet, handleApiKeySet };
};
