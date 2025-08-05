import { AIInteraction, Memory, SearchResult } from '../types';
import { openaiService } from '../services/openai';

class RAGService {
  private readonly EMBEDDING_DIMENSIONS = 1536; // OpenAI text-embedding-3-small dimensions

  async generateEmbedding(text: string): Promise<number[]> {
    if (openaiService.isInitialized()) {
      try {
        return await openaiService.generateEmbedding(text);
      } catch (error) {
        console.warn('OpenAI embedding failed, falling back to simulation:', error);
        return this.generateSimulatedEmbedding(text);
      }
    }
    return this.generateSimulatedEmbedding(text);
  }

  // Fallback simulated embedding for when OpenAI is not available
  private generateSimulatedEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const embedding = new Array(this.EMBEDDING_DIMENSIONS).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[hash % this.EMBEDDING_DIMENSIONS] += 1 / (index + 1);
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  // Calculate cosine similarity between vectors
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Search for relevant content using semantic similarity
  async search(query: string, interactions: AIInteraction[], memories: Memory[]): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: SearchResult[] = [];

    // Search interactions
    interactions.forEach(interaction => {
      if (interaction.embedding) {
        const score = this.cosineSimilarity(queryEmbedding, interaction.embedding);
        if (score > 0.1) { // Similarity threshold
          results.push({
            item: interaction,
            score,
            type: 'interaction'
          });
        }
      }
    });

    // Search memories
    memories.forEach(memory => {
      const score = this.cosineSimilarity(queryEmbedding, memory.embedding);
      if (score > 0.1) {
        results.push({
          item: memory,
          score,
          type: 'memory'
        });
      }
    });

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  // Get relevant memories for RAG context
  async getRelevantMemories(query: string, memories: Memory[], limit: number = 5): Promise<Memory[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const scoredMemories = memories.map(memory => ({
      memory,
      score: this.cosineSimilarity(queryEmbedding, memory.embedding)
    }));

    return scoredMemories
      .filter(item => item.score > 0.15) // Higher threshold for RAG context
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  // Simple hash function for embedding simulation
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Generate summary using keyword extraction and frequency analysis
  generateSummary(interactions: AIInteraction[]): string {
    if (interactions.length === 0) return '';

    const allText = interactions.map(i => `${i.prompt} ${i.response}`).join(' ');
    const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    // Count word frequency
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top keywords
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Extract key sentences containing top words
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keySentences = sentences
      .filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return topWords.some(word => lowerSentence.includes(word));
      })
      .slice(0, 3);

    return keySentences.length > 0 
      ? keySentences.join('. ') + '.'
      : `Session covered topics related to: ${topWords.slice(0, 5).join(', ')}.`;
  }

  // Extract themes from interactions
  extractThemes(interactions: AIInteraction[]): string[] {
    const allTags = interactions.flatMap(i => i.tags);
    const allText = interactions.map(i => `${i.prompt} ${i.response}`).join(' ').toLowerCase();
    
    const commonThemes = [
      'development', 'programming', 'design', 'research', 'analysis',
      'planning', 'strategy', 'learning', 'troubleshooting', 'optimization'
    ];

    const detectedThemes = commonThemes.filter(theme => 
      allText.includes(theme) || allTags.some(tag => tag.toLowerCase().includes(theme))
    );

    // Add platform-specific themes
    const platforms = [...new Set(interactions.map(i => i.platform))];
    detectedThemes.push(...platforms.map(p => `${p.toLowerCase()}-usage`));

    return [...new Set([...detectedThemes, ...allTags])].slice(0, 8);
  }
}

export const ragService = new RAGService();