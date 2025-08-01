import React, { useState, useEffect } from 'react';
import { OfflineStorageService } from '../../services/offlineStorage';
import type { Recipe } from '../../types';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface OfflineDownloadButtonProps {
  recipe: Recipe;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onDownloadComplete?: (success: boolean) => void;
}

type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded' | 'error';

export const OfflineDownloadButton: React.FC<OfflineDownloadButtonProps> = ({
  recipe,
  size = 'md',
  showLabel = false,
  onDownloadComplete
}) => {
  const [status, setStatus] = useState<DownloadStatus>('not_downloaded');
  const [progress, setProgress] = useState(0);

  // Check if recipe is already downloaded
  useEffect(() => {
    checkOfflineStatus();
  }, [recipe.id]);

  const checkOfflineStatus = async () => {
    try {
      const isOffline = await OfflineStorageService.isRecipeOffline(recipe.id);
      setStatus(isOffline ? 'downloaded' : 'not_downloaded');
    } catch (error) {
      console.error('Failed to check offline status:', error);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (status === 'downloading') return;

    try {
      setStatus('downloading');
      setProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await OfflineStorageService.downloadRecipe(recipe);
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('downloaded');
      
      toast.success(`📱 "${recipe.title}" downloaded for offline access!`);
      onDownloadComplete?.(true);
      
    } catch (error: any) {
      console.error('Failed to download recipe:', error);
      setStatus('error');
      setProgress(0);
      
      if (error.message.includes('limit')) {
        toast.error('Storage limit reached. Please remove some recipes first.');
      } else {
        toast.error('Failed to download recipe. Please try again.');
      }
      
      onDownloadComplete?.(false);
    }
  };

  const handleRemove = async () => {
    try {
      await OfflineStorageService.removeOfflineRecipe(recipe.id);
      setStatus('not_downloaded');
      setProgress(0);
      
      toast.success(`🗑️ "${recipe.title}" removed from offline storage`);
      onDownloadComplete?.(true);
      
    } catch (error) {
      console.error('Failed to remove offline recipe:', error);
      toast.error('Failed to remove recipe. Please try again.');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 p-1.5';
      case 'lg':
        return 'w-12 h-12 p-3';
      default:
        return 'w-10 h-10 p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  const renderButton = () => {
    const baseClasses = `
      relative rounded-full transition-all duration-300 
      backdrop-blur-md border border-white/20 shadow-lg
      ${getSizeClasses()}
    `;

    switch (status) {
      case 'downloading':
        return (
          <button
            disabled
            className={`${baseClasses} bg-blue-500/90 text-white cursor-not-allowed`}
            title="Downloading..."
          >
            <div className="relative">
              {/* Progress circle */}
              <svg className={`${getIconSize()} animate-spin`} fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  className="opacity-75"
                />
              </svg>
              {/* Progress text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{progress}%</span>
              </div>
            </div>
          </button>
        );

      case 'downloaded':
        return (
          <button
            onClick={handleRemove}
            className={`${baseClasses} bg-green-500/90 hover:bg-red-500/90 text-white group`}
            title="Downloaded - Click to remove"
          >
            <CheckCircleIcon className={`${getIconSize()} group-hover:hidden`} />
            <TrashIcon className={`${getIconSize()} hidden group-hover:block`} />
          </button>
        );

      case 'error':
        return (
          <button
            onClick={handleDownload}
            className={`${baseClasses} bg-red-500/90 hover:bg-blue-500/90 text-white`}
            title="Error - Click to retry"
          >
            <ExclamationTriangleIcon className={getIconSize()} />
          </button>
        );

      default:
        return (
          <button
            onClick={handleDownload}
            className={`${baseClasses} bg-white/20 hover:bg-blue-500/90 text-white hover:scale-110 active:scale-95`}
            title="Download for offline access"
          >
            <ArrowDownTrayIcon className={getIconSize()} />
          </button>
        );
    }
  };

  if (showLabel) {
    return (
      <div className="flex items-center space-x-2">
        {renderButton()}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status === 'downloaded' ? 'Downloaded' : 
           status === 'downloading' ? 'Downloading...' :
           status === 'error' ? 'Error' : 'Download'}
        </span>
      </div>
    );
  }

  return renderButton();
};

export default OfflineDownloadButton;
