import React from 'react';
import { StarIcon, ChatBubbleLeftIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import StarRating from './StarRating';

interface RatingSummaryProps {
  averageRating: number;
  ratingCount: number;
  reviewCount?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showBadge?: boolean;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  averageRating,
  ratingCount,
  reviewCount,
  className = '',
  variant = 'default',
  showBadge = true
}) => {
  const getRatingBadge = () => {
    if (ratingCount >= 10 && averageRating >= 4.5) {
      return {
        icon: TrophyIcon,
        text: 'Excellent',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      };
    }
    if (ratingCount >= 5 && averageRating >= 4.0) {
      return {
        icon: StarIcon,
        text: 'Highly Rated',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      };
    }
    if (ratingCount >= 3 && averageRating >= 3.5) {
      return {
        icon: StarIcon,
        text: 'Well Rated',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
    if (ratingCount >= 1) {
      return {
        icon: StarOutlineIcon,
        text: 'Rated',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      };
    }
    return null;
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const badge = getRatingBadge();

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <StarRating rating={averageRating} size="sm" showValue={false} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {averageRating.toFixed(1)} ({formatCount(ratingCount)})
        </span>
        {badge && showBadge && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
            <badge.icon className="w-3 h-3 mr-1" />
            {badge.text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={averageRating} size="md" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {ratingCount} rating{ratingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {badge && showBadge && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
              <badge.icon className="w-4 h-4 mr-1" />
              {badge.text}
            </span>
          )}
        </div>

        {reviewCount !== undefined && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <StarRating rating={averageRating} size="md" />
      
      <div className="flex items-center space-x-2">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {averageRating.toFixed(1)}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          ({formatCount(ratingCount)} rating{ratingCount !== 1 ? 's' : ''})
        </span>
      </div>

      {reviewCount !== undefined && (
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
          <ChatBubbleLeftIcon className="w-4 h-4" />
          <span className="text-sm">{reviewCount}</span>
        </div>
      )}

      {badge && showBadge && (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
          <badge.icon className="w-3 h-3 mr-1" />
          {badge.text}
        </span>
      )}
    </div>
  );
};

export default RatingSummary;
