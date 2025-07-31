import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Simplified Top Header - Only for branding and user actions */}
      <Navbar />

      {/* Main Content - Optimized for bottom navigation */}
      <main className="flex-1 pb-20 md:pb-0 pt-2">
        <div className="max-w-md mx-auto md:max-w-7xl px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Primary navigation for mobile */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
