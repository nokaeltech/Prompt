import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  CheckSquare, 
  Target,
  Search, 
  Bot, 
  Settings,
  Brain,
  Menu,
  X
} from 'lucide-react';
import UserProfile from './UserProfile';
import { useDeviceDetection } from '../utils/deviceDetection';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const deviceInfo = useDeviceDetection();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/sessions', icon: MessageSquare, label: 'Sessions' },
    { path: '/actions', icon: CheckSquare, label: 'Actions' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/chat', icon: Bot, label: 'Chat' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const currentPage = navItems.find(item => item.path === location.pathname);

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 iphone-performance ${deviceInfo.iphoneModel?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
      {/* Mobile Header */}
      <header className={`flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-xl iphone-status-bar ${deviceInfo.isIPhone ? 'safe-area-top' : ''}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white transition-colors iphone-touch-target iphone-haptic-zone"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Aqeel</h1>
              <p className="text-xs text-slate-400">AI Assistant</p>
            </div>
          </div>
        </div>
        <UserProfile />
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowSidebar(false)}
            />
            
            {/* Sidebar */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 z-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white">Aqeel</h1>
                      <p className="text-xs text-slate-400">AI Memory Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setShowSidebar(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                          {isActive && (
                            <motion.div
                              className="ml-auto w-2 h-2 rounded-full bg-blue-400"
                              layoutId="mobileActiveIndicator"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto iphone-scroll">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="p-4 iphone-animation"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className={`bg-slate-800/95 backdrop-blur-xl border-t border-slate-700/50 p-2 iphone-nav ${deviceInfo.isIPhone ? 'home-indicator-safe' : ''}`}>
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
                              <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 iphone-touch-target iphone-haptic-zone ${
                    isActive
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout; 