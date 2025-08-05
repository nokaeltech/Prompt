import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { CheckSquare, Plus, Filter, Flag } from 'lucide-react';
import ActionItemCard from '../components/ActionItemCard';
import CreateActionModal from '../components/CreateActionModal';

const ActionItems: React.FC = () => {
  const { state } = useApp();
  const { actionItems } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredItems = actionItems.filter(item => {
    const statusMatch = filter === 'all' || 
      (filter === 'pending' && !item.completed) ||
      (filter === 'completed' && item.completed);
    
    const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
    
    return statusMatch && priorityMatch;
  });

  const pendingItems = actionItems.filter(item => !item.completed);
  const completedItems = actionItems.filter(item => item.completed);
  const highPriorityItems = actionItems.filter(item => item.priority === 'high' && !item.completed);

  const getProgressClass = (value: number, maxValue: number) => {
    const percentage = Math.min(100, Math.round((value / Math.max(maxValue, 1)) * 100));
    const roundedPercentage = Math.round(percentage / 10) * 10;
    return `progress-${roundedPercentage}`;
  };

  const stats = [
    { label: 'Total Actions', value: actionItems.length, color: 'blue' },
    { label: 'Pending', value: pendingItems.length, color: 'orange' },
    { label: 'Completed', value: completedItems.length, color: 'green' },
    { label: 'High Priority', value: highPriorityItems.length, color: 'red' }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Action Items</h1>
          <p className="text-slate-300">
            Manage tasks extracted from your AI interactions
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          Add Action
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
          >
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-slate-300">{stat.label}</p>
            <div className={`mt-3 h-2 rounded-full bg-${stat.color}-500/20`}>
              <div 
                className={`h-full rounded-full bg-${stat.color}-500 progress-width ${getProgressClass(stat.value, Math.max(...stats.map(s => s.value)))}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-slate-300 font-medium">Status:</span>
          {['all', 'pending', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-slate-400" />
          <span className="text-slate-300 font-medium">Priority:</span>
          {['all', 'high', 'medium', 'low'].map(priority => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                priorityFilter === priority
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems
              .sort((a, b) => {
                // Sort by completion status, then priority, then date
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return b.createdAt - a.createdAt;
              })
              .map((item, index) => (
                <ActionItemCard key={item.id} item={item} index={index} />
              ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <CheckSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No action items found</h3>
            <p className="text-slate-400 mb-6">
              {filter !== 'all' || priorityFilter !== 'all' 
                ? 'Try adjusting your filters or create a new action item'
                : 'Action items will be automatically extracted from AI responses or you can create them manually'
              }
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Action Item
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <CreateActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default ActionItems;