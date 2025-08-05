import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Brain, 
  Trash2, 
  Download, 
  Upload,
  Shield,
  Zap,
  Database,
  Bell,
  Key
} from 'lucide-react';
import { storage } from '../utils/storage';
import { openaiService } from '../services/openai';
import ApiKeyModal from '../components/ApiKeyModal';

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const { ragEnabled, interactions, sessions, memories, actionItems } = state;
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  React.useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleToggleRAG = () => {
    dispatch({ type: 'TOGGLE_RAG', payload: !ragEnabled });
  };

  const handleExportData = () => {
    const data = {
      interactions,
      sessions,
      memories,
      actionItems,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptpath-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    if (showConfirmClear) {
      storage.clearAllData();
      dispatch({ type: 'SET_INTERACTIONS', payload: [] });
      dispatch({ type: 'SET_SESSIONS', payload: [] });
      dispatch({ type: 'SET_MEMORIES', payload: [] });
      dispatch({ type: 'SET_ACTION_ITEMS', payload: [] });
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
    }
  };

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('openai_api_key', newApiKey);
    openaiService.initialize(newApiKey);
  };

  const handleRemoveApiKey = () => {
    setApiKey('');
    localStorage.removeItem('openai_api_key');
  };

  const dataStats = [
    { label: 'Interactions', value: interactions.length, icon: Brain, color: 'blue' },
    { label: 'Sessions', value: sessions.length, icon: Database, color: 'purple' },
    { label: 'Memories', value: memories.length, icon: Zap, color: 'green' },
    { label: 'Action Items', value: actionItems.length, icon: Bell, color: 'orange' }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <SettingsIcon className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-300">Configure your PromptPath experience</p>
        </div>
      </motion.div>

      {/* Data Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {dataStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50"
            >
              <div className={`inline-flex p-2 rounded-lg bg-${stat.color}-500/20 mb-3`}>
                <Icon className={`w-5 h-5 text-${stat.color}-300`} />
              </div>
              <h3 className="text-xl font-bold text-white">{stat.value}</h3>
              <p className="text-sm text-slate-300">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI & RAG Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Configuration
          </h2>

          <div className="space-y-4">
            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">OpenAI API Key</h3>
                  <p className="text-sm text-slate-300">
                    Configure your OpenAI API key for real AI interactions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {apiKey ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      <Key className="w-4 h-4" />
                      <span>Configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                      <Key className="w-4 h-4" />
                      <span>Not Set</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  {apiKey ? 'Update Key' : 'Set API Key'}
                </button>
                {apiKey && (
                  <button
                    onClick={handleRemoveApiKey}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-lg transition-colors text-sm"
                  >
                    Remove Key
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">RAG Enhancement</h3>
                  <p className="text-sm text-slate-300">
                    Use stored memories to enhance AI responses with context
                  </p>
                </div>
                <motion.button
                  onClick={handleToggleRAG}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    ragEnabled ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    animate={{ x: ragEnabled ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>
              
              <div className="text-xs text-slate-400">
                {ragEnabled ? (
                  <div className="flex items-center gap-2 text-green-300">
                    <Zap className="w-4 h-4" />
                    <span>Context-aware responses enabled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Standard responses without memory context</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-2">Memory Management</h3>
              <p className="text-sm text-slate-300 mb-4">
                Your interactions are automatically converted to searchable memories
              </p>
              <div className="text-xs text-slate-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Vector Dimensions:</span> 1536
                  </div>
                  <div>
                    <span className="font-medium">Search Threshold:</span> 0.15
                  </div>
                  <div>
                    <span className="font-medium">Context Limit:</span> 5 memories
                  </div>
                  <div>
                    <span className="font-medium">Embeddings:</span> {apiKey ? 'OpenAI' : 'Simulated'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Data Management
          </h2>

          <div className="space-y-4">
            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Export & Backup</h3>
              <p className="text-sm text-slate-300 mb-4">
                Download all your data as a JSON file for backup or transfer
              </p>
              <motion.button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                Export All Data
              </motion.button>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Privacy & Security</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>All data stored locally in your browser</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>No data sent to external servers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Embeddings generated client-side</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 border-red-500/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Danger Zone
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Permanently delete all stored data. This action cannot be undone.
              </p>
              <motion.button
                onClick={handleClearAllData}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  showConfirmClear
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-5 h-5" />
                {showConfirmClear ? 'Confirm Delete All Data' : 'Clear All Data'}
              </motion.button>
              
              {showConfirmClear && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowConfirmClear(false)}
                  className="w-full mt-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        currentKey={apiKey}
      />
    </div>
  );
};

export default Settings;