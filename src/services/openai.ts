import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }

  isInitialized(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI response. Please check your API key and try again.');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('OpenAI Embedding Error:', error);
      throw new Error('Failed to generate embedding. Please check your API key and try again.');
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please provide an API key.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI Batch Embedding Error:', error);
      throw new Error('Failed to generate embeddings. Please check your API key and try again.');
    }
  }

  getAvailableModels() {
    return [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ];
  }
}

export const openaiService = new OpenAIService();