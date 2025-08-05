import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Plus, Calendar, MessageSquare, Clock, Brain } from 'lucide-react';
import CreateSessionModal from '../components/CreateSessionModal';
import SessionCard from '../components/SessionCard';

const Sessions: React.FC = () => {
  const { state } = useApp();
  const { sessions, interactions } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeSessions = sessions.filter(s => !s.endTime);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Sessions</h1>
          <p className="text-slate-300">
            Manage and organize your AI conversation sessions
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          New Session
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Sessions', value: sessions.length, icon: MessageSquare, color: 'blue' },
          { label: 'Active Sessions', value: activeSessions.length, icon: Clock, color: 'green' },
          { label: 'Total Interactions', value: interactions.length, icon: Brain, color: 'purple' },
          { label: 'This Week', value: sessions.filter(s => s.startTime > Date.now() - 7 * 24 * 60 * 60 * 1000).length, icon: Calendar, color: 'orange' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
            >
              <div className={`inline-flex p-3 rounded-xl bg-${stat.color}-500/20 mb-4`}>
                <Icon className={`w-6 h-6 text-${stat.color}-300`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-slate-300">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-green-400" />
            Active Sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session, index) => (
              <SessionCard key={session.id} session={session} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          All Sessions
        </h2>
        
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions
              .sort((a, b) => b.startTime - a.startTime)
              .map((session, index) => (
                <SessionCard key={session.id} session={session} index={index} />
              ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No sessions yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first session to start organizing your AI interactions
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create First Session
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Sessions;