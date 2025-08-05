import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskAnalysisResult } from '../services/taskStructureAnalyzer';
import { motion } from 'framer-motion';
import { Play, Check, AlertCircle } from 'lucide-react';

const TaskStructureTest: React.FC = () => {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ input: string; result: TaskAnalysisResult }[]>([]);

  const testCases = [
    {
      name: 'Single Task',
      input: 'Create a marketing plan for Q4'
    },
    {
      name: 'Multiple Steps',
      input: 'To launch the product, first research competitors, then create a timeline, design marketing materials, and prepare a press release'
    },
    {
      name: 'Bullet Points',
      input: `Here's what you need to do:
• Research market trends
• Analyze competitor strategies
• Create a budget plan
• Set up tracking metrics`
    },
    {
      name: 'Numbered Steps',
      input: `Follow these steps:
1. Schedule a meeting with the team
2. Prepare the presentation slides
3. Send out calendar invites
4. Review the agenda`
    },
    {
      name: 'Complex Response',
      input: `To improve your productivity, you should:

First, organize your workspace by clearing clutter and setting up proper filing systems. This will help you focus better.

Then, create a daily routine that includes time blocks for different types of work. Make sure to schedule breaks and buffer time.

Next, implement a task management system. You can use apps like Todoist or Notion to track your tasks and projects.

Finally, review your progress weekly and adjust your approach based on what's working and what isn't.`
    }
  ];

  const runTest = async (testCase: { name: string; input: string }) => {
    setLoading(true);
    try {
      const result = await actions.analyzeTaskStructure(testCase.input);
      setResults(prev => [...prev, { input: testCase.input, result }]);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    for (const testCase of testCases) {
      await runTest(testCase);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Task Structure Analyzer Test</h2>
        <div className="flex gap-2">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run All Tests
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testCases.map((testCase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-slate-800 rounded-lg border border-slate-700"
          >
            <h3 className="text-lg font-semibold text-white mb-2">{testCase.name}</h3>
            <p className="text-sm text-slate-300 mb-3">{testCase.input}</p>
            <button
              onClick={() => runTest(testCase)}
              disabled={loading}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
            >
              Test
            </button>
          </motion.div>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Test Results</h3>
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-slate-800 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Test {index + 1}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Structure: </span>
                  <span className="text-white font-medium">
                    {result.result.shouldCreateSubtasks ? 'Main Task + Subtasks' : 'Single Task'}
                  </span>
                </div>
                
                <div>
                  <span className="text-slate-400">Confidence: </span>
                  <span className={`font-medium ${
                    result.result.structure.confidence > 0.8 ? 'text-green-400' :
                    result.result.structure.confidence > 0.6 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {Math.round(result.result.structure.confidence * 100)}%
                  </span>
                </div>
                
                <div>
                  <span className="text-slate-400">Main Task: </span>
                  <span className="text-white">{result.result.structure.mainTask}</span>
                </div>
                
                {result.result.structure.subtasks.length > 0 && (
                  <div>
                    <span className="text-slate-400">Subtasks: </span>
                    <ul className="list-disc list-inside text-white ml-2">
                      {result.result.structure.subtasks.map((subtask, i) => (
                        <li key={i}>{subtask}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <span className="text-slate-400">Priority: </span>
                  <span className="text-white">{result.result.priority}</span>
                </div>
                
                <div>
                  <span className="text-slate-400">Category: </span>
                  <span className="text-white">{result.result.category}</span>
                </div>
                
                <div>
                  <span className="text-slate-400">Reasoning: </span>
                  <span className="text-white">{result.result.structure.reasoning}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-slate-400">Analyzing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStructureTest; 