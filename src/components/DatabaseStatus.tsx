import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Database, HardDrive, ArrowRight, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

const DatabaseStatus: React.FC = () => {
  const { state, actions } = useApp();
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const handleSwitchToDatabase = async () => {
    try {
      await actions.switchToDatabase();
    } catch (error) {
      console.error('Failed to switch to database:', error);
    }
  };

  const handleSwitchToLocalStorage = async () => {
    try {
      await actions.switchToLocalStorage();
    } catch (error) {
      console.error('Failed to switch to localStorage:', error);
    }
  };

  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      await actions.migrateToDatabase('default-user');
      setShowMigrationModal(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusColor = () => {
    if (state.useDatabase) {
      return state.databaseConnected ? 'text-green-400' : 'text-red-400';
    }
    return 'text-blue-400';
  };

  const getStatusIcon = () => {
    if (state.useDatabase) {
      if (state.databaseConnected) {
        return <CheckCircle className="w-4 h-4" />;
      }
      return <XCircle className="w-4 h-4" />;
    }
    return <HardDrive className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (state.useDatabase) {
      return state.databaseConnected ? 'Database Connected' : 'Database Disconnected';
    }
    return 'Local Storage';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          state.useDatabase && state.databaseConnected
            ? 'bg-green-500/10 border-green-500/30'
            : state.useDatabase && !state.databaseConnected
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Switch Button */}
        {state.databaseConnected && (
          <button
            onClick={() => {
              if (state.useDatabase) {
                handleSwitchToLocalStorage();
              } else {
                setShowMigrationModal(true);
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-600/50 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">
              Switch to {state.useDatabase ? 'Local Storage' : 'Database'}
            </span>
          </button>
        )}

        {/* Test Connection Button */}
        {!state.databaseConnected && (
          <button
            onClick={actions.testDatabaseConnection}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 hover:bg-orange-500/30 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Test Connection</span>
          </button>
        )}
      </motion.div>

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Migrate to Database</h3>
            </div>
            
            <p className="text-slate-300 mb-6">
              This will migrate all your existing data from local storage to the database. 
              This process is irreversible and will enable enhanced RAG features.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMigrationModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMigrateData}
                disabled={isMigrating}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Migrate Data'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default DatabaseStatus; 