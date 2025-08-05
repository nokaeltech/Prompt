import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { AIInteraction, Session, Memory, ActionItem, SearchResult } from '../types';
import { storage } from '../utils/storage';
import { ragService } from '../utils/rag';
import { initializeServices, testDatabaseConnection } from '../services';
import { MigrationService } from '../utils/migration';

interface AppState {
  interactions: AIInteraction[];
  sessions: Session[];
  memories: Memory[];
  actionItems: ActionItem[];
  currentSession: Session | null;
  searchResults: SearchResult[];
  loading: boolean;
  ragEnabled: boolean;
  databaseConnected: boolean;
  useDatabase: boolean;
  migrationStatus: 'idle' | 'migrating' | 'completed' | 'error';
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INTERACTIONS'; payload: AIInteraction[] }
  | { type: 'ADD_INTERACTION'; payload: AIInteraction }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'SET_MEMORIES'; payload: Memory[] }
  | { type: 'ADD_MEMORY'; payload: Memory }
  | { type: 'SET_ACTION_ITEMS'; payload: ActionItem[] }
  | { type: 'ADD_ACTION_ITEM'; payload: ActionItem }
  | { type: 'UPDATE_ACTION_ITEM'; payload: ActionItem }
  | { type: 'DELETE_ACTION_ITEM'; payload: string }
  | { type: 'SET_CURRENT_SESSION'; payload: Session | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'TOGGLE_RAG'; payload: boolean }
  | { type: 'SET_DATABASE_CONNECTED'; payload: boolean }
  | { type: 'SET_USE_DATABASE'; payload: boolean }
  | { type: 'SET_MIGRATION_STATUS'; payload: AppState['migrationStatus'] };

