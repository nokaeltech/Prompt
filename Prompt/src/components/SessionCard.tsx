import React from 'react';
import { motion } from 'framer-motion';
import { Session } from '../types';
import { Clock, MessageSquare, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  session: Session;
  index: number;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, index }) => {
  const isActive = !session.endTime;
  const duration = session.endTime 
    ? Math.round((session.endTime - session.startTime) / 1000 / 60)
    : Math.round((Date.now() - session.startTime) / 1000 / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
      <div className="relative p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {session.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="px-2 py-1 bg-slate-700 rounded-full text-xs">
                {session.platform}
              </span>
              {isActive && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <MessageSquare className="w-4 h-4" />
              <span>{session.totalInteractions} interactions</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{duration}m</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(session.startTime), 'MMM d, yyyy HH:mm')}</span>
          </div>

          {session.themes.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
              <div className="flex flex-wrap gap-1 flex-1">
                {session.themes.slice(0, 3).map(theme => (
                  <span
                    key={theme}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                  >
                    {theme}
                  </span>
                ))}
                {session.themes.length > 3 && (
                  <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full">
                    +{session.themes.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {session.summary && (
            <p className="text-sm text-slate-300 line-clamp-2 mt-3 pt-3 border-t border-slate-700">
              {session.summary}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SessionCard;