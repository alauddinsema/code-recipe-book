import React, { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { FavoritesService } from '../../services/favorites';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  recipeId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  recipeId,
  size = 'md',
  showText = false,
  className = '',
  onToggle
}) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, recipeId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const favorited = await FavoritesService.isFavorited(user.id, recipeId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      if (isFavorited) {
        await FavoritesService.removeFromFavorites(user.id, recipeId);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await FavoritesService.addToFavorites(user.id, recipeId);
        setIsFavorited(true);
        toast.success('Added to favorites');
      }

      onToggle?.(isFavorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show favorite button for non-authenticated users
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`
        inline-flex items-center justify-center rounded-full transition-all duration-200
        ${buttonSizeClasses[size]}
        ${isFavorited 
          ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
          : 'text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
        ${className}
      `}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
      ) : isFavorited ? (
        <HeartSolidIcon className={`${sizeClasses[size]} animate-pulse`} />
      ) : (
        <HeartIcon className={sizeClasses[size]} />
      )}
      
      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
