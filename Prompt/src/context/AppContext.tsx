import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AIInteraction, Session, Memory, ActionItem, SearchResult } from '../types';
import { storage } from '../utils/storage';
import { ragService } from '../utils/rag';

interface AppState {
  interactions: AIInteraction[];
  sessions: Session[];
  memories: Memory[];
  actionItems: ActionItem[];
  currentSession: Session | null;
  searchResults: SearchResult[];
  loading: boolean;
  ragEnabled: boolean;
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
  | { type: 'TOGGLE_RAG'; payload: boolean };

const initialState: AppState = {
  interactions: [],
  sessions: [],
  memories: [],
  actionItems: [],
  currentSession: null,
  searchResults: [],
  loading: false,
  ragEnabled: true,
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
        actionItems: state.actionItems.map(a => a.id === action.payload.id ? action.payload : a)
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
  };
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
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
    } catch (error) {
      console.error('Error loading data:', error);
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

    storage.saveInteraction(interaction);
    dispatch({ type: 'ADD_INTERACTION', payload: interaction });

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

    // Extract action items
    const actionItems = await extractActionItems(interaction.response, interaction.id);
    actionItems.forEach(item => {
      storage.saveActionItem(item);
      dispatch({ type: 'ADD_ACTION_ITEM', payload: item });
    });
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

    storage.saveSession(session);
    dispatch({ type: 'ADD_SESSION', payload: session });
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });

    return session;
  };

  const updateSession = async (session: Session) => {
    storage.saveSession(session);
    dispatch({ type: 'UPDATE_SESSION', payload: session });
  };

  const addActionItem = async (itemData: Omit<ActionItem, 'id' | 'createdAt'>) => {
    const item: ActionItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    storage.saveActionItem(item);
    dispatch({ type: 'ADD_ACTION_ITEM', payload: item });
  };

  const updateActionItem = async (item: ActionItem) => {
    storage.saveActionItem(item);
    dispatch({ type: 'UPDATE_ACTION_ITEM', payload: item });
  };

  const deleteActionItem = async (id: string) => {
    storage.deleteActionItem(id);
    dispatch({ type: 'DELETE_ACTION_ITEM', payload: id });
  };

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    const results = await ragService.search(query, state.interactions, state.memories);
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
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
    return ragService.getRelevantMemories(query, state.memories);
  };

  useEffect(() => {
    loadData();
  }, []);

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