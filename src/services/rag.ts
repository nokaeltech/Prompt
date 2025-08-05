import OpenAI from 'openai';
import { DatabaseMemory, InsertMemory, MemorySearchResult } from '../types/database';
import { Memory, RAGContext } from '../types';

// Common interface for database operations
interface DatabaseServiceInterface {
  createMemory(memory: InsertMemory): Promise<DatabaseMemory>;
  createMemoriesBatch(memories: InsertMemory[]): Promise<DatabaseMemory[]>;
  searchMemories(userId: string, queryEmbedding: number[], threshold: number, limit: number): Promise<MemorySearchResult[]>;
  getMemoriesBySourceType(userId: string, sourceType: string): Promise<DatabaseMemory[]>;
  updateMemory(memoryId: string, updates: any): Promise<DatabaseMemory>;
  createUsageLog(usageLog: any): Promise<any>;
  getDailyUsage(userId: string, date?: string): Promise<any>;
}

export class RAGService {
  private openai: OpenAI;
  private db: DatabaseServiceInterface;
  private embeddingModel: string = 'text-embedding-3-small';
  private completionModel: string = 'gpt-4o-mini';

  constructor(openai: OpenAI, db: DatabaseServiceInterface) {
    this.openai = openai;
    this.db = db;
  }

  // ===== EMBEDDING OPERATIONS =====
  
  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
        encoding_format: 'float'
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
        encoding_format: 'float'
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // ===== MEMORY OPERATIONS =====

  /**
   * Create a memory with embedding
   */
  async createMemory(
    userId: string,
    content: string,
    sourceType: 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual',
    sourceId?: string,
    tags?: string[]
  ): Promise<DatabaseMemory> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(content);

      // Create memory record
      const memory: InsertMemory = {
        user_id: userId,
        content,
        embedding,
        source_type: sourceType,
        source_id: sourceId,
        tags
      };

      const result = await this.db.createMemory(memory);

      // Log usage
      await this.logUsage(userId, 'embedding', 1, this.embeddingModel);

      return result;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  /**
   * Create multiple memories in batch
   */
  async createMemoriesBatch(
    userId: string,
    memories: Array<{
      content: string;
      sourceType: 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual';
      sourceId?: string;
      tags?: string[];
    }>
  ): Promise<DatabaseMemory[]> {
    try {
      // Generate embeddings for all contents
      const contents = memories.map(m => m.content);
      const embeddings = await this.generateEmbeddings(contents);

      // Create memory records
      const memoryRecords: InsertMemory[] = memories.map((memory, index) => ({
        user_id: userId,
        content: memory.content,
        embedding: embeddings[index],
        source_type: memory.sourceType,
        source_id: memory.sourceId,
        tags: memory.tags
      }));

      const results = await this.db.createMemoriesBatch(memoryRecords);

      // Log usage
      await this.logUsage(userId, 'embedding', contents.length, this.embeddingModel);

      return results;
    } catch (error) {
      console.error('Error creating memories batch:', error);
      throw error;
    }
  }

  // ===== SEARCH OPERATIONS =====

