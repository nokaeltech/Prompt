import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, Brain, Zap, Sparkles, Plus, MessageSquare, Search, MoreVertical, Pin, Trash2, Edit3, X, Check, ArrowLeft, Mic, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { openaiService } from '../services/openai';
import EnhancedTaskCreationModal from './EnhancedTaskCreationModal';
import { Memory } from '../types';
import { useDeviceDetection } from '../utils/deviceDetection';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ragContext?: any[];
  interactionId?: string;
}

const MobileChat: React.FC = () => {
  const { state, actions } = useApp();
  const { ragEnabled, sessions } = state;
  const deviceInfo = useDeviceDetection();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel] = useState('gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ content: string; interactionId: string } | null>(null);
  
  // Mobile-specific states
  const [showSessionList, setShowSessionList] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
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

      // Save the interaction
      const interaction = await actions.addInteraction({
        prompt: input,
        response: aiResponse,
        platform: 'Productivity Assistant',
        model: selectedModel,
        sessionId: sessionId,
        tags: [],
      });

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        ragContext,
        interactionId: interaction.id
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update session
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        session.totalInteractions = (session.totalInteractions || 0) + 1;
        await actions.updateSession(session);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
    const session = await actions.createSession('New Chat Session', 'Aqeel');
    setCurrentSession(session.id);
    setSelectedSession(session);
    setMessages([]);
    setShowSessionList(false);
  };

  const selectSession = async (session: any) => {
    setSelectedSession(session);
    setCurrentSession(session.id);
    setShowSessionList(false);
    
    try {
      const sessionMessages = await actions.loadSessionMessages(session.id);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    }
  };

  const handleSessionContextMenu = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setContextMenuSession(session);
    setShowContextMenu(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
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
    if (editingSession && editSessionTitle.trim()) {
      try {
        await actions.renameSession(editingSession.id, editSessionTitle.trim());
        setEditingSession(null);
      } catch (error) {
        console.error('Error renaming session:', error);
      }
    }
  };

  const deleteSession = async (session: any) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await actions.deleteSession(session.id);
        if (selectedSession?.id === session.id) {
          setSelectedSession(null);
          setCurrentSession(null);
          setMessages([]);
        }
        setShowContextMenu(false);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const getSessionPreview = (session: any) => {
    return session.summary || 'No summary available';
  };

  const getSessionTime = (session: any) => {
    return format(new Date(session.startTime), 'MMM d, HH:mm');
  };

  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
    session.summary?.toLowerCase().includes(sessionSearchQuery.toLowerCase())
  );

  const isConfigured = openaiService.isInitialized();

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${deviceInfo.iphoneModel?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
      {/* Modern Mobile Header */}
      <div className={`flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/30 ${deviceInfo.isIPhone ? 'safe-area-top' : ''}`}>
        {showSessionList ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Aqeel</h1>
                <p className="text-xs text-slate-400">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={createNewSession}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowSessionList(true)}
              className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center hover:bg-slate-600/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-white truncate">
                {selectedSession?.title || 'AI Assistant'}
              </h1>
              {selectedSession && (
                <p className="text-xs text-slate-400">
                  {selectedSession.totalInteractions || 0} messages
                </p>
              )}
            </div>
            <div className="w-10" />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {showSessionList ? (
            <motion.div
              key="session-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {/* Modern Search Bar */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search your conversations..."
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/30 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                      <MessageSquare className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
                    <p className="text-slate-400 mb-6 max-w-sm">
                      Start your first conversation with Aqeel to get help with tasks, goals, and productivity
                    </p>
                    <button
                      onClick={createNewSession}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl"
                    >
                      Start New Chat
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => selectSession(session)}
                        className="group p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-slate-800/50 hover:scale-[1.02] active:scale-[0.98] border border-slate-700/30 hover:border-slate-600/50"
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
                                  className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                                  autoFocus
                                />
                                <button
                                  onClick={saveSessionTitle}
                                  className="p-2 text-green-400 hover:text-green-300"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingSession(null)}
                                  className="p-2 text-red-400 hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <h3 className="text-white font-semibold truncate text-lg mb-1">
                                {session.title || 'Untitled Chat'}
                              </h3>
                            )}
                            <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                              {getSessionPreview(session)}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                {getSessionTime(session)}
                              </span>
                              {session.themes && session.themes.length > 0 && (
                                <div className="flex gap-1">
                                  {session.themes.slice(0, 2).map((theme, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                    >
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleSessionContextMenu(e, session)}
                            className="p-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-300"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-interface"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-8">
                      <Bot className="w-12 h-12 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Welcome to Aqeel</h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-md">
                      Your AI-powered productivity assistant for tasks, goals, planning, and knowledge management
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto mb-8">
                      {[
                        { icon: Brain, title: 'Smart Planning', desc: 'Organize tasks and goals' },
                        { icon: Zap, title: 'Knowledge Management', desc: 'Organize thoughts and learnings' },
                        { icon: Sparkles, title: 'Productivity Focused', desc: 'AI-powered prioritization' }
                      ].map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={index} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                            <Icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <h4 className="font-semibold text-white text-sm mb-1 text-center">{feature.title}</h4>
                            <p className="text-xs text-slate-400 text-center">{feature.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Suggested conversation starters */}
                    <div className="max-w-sm mx-auto">
                      <h4 className="text-lg font-semibold text-white mb-4">Try asking me about:</h4>
                      <div className="space-y-3">
                        {[
                          "Help me organize my tasks for this week",
                          "Create a plan for my project goals",
                          "What should I focus on today?",
                          "Help me break down my long-term goals"
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(suggestion)}
                            className="w-full p-4 text-left bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-slate-600/50 rounded-2xl transition-all text-sm text-slate-300 hover:text-white"
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
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
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
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-slate-800/50 text-slate-100 border border-slate-700/30'
                            }`}>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                              
                              {message.ragContext && message.ragContext.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-600/30">
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Brain className="w-3 h-3" />
                                    <span>Using context from {message.ragContext.length} memory block{message.ragContext.length > 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Save as Task Button */}
                              {message.role === 'assistant' && message.interactionId && (
                                <div className="mt-3 pt-3 border-t border-slate-600/30">
                                  <button
                                    onClick={() => {
                                      setSelectedResponse({
                                        content: message.content,
                                        interactionId: message.interactionId!
                                      });
                                      setTaskModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 text-orange-400 hover:text-orange-300 rounded-xl transition-colors text-sm"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Save as Action Item
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="inline-block p-4 rounded-2xl bg-slate-800/50 text-slate-100 border border-slate-700/30">
                            <div className="flex items-center gap-3">
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
                      </motion.div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Modern Input Area */}
              <div className={`p-4 border-t border-slate-700/30 bg-slate-800/50 backdrop-blur-xl ${deviceInfo.isIPhone ? 'home-indicator-safe' : ''}`}>
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full p-4 pr-12 bg-slate-700/50 backdrop-blur-xl border border-slate-600/30 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none textarea-min-height textarea-max-height"
                      rows={1}
                      disabled={!isConfigured}
                    />
                    <div className="absolute right-3 bottom-3 flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading || !isConfigured}
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      {showContextMenu && contextMenuSession && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 min-w-40"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button
            onClick={() => pinSession(contextMenuSession)}
            className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-3"
          >
            <Pin className="w-4 h-4" />
            Pin Session
          </button>
          <button
            onClick={() => renameSession(contextMenuSession)}
            className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-3"
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </button>
          <div className="border-t border-slate-700 my-1"></div>
          <button
            onClick={() => deleteSession(contextMenuSession)}
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-700 flex items-center gap-3"
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

export default MobileChat; 