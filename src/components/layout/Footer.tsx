import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION, ROUTES } from '../../utils/constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-transparent dark:bg-transparent border-t border-gray-200/20 dark:border-gray-700/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link 
              to={ROUTES.HOME} 
              className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400 mb-4"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{APP_NAME}</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">
              Discover delicious recipes with code snippets for smart cooking. 
              Combine your love for food and programming in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to={ROUTES.HOME} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to={ROUTES.ADD_RECIPE} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  Add Recipe
                </Link>
              </li>
              <li>
                <Link 
                  to={ROUTES.PROFILE} 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  Supabase
                </a>
              </li>
              <li>
                <a 
                  href="https://ai.google.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                >
                  Gemini AI
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} {APP_NAME}. Made with ❤️ for food and code lovers.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 sm:mt-0">
              Version {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
