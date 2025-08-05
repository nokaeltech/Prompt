import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Search as SearchIcon, Filter, Calendar, Tag, Brain } from 'lucide-react';
import { format } from 'date-fns';
import SearchResult from '../components/SearchResult';

const Search: React.FC = () => {
  const { state, actions } = useApp();
  const { searchResults, loading } = state;
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'interactions' | 'memories'>('all');

  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        actions.searchContent(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      actions.searchContent('');
    }
  }, [query, actions]);

  const filteredResults = searchResults.filter(result => {
    if (searchType === 'all') return true;
    return result.type === (searchType === 'interactions' ? 'interaction' : 'memory');
  });

  const stats = {
    total: searchResults.length,
    interactions: searchResults.filter(r => r.type === 'interaction').length,
    memories: searchResults.filter(r => r.type === 'memory').length,
    avgScore: searchResults.length > 0 
      ? (searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length).toFixed(2)
      : '0.00'
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Search & Recall</h1>
        <p className="text-slate-300">
          Find past interactions and memories using semantic search
        </p>
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-2xl mx-auto"
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className={`w-5 h-5 ${loading ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your AI interactions and memories..."
          className="w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Filters and Stats */}
      {(query.trim() || searchResults.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 font-medium">Type:</span>
            </div>
            {['all', 'interactions', 'memories'].map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span>Found: {filteredResults.length}</span>
            <span>Avg Score: {stats.avgScore}</span>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {!query.trim() ? (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Start searching</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Enter a query to search through your AI interactions and memories using semantic similarity
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
              {[
                { icon: SearchIcon, text: 'Semantic search using embeddings' },
                { icon: Brain, text: 'Context-aware results' },
                { icon: Tag, text: 'Relevance scoring' }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <Icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300 text-center">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-4">
            {filteredResults.map((result, index) => (
              <SearchResult key={`${result.type}-${result.item.id}`} result={result} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No results found</h3>
            <p className="text-slate-400">
              Try different keywords or check your spelling
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Search;