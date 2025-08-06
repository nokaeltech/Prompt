import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { AIInteraction, Session, Memory, ActionItem, SearchResult, Goal, TaskTemplate } from '../types';
import { storage } from '../utils/storage';
import { ragService } from '../utils/rag';
import { initializeServices } from '../services';
import { supabase } from '../lib/supabase';
import { taskStructureAnalyzer, TaskAnalysisResult } from '../services/taskStructureAnalyzer';

interface AppState {
  interactions: AIInteraction[];
  sessions: Session[];
  memories: Memory[];
  actionItems: ActionItem[];
  goals: Goal[];
  taskTemplates: TaskTemplate[];
  currentSession: Session | null;
  searchResults: SearchResult[];
  loading: boolean;
  ragEnabled: boolean;
  databaseConnected: boolean;
  user: any; // Add user property for authentication
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INTERACTIONS'; payload: AIInteraction[] }
  | { type: 'ADD_INTERACTION'; payload: AIInteraction }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_MEMORIES'; payload: Memory[] }
  | { type: 'ADD_MEMORY'; payload: Memory }
  | { type: 'SET_ACTION_ITEMS'; payload: ActionItem[] }
  | { type: 'ADD_ACTION_ITEM'; payload: ActionItem }
  | { type: 'UPDATE_ACTION_ITEM'; payload: ActionItem }
  | { type: 'DELETE_ACTION_ITEM'; payload: string }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_TASK_TEMPLATES'; payload: TaskTemplate[] }
  | { type: 'ADD_TASK_TEMPLATE'; payload: TaskTemplate }
  | { type: 'UPDATE_TASK_TEMPLATE'; payload: TaskTemplate }
  | { type: 'DELETE_TASK_TEMPLATE'; payload: string }
  | { type: 'SET_CURRENT_SESSION'; payload: Session | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'TOGGLE_RAG'; payload: boolean }
  | { type: 'SET_DATABASE_CONNECTED'; payload: boolean };

const initialState: AppState = {
  interactions: [],
  sessions: [],
  memories: [],
  actionItems: [],
  goals: [],
  taskTemplates: [],
  currentSession: null,
  searchResults: [],
  loading: false,
  ragEnabled: true,
  databaseConnected: false,
  user: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INTERACTIONS':
      return { ...state, interactions: action.payload };
    case 'ADD_INTERACTION':
      return { ...state, interactions: [...state.interactions, action.payload] };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload)
      };
    case 'SET_MEMORIES':
      return { ...state, memories: action.payload };
    case 'ADD_MEMORY':
      return { ...state, memories: [...state.memories, action.payload] };
    case 'SET_ACTION_ITEMS':
      return { ...state, actionItems: action.payload };
    case 'ADD_ACTION_ITEM':
      return { ...state, actionItems: [...state.actionItems, action.payload] };
    case 'UPDATE_ACTION_ITEM':
      return {
        ...state,
        actionItems: state.actionItems.map(a => a.id === action.payload.id ? action.payload : a)
      };
    case 'DELETE_ACTION_ITEM':
      return {
        ...state,
        actionItems: state.actionItems.filter(a => a.id !== action.payload)
      };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g)
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload)
      };
    case 'SET_TASK_TEMPLATES':
      return { ...state, taskTemplates: action.payload };
    case 'ADD_TASK_TEMPLATE':
      return { ...state, taskTemplates: [...state.taskTemplates, action.payload] };
    case 'UPDATE_TASK_TEMPLATE':
      return {
        ...state,
        taskTemplates: state.taskTemplates.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK_TEMPLATE':
      return {
        ...state,
        taskTemplates: state.taskTemplates.filter(t => t.id !== action.payload)
      };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'TOGGLE_RAG':
      return { ...state, ragEnabled: action.payload };
    case 'SET_DATABASE_CONNECTED':
      return { ...state, databaseConnected: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadData: () => Promise<void>;
    addInteraction: (interaction: Omit<AIInteraction, 'id' | 'timestamp'>) => Promise<AIInteraction>;
    createSession: (title: string, platform: string) => Promise<Session>;
    updateSession: (session: Session) => Promise<void>;
    addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt'>) => Promise<void>;
    updateActionItem: (item: ActionItem) => Promise<void>;
    deleteActionItem: (id: string) => Promise<void>;
    addActionItemFromSession: (itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>, sessionId: string, interactionId?: string) => Promise<ActionItem>;
    getTasksBySession: (sessionId: string) => Promise<ActionItem[]>;
    getTaskActivityLog: (taskId: string) => Promise<any>;
    addGoal: (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateGoal: (goal: Goal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    addTaskTemplate: (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
    updateTaskTemplate: (template: TaskTemplate) => Promise<void>;
    deleteTaskTemplate: (id: string) => Promise<void>;
    searchContent: (query: string) => Promise<void>;
    extractActionItems: (response: string, interactionId: string) => Promise<ActionItem[]>;
    getRagContext: (query: string) => Promise<Memory[]>;
    testDatabaseConnection: () => Promise<boolean>;
    enhanceSessionIntelligence: (sessionId: string) => Promise<any>;
    searchSessions: (query: string) => Promise<any>;
    getSessionsByTheme: (theme: string) => Promise<any>;
    getSessionsWithTasks: () => Promise<any>;
    getSessionStats: () => Promise<any>;
    suggestActionItems: (text: string) => Promise<string[]>;
    loadSessionMessages: (sessionId: string) => Promise<any[]>;
    pinSession: (sessionId: string) => Promise<Session | null>;
    renameSession: (sessionId: string, title: string) => Promise<Session | null>;
    deleteSession: (sessionId: string) => Promise<void>;
  };
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [services, setServices] = useState<{ dbService: any; ragService: any } | null>(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const { dbService, ragService } = initializeServices();
        setServices({ dbService, ragService });
        
        // Test database connection
        const isConnected = await testDatabaseConnection();
        dispatch({ type: 'SET_DATABASE_CONNECTED', payload: isConnected });
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        dispatch({ type: 'SET_DATABASE_CONNECTED', payload: false });
      }
    };

    initServices();
  }, []);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (services?.dbService) {
        // Load from Supabase
        const [interactions, sessions, memories, actionItems, dbGoals] = await Promise.all([
          services.dbService.getInteractions(),
          services.dbService.getSessions(),
          services.dbService.getMemories(),
          services.dbService.getActionItems(),
          services.dbService.getGoals(),
        ]);

        // Convert database goals to app format
        const goals = dbGoals.map((dbGoal: any) => ({
          id: dbGoal.id,
          title: dbGoal.title,
          description: dbGoal.description || '',
          category: dbGoal.category,
          tags: dbGoal.tags || [],
          targetDate: dbGoal.target_date ? new Date(dbGoal.target_date).getTime() : undefined,
          completed: dbGoal.completed,
          progress: dbGoal.progress,
          priority: dbGoal.priority,
          goalType: dbGoal.goal_type,
          parentGoalId: dbGoal.parent_goal_id || undefined,
          phase: dbGoal.phase,
          startDate: dbGoal.start_date ? new Date(dbGoal.start_date).getTime() : undefined,
          endDate: dbGoal.end_date ? new Date(dbGoal.end_date).getTime() : undefined,
          createdAt: new Date(dbGoal.created_at).getTime(),
          updatedAt: new Date(dbGoal.updated_at).getTime(),
        }));

        dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
        dispatch({ type: 'SET_SESSIONS', payload: sessions });
        dispatch({ type: 'SET_MEMORIES', payload: memories });
        dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
        dispatch({ type: 'SET_GOALS', payload: goals });
      } else {
        // Fallback to localStorage if Supabase is not available
        const [interactions, sessions, memories, actionItems, goals] = await Promise.all([
          Promise.resolve(storage.getInteractions()),
          Promise.resolve(storage.getSessions()),
          Promise.resolve(storage.getMemories()),
          Promise.resolve(storage.getActionItems()),
          Promise.resolve(storage.getGoals()),
          Promise.resolve(storage.getTaskTemplates()),
        ]);

        dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
        dispatch({ type: 'SET_SESSIONS', payload: sessions });
        dispatch({ type: 'SET_MEMORIES', payload: memories });
        dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
        dispatch({ type: 'SET_GOALS', payload: goals });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      const [interactions, sessions, memories, actionItems, goals] = await Promise.all([
        Promise.resolve(storage.getInteractions()),
        Promise.resolve(storage.getSessions()),
        Promise.resolve(storage.getMemories()),
        Promise.resolve(storage.getActionItems()),
        Promise.resolve(storage.getGoals()),
        Promise.resolve(storage.getTaskTemplates()),
      ]);

      dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      dispatch({ type: 'SET_MEMORIES', payload: memories });
      dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
      dispatch({ type: 'SET_GOALS', payload: goals });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addInteraction = async (interactionData: Omit<AIInteraction, 'id' | 'timestamp'>): Promise<AIInteraction> => {
    const interaction: AIInteraction = {
      ...interactionData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Generate embedding for the interaction
    const embedding = await ragService.generateEmbedding(
      `${interaction.prompt} ${interaction.response}`
    );
    interaction.embedding = embedding;

    if (services?.dbService) {
      // Save to Supabase
      await services.dbService.saveInteraction(interaction);

      // Create memory in Supabase
      const memory: Memory = {
        id: crypto.randomUUID(),
        content: `Q: ${interaction.prompt}\nA: ${interaction.response}`,
        embedding,
        source: 'interaction',
        sourceId: interaction.id,
        tags: interaction.tags,
        relevanceScore: 1.0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await services.dbService.saveMemory(memory);
      dispatch({ type: 'ADD_MEMORY', payload: memory });
    } else {
      // Save to localStorage
      storage.saveInteraction(interaction);

      // Create memory from interaction
      const memory: Memory = {
        id: crypto.randomUUID(),
        content: `Q: ${interaction.prompt}\nA: ${interaction.response}`,
        embedding,
        source: 'interaction',
        sourceId: interaction.id,
        tags: interaction.tags,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      storage.saveMemory(memory);
      dispatch({ type: 'ADD_MEMORY', payload: memory });
    }

    dispatch({ type: 'ADD_INTERACTION', payload: interaction });

    // Extract action items
    const actionItems = await extractActionItems(interaction.response, interaction.id);
    for (const item of actionItems) {
      await addActionItem(item);
    }

    return interaction;
  };

  const createSession = async (title: string, platform: string): Promise<Session> => {
    const session: Session = {
      id: crypto.randomUUID(),
      title,
      platform,
      startTime: Date.now(),
      interactions: [],
      themes: [],
      totalInteractions: 0,
    };

    if (services?.dbService) {
      // Save to Supabase
      await services.dbService.saveSession(session);
    } else {
      // Save to localStorage
      storage.saveSession(session);
    }

    dispatch({ type: 'ADD_SESSION', payload: session });
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });

    return session;
  };

  const updateSession = async (session: Session) => {
    if (services?.dbService) {
      // Update in Supabase
      await services.dbService.saveSession(session);
    } else {
      // Update in localStorage
      storage.saveSession(session);
    }

    dispatch({ type: 'UPDATE_SESSION', payload: session });
  };

  const addActionItem = async (itemData: Omit<ActionItem, 'id' | 'createdAt'>) => {
    const item: ActionItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (services?.dbService) {
      // Save to Supabase
      await services.dbService.saveActionItem(item);
    } else {
      // Save to localStorage
      storage.saveActionItem(item);
    }

    dispatch({ type: 'ADD_ACTION_ITEM', payload: item });
  };

  const updateActionItem = async (item: ActionItem) => {
    const updatedItem = {
      ...item,
      updatedAt: Date.now()
    };

    if (services?.dbService) {
      // Update in Supabase
      await services.dbService.saveActionItem(updatedItem);
    } else {
      // Update in localStorage
      storage.saveActionItem(updatedItem);
    }

    dispatch({ type: 'UPDATE_ACTION_ITEM', payload: updatedItem });
  };

  const deleteActionItem = async (id: string) => {
    if (services?.dbService) {
      // Delete from Supabase
      await services.dbService.deleteActionItem(id);
    } else {
      // Delete from localStorage
      storage.deleteActionItem(id);
    }

    dispatch({ type: 'DELETE_ACTION_ITEM', payload: id });
  };

  // Session-to-Task Linking Methods
  const addActionItemFromSession = async (
    itemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>,
    sessionId: string,
    interactionId?: string
  ) => {
    const item: ActionItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceSessionId: sessionId,
      sourceInteractionId: interactionId,
    };

    if (services?.dbService) {
      // Save to Supabase with session link
      await services.dbService.saveActionItem(item);
    } else {
      // Save to localStorage
      storage.saveActionItem(item);
    }

    dispatch({ type: 'ADD_ACTION_ITEM', payload: item });
    return item;
  };

  const getTasksBySession = async (sessionId: string): Promise<ActionItem[]> => {
    if (services?.dbService) {
      return await services.dbService.getTasksBySession(sessionId);
    } else {
      // Filter from local state
      return state.actionItems.filter(item => item.sourceSessionId === sessionId);
    }
  };

  const getTaskActivityLog = async (taskId: string) => {
    if (services?.dbService) {
      return await services.dbService.getTaskActivityLog(taskId);
    } else {
      // Return empty array for localStorage (no activity logging)
      return [];
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const goal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (services?.dbService) {
      // Save to Supabase
      const dbGoal: any = {
        title: goal.title,
        description: goal.description,
        category: goal.category,
        tags: goal.tags,
        target_date: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : null,
        completed: goal.completed,
        progress: goal.progress,
        priority: goal.priority,
        goal_type: goal.goalType,
        parent_goal_id: goal.parentGoalId || null,
        phase: goal.phase,
        start_date: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : null,
        end_date: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : null,
      };
      await services.dbService.createGoal(dbGoal);
    } else {
      // Save to localStorage
      storage.saveGoal(goal);
    }

    dispatch({ type: 'ADD_GOAL', payload: goal });
  };

  const updateGoal = async (goal: Goal) => {
    const updatedGoal = { ...goal, updatedAt: Date.now() };
    
    if (services?.dbService) {
      // Update in Supabase
      const dbUpdates = {
        title: goal.title,
        description: goal.description,
        category: goal.category,
        tags: goal.tags,
        target_date: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : null,
        completed: goal.completed,
        progress: goal.progress,
        priority: goal.priority,
        goal_type: goal.goalType,
        parent_goal_id: goal.parentGoalId || null,
        phase: goal.phase,
        start_date: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : null,
        end_date: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : null,
      };
      await services.dbService.updateGoal(goal.id, dbUpdates);
    } else {
      // Update in localStorage
      storage.saveGoal(updatedGoal);
    }

    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
  };

  const deleteGoal = async (id: string) => {
    if (services?.dbService) {
      // Delete from Supabase
      await services.dbService.deleteGoal(id);
    } else {
      // Delete from localStorage
      storage.deleteGoal(id);
    }

    dispatch({ type: 'DELETE_GOAL', payload: id });
  };

  // Task Template Functions
  const addTaskTemplate = async (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (services?.dbService) {
      // Save to Supabase
      const dbTemplate = {
        id: newTemplate.id,
        user_id: '', // Will be set by RLS policies
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        priority: newTemplate.priority,
        tags: newTemplate.tags,
        estimated_duration: newTemplate.estimatedDuration,
        is_recurring: newTemplate.isRecurring,
        recurrence_pattern: newTemplate.recurrencePattern,
        recurrence_config: newTemplate.recurrenceConfig,
        usage_count: newTemplate.usageCount,
        last_used: newTemplate.lastUsed ? new Date(newTemplate.lastUsed).toISOString() : null,
        is_public: newTemplate.isPublic,
        created_at: new Date(newTemplate.createdAt).toISOString(),
        updated_at: new Date(newTemplate.updatedAt).toISOString(),
      };
      await services.dbService.addTaskTemplate(dbTemplate);
    } else {
      // Save to localStorage
      storage.saveTaskTemplate(newTemplate);
    }

    dispatch({ type: 'ADD_TASK_TEMPLATE', payload: newTemplate });
  };

  const updateTaskTemplate = async (template: TaskTemplate) => {
    const updatedTemplate = {
      ...template,
      updatedAt: Date.now(),
    };

    if (services?.dbService) {
      // Update in Supabase
      const dbUpdates = {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        priority: updatedTemplate.priority,
        tags: updatedTemplate.tags,
        estimated_duration: updatedTemplate.estimatedDuration,
        is_recurring: updatedTemplate.isRecurring,
        recurrence_pattern: updatedTemplate.recurrencePattern,
        recurrence_config: updatedTemplate.recurrenceConfig,
        usage_count: updatedTemplate.usageCount,
        last_used: updatedTemplate.lastUsed ? new Date(updatedTemplate.lastUsed).toISOString() : null,
        is_public: updatedTemplate.isPublic,
        updated_at: new Date(updatedTemplate.updatedAt).toISOString(),
      };
      await services.dbService.updateTaskTemplate(template.id, dbUpdates);
    } else {
      // Update in localStorage
      storage.saveTaskTemplate(updatedTemplate);
    }

    dispatch({ type: 'UPDATE_TASK_TEMPLATE', payload: updatedTemplate });
  };

  const deleteTaskTemplate = async (id: string) => {
    if (services?.dbService) {
      // Delete from Supabase
      await services.dbService.deleteTaskTemplate(id);
    } else {
      // Delete from localStorage
      storage.deleteTaskTemplate(id);
    }

    dispatch({ type: 'DELETE_TASK_TEMPLATE', payload: id });
  };

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    if (services?.dbService) {
      // Search using Supabase
      const interactions = await services.dbService.searchInteractions(query);
      
      // Convert to SearchResult format
      const searchResults: SearchResult[] = interactions.map((interaction: AIInteraction) => ({
        item: interaction,
        score: 1.0, // Default score for now
        type: 'interaction' as const,
      }));

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults });
    } else {
      // Search using localStorage RAG
      const results = await ragService.search(query, state.interactions, state.memories);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    }
  };

  const extractActionItems = async (response: string, interactionId: string): Promise<ActionItem[]> => {
    const actionWords = ['build', 'create', 'implement', 'research', 'investigate', 'design', 'develop', 'write', 'plan', 'organize', 'setup', 'configure', 'test', 'analyze'];
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    const actionItems: ActionItem[] = [];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const hasActionWord = actionWords.some(word => lowerSentence.includes(word));
      const hasImperative = /^(you should|try to|consider|make sure to|don't forget to)/i.test(sentence.trim());
      
      if (hasActionWord || hasImperative) {
        const priority = lowerSentence.includes('important') || lowerSentence.includes('critical') ? 'high' :
                        lowerSentence.includes('consider') || lowerSentence.includes('might') ? 'low' : 'medium';
        
        actionItems.push({
          id: crypto.randomUUID(),
          text: sentence.trim(),
          completed: false,
          priority: priority as ActionItem['priority'],
          category: 'Development',
          sourceInteractionId: interactionId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });
    
    return actionItems;
  };

  /**
   * Analyze AI response and determine task structure (single task vs main task + subtasks)
   */
  const analyzeTaskStructure = async (response: string): Promise<TaskAnalysisResult> => {
    try {
      return await taskStructureAnalyzer.analyzeResponse(response);
    } catch (error) {
      console.error('Error analyzing task structure:', error);
      // Fallback to simple single task
      return {
        structure: {
          mainTask: 'Task from AI response',
          subtasks: [],
          confidence: 0.5,
          reasoning: 'Fallback analysis due to error'
        },
        shouldCreateSubtasks: false,
        priority: 'medium',
        category: 'General'
      };
    }
  };

  /**
   * Create hierarchical tasks from AI response analysis
   */
  const createHierarchicalTasks = async (
    analysis: TaskAnalysisResult,
    sessionId: string,
    interactionId: string
  ): Promise<{ mainTask: ActionItem; subtasks: ActionItem[] }> => {
    const mainTaskId = crypto.randomUUID();
    const timestamp = Date.now();

    // Create main task
    const mainTask: ActionItem = {
      id: mainTaskId,
      text: analysis.structure.mainTask,
      completed: false,
      priority: analysis.priority,
      category: analysis.category,
      sourceInteractionId: interactionId,
      sourceSessionId: sessionId,
      isMainTask: true,
      progress: 0,
      estimatedDuration: analysis.estimatedDuration,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Create subtasks if they exist
    const subtasks: ActionItem[] = analysis.structure.subtasks.map((subtaskText, index) => ({
      id: crypto.randomUUID(),
      text: subtaskText,
      completed: false,
      priority: analysis.priority,
      category: analysis.category,
      sourceInteractionId: interactionId,
      sourceSessionId: sessionId,
      parentId: mainTaskId,
      orderIndex: index,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    // Save main task
    if (services?.dbService) {
      await services.dbService.saveActionItem(mainTask);
    } else {
      storage.saveActionItem(mainTask);
    }
    dispatch({ type: 'ADD_ACTION_ITEM', payload: mainTask });

    // Save subtasks
    for (const subtask of subtasks) {
      if (services?.dbService) {
        await services.dbService.saveActionItem(subtask);
      } else {
        storage.saveActionItem(subtask);
      }
      dispatch({ type: 'ADD_ACTION_ITEM', payload: subtask });
    }

    return { mainTask, subtasks };
  };

  /**
   * Create single task from AI response (legacy method)
   */
  const createSingleTask = async (
    taskData: Omit<ActionItem, 'id' | 'createdAt'>,
    sessionId: string,
    interactionId: string
  ): Promise<ActionItem> => {
    const task: ActionItem = {
      ...taskData,
      id: crypto.randomUUID(),
      sourceSessionId: sessionId,
      sourceInteractionId: interactionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (services?.dbService) {
      await services.dbService.saveActionItem(task);
    } else {
      storage.saveActionItem(task);
    }

    dispatch({ type: 'ADD_ACTION_ITEM', payload: task });
    return task;
  };

  const getRagContext = async (query: string): Promise<Memory[]> => {
    if (services?.dbService) {
      // Get context from Supabase
      const memories = await services.dbService.getMemories();
      return ragService.getRelevantMemories(query, memories);
    } else {
      // Get context from localStorage
      return ragService.getRelevantMemories(query, state.memories);
    }
  };

  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      if (!services?.dbService) {
        return false;
      }
      const isConnected = await services.dbService.testConnection();
      dispatch({ type: 'SET_DATABASE_CONNECTED', payload: isConnected });
      return isConnected;
    } catch (error) {
      console.error('Database connection test failed:', error);
      dispatch({ type: 'SET_DATABASE_CONNECTED', payload: false });
      return false;
    }
  };

  const enhanceSessionIntelligence = async (_sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (services?.dbService) {
        // For now, skip AI enhancement if services aren't available
        // TODO: Implement AI enhancement when services are properly configured
        console.log('Session intelligence enhancement would happen here');
        return null;
      }
      return null;
    } catch (error) {
      console.error('Error enhancing session intelligence:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const searchSessions = async (query: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (services?.dbService) {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (userId) {
          const sessions = await services.dbService.searchSessions(userId, query);
          return sessions;
        }
      }
      return [];
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSessionsByTheme = async (theme: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (services?.dbService) {
        const sessions = await services.dbService.getSessionsByTheme(state.user?.id || '', theme);
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Error getting sessions by theme:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSessionsWithTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      if (services?.dbService) {
        const sessions = await services.dbService.getSessionsWithTasks(state.user?.id || '');
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Error getting sessions with tasks:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSessionStats = async () => {
    try {
      if (services?.dbService && state.user?.id) {
        const stats = await services.dbService.getSessionStats(state.user.id);
        return stats;
      }
      // Return empty stats if service not available or user not authenticated
      return {
        totalSessions: 0,
        totalInteractions: 0,
        avgSessionLength: 0,
        topThemes: []
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      // Return empty stats on error instead of throwing
      return {
        totalSessions: 0,
        totalInteractions: 0,
        avgSessionLength: 0,
        topThemes: []
      };
    }
  };

  const suggestActionItems = async (text: string) => {
    try {
      if (services?.ragService) {
        const suggestions = await services.ragService.suggestActionItems(text);
        return suggestions;
      }
      return [];
    } catch (error) {
      console.error('Error suggesting action items:', error);
      throw error;
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('loadSessionMessages called with sessionId:', sessionId);
      console.log('services available:', !!services?.dbService);
      
      if (services?.dbService) {
        // Load AI interactions for this session
        console.log('Calling getAiInteractionsBySession...');
        const interactions = await services.dbService.getAiInteractionsBySession(sessionId);
        console.log('Retrieved interactions:', interactions);
        
        // Convert interactions to chat messages format
        const chatMessages = interactions.flatMap((interaction: any) => [
          {
            id: `user-${interaction.id}`,
            role: 'user' as const,
            content: interaction.prompt,
            timestamp: new Date(interaction.created_at).getTime(),
            interactionId: interaction.id
          },
          {
            id: `assistant-${interaction.id}`,
            role: 'assistant' as const,
            content: interaction.response,
            timestamp: new Date(interaction.created_at).getTime(),
            interactionId: interaction.id
          }
        ]);
        
        console.log('Converted to chat messages:', chatMessages);
        return chatMessages;
      } else {
        console.log('No database service available, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const pinSession = async (sessionId: string) => {
    try {
      if (services?.dbService) {
        const updatedSession = await services.dbService.pinSession(sessionId, true);
        dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
        return updatedSession;
      }
    } catch (error) {
      console.error('Error pinning session:', error);
      throw error;
    }
  };

  const renameSession = async (sessionId: string, title: string) => {
    try {
      if (services?.dbService) {
        const updatedSession = await services.dbService.renameSession(sessionId, title);
        dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
        return updatedSession;
      }
    } catch (error) {
      console.error('Error renaming session:', error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      if (services?.dbService) {
        await services.dbService.deleteSession(sessionId);
        dispatch({ type: 'DELETE_SESSION', payload: sessionId });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };


  useEffect(() => {
    loadData();
  }, [services]);

  const actions = {
    loadData,
    addInteraction,
    createSession,
    updateSession,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    addActionItemFromSession,
    getTasksBySession,
    getTaskActivityLog,
    addGoal,
    updateGoal,
    deleteGoal,
    addTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    searchContent,
    extractActionItems,
    analyzeTaskStructure,
    createHierarchicalTasks,
    createSingleTask,
    getRagContext,
    testDatabaseConnection,
    enhanceSessionIntelligence,
    searchSessions,
    getSessionsByTheme,
    getSessionsWithTasks,
    getSessionStats,
    suggestActionItems,
    loadSessionMessages,
    pinSession,
    renameSession,
    deleteSession,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}