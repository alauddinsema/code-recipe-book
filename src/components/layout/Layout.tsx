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
      {/* Top Header */}
      <Navbar />

      {/* Main Content with mobile-first spacing */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-md mx-auto md:max-w-7xl">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>

      {/* Footer for Desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
