import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface SessionIntelligenceProps {
  title?: string;
  summary?: string;
  themes?: string[];
  isVisible: boolean;
}

const SessionIntelligence: React.FC<SessionIntelligenceProps> = ({
  title,
  summary,
  themes,
  isVisible
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible || (!title && !summary && (!themes || themes.length === 0))) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          {title || 'Current Session'}
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          {summary && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-1">Summary</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{summary}</p>
            </div>
          )}
          
          {themes && themes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/30"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SessionIntelligence; 