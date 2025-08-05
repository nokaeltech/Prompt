import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { Check, Clock, Flag, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ActionItemCardProps {
  item: ActionItem;
  index: number;
}

const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, index }) => {
  const { actions } = useApp();

  const handleToggleComplete = async () => {
    await actions.updateActionItem({
      ...item,
      completed: !item.completed
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this action item?')) {
      await actions.deleteActionItem(item.id);
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
              <h3 className={`text-sm font-medium leading-relaxed ${
                item.completed ? 'text-slate-400 line-through' : 'text-white'
              }`}>
                {item.text}
              </h3>
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityBgColors[item.priority]}`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  {item.priority}
                </span>
                <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                  {item.category}
                </span>
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionItemCard;