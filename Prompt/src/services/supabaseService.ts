import { supabase } from '../lib/supabase';
import { AIInteraction, Session, Memory, ActionItem } from '../types';

export class SupabaseService {
  // Interactions
  async saveInteraction(interaction: AIInteraction): Promise<void> {
    const { error } = await supabase
      .from('interactions')
      .insert({
        id: interaction.id,
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
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
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
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: session.id,
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
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
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
    const { error } = await supabase
      .from('memories')
      .upsert({
        id: memory.id,
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
    const { data, error } = await supabase
      .from('memories')
      .select('*')
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
    const { error } = await supabase
      .from('action_items')
      .upsert({
        id: action.id,
        text: action.text,
        completed: action.completed,
        priority: action.priority,
        category: action.category,
        due_date: action.dueDate ? new Date(action.dueDate).toISOString() : null,
        source_interaction_id: action.sourceInteractionId,
        created_at: new Date(action.createdAt).toISOString(),
      });

    if (error) {
      console.error('Error saving action item:', error);
      throw error;
    }
  }

  async getActionItems(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
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
      createdAt: new Date(row.created_at).getTime(),
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
      const { data, error } = await supabase
        .from('interactions')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService(); 