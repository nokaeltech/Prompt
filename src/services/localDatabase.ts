import { 
  DatabaseTask, 
  DatabaseSubtask, 
  DatabaseNote, 
  DatabaseMemory, 
  DatabaseMessage, 
  DatabaseSession, 
  DatabaseActionItem, 
  DatabaseApiKey, 
  DatabaseUsageLog, 
  DatabaseAiInteraction,
  InsertTask,
  InsertSubtask,
  InsertNote,
  InsertMemory,
  InsertMessage,
  InsertSession,
  InsertActionItem,
  InsertApiKey,
  InsertUsageLog,
  InsertAiInteraction,
  UpdateTask,
  UpdateSubtask,
  UpdateNote,
  UpdateMemory,
  UpdateSession,
  UpdateActionItem,
  MemorySearchResult,
  DailyUsageResult
} from '../types/database';

// Frontend-compatible database service using fetch API
export class LocalDatabaseService {
  private baseUrl: string;

  constructor() {
    // For now, we'll use localStorage as fallback
    // In a real app, this would point to your API server
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  // Helper method to make API calls
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  }

  // ===== TASKS =====
  async createTask(task: InsertTask): Promise<DatabaseTask> {
    return this.apiCall<DatabaseTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async getTasks(userId: string): Promise<DatabaseTask[]> {
    return this.apiCall<DatabaseTask[]>(`/tasks?userId=${userId}`);
  }

  async getTaskById(taskId: string): Promise<DatabaseTask | null> {
    return this.apiCall<DatabaseTask | null>(`/tasks/${taskId}`);
  }

  async updateTask(taskId: string, updates: UpdateTask): Promise<DatabaseTask> {
    return this.apiCall<DatabaseTask>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.apiCall(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ===== SUBTASKS =====
  async createSubtask(subtask: InsertSubtask): Promise<DatabaseSubtask> {
    return this.apiCall<DatabaseSubtask>('/subtasks', {
      method: 'POST',
      body: JSON.stringify(subtask),
    });
  }

  async getSubtasksByTaskId(taskId: string): Promise<DatabaseSubtask[]> {
    return this.apiCall<DatabaseSubtask[]>(`/subtasks?taskId=${taskId}`);
  }

  async updateSubtask(subtaskId: string, updates: UpdateSubtask): Promise<DatabaseSubtask> {
    return this.apiCall<DatabaseSubtask>(`/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ===== NOTES =====
  async createNote(note: InsertNote): Promise<DatabaseNote> {
    return this.apiCall<DatabaseNote>('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async getNotes(userId: string): Promise<DatabaseNote[]> {
    return this.apiCall<DatabaseNote[]>(`/notes?userId=${userId}`);
  }

  async updateNote(noteId: string, updates: UpdateNote): Promise<DatabaseNote> {
    return this.apiCall<DatabaseNote>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.apiCall(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // ===== MEMORIES (RAG) =====
  async createMemory(memory: InsertMemory): Promise<DatabaseMemory> {
    return this.apiCall<DatabaseMemory>('/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
  }

  async searchMemories(
    userId: string, 
    queryEmbedding: number[], 
    threshold: number = 0.7, 
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    return this.apiCall<MemorySearchResult[]>('/memories/search', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        queryEmbedding,
        threshold,
        limit,
      }),
    });
  }

  async getMemoriesBySourceType(userId: string, sourceType: string): Promise<DatabaseMemory[]> {
    return this.apiCall<DatabaseMemory[]>(`/memories?userId=${userId}&sourceType=${sourceType}`);
  }

  async updateMemory(memoryId: string, updates: UpdateMemory): Promise<DatabaseMemory> {
    return this.apiCall<DatabaseMemory>(`/memories/${memoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ===== SESSIONS =====
  async createSession(session: InsertSession): Promise<DatabaseSession> {
    return this.apiCall<DatabaseSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async getSessions(userId: string): Promise<DatabaseSession[]> {
    return this.apiCall<DatabaseSession[]>(`/sessions?userId=${userId}`);
  }

  async updateSession(sessionId: string, updates: UpdateSession): Promise<DatabaseSession> {
    return this.apiCall<DatabaseSession>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ===== MESSAGES =====
  async createMessage(message: InsertMessage): Promise<DatabaseMessage> {
    return this.apiCall<DatabaseMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getMessagesBySession(sessionId: string): Promise<DatabaseMessage[]> {
    return this.apiCall<DatabaseMessage[]>(`/messages?sessionId=${sessionId}`);
  }

  // ===== ACTION ITEMS =====
  async createActionItem(actionItem: InsertActionItem): Promise<DatabaseActionItem> {
    return this.apiCall<DatabaseActionItem>('/action-items', {
      method: 'POST',
      body: JSON.stringify(actionItem),
    });
  }

  async getActionItems(userId: string): Promise<DatabaseActionItem[]> {
    return this.apiCall<DatabaseActionItem[]>(`/action-items?userId=${userId}`);
  }

  async updateActionItem(actionItemId: string, updates: UpdateActionItem): Promise<DatabaseActionItem> {
    return this.apiCall<DatabaseActionItem>(`/action-items/${actionItemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteActionItem(actionItemId: string): Promise<void> {
    await this.apiCall(`/action-items/${actionItemId}`, {
      method: 'DELETE',
    });
  }

  // ===== API KEYS =====
  async createApiKey(apiKey: InsertApiKey): Promise<DatabaseApiKey> {
    return this.apiCall<DatabaseApiKey>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(apiKey),
    });
  }

  async getApiKey(userId: string, provider: string = 'openai'): Promise<DatabaseApiKey | null> {
    return this.apiCall<DatabaseApiKey | null>(`/api-keys?userId=${userId}&provider=${provider}`);
  }

  // ===== USAGE LOGS =====
  async createUsageLog(usageLog: InsertUsageLog): Promise<DatabaseUsageLog> {
    return this.apiCall<DatabaseUsageLog>('/usage-logs', {
      method: 'POST',
      body: JSON.stringify(usageLog),
    });
  }

  async getDailyUsage(userId: string, date?: string): Promise<DailyUsageResult> {
    const dateParam = date || new Date().toISOString().split('T')[0];
    return this.apiCall<DailyUsageResult>(`/usage-logs/daily?userId=${userId}&date=${dateParam}`);
  }

  // ===== AI INTERACTIONS =====
  async createAiInteraction(interaction: InsertAiInteraction): Promise<DatabaseAiInteraction> {
    return this.apiCall<DatabaseAiInteraction>('/ai-interactions', {
      method: 'POST',
      body: JSON.stringify(interaction),
    });
  }

  async getAiInteractions(userId: string): Promise<DatabaseAiInteraction[]> {
    return this.apiCall<DatabaseAiInteraction[]>(`/ai-interactions?userId=${userId}`);
  }

  // ===== SEARCH FUNCTIONALITY =====
  async searchTasks(userId: string, query: string): Promise<DatabaseTask[]> {
    return this.apiCall<DatabaseTask[]>(`/tasks/search?userId=${userId}&query=${encodeURIComponent(query)}`);
  }

  async searchNotes(userId: string, query: string): Promise<DatabaseNote[]> {
    return this.apiCall<DatabaseNote[]>(`/notes/search?userId=${userId}&query=${encodeURIComponent(query)}`);
  }

  // ===== BULK OPERATIONS =====
  async createMemoriesBatch(memories: InsertMemory[]): Promise<DatabaseMemory[]> {
    return this.apiCall<DatabaseMemory[]>('/memories/batch', {
      method: 'POST',
      body: JSON.stringify({ memories }),
    });
  }

  async createUsageLogsBatch(usageLogs: InsertUsageLog[]): Promise<DatabaseUsageLog[]> {
    return this.apiCall<DatabaseUsageLog[]>('/usage-logs/batch', {
      method: 'POST',
      body: JSON.stringify({ usageLogs }),
    });
  }

  // ===== UTILITY METHODS =====
  
  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.apiCall('/health');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Close database connection pool (not needed for API-based service)
   */
  async close(): Promise<void> {
    // No-op for API-based service
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  }> {
    try {
      return await this.apiCall('/stats');
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
      };
    }
  }
} 