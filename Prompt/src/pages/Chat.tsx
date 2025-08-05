import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, Brain, Zap, Sparkles, Key, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { openaiService } from '../services/openai';
import ApiKeyModal from '../components/ApiKeyModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ragContext?: any[];
}

const Chat: React.FC = () => {
  const { state, actions } = useApp();
  const { ragEnabled } = state;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load saved API key
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      openaiService.initialize(savedKey);
    }
  }, []);

  const generateAIResponse = async (prompt: string, ragContext?: any[]): Promise<string> => {
    if (!openaiService.isInitialized()) {
      throw new Error('OpenAI API key not configured. Please add your API key to continue.');
    }

    // Build conversation context
    const systemMessage = ragEnabled && ragContext && ragContext.length > 0
      ? `You are a helpful AI assistant. You have access to the user's previous interactions and memories for context. Here are some relevant memories from their past conversations:

${ragContext.map(memory => `- ${memory.content}`).join('\n')}

Use this context to provide more personalized and relevant responses, but don't explicitly mention that you're using their stored memories unless directly asked.`
      : 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.';

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
      let ragContext = [];
      if (ragEnabled) {
        ragContext = await actions.getRagContext(input);
      }

      // Generate AI response
      const aiResponse = await generateAIResponse(input, ragContext);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        ragContext: ragContext.length > 0 ? ragContext : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save interaction
      if (!currentSession) {
        const session = await actions.createSession('Chat Session', 'Aqeel');
        setCurrentSession(session.id);
      }

      await actions.addInteraction({
        prompt: input,
        response: aiResponse,
        platform: 'OpenAI',
        model: selectedModel,
        sessionId: currentSession || 'default',
        tags: ['chat', 'interactive'],
        summary: `User asked about: ${input.substring(0, 50)}...`
      });

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
      
      // If it's an API key error, show the modal
      if (error instanceof Error && error.message.includes('API key')) {
        setShowApiKeyModal(true);
      }
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

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('openai_api_key', newApiKey);
    openaiService.initialize(newApiKey);
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
          <h1 className="text-3xl font-bold text-white mb-2">AI Chat Interface</h1>
          <p className="text-slate-300">
            Chat with OpenAI using your stored memory and context
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              isConfigured
                ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            {isConfigured ? <Key className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isConfigured ? 'API Key Set' : 'Set API Key'}
            </span>
          </button>
          
          {isConfigured && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              aria-label="Select AI model"
              title="Select AI model"
            >
              {openaiService.getAvailableModels().map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          )}
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
            ragEnabled 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-slate-700 text-slate-400'
          }`}>
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">
              RAG {ragEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
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
                Welcome to AI Chat
              </h3>
              <p className="text-slate-300 max-w-md">
                {isConfigured 
                  ? "Start a conversation and I'll use your stored memories and interactions to provide contextual responses"
                  : "Please configure your OpenAI API key to start chatting"
                }
              </p>
              {!isConfigured && (
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Configure API Key
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              {[
                { icon: Brain, title: 'Memory-Enhanced', desc: 'Uses your stored interactions' },
                { icon: Zap, title: 'Context-Aware', desc: 'Remembers previous conversations' },
                { icon: Sparkles, title: 'Real AI', desc: 'Powered by OpenAI GPT models' }
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

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />
    </div>
  );
};

export default Chat;