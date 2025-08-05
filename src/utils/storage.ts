import { AIInteraction, Session, Memory, ActionItem, Goal, TaskTemplate } from '../types';

class StorageManager {
  private readonly INTERACTIONS_KEY = 'aqeel_interactions';
  private readonly SESSIONS_KEY = 'aqeel_sessions';
  private readonly MEMORIES_KEY = 'aqeel_memories';
  private readonly ACTIONS_KEY = 'aqeel_actions';
  private readonly GOALS_KEY = 'aqeel_goals';
  private readonly TASK_TEMPLATES_KEY = 'aqeel_task_templates';

  // Interactions
  saveInteraction(interaction: AIInteraction): void {
    const interactions = this.getInteractions();
    interactions.push(interaction);
    localStorage.setItem(this.INTERACTIONS_KEY, JSON.stringify(interactions));
  }

  getInteractions(): AIInteraction[] {
    const data = localStorage.getItem(this.INTERACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getInteractionById(id: string): AIInteraction | null {
    const interactions = this.getInteractions();
    return interactions.find(i => i.id === id) || null;
  }

  // Sessions
  saveSession(session: Session): void {
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  getSessions(): Session[] {
    const data = localStorage.getItem(this.SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getSessionById(id: string): Session | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  // Memories
  saveMemory(memory: Memory): void {
    const memories = this.getMemories();
    const existingIndex = memories.findIndex(m => m.id === memory.id);
    if (existingIndex >= 0) {
      memories[existingIndex] = memory;
    } else {
      memories.push(memory);
    }
    localStorage.setItem(this.MEMORIES_KEY, JSON.stringify(memories));
  }

  getMemories(): Memory[] {
    const data = localStorage.getItem(this.MEMORIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Action Items
  saveActionItem(action: ActionItem): void {
    const actions = this.getActionItems();
    const existingIndex = actions.findIndex(a => a.id === action.id);
    if (existingIndex >= 0) {
      actions[existingIndex] = action;
    } else {
      actions.push(action);
    }
    localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions));
  }

  getActionItems(): ActionItem[] {
    const data = localStorage.getItem(this.ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  deleteActionItem(id: string): void {
    const actions = this.getActionItems();
    const filtered = actions.filter(a => a.id !== id);
    localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(filtered));
  }

  // Goals
  saveGoal(goal: Goal): void {
    const goals = this.getGoals();
    const existingIndex = goals.findIndex(g => g.id === goal.id);
    if (existingIndex >= 0) {
      goals[existingIndex] = goal;
    } else {
      goals.push(goal);
    }
    localStorage.setItem(this.GOALS_KEY, JSON.stringify(goals));
  }

  getGoals(): Goal[] {
    const data = localStorage.getItem(this.GOALS_KEY);
    return data ? JSON.parse(data) : [];
  }

  deleteGoal(id: string): void {
    const goals = this.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    localStorage.setItem(this.GOALS_KEY, JSON.stringify(filtered));
  }

  // Task Templates
  saveTaskTemplate(template: TaskTemplate): void {
    const templates = this.getTaskTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(this.TASK_TEMPLATES_KEY, JSON.stringify(templates));
  }

  getTaskTemplates(): TaskTemplate[] {
    const data = localStorage.getItem(this.TASK_TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  }

  deleteTaskTemplate(id: string): void {
    const templates = this.getTaskTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(this.TASK_TEMPLATES_KEY, JSON.stringify(filtered));
  }

  // Search
  searchInteractions(query: string): AIInteraction[] {
    const interactions = this.getInteractions();
    const lowercaseQuery = query.toLowerCase();
    
    return interactions.filter(interaction => 
      interaction.prompt.toLowerCase().includes(lowercaseQuery) ||
      interaction.response.toLowerCase().includes(lowercaseQuery) ||
      interaction.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (interaction.summary && interaction.summary.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.INTERACTIONS_KEY);
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.MEMORIES_KEY);
    localStorage.removeItem(this.ACTIONS_KEY);
  }
}

export const storage = new StorageManager();