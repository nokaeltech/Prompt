import { supabase } from '../lib/supabase';
import { AIInteraction, Session, Memory, ActionItem, TaskActivityLog } from '../types';

export class SupabaseService {
  // Interactions
  async saveInteraction(interaction: AIInteraction): Promise<void> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('interactions')
      .insert({
        id: interaction.id,
        user_id: userId,
        prompt: interaction.prompt,
        response: interaction.response,
        platform: interaction.platform,
        model: interaction.model,
        timestamp: new Date(interaction.timestamp).toISOString(),
        session_id: interaction.sessionId,
        tags: interaction.tags,
        summary: interaction.summary,
        embedding: interaction.embedding,
      });

    if (error) {
      console.error('Error saving interaction:', error);
      throw error;
    }
  }

  async getInteractions(): Promise<AIInteraction[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching interactions:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      prompt: row.prompt,
      response: row.response,
      platform: row.platform,
      model: row.model,
      timestamp: new Date(row.timestamp).getTime(),
      sessionId: row.session_id,
      tags: row.tags || [],
      summary: row.summary,
      embedding: row.embedding,
    }));
  }

  async getInteractionById(id: string): Promise<AIInteraction | null> {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching interaction:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      prompt: data.prompt,
      response: data.response,
      platform: data.platform,
      model: data.model,
      timestamp: new Date(data.timestamp).getTime(),
      sessionId: data.session_id,
      tags: data.tags || [],
      summary: data.summary,
      embedding: data.embedding,
    };
  }

  // Sessions
  async saveSession(session: Session): Promise<void> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: session.id,
        user_id: userId,
        title: session.title,
        platform: session.platform,
        start_time: new Date(session.startTime).toISOString(),
        end_time: session.endTime ? new Date(session.endTime).toISOString() : null,
        summary: session.summary,
        themes: session.themes,
        total_interactions: session.totalInteractions,
      });

    if (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async getSessions(): Promise<Session[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      platform: row.platform,
      startTime: new Date(row.start_time).getTime(),
      endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
      summary: row.summary,
      themes: row.themes || [],
      totalInteractions: row.total_interactions,
      interactions: [], // Will be populated separately if needed
    }));
  }

  async getSessionById(id: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      platform: data.platform,
      startTime: new Date(data.start_time).getTime(),
      endTime: data.end_time ? new Date(data.end_time).getTime() : undefined,
      summary: data.summary,
      themes: data.themes || [],
      totalInteractions: data.total_interactions,
      interactions: [], // Will be populated separately if needed
    };
  }

  // Memories
  async saveMemory(memory: Memory): Promise<void> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('memories')
      .upsert({
        id: memory.id,
        user_id: userId,
        content: memory.content,
        embedding: memory.embedding,
        source: memory.source,
        source_id: memory.sourceId,
        tags: memory.tags,
        relevance_score: memory.relevanceScore,
        created_at: new Date(memory.createdAt).toISOString(),
        updated_at: new Date(memory.updatedAt).toISOString(),
      });

    if (error) {
      console.error('Error saving memory:', error);
      throw error;
    }
  }

  async getMemories(): Promise<Memory[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      content: row.content,
      embedding: row.embedding,
      source: row.source,
      sourceId: row.source_id,
      tags: row.tags || [],
      relevanceScore: row.relevance_score,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));
  }

  // Action Items
  async saveActionItem(action: ActionItem): Promise<void> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('action_items')
      .upsert({
        id: action.id,
        user_id: userId,
        text: action.text,
        completed: action.completed,
        priority: action.priority,
        category: action.category,
        due_date: action.dueDate ? new Date(action.dueDate).toISOString() : null,
        source_interaction_id: action.sourceInteractionId,
        source_session_id: action.sourceSessionId,
        parent_id: action.parentId,
        is_main_task: action.isMainTask,
        progress: action.progress,
        estimated_duration: action.estimatedDuration,
        actual_duration: action.actualDuration,
        order_index: action.orderIndex,
        completed_at: action.completedAt ? new Date(action.completedAt).toISOString() : null,
        tags: action.tags,
        metadata: action.metadata,
        created_at: new Date(action.createdAt).toISOString(),
        updated_at: new Date(action.updatedAt).toISOString(),
      });

    if (error) {
      console.error('Error saving action item:', error);
      throw error;
    }

    // Log the activity if it's created from a session
    if (action.sourceSessionId) {
      await this.logTaskActivity({
        id: crypto.randomUUID(),
        taskId: action.id,
        action: 'created_from_session',
        sessionId: action.sourceSessionId,
        messageId: action.sourceInteractionId,
        metadata: {
          taskText: action.text,
          priority: action.priority,
          category: action.category
        },
        timestamp: Date.now()
      });
    }
  }

  async getActionItems(): Promise<ActionItem[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching action items:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      text: row.text,
      completed: row.completed,
      priority: row.priority,
      category: row.category,
      dueDate: row.due_date ? new Date(row.due_date).getTime() : undefined,
      sourceInteractionId: row.source_interaction_id,
      sourceSessionId: row.source_session_id,
      parentId: row.parent_id,
      isMainTask: row.is_main_task || false,
      progress: row.progress || 0,
      estimatedDuration: row.estimated_duration,
      actualDuration: row.actual_duration,
      orderIndex: row.order_index || 0,
      completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));
  }

  async deleteActionItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  }

  // Task Activity Logging
  async logTaskActivity(activity: TaskActivityLog): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('task_activity_log')
      .insert({
        id: activity.id,
        user_id: userId,
        task_id: activity.taskId,
        action: activity.action,
        message_id: activity.messageId,
        session_id: activity.sessionId,
        old_value: activity.oldValue,
        new_value: activity.newValue,
        metadata: activity.metadata,
        timestamp: new Date(activity.timestamp).toISOString(),
      });

    if (error) {
      console.error('Error logging task activity:', error);
      throw error;
    }
  }

  // Get tasks by session
  async getTasksBySession(sessionId: string): Promise<ActionItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('user_id', userId)
      .eq('source_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks by session:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      text: row.text,
      completed: row.completed,
      priority: row.priority,
      category: row.category,
      dueDate: row.due_date ? new Date(row.due_date).getTime() : undefined,
      sourceInteractionId: row.source_interaction_id,
      sourceSessionId: row.source_session_id,
      parentId: row.parent_id,
      isMainTask: row.is_main_task || false,
      progress: row.progress || 0,
      estimatedDuration: row.estimated_duration,
      actualDuration: row.actual_duration,
      orderIndex: row.order_index || 0,
      completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }));
  }

  // Get task activity log
  async getTaskActivityLog(taskId: string): Promise<TaskActivityLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('task_activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching task activity log:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      action: row.action,
      messageId: row.message_id,
      sessionId: row.session_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      metadata: row.metadata,
      timestamp: new Date(row.timestamp).getTime(),
    }));
  }

  // Goals
  async getGoals(): Promise<any[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }

    return data || [];
  }

  // Task Templates
  async getTaskTemplates(): Promise<any[]> {
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task templates:', error);
      throw error;
    }

    return data || [];
  }

  // Search
  async searchInteractions(query: string): Promise<AIInteraction[]> {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .or(`prompt.ilike.%${query}%,response.ilike.%${query}%`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error searching interactions:', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: row.id,
      prompt: row.prompt,
      response: row.response,
      platform: row.platform,
      model: row.model,
      timestamp: new Date(row.timestamp).getTime(),
      sessionId: row.session_id,
      tags: row.tags || [],
      summary: row.summary,
      embedding: row.embedding,
    }));
  }

  // Clear all data (for testing/reset purposes)
  async clearAllData(): Promise<void> {
    const { error } = await supabase.rpc('clear_all_data');
    if (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interactions')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Session Management Methods
  async pinSession(sessionId: string, pinned: boolean): Promise<Session> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({ pinned })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      platform: data.platform,
      startTime: new Date(data.start_time).getTime(),
      endTime: data.end_time ? new Date(data.end_time).getTime() : undefined,
      summary: data.summary,
      themes: data.themes || [],
      totalInteractions: data.total_interactions,
      pinned: data.pinned,
      interactions: [], // Will be populated separately if needed
    };
  }

  async renameSession(sessionId: string, title: string): Promise<Session> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({ title })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      platform: data.platform,
      startTime: new Date(data.start_time).getTime(),
      endTime: data.end_time ? new Date(data.end_time).getTime() : undefined,
      summary: data.summary,
      themes: data.themes || [],
      totalInteractions: data.total_interactions,
      pinned: data.pinned,
      interactions: [], // Will be populated separately if needed
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // First delete all related interactions
    const { error: interactionsError } = await supabase
      .from('interactions')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (interactionsError) throw interactionsError;

    // Then delete all related action items
    const { error: actionItemsError } = await supabase
      .from('action_items')
      .delete()
      .eq('source_session_id', sessionId)
      .eq('user_id', userId);

    if (actionItemsError) throw actionItemsError;

    // Finally delete the session
    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (sessionError) throw sessionError;
  }

  async getAiInteractionsBySession(sessionId: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getPinnedSessions(): Promise<Session[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('pinned', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      platform: row.platform,
      startTime: new Date(row.start_time).getTime(),
      endTime: row.end_time ? new Date(row.end_time).getTime() : undefined,
      summary: row.summary,
      themes: row.themes || [],
      totalInteractions: row.total_interactions,
      pinned: row.pinned,
    }));
  }
}

export const supabaseService = new SupabaseService(); 