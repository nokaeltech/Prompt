import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  Search, 
  Tag, 
  Clock, 
  CheckCircle, 
  Filter, 
  Sparkles,
  Brain,
  Calendar,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface SessionStats {
  totalSessions: number;
  sessionsThisWeek: number;
  sessionsWithTasks: number;
  averageInteractionsPerSession: number;
}

const Sessions: React.FC = () => {
  const { state, actions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [showOnlyWithTasks, setShowOnlyWithTasks] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [filteredSessions, setFilteredSessions] = useState(state.sessions);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadSessionStats();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, selectedTheme, showOnlyWithTasks, state.sessions]);

  const loadSessionStats = async () => {
    try {
      const stats = await actions.getSessionStats();
      setSessionStats(stats);
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const filterSessions = async () => {
    setLoading(true);
    try {
      let sessions = state.sessions;

      // Apply search filter
      if (searchQuery.trim()) {
        sessions = await actions.searchSessions(searchQuery);
      }

      // Apply theme filter
      if (selectedTheme) {
        sessions = await actions.getSessionsByTheme(selectedTheme);
      }

      // Apply tasks filter
      if (showOnlyWithTasks) {
        sessions = await actions.getSessionsWithTasks();
      }

      setFilteredSessions(sessions);
    } catch (error) {
      console.error('Error filtering sessions:', error);
      setFilteredSessions(state.sessions);
    } finally {
      setLoading(false);
    }
  };

  const getAllThemes = () => {
    const themes = new Set<string>();
    state.sessions.forEach(session => {
      if (session.themes) {
        session.themes.forEach(theme => themes.add(theme));
      }
    });
    return Array.from(themes).sort();
  };

  const getSessionDuration = (session: any) => {
    if (!session.startTime || !session.endTime) return 'Ongoing';
    const duration = session.endTime - session.startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getSessionPreview = (session: any) => {
    if (session.summary) {
      return session.summary.length > 100 
        ? session.summary.substring(0, 100) + '...' 
        : session.summary;
    }
    return 'No summary available';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Session Intelligence</h1>
          <p className="text-slate-300">
            Your AI-enhanced conversation history with automatic organization and insights
          </p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-colors"
        >
          {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </motion.div>

      {/* Session Statistics */}
      {showStats && sessionStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{sessionStats.totalSessions}</p>
                <p className="text-sm text-slate-300">Total Sessions</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{sessionStats.sessionsThisWeek}</p>
                <p className="text-sm text-slate-300">This Week</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{sessionStats.sessionsWithTasks}</p>
                <p className="text-sm text-slate-300">With Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{sessionStats.averageInteractionsPerSession}</p>
                <p className="text-sm text-slate-300">Avg Interactions</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sessions by title, summary, or themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Theme Filter */}
          <div className="relative">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Themes</option>
              {getAllThemes().map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
            <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>

          {/* Tasks Filter */}
          <button
            onClick={() => setShowOnlyWithTasks(!showOnlyWithTasks)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showOnlyWithTasks
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            With Tasks
          </button>
        </div>
      </motion.div>

      {/* Sessions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-slate-400">Loading sessions...</span>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No sessions found</h3>
            <p className="text-slate-500">
              {searchQuery || selectedTheme || showOnlyWithTasks 
                ? 'Try adjusting your filters or search terms'
                : 'Start a conversation in the Chat to create your first session'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      {session.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(session.startTime), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {session.totalInteractions || 0} interactions
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        {getSessionDuration(session)}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/chat?session=${session.id}`}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm"
                  >
                    Open
                  </Link>
                </div>

                {/* Summary */}
                {session.summary && (
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {getSessionPreview(session)}
                  </p>
                )}

                {/* Themes */}
                {session.themes && session.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {session.themes.slice(0, 3).map((theme, themeIndex) => (
                      <span
                        key={themeIndex}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/30"
                      >
                        {theme}
                      </span>
                    ))}
                    {session.themes.length > 3 && (
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg">
                        +{session.themes.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Session Intelligence Badge */}
                {(session.title || session.summary || session.themes?.length) && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Brain className="w-3 h-3" />
                    <span>AI Enhanced</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sessions;