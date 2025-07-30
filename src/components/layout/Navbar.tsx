import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui';
import { ROUTES, APP_NAME } from '../../utils/constants';
import { useSwipeGesture } from '../../hooks';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Swipe gesture support for mobile menu
  const swipeRef = useSwipeGesture({
    onSwipeUp: () => {
      if (isMobileMenuOpen) {
        closeMobileMenu();
      }
    },
    threshold: 50
  });

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

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsMobileMenuOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  const closeMobileMenu = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsAnimating(false);
    }, 200);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { path: ROUTES.HOME, label: 'Home' },
    { path: ROUTES.ADD_RECIPE, label: 'Add Recipe', requireAuth: true },
    { path: ROUTES.FAVORITES, label: 'Favorites', requireAuth: true },
    { path: ROUTES.COLLECTIONS, label: 'Collections', requireAuth: true },
    { path: ROUTES.PROFILE, label: 'Profile', requireAuth: true },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to={ROUTES.HOME} 
            className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="hidden sm:block">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (link.requireAuth && !user) return null;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-sm px-3 py-2 touch-manipulation"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="btn-secondary text-sm px-3 py-2 touch-manipulation"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-primary text-sm px-3 py-2 touch-manipulation"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-150 touch-manipulation"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 md:hidden"
            style={{ top: '64px' }} // Account for navbar height
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-200 ${
                isAnimating ? 'opacity-0' : 'opacity-50'
              }`}
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu */}
            <div
              ref={(el) => {
                mobileMenuRef.current = el;
                swipeRef.current = el;
              }}
              className={`absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-out ${
                isAnimating ? '-translate-y-full' : 'translate-y-0'
              }`}
            >
              <div className="px-4 py-6 space-y-1">
                {navLinks.map((link) => {
                  if (link.requireAuth && !user) return null;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 touch-manipulation ${
                        isActive(link.path)
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Mobile Auth Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          closeMobileMenu();
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors duration-200 touch-manipulation"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to={ROUTES.LOGIN}
                        onClick={closeMobileMenu}
                        className="block w-full px-4 py-3 rounded-lg text-base font-medium text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors duration-200 touch-manipulation"
                      >
                        Login
                      </Link>
                      <Link
                        to={ROUTES.REGISTER}
                        onClick={closeMobileMenu}
                        className="block w-full px-4 py-3 rounded-lg text-base font-medium text-center bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white transition-colors duration-200 touch-manipulation"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
