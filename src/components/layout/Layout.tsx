import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 sm:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default Layout;
