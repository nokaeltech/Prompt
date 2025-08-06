import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { CheckSquare, Plus, Filter, Flag, FileText, Clock, Repeat, Sparkles, Layers } from 'lucide-react';
import ActionItemCard from '../components/ActionItemCard';
import MobileActionItemCard from '../components/MobileActionItemCard';
import CreateActionModal from '../components/CreateActionModal';
import TaskTemplateModal from '../components/TaskTemplateModal';

const ActionItems: React.FC = () => {
  const { state } = useApp();
  const { actionItems, taskTemplates } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'all' | 'main-tasks' | 'subtasks'>('all');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process action items to build hierarchical structure
  const processedItems = React.useMemo(() => {
    const mainTasks: ActionItem[] = [];
    const subtasks: ActionItem[] = [];
    const standaloneItems: ActionItem[] = [];

    // First pass: separate main tasks, subtasks, and standalone items
    actionItems.forEach(item => {
      if (item.isMainTask) {
        mainTasks.push({ ...item, children: [] });
      } else if (item.parentId) {
        subtasks.push(item);
      } else {
        standaloneItems.push(item);
      }
    });

    // Second pass: build children arrays for main tasks
    mainTasks.forEach(mainTask => {
      mainTask.children = subtasks.filter(subtask => subtask.parentId === mainTask.id);
    });

    return { mainTasks, subtasks, standaloneItems };
  }, [actionItems]);

  const getFilteredItems = () => {
    let items: ActionItem[] = [];

    switch (viewMode) {
      case 'main-tasks':
        items = processedItems.mainTasks;
        break;
      case 'subtasks':
        items = processedItems.subtasks;
        break;
      default:
        items = [...processedItems.mainTasks, ...processedItems.standaloneItems];
        break;
    }

    return items.filter(item => {
      const statusMatch = filter === 'all' || 
        (filter === 'pending' && !item.completed) ||
        (filter === 'completed' && item.completed);
      
      const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
      
      return statusMatch && priorityMatch;
    });
  };

  const filteredItems = getFilteredItems();

  const pendingItems = actionItems.filter(item => !item.completed);
  const completedItems = actionItems.filter(item => item.completed);
  const highPriorityItems = actionItems.filter(item => item.priority === 'high' && !item.completed);
  const mainTasksCount = processedItems.mainTasks.length;
  const subtasksCount = processedItems.subtasks.length;

  const getProgressClass = (value: number, maxValue: number) => {
    const percentage = Math.min(100, Math.round((value / Math.max(maxValue, 1)) * 100));
    const roundedPercentage = Math.round(percentage / 10) * 10;
    return `progress-${roundedPercentage}`;
  };

  const stats = [
    { label: 'Total Actions', value: actionItems.length, color: 'blue' },
    { label: 'Main Tasks', value: mainTasksCount, color: 'purple' },
    { label: 'Subtasks', value: subtasksCount, color: 'indigo' },
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
            Manage tasks with hierarchical organization and AI-powered extraction
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

      {/* Filters and View Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {/* View Mode */}
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-400" />
          <span className="text-slate-300 font-medium">View:</span>
          {[
            { key: 'all', label: 'All Tasks', icon: CheckSquare },
            { key: 'main-tasks', label: 'Main Tasks', icon: Sparkles },
            { key: 'subtasks', label: 'Subtasks', icon: Layers }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === key
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Status and Priority Filters */}
        <div className="flex flex-wrap gap-4">
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
        </div>
      </motion.div>

      {/* Task Templates Section */}
      {taskTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Task Templates</h2>
              <span className="text-sm text-slate-400">({taskTemplates.length})</span>
            </div>
            <motion.button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              New Template
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskTemplates.slice(0, 6).map((template) => (
              <motion.div
                key={template.id}
                className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white truncate">{template.name}</h3>
                  <div className="flex items-center gap-1">
                    {template.isRecurring && (
                      <div title="Recurring">
                        <Repeat className="w-3 h-3 text-orange-400" />
                      </div>
                    )}
                    {template.estimatedDuration && (
                      <div title={`${template.estimatedDuration} min`}>
                        <Clock className="w-3 h-3 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {template.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      template.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      template.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {template.priority}
                    </span>
                    <span className="text-xs text-slate-500">{template.category}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Used {template.usageCount} times
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {taskTemplates.length > 6 && (
            <div className="text-center">
              <button className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                View all {taskTemplates.length} templates
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {filteredItems.length > 0 ? (
          <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
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
                isMobile ? (
                  <MobileActionItemCard key={`${item.id}-${index}`} item={item} index={index} />
                ) : (
                  <ActionItemCard key={`${item.id}-${index}`} item={item} index={index} />
                )
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
              {filter !== 'all' || priorityFilter !== 'all' || viewMode !== 'all'
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
      <TaskTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />
    </div>
  );
};

export default ActionItems;