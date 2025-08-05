export interface AIInteraction {
  id: string;
  prompt: string;
  response: string;
  platform: 'ChatGPT' | 'Claude' | 'Gemini' | 'Productivity Assistant' | 'Other';
  model: string;
  timestamp: number;
  sessionId: string;
  tags: string[];
  summary?: string;
  actionItems?: ActionItem[];
  embedding?: number[];
}



// Enhanced ActionItem interface with hierarchical support
export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: number;
  sourceInteractionId?: string;
  sourceSessionId?: string; // Link back to originating session
  templateId?: string;
  // Hierarchical support
  parentId?: string; // For subtasks
  children?: ActionItem[]; // For main tasks with subtasks
  isMainTask?: boolean; // Flag to identify main tasks
  progress?: number; // Progress percentage for main tasks
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  orderIndex?: number; // For subtask ordering
  completedAt?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  action: 'created_from_session' | 'status_changed' | 'completed' | 'updated' | 'deleted';
  messageId?: string;
  sessionId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  estimatedDuration?: number; // in minutes
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceConfig?: Record<string, any>; // for custom recurrence rules
  usageCount: number;
  lastUsed?: number;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
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

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  targetDate?: number;
  completed: boolean;
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  goalType: 'simple' | 'milestone' | 'habit' | 'project';
  parentGoalId?: string;
  phase: string;
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalPhase {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  orderIndex: number;
  completed: boolean;
  progress: number;
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalSubgoal {
  id: string;
  goalId: string;
  phaseId?: string;
  title: string;
  description?: string;
  completed: boolean;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalProgressLog {
  id: string;
  goalId: string;
  subgoalId?: string;
  progressValue: number;
  notes?: string;
  loggedAt: number;
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