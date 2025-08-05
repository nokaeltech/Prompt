import { 
  DatabaseTask, 
  DatabaseSubtask, 
  DatabaseNote, 
  DatabaseMemory, 
  DatabaseMessage, 
  DatabaseSession, 
  DatabaseGoal,
  DatabaseGoalPhase,
  DatabaseGoalSubgoal,
  DatabaseGoalProgressLog,
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
  InsertGoal,
  InsertGoalPhase,
  InsertGoalSubgoal,
  InsertGoalProgressLog,
  InsertActionItem,
  InsertApiKey,
  InsertUsageLog,
  InsertAiInteraction,
  UpdateTask,
  UpdateSubtask,
  UpdateNote,
  UpdateMemory,
  UpdateGoal,
  UpdateGoalPhase,
  UpdateGoalSubgoal,
  UpdateSession,
  UpdateActionItem,
  MemorySearchResult,
  DailyUsageResult
} from '../types/database';

// Database service class for handling all database operations
export class DatabaseService {
  private supabase: any; // Will be initialized with Supabase client

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // ===== TASKS =====
  async createTask(task: InsertTask): Promise<DatabaseTask> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTasks(userId: string): Promise<DatabaseTask[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTaskById(taskId: string): Promise<DatabaseTask | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(taskId: string, updates: UpdateTask): Promise<DatabaseTask> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  // ===== SUBTASKS =====
  async createSubtask(subtask: InsertSubtask): Promise<DatabaseSubtask> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .insert(subtask)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSubtasksByTaskId(taskId: string): Promise<DatabaseSubtask[]> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateSubtask(subtaskId: string, updates: UpdateSubtask): Promise<DatabaseSubtask> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== NOTES =====
  async createNote(note: InsertNote): Promise<DatabaseNote> {
    const { data, error } = await this.supabase
      .from('notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotes(userId: string): Promise<DatabaseNote[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateNote(noteId: string, updates: UpdateNote): Promise<DatabaseNote> {
    const { data, error } = await this.supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  }

  // ===== MEMORIES (RAG) =====
  async createMemory(memory: InsertMemory): Promise<DatabaseMemory> {
    const { data, error } = await this.supabase
      .from('memories')
      .insert(memory)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchMemories(
    userId: string, 
    queryEmbedding: number[], 
    threshold: number = 0.7, 
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    const { data, error } = await this.supabase
      .rpc('search_memories', {
        user_uuid: userId,
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) throw error;
    return data || [];
  }

  async getMemoriesBySourceType(userId: string, sourceType: string): Promise<DatabaseMemory[]> {
    const { data, error } = await this.supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateMemory(memoryId: string, updates: UpdateMemory): Promise<DatabaseMemory> {
    const { data, error } = await this.supabase
      .from('memories')
      .update(updates)
      .eq('id', memoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===== SESSIONS =====
  async createSession(session: InsertSession): Promise<DatabaseSession> {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessions(userId: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateSession(sessionId: string, updates: UpdateSession): Promise<DatabaseSession> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Enhanced session management for intelligence features
  async updateSessionIntelligence(sessionId: string, updates: {
    title?: string;
    summary?: string;
    themes?: string[];
    total_interactions?: number;
  }): Promise<DatabaseSession> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionsWithIntelligence(userId: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        ai_interactions(count),
        action_items(count)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async searchSessions(userId: string, query: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,themes.cs.{${query}}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSessionsByTheme(userId: string, theme: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .contains('themes', [theme])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSessionsWithTasks(userId: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        action_items!inner(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRecentSessions(userId: string, limit: number = 10): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    sessionsThisWeek: number;
    sessionsWithTasks: number;
    averageInteractionsPerSession: number;
  }> {
    // Get total sessions
    const { count: totalSessions } = await this.supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get sessions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: sessionsThisWeek } = await this.supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    // Get sessions with tasks
    const { count: sessionsWithTasks } = await this.supabase
      .from('sessions')
      .select('action_items!inner(*)', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get average interactions per session
    const { data: sessions } = await this.supabase
      .from('sessions')
      .select('total_interactions')
      .eq('user_id', userId);

    const totalInteractions = sessions?.reduce((sum: number, session: any) => sum + (session.total_interactions || 0), 0) || 0;
    const averageInteractionsPerSession = totalSessions ? totalInteractions / totalSessions : 0;

    return {
      totalSessions: totalSessions || 0,
      sessionsThisWeek: sessionsThisWeek || 0,
      sessionsWithTasks: sessionsWithTasks || 0,
      averageInteractionsPerSession: Math.round(averageInteractionsPerSession * 100) / 100
    };
  }

  // ===== GOALS =====
  async createGoal(goal: InsertGoal): Promise<DatabaseGoal> {
    const { data, error } = await this.supabase
      .from('goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoals(userId: string): Promise<DatabaseGoal[]> {
    const { data, error } = await this.supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getGoalById(goalId: string): Promise<DatabaseGoal | null> {
    const { data, error } = await this.supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateGoal(goalId: string, updates: UpdateGoal): Promise<DatabaseGoal> {
    const { data, error } = await this.supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await this.supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  }

  // ===== GOAL PHASES =====
  async createGoalPhase(phase: InsertGoalPhase): Promise<DatabaseGoalPhase> {
    const { data, error } = await this.supabase
      .from('goal_phases')
      .insert(phase)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoalPhases(goalId: string): Promise<DatabaseGoalPhase[]> {
    const { data, error } = await this.supabase
      .from('goal_phases')
      .select('*')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateGoalPhase(phaseId: string, updates: UpdateGoalPhase): Promise<DatabaseGoalPhase> {
    const { data, error } = await this.supabase
      .from('goal_phases')
      .update(updates)
      .eq('id', phaseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoalPhase(phaseId: string): Promise<void> {
    const { error } = await this.supabase
      .from('goal_phases')
      .delete()
      .eq('id', phaseId);

    if (error) throw error;
  }

  // ===== GOAL SUBGOALS =====
  async createGoalSubgoal(subgoal: InsertGoalSubgoal): Promise<DatabaseGoalSubgoal> {
    const { data, error } = await this.supabase
      .from('goal_subgoals')
      .insert(subgoal)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoalSubgoals(goalId: string, phaseId?: string): Promise<DatabaseGoalSubgoal[]> {
    let query = this.supabase
      .from('goal_subgoals')
      .select('*')
      .eq('goal_id', goalId);

    if (phaseId) {
      query = query.eq('phase_id', phaseId);
    }

    const { data, error } = await query.order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateGoalSubgoal(subgoalId: string, updates: UpdateGoalSubgoal): Promise<DatabaseGoalSubgoal> {
    const { data, error } = await this.supabase
      .from('goal_subgoals')
      .update(updates)
      .eq('id', subgoalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoalSubgoal(subgoalId: string): Promise<void> {
    const { error } = await this.supabase
      .from('goal_subgoals')
      .delete()
      .eq('id', subgoalId);

    if (error) throw error;
  }

  // ===== GOAL PROGRESS LOGS =====
  async createGoalProgressLog(log: InsertGoalProgressLog): Promise<DatabaseGoalProgressLog> {
    const { data, error } = await this.supabase
      .from('goal_progress_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getGoalProgressLogs(goalId: string, subgoalId?: string): Promise<DatabaseGoalProgressLog[]> {
    let query = this.supabase
      .from('goal_progress_logs')
      .select('*')
      .eq('goal_id', goalId);

    if (subgoalId) {
      query = query.eq('subgoal_id', subgoalId);
    }

    const { data, error } = await query.order('logged_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== MESSAGES =====
  async createMessage(message: InsertMessage): Promise<DatabaseMessage> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getMessagesBySession(sessionId: string): Promise<DatabaseMessage[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAiInteractionsBySession(sessionId: string): Promise<DatabaseAiInteraction[]> {
    const { data, error } = await this.supabase
      .from('ai_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ===== ACTION ITEMS =====
  async createActionItem(actionItem: InsertActionItem): Promise<DatabaseActionItem> {
    const { data, error } = await this.supabase
      .from('action_items')
      .insert(actionItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getActionItems(userId: string): Promise<DatabaseActionItem[]> {
    const { data, error } = await this.supabase
      .from('action_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateActionItem(actionItemId: string, updates: UpdateActionItem): Promise<DatabaseActionItem> {
    const { data, error } = await this.supabase
      .from('action_items')
      .update(updates)
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActionItem(actionItemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('action_items')
      .delete()
      .eq('id', actionItemId);

    if (error) throw error;
  }

  // ===== API KEYS =====
  async createApiKey(apiKey: InsertApiKey): Promise<DatabaseApiKey> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .upsert(apiKey, { onConflict: 'user_id,provider' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApiKey(userId: string, provider: string = 'openai'): Promise<DatabaseApiKey | null> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // ===== USAGE LOGS =====
  async createUsageLog(usageLog: InsertUsageLog): Promise<DatabaseUsageLog> {
    const { data, error } = await this.supabase
      .from('usage_logs')
      .insert(usageLog)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDailyUsage(userId: string, date?: string): Promise<DailyUsageResult> {
    const { data, error } = await this.supabase
      .rpc('get_daily_usage', {
        user_uuid: userId,
        usage_date: date || new Date().toISOString().split('T')[0]
      });

    if (error) throw error;
    return data?.[0] || { total_tokens: 0, total_requests: 0, total_cost: 0 };
  }

  // ===== AI INTERACTIONS =====
  async createAiInteraction(interaction: InsertAiInteraction): Promise<DatabaseAiInteraction> {
    const { data, error } = await this.supabase
      .from('ai_interactions')
      .insert(interaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAiInteractions(userId: string): Promise<DatabaseAiInteraction[]> {
    const { data, error } = await this.supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== SEARCH FUNCTIONALITY =====
  async searchTasks(userId: string, query: string): Promise<DatabaseTask[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async searchNotes(userId: string, query: string): Promise<DatabaseNote[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== BULK OPERATIONS =====
  async createMemoriesBatch(memories: InsertMemory[]): Promise<DatabaseMemory[]> {
    const { data, error } = await this.supabase
      .from('memories')
      .insert(memories)
      .select();

    if (error) throw error;
    return data || [];
  }

  async createUsageLogsBatch(usageLogs: InsertUsageLog[]): Promise<DatabaseUsageLog[]> {
    const { data, error } = await this.supabase
      .from('usage_logs')
      .insert(usageLogs)
      .select();

    if (error) throw error;
    return data || [];
  }

  async pinSession(sessionId: string, pinned: boolean): Promise<DatabaseSession> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({ pinned })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async renameSession(sessionId: string, title: string): Promise<DatabaseSession> {
    const { data, error } = await this.supabase
      .from('sessions')
      .update({ title })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    // First delete all related interactions
    const { error: interactionsError } = await this.supabase
      .from('ai_interactions')
      .delete()
      .eq('session_id', sessionId);

    if (interactionsError) throw interactionsError;

    // Then delete all related action items
    const { error: actionItemsError } = await this.supabase
      .from('action_items')
      .delete()
      .eq('source_session_id', sessionId);

    if (actionItemsError) throw actionItemsError;

    // Finally delete the session
    const { error: sessionError } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) throw sessionError;
  }

  async getPinnedSessions(userId: string): Promise<DatabaseSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('pinned', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
} 