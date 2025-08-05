import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ActionItem } from '../types';
import { Check, Clock, Flag, Calendar, Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface SessionTasksListProps {
  sessionId: string;
  sessionTitle?: string;
}

const SessionTasksList: React.FC<SessionTasksListProps> = ({ sessionId, sessionTitle }) => {
  const { supabaseService } = useApp();
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionTasks();
  }, [sessionId]);

  const loadSessionTasks = async () => {
    try {
      setLoading(true);
      const sessionTasks = await supabaseService.getTasksBySession(sessionId);
      setTasks(sessionTasks);
    } catch (error) {
      console.error('Error loading session tasks:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-slate-800 rounded"></div>
            <div className="h-16 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Tasks from this Chat
          {sessionTitle && (
            <span className="text-sm text-slate-400 font-normal">
              ({sessionTitle})
            </span>
          )}
        </h3>
        <span className="text-sm text-slate-400">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tasks created from this chat yet</p>
          <p className="text-sm mt-1">Tasks created from this session will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative ${task.completed ? 'opacity-75' : ''}`}
            >
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur bg-gradient-to-r ${priorityColors[task.priority]}/20`} />
              <div className="relative p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-slate-400'
                  }`}>
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium leading-relaxed ${
                      task.completed ? 'text-slate-400 line-through' : 'text-white'
                    }`}>
                      {task.text}
                    </h4>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityBgColors[task.priority]}`}>
                        <Flag className="w-3 h-3 inline mr-1" />
                        {task.priority}
                      </span>
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                        {task.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(task.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionTasksList; 