  /**
   * Search memories using semantic similarity
   */
  async searchMemories(
    userId: string,
    query: string,
    threshold: number = 0.7,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search memories using the database function
      const results = await this.db.searchMemories(userId, queryEmbedding, threshold, limit);

      // Log usage
      await this.logUsage(userId, 'search', 1, this.embeddingModel);

      return results;
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  /**
   * Get RAG context for a query
   */
  async getRAGContext(
    userId: string,
    query: string,
    threshold: number = 0.7,
    limit: number = 5
  ): Promise<RAGContext> {
    try {
      const searchResults = await this.searchMemories(userId, query, threshold, limit);
      
      // Convert to Memory format for compatibility
      const memories: Memory[] = searchResults.map(result => ({
        id: result.id,
        content: result.content,
        embedding: [], // We don't need the full embedding here
        source: result.source_type as any,
        sourceId: result.source_id || '',
        tags: [],
        relevanceScore: result.similarity,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      const totalScore = searchResults.reduce((sum, result) => sum + result.similarity, 0);

      return {
        memories,
        totalScore,
        used: memories.length > 0
      };
    } catch (error) {
      console.error('Error getting RAG context:', error);
      throw error;
    }
  }

  // ===== ENHANCED CHAT WITH RAG =====

  /**
   * Generate a response using RAG context
   */
  async generateRAGResponse(
    userId: string,
    userMessage: string,
    systemPrompt?: string,
    threshold: number = 0.7,
    memoryLimit: number = 5
  ): Promise<{
    response: string;
    context: RAGContext;
    tokensUsed: number;
  }> {
    try {
      // Get RAG context
      const context = await this.getRAGContext(userId, userMessage, threshold, memoryLimit);

      // Build the prompt with context
      let prompt = systemPrompt || `You are a helpful AI assistant. Use the following context to provide relevant and accurate responses:

Context from user's previous interactions and data:
${context.memories.map(memory => `- ${memory.content}`).join('\n')}

User's question: ${userMessage}

Please provide a helpful response based on the context above and your general knowledge.`;

      // Generate response
      const completion = await this.openai.chat.completions.create({
        model: this.completionModel,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Log usage
      await this.logUsage(userId, 'chat', 1, this.completionModel, tokensUsed);

      return {
        response,
        context,
        tokensUsed
      };
    } catch (error) {
      console.error('Error generating RAG response:', error);
      throw error;
    }
  }

  // ===== MEMORY MANAGEMENT =====

  /**
   * Update memory relevance score
   */
  async updateMemoryRelevance(memoryId: string, relevanceScore: number): Promise<void> {
    try {
      await this.db.updateMemory(memoryId, { relevance_score: relevanceScore });
    } catch (error) {
      console.error('Error updating memory relevance:', error);
      throw error;
    }
  }

  /**
   * Get memories by source type
   */
  async getMemoriesBySourceType(
    userId: string,
    sourceType: 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual'
  ): Promise<DatabaseMemory[]> {
    try {
      return await this.db.getMemoriesBySourceType(userId, sourceType);
    } catch (error) {
      console.error('Error getting memories by source type:', error);
      throw error;
    }
  }

  /**
   * Create memories from existing data (migration helper)
   */
  async createMemoriesFromData(
    userId: string,
    data: Array<{
      content: string;
      sourceType: 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual';
      sourceId?: string;
      tags?: string[];
    }>
  ): Promise<DatabaseMemory[]> {
    try {
      return await this.createMemoriesBatch(userId, data);
    } catch (error) {
      console.error('Error creating memories from data:', error);
      throw error;
    }
  }

  // ===== USAGE TRACKING =====

  /**
   * Log API usage
   */
  private async logUsage(
    userId: string,
    purpose: 'embedding' | 'chat' | 'completion' | 'search',
    requestCount: number = 1,
    model?: string,
    tokensUsed?: number
  ): Promise<void> {
    try {
      // Calculate cost (approximate)
      let cost = 0;
      if (model?.includes('gpt-4')) {
        cost = (tokensUsed || 0) * 0.00003; // Approximate GPT-4 cost per token
      } else if (model?.includes('gpt-3.5')) {
        cost = (tokensUsed || 0) * 0.000002; // Approximate GPT-3.5 cost per token
      } else if (model?.includes('embedding')) {
        cost = (tokensUsed || 0) * 0.0000001; // Approximate embedding cost per token
      }

      await this.db.createUsageLog({
        user_id: userId,
        tokens_used: tokensUsed,
        request_count: requestCount,
        purpose,
        model,
        cost_usd: cost
      });
    } catch (error) {
      console.error('Error logging usage:', error);
      // Don't throw error for usage logging failures
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if user has exceeded daily usage limits
   */
  async checkUsageLimits(userId: string, maxTokens: number = 100000): Promise<{
    withinLimit: boolean;
    currentUsage: number;
    maxTokens: number;
  }> {
    try {
      const dailyUsage = await this.db.getDailyUsage(userId);
      const withinLimit = dailyUsage.total_tokens < maxTokens;

      return {
        withinLimit,
        currentUsage: dailyUsage.total_tokens,
        maxTokens
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      throw error;
    }
  }

  /**
   * Get user's daily usage statistics
   */
  async getDailyUsageStats(userId: string): Promise<{
    totalTokens: number;
    totalRequests: number;
    totalCost: number;
    breakdown: {
      embedding: number;
      chat: number;
      completion: number;
      search: number;
    };
  }> {
    try {
      const dailyUsage = await this.db.getDailyUsage(userId);
      
      // Get breakdown by purpose (you might want to add this to the database function)
      // For now, returning basic stats
      return {
        totalTokens: dailyUsage.total_tokens,
        totalRequests: dailyUsage.total_requests,
        totalCost: dailyUsage.total_cost,
        breakdown: {
          embedding: 0,
          chat: 0,
          completion: 0,
          search: 0
        }
      };
    } catch (error) {
      console.error('Error getting daily usage stats:', error);
      throw error;
    }
  }
} 