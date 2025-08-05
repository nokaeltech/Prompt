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

  // New session intelligence functions
  async generateSessionTitle(conversation: Array<{role: string, content: string}>): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant that generates concise, descriptive titles for chat sessions. 

Rules:
- Keep titles under 60 characters
- Be specific and descriptive
- Use action-oriented language when appropriate
- Include key topics or themes
- Avoid generic titles like "Chat Session"
- If it's a planning session, include the time period (e.g., "Weekly Planning")
- If it's about a specific project, include the project name

Examples:
- "Website Redesign Planning - Q4"
- "Morning Productivity Review"
- "Marketing Strategy Brainstorm"
- "Learning Session - React Hooks"
- "Goal Setting for 2024"

Generate a title based on the conversation content:`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a title for this conversation:\n\n${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` }
    ];

    const response = await this.generateResponse(messages, 'gpt-3.5-turbo');
    return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }

  async summarizeSession(conversation: Array<{role: string, content: string}>): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant that creates concise, insightful summaries of chat sessions.

Rules:
- Keep summaries under 200 words
- Focus on key decisions, action items, and insights
- Highlight any tasks created or goals discussed
- Mention important topics or themes
- Use bullet points for clarity
- Be objective and factual
- Include any deadlines or timeframes mentioned

Format the summary as a brief paragraph followed by key points if relevant.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Summarize this conversation:\n\n${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` }
    ];

    return await this.generateResponse(messages, 'gpt-3.5-turbo');
  }

  async extractSessionThemes(conversation: Array<{role: string, content: string}>): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant that identifies key themes and topics from conversations.

Rules:
- Extract 3-5 main themes or topics
- Use single words or short phrases (2-3 words max)
- Be specific and relevant
- Avoid generic terms like "general" or "miscellaneous"
- Focus on actionable themes when possible
- Return only the themes, one per line, no numbering or bullets

Examples of good themes:
- productivity
- goal planning
- project management
- learning
- marketing strategy
- time management
- personal development

Extract themes from this conversation:`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract themes from this conversation:\n\n${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` }
    ];

    const response = await this.generateResponse(messages, 'gpt-3.5-turbo');
    return response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 5); // Limit to 5 themes
  }

  async suggestActionItems(text: string): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant that identifies potential action items from text.

Rules:
- Look for actionable phrases and suggestions
- Extract specific tasks that can be done
- Focus on concrete, measurable actions
- Avoid vague suggestions
- Return only the action items, one per line
- Keep each action item concise but clear
- Don't include explanations or context

Examples of good action items:
- Schedule meeting with marketing team
- Research competitor pricing
- Update project timeline
- Review quarterly goals
- Prepare presentation slides

Extract action items from this text:`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract action items from this text:\n\n${text}` }
    ];

    const response = await this.generateResponse(messages, 'gpt-3.5-turbo');
    return response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('-') && !line.match(/^\d+\./))
      .slice(0, 10); // Limit to 10 action items
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