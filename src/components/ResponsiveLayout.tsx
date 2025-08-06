import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from './Layout';
import MobileLayout from './MobileLayout';
import MobileChat from './MobileChat';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if the current route is the chat page
  const isChatPage = location.pathname === '/chat';

  if (isMobile && isChatPage) {
    return <MobileChat />;
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <Layout>{children}</Layout>;
};

export default ResponsiveLayout; 