const initialState: AppState = {
  interactions: [],
  sessions: [],
  memories: [],
  actionItems: [],
  currentSession: null,
  searchResults: [],
  loading: false,
  ragEnabled: true,
  databaseConnected: false,
  useDatabase: false,
  migrationStatus: 'idle',
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
        actionItems: state.actionItems.map(a => a.id === action.payload.id ? a : action.payload)
      };
    case 'DELETE_ACTION_ITEM':
      return {
        ...state,
        actionItems: state.actionItems.filter(a => a.id !== action.payload)
      };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'TOGGLE_RAG':
      return { ...state, ragEnabled: action.payload };
    case 'SET_DATABASE_CONNECTED':
      return { ...state, databaseConnected: action.payload };
    case 'SET_USE_DATABASE':
      return { ...state, useDatabase: action.payload };
    case 'SET_MIGRATION_STATUS':
      return { ...state, migrationStatus: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadData: () => Promise<void>;
    addInteraction: (interaction: Omit<AIInteraction, 'id' | 'timestamp'>) => Promise<void>;
    createSession: (title: string, platform: string) => Promise<Session>;
    updateSession: (session: Session) => Promise<void>;
    addActionItem: (item: Omit<ActionItem, 'id' | 'createdAt'>) => Promise<void>;
    updateActionItem: (item: ActionItem) => Promise<void>;
    deleteActionItem: (id: string) => Promise<void>;
    searchContent: (query: string) => Promise<void>;
    extractActionItems: (response: string, interactionId: string) => Promise<ActionItem[]>;
    getRagContext: (query: string) => Promise<Memory[]>;
    testDatabaseConnection: () => Promise<boolean>;
    migrateToDatabase: (userId: string) => Promise<void>;
    switchToDatabase: () => Promise<void>;
    switchToLocalStorage: () => Promise<void>;
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
        
        // Test database connection (will fail gracefully if API server is not running)
        const isConnected = await testDatabaseConnection();
        dispatch({ type: 'SET_DATABASE_CONNECTED', payload: isConnected });
        
        // Check if user wants to use database (stored in localStorage)
        const useDatabase = localStorage.getItem('useDatabase') === 'true';
        dispatch({ type: 'SET_USE_DATABASE', payload: useDatabase && isConnected });
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        // Fallback to localStorage mode
        dispatch({ type: 'SET_DATABASE_CONNECTED', payload: false });
        dispatch({ type: 'SET_USE_DATABASE', payload: false });
      }
    };

    initServices();
  }, []);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (state.useDatabase && services?.dbService) {
        // Load from database
        const userId = 'default-user'; // TODO: Implement proper user management
        
        const [dbInteractions, dbSessions, dbMemories, dbActionItems] = await Promise.all([
          services.dbService.getAiInteractions(userId),
          services.dbService.getSessions(userId),
          services.dbService.getMemoriesBySourceType(userId, 'interaction'),
          services.dbService.getActionItems(userId),
        ]);

        // Convert database types to app types
        const interactions: AIInteraction[] = dbInteractions.map((db: any) => ({
          id: db.id,
          prompt: db.prompt,
          response: db.response,
          platform: db.platform,
          model: db.model,
          timestamp: db.timestamp || new Date(db.created_at).getTime(),
          sessionId: db.session_id,
          tags: db.tags || [],
          summary: db.summary,
          embedding: db.embedding,
        }));

        const sessions: Session[] = dbSessions.map((db: any) => ({
          id: db.id,
          title: db.title || 'Untitled Session',
          platform: db.platform || 'Unknown',
          startTime: new Date(db.start_time).getTime(),
          endTime: db.end_time ? new Date(db.end_time).getTime() : undefined,
          interactions: [],
          summary: db.summary,
          themes: db.themes || [],
          totalInteractions: db.total_interactions,
        }));

        const memories: Memory[] = dbMemories.map((db: any) => ({
          id: db.id,
          content: db.content,
          embedding: db.embedding || [],
          source: db.source_type,
          sourceId: db.source_id,
          tags: db.tags || [],
          relevanceScore: db.relevance_score,
          createdAt: new Date(db.created_at).getTime(),
          updatedAt: new Date(db.updated_at).getTime(),
        }));

        const actionItems: ActionItem[] = dbActionItems.map((db: any) => ({
          id: db.id,
          text: db.text,
          completed: db.completed,
          priority: db.priority,
          category: db.category || 'General',
          dueDate: db.due_date ? new Date(db.due_date).getTime() : undefined,
          sourceInteractionId: db.source_interaction_id,
          createdAt: new Date(db.created_at).getTime(),
        }));

        dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
        dispatch({ type: 'SET_SESSIONS', payload: sessions });
        dispatch({ type: 'SET_MEMORIES', payload: memories });
        dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
      } else {
        // Load from localStorage (fallback)
        const [interactions, sessions, memories, actionItems] = await Promise.all([
          Promise.resolve(storage.getInteractions()),
          Promise.resolve(storage.getSessions()),
          Promise.resolve(storage.getMemories()),
          Promise.resolve(storage.getActionItems()),
        ]);

        dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
        dispatch({ type: 'SET_SESSIONS', payload: sessions });
        dispatch({ type: 'SET_MEMORIES', payload: memories });
        dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      const [interactions, sessions, memories, actionItems] = await Promise.all([
        Promise.resolve(storage.getInteractions()),
        Promise.resolve(storage.getSessions()),
        Promise.resolve(storage.getMemories()),
        Promise.resolve(storage.getActionItems()),
      ]);

      dispatch({ type: 'SET_INTERACTIONS', payload: interactions });
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      dispatch({ type: 'SET_MEMORIES', payload: memories });
      dispatch({ type: 'SET_ACTION_ITEMS', payload: actionItems });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addInteraction = async (interactionData: Omit<AIInteraction, 'id' | 'timestamp'>) => {
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

    if (state.useDatabase && services?.dbService) {
      // Save to database
      const userId = 'default-user';
      await services.dbService.createAiInteraction({
        user_id: userId,
        session_id: interaction.sessionId,
        prompt: interaction.prompt,
        response: interaction.response,
        platform: interaction.platform,
        model: interaction.model,
        timestamp: interaction.timestamp,
        tags: interaction.tags,
        summary: interaction.summary,
        embedding: interaction.embedding,
        tokens_used: 0, // TODO: Get actual token count
      });

      // Create memory in database
      await services.ragService.createMemory(
        userId,
        `Q: ${interaction.prompt}\nA: ${interaction.response}`,
        'interaction',
        interaction.id,
        interaction.tags
      );
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

    if (state.useDatabase && services?.dbService) {
      // Save to database
      const userId = 'default-user';
      await services.dbService.createSession({
        user_id: userId,
        title: session.title,
        platform: session.platform,
        start_time: new Date(session.startTime).toISOString(),
        total_interactions: session.totalInteractions,
      });
    } else {
      // Save to localStorage
      storage.saveSession(session);
    }

    dispatch({ type: 'ADD_SESSION', payload: session });
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });

    return session;
  };

  const updateSession = async (session: Session) => {
    if (state.useDatabase && services?.dbService) {
      // Update in database
      const userId = 'default-user';
      await services.dbService.updateSession(session.id, {
        title: session.title,
        platform: session.platform,
        end_time: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        summary: session.summary,
        themes: session.themes,
        total_interactions: session.totalInteractions,
      });
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
    };

    if (state.useDatabase && services?.dbService) {
      // Save to database
      const userId = 'default-user';
      await services.dbService.createActionItem({
        user_id: userId,
        text: item.text,
        completed: item.completed,
        priority: item.priority,
        category: item.category,
        due_date: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : undefined,
        source_interaction_id: item.sourceInteractionId,
        source_session_id: undefined,
      });
    } else {
      // Save to localStorage
      storage.saveActionItem(item);
    }

    dispatch({ type: 'ADD_ACTION_ITEM', payload: item });
  };

  const updateActionItem = async (item: ActionItem) => {
    if (state.useDatabase && services?.dbService) {
      // Update in database
      await services.dbService.updateActionItem(item.id, {
        text: item.text,
        completed: item.completed,
        priority: item.priority,
        category: item.category,
        due_date: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : undefined,
      });
    } else {
      // Update in localStorage
      storage.saveActionItem(item);
    }

    dispatch({ type: 'UPDATE_ACTION_ITEM', payload: item });
  };

  const deleteActionItem = async (id: string) => {
    if (state.useDatabase && services?.dbService) {
      // Delete from database
      await services.dbService.deleteActionItem(id);
    } else {
      // Delete from localStorage
      storage.deleteActionItem(id);
    }

    dispatch({ type: 'DELETE_ACTION_ITEM', payload: id });
  };

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    if (state.useDatabase && services?.ragService) {
      // Search using database RAG
      const userId = 'default-user';
      const results = await services.ragService.searchMemories(userId, query, 0.7, 10);
      
      // Convert to SearchResult format
      const searchResults: SearchResult[] = results.map(result => ({
        item: {
          id: result.id,
          content: result.content,
          embedding: [],
          source: result.source_type as any,
          sourceId: result.source_id,
          tags: [],
          relevanceScore: result.similarity,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        score: result.similarity,
        type: 'memory',
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
        });
      }
    });
    
    return actionItems;
  };

  const getRagContext = async (query: string): Promise<Memory[]> => {
    if (state.useDatabase && services?.ragService) {
      // Get context from database
      const userId = 'default-user';
      const context = await services.ragService.getRAGContext(userId, query, 0.7, 5);
      return context.memories;
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

  const migrateToDatabase = async (userId: string) => {
    if (!services?.dbService || !services?.ragService) {
      throw new Error('Database services not initialized');
    }

    dispatch({ type: 'SET_MIGRATION_STATUS', payload: 'migrating' });

    try {
      const migration = new MigrationService(services.dbService, services.ragService);
      const result = await migration.migrateAllData(userId);
      
      console.log('Migration completed:', result);
      
      // Reload data from database
      await loadData();
      
      dispatch({ type: 'SET_MIGRATION_STATUS', payload: 'completed' });
    } catch (error) {
      console.error('Migration failed:', error);
      dispatch({ type: 'SET_MIGRATION_STATUS', payload: 'error' });
      throw error;
    }
  };

  const switchToDatabase = async () => {
    if (!state.databaseConnected) {
      throw new Error('Database not connected');
    }

    localStorage.setItem('useDatabase', 'true');
    dispatch({ type: 'SET_USE_DATABASE', payload: true });
    await loadData();
  };

  const switchToLocalStorage = async () => {
    localStorage.setItem('useDatabase', 'false');
    dispatch({ type: 'SET_USE_DATABASE', payload: false });
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [state.useDatabase, services]);

  const actions = {
    loadData,
    addInteraction,
    createSession,
    updateSession,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    searchContent,
    extractActionItems,
    getRagContext,
    testDatabaseConnection,
    migrateToDatabase,
    switchToDatabase,
    switchToLocalStorage,
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