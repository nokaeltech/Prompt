import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { X, Plus, Calendar, Flag, Folder, Tag } from 'lucide-react';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseContent: string;
  sessionId: string;
  interactionId: string;
}

const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  responseContent,
  sessionId,
  interactionId
}) => {
  const { actions } = useApp();
  const [taskText, setTaskText] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract a meaningful task title from the response content
  useEffect(() => {
    if (responseContent && !taskText) {
      const lines = responseContent.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.length > 0 && firstLine.length < 100) {
        setTaskText(firstLine);
      } else {
        // If first line is too long, take first sentence
        const sentences = responseContent.split(/[.!?]/);
        const firstSentence = sentences[0].trim();
        if (firstSentence.length > 0 && firstSentence.length < 100) {
          setTaskText(firstSentence);
        } else {
          setTaskText('Task from AI response');
        }
      }
    }
  }, [responseContent, taskText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    setLoading(true);
    try {
      const finalCategory = showCustomCategory ? customCategory : category;
      
      const taskData: Omit<ActionItem, 'id' | 'createdAt'> = {
        text: taskText.trim(),
        completed: false,
        priority,
        category: finalCategory || 'General',
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        sourceInteractionId: interactionId,
      };

      await actions.addActionItem(taskData);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-orange-400' },
    { value: 'high', label: 'High', color: 'text-red-400' }
  ];

  const commonCategories = [
    'Work',
    'Personal',
    'Health',
    'Learning',
    'Finance',
    'Home',
    'Travel',
    'General'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Save as Task</h2>
                  <p className="text-sm text-slate-400">Create a task from this AI response</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Close modal"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Text */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task Description
                </label>
                <textarea
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={3}
                  placeholder="Enter task description..."
                  required
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Folder className="w-4 h-4 inline mr-2" />
                  Category
                </label>
                <div className="space-y-2">
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value === 'custom') {
                        setShowCustomCategory(true);
                      } else {
                        setShowCustomCategory(false);
                      }
                    }}
                    className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={loading}
                    aria-label="Select task category"
                    title="Select task category"
                  >
                    <option value="">Select a category</option>
                    {commonCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">Custom category...</option>
                  </select>
                  
                                     {showCustomCategory && (
                     <input
                       type="text"
                       value={customCategory}
                       onChange={(e) => setCustomCategory(e.target.value)}
                       placeholder="Enter custom category"
                       className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                       disabled={loading}
                       aria-label="Enter custom category"
                       title="Enter custom category"
                     />
                   )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Flag className="w-4 h-4 inline mr-2" />
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                      className={`p-3 rounded-xl border transition-all ${
                        priority === option.value
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-slate-600/50 bg-slate-700/50 text-slate-300 hover:border-slate-500/50'
                      }`}
                      disabled={loading}
                      aria-label={`Set priority to ${option.label.toLowerCase()}`}
                      title={`Set priority to ${option.label.toLowerCase()}`}
                    >
                      <span className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={loading}
                  aria-label="Select due date"
                  title="Select due date"
                />
              </div>

              {/* Session Info */}
              <div className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Tag className="w-4 h-4" />
                  <span>Linked to session: {sessionId.substring(0, 8)}...</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskText.trim() || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskCreationModal; 