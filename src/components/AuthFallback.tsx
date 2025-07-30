import React from 'react';
import { Button } from './ui';

interface AuthFallbackProps {
  error?: string;
  onRetry?: () => void;
}

const AuthFallback: React.FC<AuthFallbackProps> = ({ error, onRetry }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-yellow-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Authentication Service Unavailable
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're having trouble connecting to our authentication service. 
          You can still browse recipes, but some features may be limited.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="primary">
              Try Again
            </Button>
          )}
          <Button onClick={handleReload} variant="secondary">
            Reload Page
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If this problem persists, please check your internet connection or try again later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthFallback;
