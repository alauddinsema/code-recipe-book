import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  ClockIcon,
  UserGroupIcon,
  CakeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { Recipe } from '../../types';

interface MobileRecipeCardProps {
  recipe: Recipe;
  onFavorite?: (recipe: Recipe) => void;
  onSave?: (recipe: Recipe) => void;
  onShare?: (recipe: Recipe) => void;
  isFavorited?: boolean;
}

const MobileRecipeCard: React.FC<MobileRecipeCardProps> = ({
  recipe,
  onFavorite,
  onSave,
  onShare,
  isFavorited = false
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipeActive) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative values)
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -120)); // Max swipe distance
    }
  };

  const handleTouchEnd = () => {
    setIsSwipeActive(false);
    
    // If swiped more than 60px, show actions
    if (swipeOffset < -60) {
      setSwipeOffset(-120);
      setShowActions(true);
    } else {
      setSwipeOffset(0);
      setShowActions(false);
    }
  };

  // Reset swipe when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setSwipeOffset(0);
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: 'favorite' | 'save' | 'share', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'favorite':
        onFavorite?.(recipe);
        break;
      case 'save':
        onSave?.(recipe);
        break;
      case 'share':
        onShare?.(recipe);
        break;
    }
    
    // Reset swipe after action
    setSwipeOffset(0);
    setShowActions(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-soft">
      {/* Swipe Actions Background */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500 to-orange-500 flex items-center justify-end pr-4 space-x-3">
        <button
          type="button"
          onClick={(e) => handleAction('favorite', e)}
          className="p-2 bg-white bg-opacity-20 rounded-full"
          aria-label="Favorite recipe"
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-white" />
          ) : (
            <HeartIcon className="w-5 h-5 text-white" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => handleAction('save', e)}
          className="p-2 bg-white bg-opacity-20 rounded-full"
          aria-label="Save recipe"
        >
          <BookmarkIcon className="w-5 h-5 text-white" />
        </button>
        <button
          type="button"
          onClick={(e) => handleAction('share', e)}
          className="p-2 bg-white bg-opacity-20 rounded-full"
          aria-label="Share recipe"
        >
          <ShareIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Card Content */}
      <div
        ref={cardRef}
        className="relative bg-white dark:bg-gray-800 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link to={`/recipe/${recipe.id}`} className="block">
          {/* Recipe Image */}
          <div className="relative h-40 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CakeIcon className="w-12 h-12 text-white opacity-60" />
              </div>
            )}
            
            {/* Difficulty Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty || 'medium')}`}>
                {recipe.difficulty}
              </span>
            </div>

            {/* Quick Action Hint */}
            {!showActions && (
              <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs opacity-70">
                ← Swipe
              </div>
            )}
          </div>

          {/* Recipe Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2">
              {recipe.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {recipe.description}
            </p>

            {/* Recipe Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                {recipe.prep_time && (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatTime(recipe.prep_time)}</span>
                  </div>
                )}
                
                {recipe.servings && (
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
              </div>

              {/* Rating */}
              {recipe.average_rating && recipe.average_rating > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{recipe.average_rating.toFixed(1)}</span>
                  <span className="text-xs">({recipe.rating_count || 0})</span>
                </div>
              )}
            </div>

            {/* Author */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                by <span className="font-medium">{recipe.author_name || 'Anonymous'}</span>
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Swipe Instruction Overlay (shown on first load) */}
      {!localStorage.getItem('swipe-tutorial-seen') && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center text-white p-6">
            <div className="text-2xl mb-2">👈</div>
            <p className="text-sm font-medium mb-1">Swipe left for quick actions</p>
            <p className="text-xs opacity-75">Favorite, Save, Share</p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('swipe-tutorial-seen', 'true');
                // Force re-render to hide overlay
                window.location.reload();
              }}
              className="mt-3 px-4 py-2 bg-primary-500 rounded-lg text-sm font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileRecipeCard;
