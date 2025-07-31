import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui';
import { ROUTES, APP_NAME } from '../../utils/constants';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Check if we're on a detail page that should show back button
  const isDetailPage = location.pathname.includes('/recipe/');

  const navLinks = [
    { path: ROUTES.HOME, label: 'Home' },
    { path: ROUTES.ADD_RECIPE, label: 'Add Recipe', requireAuth: true },
    { path: ROUTES.FAVORITES, label: 'Favorites', requireAuth: true },
    { path: ROUTES.PROFILE, label: 'Profile', requireAuth: true },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button or Menu */}
          <div className="flex items-center">
            {isDetailPage ? (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 mr-2"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 mr-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            )}

            {/* App Title */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">{APP_NAME}</span>
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="py-4 space-y-1">
              {navLinks.map((link) => {
                if (link.requireAuth && !user) return null;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 ${
                      isActive(link.path)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile Auth Section */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                {user ? (
                  <div className="px-4 space-y-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Signed in as
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.email}
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-0 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="px-4 space-y-2">
                    <Link
                      to={ROUTES.LOGIN}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      Login
                    </Link>
                    <Link
                      to={ROUTES.REGISTER}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-base font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
