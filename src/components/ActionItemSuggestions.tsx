import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, X } from 'lucide-react';

interface ActionItemSuggestionsProps {
  suggestions: string[];
  isVisible: boolean;
  onHide: () => void;
  onSelectSuggestion: (suggestion: string) => void;
}

const ActionItemSuggestions: React.FC<ActionItemSuggestionsProps> = ({
  suggestions,
  isVisible,
  onHide,
  onSelectSuggestion
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="mb-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-orange-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Suggested Action Items
        </h3>
        <button
          onClick={onHide}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.slice(0, 6).map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectSuggestion(suggestion)}
            className="p-3 text-left bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-orange-500/50 rounded-lg transition-all duration-200 text-sm text-slate-300 hover:text-white group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="flex-1">{suggestion}</span>
            </div>
          </motion.button>
        ))}
      </div>
      
      {suggestions.length > 6 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-400">
            Showing 6 of {suggestions.length} suggestions
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ActionItemSuggestions; 