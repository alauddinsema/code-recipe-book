import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface MobileRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  allowHalf?: boolean;
}

const MobileRatingInput: React.FC<MobileRatingInputProps> = ({
  rating,
  onRatingChange,
  size = 'lg',
  disabled = false,
  className = '',
  showLabels = true,
  allowHalf = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [touchRating, setTouchRating] = useState(0);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const labels = [
    'Terrible',
    'Poor',
    'Average',
    'Good',
    'Excellent'
  ];

  const getCurrentRating = () => {
    return touchRating || hoverRating || rating;
  };

  const handleClick = (starRating: number) => {
    if (disabled) return;
    onRatingChange(starRating);
  };

  const handleMouseEnter = (starRating: number) => {
    if (disabled) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  const handleTouchStart = (starRating: number) => {
    if (disabled) return;
    setTouchRating(starRating);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    if (touchRating > 0) {
      onRatingChange(touchRating);
    }
    setTouchRating(0);
  };

  const currentRating = getCurrentRating();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Star Rating */}
      <div className="flex items-center justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentRating;
          const isHalfFilled = allowHalf && star - 0.5 <= currentRating && star > currentRating;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleTouchStart(star)}
              onTouchEnd={handleTouchEnd}
              disabled={disabled}
              className={`
                ${sizeClasses[size]}
                transition-all duration-150 ease-in-out
                touch-manipulation
                ${disabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:scale-110 active:scale-95'
                }
                ${(hoverRating > 0 || touchRating > 0) ? 'transform scale-105' : ''}
              `}
              style={{ minWidth: sizeClasses[size].split(' ')[0], minHeight: sizeClasses[size].split(' ')[1] }}
            >
              {isFilled ? (
                <StarIcon className={`${sizeClasses[size]} text-yellow-400 drop-shadow-sm`} />
              ) : isHalfFilled ? (
                <div className="relative">
                  <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`} />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                    <StarIcon className={`${sizeClasses[size]} text-yellow-400`} />
                  </div>
                </div>
              ) : (
                <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600 hover:text-yellow-400 transition-colors`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Rating Label */}
      {showLabels && currentRating > 0 && (
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {labels[Math.ceil(currentRating) - 1]}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentRating} out of 5 stars
          </p>
        </div>
      )}

      {/* Touch-friendly rating buttons for mobile */}
      <div className="flex justify-center space-x-2 md:hidden">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
              touch-manipulation min-w-[44px] min-h-[44px]
              ${star <= currentRating
                ? 'bg-yellow-400 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
            `}
          >
            {star}
          </button>
        ))}
      </div>

      {/* Clear rating button */}
      {currentRating > 0 && !disabled && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => onRatingChange(0)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear rating
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileRatingInput;
