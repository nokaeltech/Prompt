import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, Brain, Zap, Sparkles, Plus, MessageSquare, Search, MoreVertical, Pin, Trash2, Edit3, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { openaiService } from '../services/openai';
import EnhancedTaskCreationModal from '../components/EnhancedTaskCreationModal';
import ActionItemSuggestions from '../components/ActionItemSuggestions';
import SessionIntelligence from '../components/SessionIntelligence';

import { Memory } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ragContext?: any[];
  interactionId?: string;
}

const Chat: React.FC = () => {
  const { state, actions } = useApp();
  const { ragEnabled, sessions } = state;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel] = useState('gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ content: string; interactionId: string } | null>(null);
  
  // Session intelligence states
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [sessionSummary, setSessionSummary] = useState<string>('');
  const [sessionThemes, setSessionThemes] = useState<string[]>([]);
  const [actionItemSuggestions, setActionItemSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // WhatsApp-style states
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [showSessionList, setShowSessionList] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Session management states
  const [contextMenuSession, setContextMenuSession] = useState<any>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize OpenAI service if API key is available
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      openaiService.initialize(savedKey);
    }
  }, []);

  // Auto-enhance session intelligence when conversation grows
  useEffect(() => {
    if (messages.length >= 4 && currentSession && messages.length % 4 === 0) {
      enhanceSessionIntelligence();
    }
  }, [messages.length, currentSession]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
      setContextMenuSession(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const enhanceSessionIntelligence = async () => {
    if (!currentSession || messages.length < 2) return;
    
    try {
      await actions.enhanceSessionIntelligence(currentSession);
      
      // Update local state with enhanced session info
      const session = state.sessions.find(s => s.id === currentSession);
      if (session) {
        setSessionTitle(session.title || '');
        setSessionSummary(session.summary || '');
        setSessionThemes(session.themes || []);
      }
    } catch (error) {
      console.error('Error enhancing session intelligence:', error);
    }
  };

  const generateAIResponse = async (prompt: string, ragContext?: any[]): Promise<string> => {
    if (!openaiService.isInitialized()) {
      throw new Error('OpenAI API key not configured. Please add your API key to continue.');
    }

    // Build conversation context
    const systemMessage = ragEnabled && ragContext && ragContext.length > 0
      ? `You are an AI-powered productivity and planning assistant. Your role is to help the user with:

1. **Task Management**: Help create, organize, and prioritize tasks and action items
2. **Goal Planning**: Assist with setting and breaking down long-term goals into actionable steps
3. **Knowledge Management**: Help organize thoughts, notes, and learnings
4. **Smart Prioritization**: Suggest what to focus on based on context and priorities
5. **Daily Planning**: Help with morning reviews and evening reflections

You have access to the user's previous interactions and memories for context. Here are some relevant memories from their past conversations:

${ragContext.map(memory => `- ${memory.content}`).join('\n')}

Use this context to provide more personalized and relevant responses. When appropriate, suggest creating action items, organizing information, or planning next steps. Don't explicitly mention that you're using their stored memories unless directly asked.`
      : `You are an AI-powered productivity and planning assistant. Your role is to help the user with:

1. **Task Management**: Help create, organize, and prioritize tasks and action items
2. **Goal Planning**: Assist with setting and breaking down long-term goals into actionable steps  
3. **Knowledge Management**: Help organize thoughts, notes, and learnings
4. **Smart Prioritization**: Suggest what to focus on based on context and priorities
5. **Daily Planning**: Help with morning reviews and evening reflections

When appropriate, suggest creating action items, organizing information, or planning next steps. Provide clear, actionable advice that helps the user be more productive and organized.`;

    const conversationMessages = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const apiMessages = [
      { role: 'system' as const, content: systemMessage },
      ...conversationMessages,
      { role: 'user' as const, content: prompt }
    ];

    return await openaiService.generateResponse(apiMessages, selectedModel);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get RAG context if enabled
      let ragContext: Memory[] = [];
      if (ragEnabled) {
        ragContext = await actions.getRagContext(input);
      }

      // Generate AI response
      const aiResponse = await generateAIResponse(input, ragContext);

      // Save interaction first to get the real interaction ID
      let sessionId = currentSession;
      if (!sessionId) {
        const session = await actions.createSession('Chat Session', 'Aqeel');
        sessionId = session.id;
        setCurrentSession(sessionId);
      }

      const savedInteraction = await actions.addInteraction({
        prompt: input,
        response: aiResponse,
        platform: 'ChatGPT',
        model: selectedModel,
        sessionId: sessionId,
        tags: ['chat', 'interactive'],
        summary: `User asked about: ${input.substring(0, 50)}...`
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        ragContext: ragContext.length > 0 ? ragContext : undefined,
        interactionId: savedInteraction.id // Use the real interaction ID from the database
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate action item suggestions for the response
      try {
        const suggestions = await actions.suggestActionItems(aiResponse);
        setActionItemSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error generating action item suggestions:', error);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred while generating the response.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
      

    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const createNewSession = async () => {
    try {
      const session = await actions.createSession('New Chat', 'Aqeel');
      setCurrentSession(session.id);
      setSelectedSession(session);
      setMessages([]);
      setSessionTitle('');
      setSessionSummary('');
      setSessionThemes([]);
      setActionItemSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const selectSession = async (session: any) => {
    setLoadingSession(true);
    setSelectedSession(session);
    setCurrentSession(session.id);
    setSessionTitle(session.title || '');
    setSessionSummary(session.summary || '');
    setSessionThemes(session.themes || []);
    
    // Debug: Check what's in the current state
    console.log('Current state interactions:', state.interactions);
    console.log('Current state sessions:', state.sessions);
    console.log('Selected session:', session);
    
    // Load messages for this session
    try {
      console.log('Loading messages for session:', session.id);
      const sessionMessages = await actions.loadSessionMessages(session.id);
      console.log('Loaded messages:', sessionMessages);
      
      if (sessionMessages && sessionMessages.length > 0) {
        setMessages(sessionMessages);
      } else {
        // Fallback: try to load from existing interactions in state
        const sessionInteractions = state.interactions.filter(interaction => interaction.sessionId === session.id);
        console.log('Fallback - found interactions in state:', sessionInteractions);
        
        if (sessionInteractions.length > 0) {
          const fallbackMessages = sessionInteractions.flatMap(interaction => [
            {
              id: `user-${interaction.id}`,
              role: 'user' as const,
              content: interaction.prompt,
              timestamp: interaction.timestamp,
              interactionId: interaction.id
            },
            {
              id: `assistant-${interaction.id}`,
              role: 'assistant' as const,
              content: interaction.response,
              timestamp: interaction.timestamp,
              interactionId: interaction.id
            }
          ]);
          setMessages(fallbackMessages);
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSessionContextMenu = (e: React.MouseEvent, session: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuSession(session);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const pinSession = async (session: any) => {
    try {
      await actions.pinSession(session.id);
      setShowContextMenu(false);
    } catch (error) {
      console.error('Error pinning session:', error);
    }
  };

  const renameSession = (session: any) => {
    setEditingSession(session);
    setEditSessionTitle(session.title || '');
    setShowContextMenu(false);
  };

  const saveSessionTitle = async () => {
    if (!editingSession || !editSessionTitle.trim()) return;
    
    try {
      await actions.renameSession(editingSession.id, editSessionTitle);
      setEditingSession(null);
      setEditSessionTitle('');
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  const deleteSession = async (session: any) => {
    if (!confirm(`Are you sure you want to delete "${session.title || 'Untitled Chat'}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await actions.deleteSession(session.id);
      
      // If this was the selected session, clear it
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
        setCurrentSession(null);
        setMessages([]);
        setSessionTitle('');
        setSessionSummary('');
        setSessionThemes([]);
      }
      
      setShowContextMenu(false);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    session.summary?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    session.themes?.some(theme => theme.toLowerCase().includes(sessionSearchQuery.toLowerCase()))
  );

  const getSessionPreview = (session: any) => {
    if (session.summary) {
      return session.summary.length > 50 
        ? session.summary.substring(0, 50) + '...' 
        : session.summary;
    }
    return 'No summary available';
  };

  const getSessionTime = (session: any) => {
    return format(new Date(session.startTime), 'MMM d, HH:mm');
  };

  const isConfigured = openaiService.isInitialized();

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-slate-900">
      {/* Left Sidebar - Sessions List */}
      <div className={`${showSessionList ? 'w-80' : 'w-0'} transition-all duration-300 bg-slate-800/50 border-r border-slate-700/50 flex flex-col`}>
        {/* Sessions Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chats</h2>
            <button
              onClick={createNewSession}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Sessions */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              value={sessionSearchQuery}
              onChange={(e) => setSessionSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No chats found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => selectSession(session)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSession?.id === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editSessionTitle}
                            onChange={(e) => setEditSessionTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveSessionTitle()}
                            onBlur={saveSessionTitle}
                            className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500/50"
                            autoFocus
                          />
                          <button
                            onClick={saveSessionTitle}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSession(null)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-white font-medium truncate">
                          {session.title || 'Untitled Chat'}
                        </h3>
                      )}
                      <p className="text-slate-400 text-sm truncate mt-1">
                        {getSessionPreview(session)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">
                          {getSessionTime(session)}
                        </span>
                        {session.themes && session.themes.length > 0 && (
                          <div className="flex gap-1">
                            {session.themes.slice(0, 2).map((theme, index) => (
                              <span
                                key={index}
                                className="px-1 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedSession?.id === session.id && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => handleSessionContextMenu(e, session)}
                        className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSessionList(!showSessionList)}
                className="lg:hidden p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {selectedSession?.title || 'AI Productivity Assistant'}
                </h1>
                <p className="text-slate-400 text-sm">
                  Your personal AI assistant for tasks, goals, planning, and knowledge management
                </p>
              </div>
            </div>
          </div>
          
          {/* Session Intelligence Display */}
          <SessionIntelligence
            title={sessionTitle}
            summary={sessionSummary}
            themes={sessionThemes}
            isVisible={currentSession !== null}
          />
        </div>

        {/* Action Item Suggestions */}
        <ActionItemSuggestions
          suggestions={actionItemSuggestions}
          isVisible={showSuggestions}
          onHide={() => setShowSuggestions(false)}
          onSelectSuggestion={(suggestion) => {
            setSelectedResponse({
              content: suggestion,
              interactionId: messages[messages.length - 1]?.interactionId || ''
            });
            setTaskModalOpen(true);
            setShowSuggestions(false);
          }}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-900 p-4">
          {loadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400">Loading conversation...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 mb-6">
                <Bot className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedSession ? `Session: ${selectedSession.title || 'Untitled'}` : 'Welcome to Your AI Productivity Assistant'}
                </h3>
                <p className="text-slate-300 max-w-md">
                  {isConfigured 
                    ? selectedSession 
                      ? "This session appears to be empty. Start a new conversation!"
                      : "I'm here to help you manage tasks, plan goals, organize knowledge, and boost your productivity. I'll use your stored memories to provide personalized advice and automatically organize our conversations."
                    : "Please configure your OpenAI API key to start using your AI productivity assistant"
                  }
                </p>
                {!isConfigured && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm">
                      Please configure your OpenAI API key in the Settings page to start using the AI assistant.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Debug Information */}
              {selectedSession && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 max-w-2xl">
                  <h4 className="text-lg font-semibold text-white mb-2">Debug Info</h4>
                  <div className="text-left text-sm text-slate-300 space-y-1">
                    <p><strong>Session ID:</strong> {selectedSession.id}</p>
                    <p><strong>Total Interactions in State:</strong> {state.interactions.length}</p>
                    <p><strong>Total Sessions in State:</strong> {state.sessions.length}</p>
                    <p><strong>Session Interactions:</strong> {state.interactions.filter(i => i.sessionId === selectedSession.id).length}</p>
                    <p><strong>Database Connected:</strong> {state.databaseConnected ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                {[
                  { icon: Brain, title: 'Smart Planning', desc: 'Helps organize tasks and goals' },
                  { icon: Zap, title: 'Knowledge Management', desc: 'Organizes your thoughts and learnings' },
                  { icon: Sparkles, title: 'Productivity Focused', desc: 'AI-powered task prioritization' }
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <Icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-slate-400">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Suggested conversation starters */}
              <div className="mt-8 max-w-2xl">
                <h4 className="text-lg font-semibold text-white mb-4 text-center">Try asking me about:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Help me organize my tasks for this week",
                    "Create a plan for my project goals",
                    "What should I focus on today?",
                    "Help me break down my long-term goals",
                    "Organize my thoughts about this topic",
                    "Suggest action items from our conversation"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="p-3 text-left bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 rounded-xl transition-colors text-sm text-slate-300 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-100 border border-slate-600/50'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {message.ragContext && message.ragContext.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-600/50">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <Brain className="w-3 h-3" />
                              <span>Using context from {message.ragContext.length} memory block{message.ragContext.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Save as Task Button */}
                        {message.role === 'assistant' && message.interactionId && (
                          <div className="mt-3 pt-3 border-t border-slate-600/50">
                            <button
                              onClick={() => {
                                setSelectedResponse({
                                  content: message.content,
                                  interactionId: message.interactionId!
                                });
                                setTaskModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-orange-400 hover:text-orange-300 rounded-lg transition-colors text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Save as Action Item
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-slate-400 mt-2 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-start"
                >
                  <div className="flex gap-3 max-w-2xl">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-4 rounded-2xl bg-slate-700/50 border border-slate-600/50">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className={`w-2 h-2 bg-slate-400 rounded-full animate-pulse animate-delay-${i}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-400">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full p-4 bg-slate-700/50 backdrop-blur-xl border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none textarea-min-height textarea-max-height"
                rows={1}
                disabled={!isConfigured}
              />
            </div>
            <motion.button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading || !isConfigured}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Send</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && contextMenuSession && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 min-w-32"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button
            onClick={() => pinSession(contextMenuSession)}
            className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
          >
            <Pin className="w-4 h-4" />
            Pin Session
          </button>
          <button
            onClick={() => renameSession(contextMenuSession)}
            className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </button>
          <div className="border-t border-slate-700 my-1"></div>
          <button
            onClick={() => deleteSession(contextMenuSession)}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Enhanced Task Creation Modal */}
      {selectedResponse && (
        <EnhancedTaskCreationModal
          isOpen={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setSelectedResponse(null);
          }}
          responseContent={selectedResponse.content}
          sessionId={currentSession || ''}
          interactionId={selectedResponse.interactionId}
        />
      )}
    </div>
  );
};

export default Chat;