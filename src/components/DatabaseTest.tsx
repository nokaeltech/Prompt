import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Database, HardDrive, TestTube, CheckCircle, XCircle, Loader } from 'lucide-react';

const DatabaseTest: React.FC = () => {
  const { state, actions } = useApp();
  const [testResults, setTestResults] = useState<{
    connection: boolean;
    createTest: boolean;
    searchTest: boolean;
    loading: boolean;
  }>({
    connection: false,
    createTest: false,
    searchTest: false,
    loading: false,
  });

  const runTests = async () => {
    setTestResults(prev => ({ ...prev, loading: true }));

    try {
      // Test 1: Connection
      const connectionTest = await actions.testDatabaseConnection();
      setTestResults(prev => ({ ...prev, connection: connectionTest }));

      if (connectionTest && state.useDatabase) {
        // Test 2: Create test data
        try {
          await actions.addActionItem({
            text: 'Test action item from database',
            completed: false,
            priority: 'medium',
            category: 'Test',
          });
          setTestResults(prev => ({ ...prev, createTest: true }));
        } catch (error) {
          console.error('Create test failed:', error);
          setTestResults(prev => ({ ...prev, createTest: false }));
        }

        // Test 3: Search test
        try {
          await actions.searchContent('test');
          setTestResults(prev => ({ ...prev, searchTest: true }));
        } catch (error) {
          console.error('Search test failed:', error);
          setTestResults(prev => ({ ...prev, searchTest: false }));
        }
      }
    } catch (error) {
      console.error('Database tests failed:', error);
    } finally {
      setTestResults(prev => ({ ...prev, loading: false }));
    }
  };

  const getTestIcon = (test: boolean) => {
    if (testResults.loading) {
      return <Loader className="w-4 h-4 animate-spin" />;
    }
    return test ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getTestColor = (test: boolean) => {
    if (testResults.loading) return 'text-slate-400';
    return test ? 'text-green-400' : 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Database Test</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Connection Test</span>
          <div className="flex items-center gap-2">
            {getTestIcon(testResults.connection)}
            <span className={`text-sm ${getTestColor(testResults.connection)}`}>
              {testResults.loading ? 'Testing...' : testResults.connection ? 'Connected' : 'Failed'}
            </span>
          </div>
        </div>

        {state.useDatabase && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Create Test</span>
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.createTest)}
                <span className={`text-sm ${getTestColor(testResults.createTest)}`}>
                  {testResults.loading ? 'Testing...' : testResults.createTest ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Search Test</span>
              <div className="flex items-center gap-2">
                {getTestIcon(testResults.searchTest)}
                <span className={`text-sm ${getTestColor(testResults.searchTest)}`}>
                  {testResults.loading ? 'Testing...' : testResults.searchTest ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {state.useDatabase ? <Database className="w-4 h-4 text-blue-400" /> : <HardDrive className="w-4 h-4 text-green-400" />}
            <span className="text-slate-300">Storage Mode</span>
          </div>
          <span className="text-white font-medium">
            {state.useDatabase ? 'Database' : 'Local Storage'}
          </span>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-slate-300 mb-2">Data Count</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Interactions:</span>
              <span className="text-white">{state.interactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memories:</span>
              <span className="text-white">{state.memories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Action Items:</span>
              <span className="text-white">{state.actionItems.length}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={runTests}
        disabled={testResults.loading}
        className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {testResults.loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Running Tests...
          </>
        ) : (
          <>
            <TestTube className="w-4 h-4" />
            Run Database Tests
          </>
        )}
      </button>
    </motion.div>
  );
};

export default DatabaseTest; 