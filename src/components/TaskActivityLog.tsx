import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TaskActivityLog as TaskActivityLogType } from '../types';
import { 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Plus,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskActivityLogProps {
  taskId: string;
  taskTitle?: string;
}

const TaskActivityLog: React.FC<TaskActivityLogProps> = ({ taskId, taskTitle }) => {
  const { supabaseService } = useApp();
  const [activities, setActivities] = useState<TaskActivityLogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskActivity();
  }, [taskId]);

  const loadTaskActivity = async () => {
    try {
      setLoading(true);
      const taskActivities = await supabaseService.getTaskActivityLog(taskId);
      setActivities(taskActivities);
    } catch (error) {
      console.error('Error loading task activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created_from_session':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'status_changed':
        return <Edit className="w-4 h-4 text-yellow-400" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-purple-400" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <Plus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityTitle = (action: string) => {
    switch (action) {
      case 'created_from_session':
        return 'Created from chat session';
      case 'completed':
        return 'Marked as completed';
      case 'status_changed':
        return 'Status updated';
      case 'updated':
        return 'Task updated';
      case 'deleted':
        return 'Task deleted';
      default:
        return 'Activity logged';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created_from_session':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'completed':
        return 'border-green-500/30 bg-green-500/10';
      case 'status_changed':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'updated':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'deleted':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-slate-500/30 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-slate-800 rounded"></div>
            <div className="h-12 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Task Activity Log
          {taskTitle && (
            <span className="text-sm text-slate-400 font-normal">
              ({taskTitle})
            </span>
          )}
        </h3>
        <span className="text-sm text-slate-400">
          {activities.length} event{activities.length !== 1 ? 's' : ''}
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No activity recorded for this task</p>
          <p className="text-sm mt-1">Activity will appear here as you work on the task</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-xl border ${getActivityColor(activity.action)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">
                      {getActivityTitle(activity.action)}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  {/* Show session link if available */}
                  {activity.sessionId && (
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                        title="View originating chat session"
                        onClick={() => {
                          // TODO: Navigate to session view
                          console.log('Navigate to session:', activity.sessionId);
                        }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        View Chat
                      </button>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-400">
                        Created from session
                      </span>
                    </div>
                  )}

                  {/* Show value changes */}
                  {activity.oldValue && activity.newValue && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Changed from:</span>
                      <span className="text-red-300 line-through">{activity.oldValue}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-green-300">{activity.newValue}</span>
                    </div>
                  )}

                  {/* Show metadata if available */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">Context:</div>
                      {activity.metadata.taskText && (
                        <div className="text-xs text-white mb-1">
                          <span className="text-slate-400">Task:</span> {activity.metadata.taskText}
                        </div>
                      )}
                      {activity.metadata.priority && (
                        <div className="text-xs text-white mb-1">
                          <span className="text-slate-400">Priority:</span> {activity.metadata.priority}
                        </div>
                      )}
                      {activity.metadata.category && (
                        <div className="text-xs text-white">
                          <span className="text-slate-400">Category:</span> {activity.metadata.category}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskActivityLog; 