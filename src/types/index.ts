export interface AIInteraction {
  id: string;
  prompt: string;
  response: string;
  platform: 'ChatGPT' | 'Claude' | 'Gemini' | 'Other';
  model: string;
  timestamp: number;
  sessionId: string;
  tags: string[];
  summary?: string;
  actionItems?: ActionItem[];
  embedding?: number[];
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: number;
  sourceInteractionId: string;
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  platform: string;
  startTime: number;
  endTime?: number;
  interactions: AIInteraction[];
  summary?: string;
  themes: string[];
  totalInteractions: number;
}

export interface Memory {
  id: string;
  content: string;
  embedding: number[];
  source: 'interaction' | 'summary' | 'manual';
  sourceId: string;
  tags: string[];
  relevanceScore?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SearchResult {
  item: AIInteraction | Memory;
  score: number;
  type: 'interaction' | 'memory';
}

export interface RAGContext {
  memories: Memory[];
  totalScore: number;
  used: boolean;
}