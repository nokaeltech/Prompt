import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, Brain, Zap, Sparkles, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { openaiService } from '../services/openai';
import CreateActionModal from '../components/CreateActionModal';


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
  const { ragEnabled } = state;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel] = useState('gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ content: string; interactionId: string } | null>(null);

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



  const isConfigured = openaiService.isInitialized();

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Productivity Assistant</h1>
          <p className="text-slate-300">
            Your personal AI assistant for tasks, goals, planning, and knowledge management
          </p>
        </div>

      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 overflow-y-auto bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 mb-6">
              <Bot className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to Your AI Productivity Assistant
              </h3>
              <p className="text-slate-300 max-w-md">
                {isConfigured 
                  ? "I'm here to help you manage tasks, plan goals, organize knowledge, and boost your productivity. I'll use your stored memories to provide personalized advice."
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
          <>
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
          </>
        )}
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full p-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none textarea-min-height textarea-max-height"
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
      </motion.div>

      {/* Action Item Creation Modal */}
      {selectedResponse && (
        <CreateActionModal
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