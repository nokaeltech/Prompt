// Simple client-side text embedding simulation
// In production, this would use OpenAI Embeddings API, Cohere, or similar service

export class EmbeddingService {
  private readonly DIMENSIONS = 384;
  
  // Simulate text embedding generation
  async generateEmbedding(text: string): Promise<number[]> {
    const words = this.tokenize(text);
    const embedding = new Array(this.DIMENSIONS).fill(0);
    
    // Simple word2vec-like approach for demonstration
    words.forEach((word, index) => {
      const hash = this.hash(word);
      const position = hash % this.DIMENSIONS;
      const weight = 1 / Math.sqrt(index + 1); // Decreasing weight for later words
      embedding[position] += weight;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  // Calculate cosine similarity between two embeddings
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

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const embeddingService = new EmbeddingService();