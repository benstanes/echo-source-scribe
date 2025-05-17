import { SourceDocument } from './agentTypes';

// Define the ChatCompletionMessageParam type locally since we can't import it from openai/resources
interface ChatCompletionMessageParam {
  role: "system" | "user" | "assistant" | "function" | "tool";
  content: string;
  name?: string;
}

// This class handles communication with OpenAI API
export class OpenAIService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Generate embeddings for text using OpenAI's API
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input: texts,
          model: "text-embedding-3-small"
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  // Generate chat completion using OpenAI's API
  async generateChatCompletion(
    messages: ChatCompletionMessageParam[],
    temperature: number = 0.7,
    model: string = "gpt-4o"
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating chat completion:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const openAIService = new OpenAIService();
