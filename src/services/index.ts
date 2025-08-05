// Service exports for the Aqeel RAG app
export { LocalDatabaseService } from './localDatabase';
export { RAGService } from './rag';
export { MigrationService } from '../utils/migration';

// Service initialization helper
import { LocalDatabaseService } from './localDatabase';
import { RAGService } from './rag';
import OpenAI from 'openai';

let dbService: LocalDatabaseService | null = null;
let ragService: RAGService | null = null;

export function initializeServices() {
  if (!dbService) {
    dbService = new LocalDatabaseService();
  }
  
  if (!ragService) {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found. RAG features will be disabled.');
      return { dbService, ragService: null };
    }
    
    try {
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true // Required for browser environment
      });
      ragService = new RAGService(openai, dbService);
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      return { dbService, ragService: null };
    }
  }
  
  return { dbService, ragService };
}

export function getServices() {
  if (!dbService) {
    throw new Error('Services not initialized. Call initializeServices() first.');
  }
  return { dbService, ragService };
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { dbService } = initializeServices();
    return await dbService.testConnection();
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 