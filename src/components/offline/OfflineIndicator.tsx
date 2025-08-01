import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  SignalSlashIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface OfflineIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      
      // Hide warning after 5 seconds
      setTimeout(() => setShowOfflineWarning(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineWarning) {
    return null; // Don't show anything when online
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1.5 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-700">
        <SignalSlashIcon className="w-4 h-4" />
        {showLabel && (
          <span className="text-sm font-medium">
            You're offline - showing cached recipes
          </span>
        )}
      </div>
    </div>
  );
};

interface OfflineStorageStatsProps {
  className?: string;
}

export const OfflineStorageStats: React.FC<OfflineStorageStatsProps> = ({ 
  className = '' 
}) => {
  const [stats, setStats] = useState<{
    total_recipes: number;
    total_size: number;
    storage_quota: number;
    storage_used: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { OfflineStorageService } = await import('../../services/offlineStorage');
      const storageStats = await OfflineStorageService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    if (!stats) return 0;
    return Math.round((stats.storage_used / stats.storage_quota) * 100);
  };

  const getStorageColor = (): string => {
    const percentage = getStoragePercentage();
    if (percentage > 80) return 'text-red-600 dark:text-red-400';
    if (percentage > 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Offline Recipes: {stats.total_recipes}
        </span>
        <span className={`font-medium ${getStorageColor()}`}>
          {formatBytes(stats.storage_used)} / {formatBytes(stats.storage_quota)}
        </span>
      </div>
      
      {/* Storage Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            getStoragePercentage() > 80 ? 'bg-red-500' :
            getStoragePercentage() > 60 ? 'bg-orange-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {getStoragePercentage()}% storage used
      </div>
    </div>
  );
};

interface NetworkStatusBadgeProps {
  className?: string;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({ 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
      
      connection?.addEventListener('change', () => {
        setConnectionType(connection.effectiveType || 'unknown');
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {isOnline ? (
        <>
          <WifiIcon className="w-3 h-3 text-green-500" />
          <span className="text-green-700 dark:text-green-300">
            Online {connectionType !== 'unknown' && `(${connectionType})`}
          </span>
        </>
      ) : (
        <>
          <SignalSlashIcon className="w-3 h-3 text-red-500" />
          <span className="text-red-700 dark:text-red-300">Offline</span>
        </>
      )}
    </div>
  );
};

interface OfflineBannerProps {
  onDismiss?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onDismiss }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>You're currently offline.</strong> You can still browse your downloaded recipes and use cached content.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
