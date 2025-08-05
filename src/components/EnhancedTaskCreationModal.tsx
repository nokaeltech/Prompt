import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { TaskAnalysisResult } from '../services/taskStructureAnalyzer';
import { X, Plus, Calendar, Flag, Folder, Tag, Check, ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react';

interface EnhancedTaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseContent: string;
  sessionId: string;
  interactionId: string;
}

const EnhancedTaskCreationModal: React.FC<EnhancedTaskCreationModalProps> = ({
  isOpen,
  onClose,
  responseContent,
  sessionId,
  interactionId
}) => {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TaskAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [useSubtasks, setUseSubtasks] = useState(true);
  const [editingMode, setEditingMode] = useState(false);
  
  // Form states
  const [mainTaskText, setMainTaskText] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Analyze the response when modal opens
  useEffect(() => {
    if (isOpen && responseContent && !analysis) {
      analyzeResponse();
    }
  }, [isOpen, responseContent, analysis]);

  // Update form when analysis is available
  useEffect(() => {
    if (analysis) {
      setMainTaskText(analysis.structure.mainTask);
      setSubtasks([...analysis.structure.subtasks]);
      setPriority(analysis.priority);
      setCategory(analysis.category);
      setUseSubtasks(analysis.shouldCreateSubtasks);
    }
  }, [analysis]);

  const analyzeResponse = async () => {
    setLoading(true);
    try {
      const result = await actions.analyzeTaskStructure(responseContent);
      setAnalysis(result);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error analyzing response:', error);
      // Fallback to simple analysis
      setAnalysis({
        structure: {
          mainTask: 'Task from AI response',
          subtasks: [],
          confidence: 0.5,
          reasoning: 'Analysis failed, using fallback'
        },
        shouldCreateSubtasks: false,
        priority: 'medium',
        category: 'General'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainTaskText.trim()) return;

    setLoading(true);
    try {
      if (useSubtasks && subtasks.length > 0) {
        // Create hierarchical tasks
        const updatedAnalysis: TaskAnalysisResult = {
          structure: {
            mainTask: mainTaskText.trim(),
            subtasks: subtasks.filter(s => s.trim().length > 0),
            confidence: analysis?.structure.confidence || 0.8,
            reasoning: 'User confirmed subtask structure'
          },
          shouldCreateSubtasks: true,
          estimatedDuration: analysis?.estimatedDuration,
          priority,
          category: showCustomCategory ? customCategory : category
        };

        await actions.createHierarchicalTasks(updatedAnalysis, sessionId, interactionId);
      } else {
        // Create single task
        const taskData: Omit<ActionItem, 'id' | 'createdAt'> = {
          text: mainTaskText.trim(),
          completed: false,
          priority,
          category: showCustomCategory ? customCategory : category,
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
          sourceInteractionId: interactionId,
        };

        await actions.createSingleTask(taskData, sessionId, interactionId);
      }

      onClose();
    } catch (error) {
      console.error('Error creating task(s):', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAnalysis(null);
      setShowAnalysis(false);
      setEditingMode(false);
      setMainTaskText('');
      setSubtasks([]);
      setPriority('medium');
      setCategory('');
      setDueDate('');
      setCustomCategory('');
      setShowCustomCategory(false);
      setUseSubtasks(true);
      onClose();
    }
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const removeSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    setSubtasks(newSubtasks);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-800 rounded-2xl border border-slate-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create Task from AI Response</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Analysis Results */}
            {analysis && (
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">AI Analysis</h3>
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAnalysis ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Structure:</span>
                    <span className="text-white font-medium">
                      {analysis.shouldCreateSubtasks ? 'Main Task + Subtasks' : 'Single Task'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Confidence:</span>
                    <span className={`font-medium ${
                      analysis.structure.confidence > 0.8 ? 'text-green-400' :
                      analysis.structure.confidence > 0.6 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {Math.round(analysis.structure.confidence * 100)}%
                    </span>
                  </div>

                  {showAnalysis && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <p className="text-sm text-slate-300">{analysis.structure.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task Structure Toggle */}
            {analysis && analysis.shouldCreateSubtasks && (
              <div className="flex items-center gap-3 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <input
                  type="checkbox"
                  id="useSubtasks"
                  checked={useSubtasks}
                  onChange={(e) => setUseSubtasks(e.target.checked)}
                  className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="useSubtasks" className="text-white font-medium">
                  Create as main task with subtasks ({subtasks.length} steps detected)
                </label>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Task */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {useSubtasks ? 'Main Task' : 'Task Description'}
                </label>
                <textarea
                  value={mainTaskText}
                  onChange={(e) => setMainTaskText(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={2}
                  placeholder="Enter task description..."
                  required
                />
              </div>

              {/* Subtasks */}
              {useSubtasks && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white">Subtasks</label>
                    <button
                      type="button"
                      onClick={addSubtask}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={subtask}
                          onChange={(e) => updateSubtask(index, e.target.value)}
                          className="flex-1 p-2 bg-slate-700/50 border border-slate-600/50 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                          placeholder={`Subtask ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtask(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Priority</label>
                <div className="flex gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        priority === option.value
                          ? 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                          : 'border-slate-600/50 bg-slate-700/50 text-slate-300 hover:border-slate-500/50'
                      }`}
                    >
                      <Flag className={`w-4 h-4 ${option.color}`} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {commonCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setShowCustomCategory(false);
                      }}
                      className={`p-2 rounded-lg border transition-colors ${
                        category === cat && !showCustomCategory
                          ? 'border-blue-500/50 bg-blue-500/20 text-blue-400'
                          : 'border-slate-600/50 bg-slate-700/50 text-slate-300 hover:border-slate-500/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomCategory(!showCustomCategory)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Custom Category
                  </button>
                  
                  {showCustomCategory && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                      placeholder="Enter custom category..."
                    />
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Due Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !mainTaskText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {useSubtasks ? 'Create Tasks' : 'Create Task'}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedTaskCreationModal; 