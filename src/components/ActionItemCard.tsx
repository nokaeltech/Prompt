import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { Check, Clock, Flag, Calendar, Trash2, Link, MessageSquare, ChevronDown, ChevronRight, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ActionItemCardProps {
  item: ActionItem;
  index: number;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, index }) => {
  const { actions } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleToggleComplete = async () => {
    await actions.updateActionItem({
      ...item,
      completed: !item.completed,
      completedAt: !item.completed ? Date.now() : undefined
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this action item?')) {
      await actions.deleteActionItem(item.id);
    }
  };

  const handleSaveEdit = async () => {
    if (editText.trim()) {
      await actions.updateActionItem({
        ...item,
        text: editText.trim()
      });
      setIsEditing(false);
    }
  };

  const handleAddSubtask = async () => {
    const subtaskText = prompt('Enter subtask:');
    if (subtaskText?.trim()) {
      const newSubtask: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'> = {
        text: subtaskText.trim(),
        completed: false,
        priority: 'medium',
        category: item.category,
        parentId: item.id,
        orderIndex: (item.children?.length || 0) + 1,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await actions.addActionItem(newSubtask);
    }
  };

  const priorityColors = {
    high: 'from-red-500 to-red-600',
    medium: 'from-orange-500 to-orange-600',
    low: 'from-green-500 to-green-600'
  };

  const priorityBgColors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    medium: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    low: 'bg-green-500/20 text-green-300 border-green-500/30'
  };

  const hasChildren = item.children && item.children.length > 0;
  const isMainTask = item.isMainTask || hasChildren;
  const progress = item.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative ${item.completed ? 'opacity-75' : ''}`}
    >
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur bg-gradient-to-r ${priorityColors[item.priority]}/20`} />
      <div className="relative p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
        <div className="flex items-start gap-4">
          <motion.button
            onClick={handleToggleComplete}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              item.completed
                ? 'bg-green-500 border-green-500'
                : 'border-slate-400 hover:border-green-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {item.completed && <Check className="w-4 h-4 text-white" />}
          </motion.button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm"
                      placeholder="Enter task text"
                      aria-label="Edit task text"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isMainTask && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    <h3 
                      className={`text-sm font-medium leading-relaxed cursor-pointer ${
                        item.completed ? 'text-slate-400 line-through' : 'text-white'
                      }`}
                      onDoubleClick={() => setIsEditing(true)}
                    >
                      {item.text}
                    </h3>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isMainTask && (
                  <button
                    onClick={handleAddSubtask}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Add subtask"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete action item"
                  title="Delete action item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar for main tasks */}
            {isMainTask && progress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityBgColors[item.priority]}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {item.priority}
                </span>
                <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                  {item.category}
                </span>
                {item.sourceSessionId && (
                  <button
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                    title="View originating chat session"
                    onClick={() => {
                      // TODO: Navigate to session view
                      console.log('Navigate to session:', item.sourceSessionId);
                    }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </button>
                )}
                {isMainTask && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs">
                    Main Task
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(item.createdAt), 'MMM d')}</span>
              </div>
            </div>

            {item.dueDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Due: {format(new Date(item.dueDate), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {item.sourceInteractionId && (
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                <Link className="w-3 h-3" />
                <span>Linked to session</span>
              </div>
            )}

            {/* Subtasks */}
            {isMainTask && hasChildren && (
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <div className="border-t border-slate-700 pt-3">
                      <h4 className="text-xs font-medium text-slate-400 mb-2">Subtasks</h4>
                      {item.children!.map((subtask, subtaskIndex) => (
                        <ActionItemCard 
                          key={subtask.id} 
                          item={subtask} 
                          index={subtaskIndex} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionItemCard;