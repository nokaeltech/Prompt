import React from 'react';
import { motion } from 'framer-motion';
import { SearchResult as SearchResultType } from '../types';
import { MessageSquare, Brain, Calendar, Tag, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResultProps {
  result: SearchResultType;
  index: number;
}

const SearchResult: React.FC<SearchResultProps> = ({ result, index }) => {
  const isInteraction = result.type === 'interaction';
  const item = result.item;

  // Safety check for undefined item
  if (!item) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isInteraction ? 'bg-blue-500/20' : 'bg-purple-500/20'
          }`}>
            {isInteraction ? (
              <MessageSquare className={`w-5 h-5 ${isInteraction ? 'text-blue-400' : 'text-purple-400'}`} />
            ) : (
              <Brain className="w-5 h-5 text-purple-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isInteraction 
                    ? 'bg-blue-500/20 text-blue-300' 
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {isInteraction ? 'Interaction' : 'Memory'}
                </span>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <span>Score:</span>
                  <span className="font-mono font-bold text-green-400">
                    {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {isInteraction && 'prompt' in item && (
              <>
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Question:</h4>
                  <p className="text-white text-sm leading-relaxed line-clamp-2">
                    {item.prompt}
                  </p>
                </div>
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Response:</h4>
                  <p className="text-slate-200 text-sm leading-relaxed line-clamp-3">
                    {item.response}
                  </p>
                </div>
              </>
            )}

            {'content' in item && (
              <div className="mb-3">
                <p className="text-white text-sm leading-relaxed line-clamp-3">
                  {item.content}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(
                      'timestamp' in item ? item.timestamp : item.createdAt
                    ), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                
                {isInteraction && 'platform' in item && (
                  <div className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>{item.platform}</span>
                  </div>
                )}
              </div>
            </div>

            {'tags' in item && item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <Tag className="w-3 h-3 text-slate-400" />
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 4 && (
                    <span className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-full">
                      +{item.tags.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchResult;