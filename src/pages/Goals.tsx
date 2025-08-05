import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Goal } from '../types';
import { 
  Target, 
  Plus, 
  Filter, 
  Flag, 
  Calendar, 
  Tag, 
  Trash2, 
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose }) => {
  const { actions } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [goalType, setGoalType] = useState<'simple' | 'milestone' | 'habit' | 'project'>('simple');
  const [loading, setLoading] = useState(false);

  const categories = ['Personal', 'Professional', 'Health', 'Learning', 'Financial', 'Creative', 'Other'];
  const priorities = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'orange' },
    { value: 'high', label: 'High', color: 'red' }
  ] as const;
  const goalTypes = [
    { value: 'simple', label: 'Simple Goal', description: 'A straightforward goal to achieve' },
    { value: 'milestone', label: 'Milestone Goal', description: 'A goal with multiple phases' },
    { value: 'habit', label: 'Habit Goal', description: 'A recurring habit to develop' },
    { value: 'project', label: 'Project Goal', description: 'A complex project with subgoals' }
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await actions.addGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
        completed: false,
        progress: 0,
        priority,
        goalType,
        phase: 'planning',
      });
      
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setTags('');
      setTargetDate('');
      setPriority('medium');
      setGoalType('simple');
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">New Goal</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close modal"
                title="Close modal"
              >
                <Plus className="w-5 h-5 text-slate-400 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Flag className="w-4 h-4 inline mr-1" />
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Select priority level"
                  >
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Select category"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Goal Type
                </label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  aria-label="Select goal type"
                >
                  {goalTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {goalTypes.find(t => t.value === goalType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="motivation, learning, career..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  aria-label="Select target date"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface GoalCardProps {
  goal: Goal;
  index: number;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, index }) => {
  const { actions } = useApp();

  const handleToggleComplete = async () => {
    await actions.updateGoal({
      ...goal,
      completed: !goal.completed,
      progress: !goal.completed ? 100 : 0
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await actions.deleteGoal(goal.id);
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    await actions.updateGoal({
      ...goal,
      progress: Math.max(0, Math.min(100, newProgress)),
      completed: newProgress >= 100
    });
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-slate-500';
  };

  const getProgressClass = (progress: number) => {
    const roundedProgress = Math.round(progress / 5) * 5;
    return `progress-goal-${Math.min(100, Math.max(0, roundedProgress))}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative ${goal.completed ? 'opacity-75' : ''}`}
    >
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur bg-gradient-to-r ${priorityColors[goal.priority]}/20`} />
      <div className="relative p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
        <div className="flex items-start gap-4">
          <motion.button
            onClick={handleToggleComplete}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              goal.completed
                ? 'bg-green-500 border-green-500'
                : 'border-slate-400 hover:border-green-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={goal.completed ? "Mark goal as incomplete" : "Mark goal as complete"}
            title={goal.completed ? "Mark goal as incomplete" : "Mark goal as complete"}
          >
            {goal.completed && <CheckCircle className="w-4 h-4 text-white" />}
          </motion.button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold leading-relaxed ${
                  goal.completed ? 'text-slate-400 line-through' : 'text-white'
                }`}>
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className={`text-sm mt-1 ${
                    goal.completed ? 'text-slate-500' : 'text-slate-300'
                  }`}>
                    {goal.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete goal"
                title="Delete goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Progress</span>
                <span className="text-sm font-medium text-white">{goal.progress}%</span>
              </div>
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 progress-bar-goal ${getProgressColor(goal.progress)} ${getProgressClass(goal.progress)}`}
                />
              </div>
                             <input
                 type="range"
                 min="0"
                 max="100"
                 value={goal.progress}
                 onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                 className="w-full mt-2 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                 aria-label={`Update progress for ${goal.title}`}
               />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityBgColors[goal.priority]}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {goal.priority}
                </span>
                <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                  {goal.category}
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs">
                  <Target className="w-3 h-3 inline mr-1" />
                  {goal.goalType}
                </span>
                {goal.tags.length > 0 && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs">
                    <Tag className="w-3 h-3 inline mr-1" />
                    {goal.tags.length} tags
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(goal.createdAt), 'MMM d')}</span>
              </div>
            </div>

            {goal.targetDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Goals: React.FC = () => {
  const { state } = useApp();
  const { goals } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredGoals = goals.filter(goal => {
    const statusMatch = filter === 'all' || 
      (filter === 'active' && !goal.completed) ||
      (filter === 'completed' && goal.completed);
    
    const priorityMatch = priorityFilter === 'all' || goal.priority === priorityFilter;
    const categoryMatch = categoryFilter === 'all' || goal.category === categoryFilter;
    
    return statusMatch && priorityMatch && categoryMatch;
  });

  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);
  const highPriorityGoals = goals.filter(goal => goal.priority === 'high' && !goal.completed);
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0;

  const categories = ['Personal', 'Professional', 'Health', 'Learning', 'Financial', 'Creative', 'Other'];

  const stats = [
    { label: 'Total Goals', value: goals.length, color: 'blue' },
    { label: 'Active', value: activeGoals.length, color: 'orange' },
    { label: 'Completed', value: completedGoals.length, color: 'green' },
    { label: 'High Priority', value: highPriorityGoals.length, color: 'red' }
  ];

  const getDynamicProgressClass = (value: number, maxValue: number) => {
    const percentage = Math.min(100, (value / Math.max(maxValue, 1)) * 100);
    const roundedPercentage = Math.round(percentage / 10) * 10;
    return `progress-dynamic-${Math.min(100, Math.max(0, roundedPercentage))}`;
  };

  const getOverallProgressClass = (progress: number) => {
    const roundedProgress = Math.round(progress / 10) * 10;
    return `progress-overall-${Math.min(100, Math.max(0, roundedProgress))}`;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Goals</h1>
          <p className="text-slate-300">
            Set and track your personal and professional objectives
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          Add Goal
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
                className={`h-full rounded-full bg-${stat.color}-500 progress-bar-dynamic ${getDynamicProgressClass(stat.value, Math.max(...stats.map(s => s.value), 1))}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Average Completion</span>
              <span className="text-lg font-bold text-white">{averageProgress}%</span>
            </div>
            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 progress-bar-overall ${getOverallProgressClass(averageProgress)}`}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Filter:</span>
        </div>
        
                 <select
           value={filter}
           onChange={(e) => setFilter(e.target.value as any)}
           className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
           aria-label="Filter by status"
         >
          <option value="all">All Goals</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

                 <select
           value={priorityFilter}
           onChange={(e) => setPriorityFilter(e.target.value as any)}
           className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
           aria-label="Filter by priority"
         >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

                 <select
           value={categoryFilter}
           onChange={(e) => setCategoryFilter(e.target.value)}
           className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
           aria-label="Filter by category"
         >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </motion.div>

      {/* Goals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        {filteredGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No goals found</h3>
            <p className="text-slate-500">
              {filter === 'all' ? 'Create your first goal to get started!' : 'No goals match your current filters.'}
            </p>
          </motion.div>
        ) : (
          filteredGoals.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} index={index} />
          ))
        )}
      </motion.div>

      <CreateGoalModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};

export default Goals; 