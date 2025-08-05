// Database types matching the PostgreSQL schema
export interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSubtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNote {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseMemory {
  id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  source_type: 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual';
  source_id?: string;
  tags?: string[];
  relevance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMessage {
  id: string;
  user_id: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens_used?: number;
  created_at: string;
}

export interface DatabaseSession {
  id: string;
  user_id: string;
  title?: string;
  platform?: string;
  start_time: string;
  end_time?: string;
  summary?: string;
  themes?: string[];
  total_interactions: number;
  pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  target_date?: string;
  completed: boolean;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  goal_type: 'simple' | 'milestone' | 'habit' | 'project';
  parent_goal_id?: string;
  phase: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGoalPhase {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  order_index: number;
  completed: boolean;
  progress: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGoalSubgoal {
  id: string;
  goal_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  completed: boolean;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGoalProgressLog {
  id: string;
  goal_id: string;
  subgoal_id?: string;
  progress_value: number;
  notes?: string;
  logged_at: string;
}

export interface DatabaseActionItem {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string;
  source_interaction_id?: string;
  source_session_id?: string;
  goal_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUsageLog {
  id: string;
  user_id: string;
  tokens_used?: number;
  request_count: number;
  purpose: 'embedding' | 'chat' | 'completion' | 'search';
  model?: string;
  cost_usd?: number;
  created_at: string;
}

export interface DatabaseAiInteraction {
  id: string;
  user_id: string;
  session_id?: string;
  prompt: string;
  response: string;
  platform: 'ChatGPT' | 'Claude' | 'Gemini' | 'Other';
  model?: string;
  timestamp?: number;
  tags?: string[];
  summary?: string;
  embedding?: number[];
  tokens_used?: number;
  created_at: string;
}

// Insert types (for creating new records)
export type InsertTask = Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at'>;
export type InsertSubtask = Omit<DatabaseSubtask, 'id' | 'created_at' | 'updated_at'>;
export type InsertNote = Omit<DatabaseNote, 'id' | 'created_at' | 'updated_at'>;
export type InsertMemory = Omit<DatabaseMemory, 'id' | 'created_at' | 'updated_at'>;
export type InsertMessage = Omit<DatabaseMessage, 'id' | 'created_at'>;
export type InsertSession = Omit<DatabaseSession, 'id' | 'created_at' | 'updated_at'>;
export type InsertGoal = Omit<DatabaseGoal, 'id' | 'created_at' | 'updated_at'>;
export type InsertGoalPhase = Omit<DatabaseGoalPhase, 'id' | 'created_at' | 'updated_at'>;
export type InsertGoalSubgoal = Omit<DatabaseGoalSubgoal, 'id' | 'created_at' | 'updated_at'>;
export type InsertGoalProgressLog = Omit<DatabaseGoalProgressLog, 'id' | 'logged_at'>;
export type InsertActionItem = Omit<DatabaseActionItem, 'id' | 'created_at' | 'updated_at'>;
export type InsertApiKey = Omit<DatabaseApiKey, 'id' | 'created_at' | 'updated_at'>;
export type InsertUsageLog = Omit<DatabaseUsageLog, 'id' | 'created_at'>;
export type InsertAiInteraction = Omit<DatabaseAiInteraction, 'id' | 'created_at'>;

// Update types (for partial updates)
export type UpdateTask = Partial<Omit<DatabaseTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateSubtask = Partial<Omit<DatabaseSubtask, 'id' | 'task_id' | 'created_at' | 'updated_at'>>;
export type UpdateNote = Partial<Omit<DatabaseNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateMemory = Partial<Omit<DatabaseMemory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateGoal = Partial<Omit<DatabaseGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateGoalPhase = Partial<Omit<DatabaseGoalPhase, 'id' | 'goal_id' | 'created_at' | 'updated_at'>>;
export type UpdateGoalSubgoal = Partial<Omit<DatabaseGoalSubgoal, 'id' | 'goal_id' | 'created_at' | 'updated_at'>>;
export type UpdateSession = Partial<Omit<DatabaseSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateActionItem = Partial<Omit<DatabaseActionItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Search result types
export interface MemorySearchResult {
  id: string;
  content: string;
  source_type: string;
  source_id?: string;
  similarity: number;
}

export interface DailyUsageResult {
  total_tokens: number;
  total_requests: number;
  total_cost: number;
}

// Database schema type
export interface DatabaseSchema {
  users: DatabaseUser;
  tasks: DatabaseTask;
  subtasks: DatabaseSubtask;
  notes: DatabaseNote;
  memories: DatabaseMemory;
  messages: DatabaseMessage;
  sessions: DatabaseSession;
  goals: DatabaseGoal;
  goal_phases: DatabaseGoalPhase;
  goal_subgoals: DatabaseGoalSubgoal;
  goal_progress_logs: DatabaseGoalProgressLog;
  action_items: DatabaseActionItem;
  api_keys: DatabaseApiKey;
  usage_logs: DatabaseUsageLog;
  ai_interactions: DatabaseAiInteraction;
} 