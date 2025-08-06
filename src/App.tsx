import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ResponsiveLayout from './components/ResponsiveLayout';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import ActionItems from './pages/ActionItems';
import Goals from './pages/Goals';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import { mobileService } from './services/mobileService';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initialize mobile service
  React.useEffect(() => {
    const initializeMobile = async () => {
      await mobileService.initialize();
      // Hide splash screen once app is ready
      await mobileService.hideSplashScreen();
    };
    initializeMobile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Aqeel</h1>
            <p className="text-slate-300">Your AI-powered productivity and memory assistant</p>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
          >
            Sign In to Continue
          </button>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ResponsiveLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/actions" element={<ActionItems />} />

            <Route path="/goals" element={<Goals />} />
            <Route path="/search" element={<Search />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset" element={<AuthCallback />} />
          </Routes>
        </ResponsiveLayout>
      </div>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;