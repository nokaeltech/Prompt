import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  CheckSquare, 
  Brain, 
  Clock,
  Target,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import DatabaseTest from '../components/DatabaseTest';

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { interactions, sessions, actionItems, memories } = state;

  const recentInteractions = interactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const pendingActions = actionItems.filter(item => !item.completed);
  const completedActions = actionItems.filter(item => item.completed);

  const getGradientClass = (color: string) => {
    if (color.includes('blue')) return 'gradient-blue';
    if (color.includes('purple')) return 'gradient-purple';
    if (color.includes('orange')) return 'gradient-orange';
    if (color.includes('green')) return 'gradient-green';
    return 'gradient-blue';
  };

  const stats = [
    {
      label: 'Total Interactions',
      value: interactions.length,
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      change: '+12% this week'
    },
    {
      label: 'Active Sessions',
      value: sessions.filter(s => !s.endTime).length,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      change: '3 ongoing'
    },
    {
      label: 'Pending Actions',
      value: pendingActions.length,
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      change: `${completedActions.length} completed`
    },
    {
      label: 'Memory Blocks',
      value: memories.length,
      icon: Brain,
      color: 'from-green-500 to-green-600',
      change: 'Growing daily'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Aqeel</span>
        </h1>
        <p className="text-slate-300 text-lg">
          Your personal AI memory assistant, tracking and organizing your AI interactions
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="relative group"
            >
                             <div className={`absolute inset-0 gradient-bg opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur ${getGradientClass(stat.color)}`} />
              <div className="relative p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-slate-300 font-medium mb-2">{stat.label}</p>
                <p className="text-sm text-slate-400">{stat.change}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Database Test Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <DatabaseTest />
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Interactions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Recent Interactions
            </h2>
            <Link
              to="/sessions"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentInteractions.length > 0 ? (
              recentInteractions.map((interaction, index) => (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                        {interaction.platform}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {format(new Date(interaction.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-white mb-2 line-clamp-2">
                    {interaction.prompt}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {interaction.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No interactions yet</p>
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Start chatting <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-400" />
              Pending Actions
            </h2>
            <Link
              to="/actions"
              className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 text-sm"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {pendingActions.length > 0 ? (
              pendingActions.slice(0, 5).map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        action.priority === 'high' ? 'bg-red-400' :
                        action.priority === 'medium' ? 'bg-orange-400' : 'bg-green-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white mb-2 line-clamp-2">
                        {action.text}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {action.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          action.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          action.priority === 'medium' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No pending actions</p>
                <p className="text-sm text-slate-500 mt-2">
                  Action items will appear here when extracted from AI responses
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;