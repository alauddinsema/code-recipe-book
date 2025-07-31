import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  showValue?: boolean;
  className?: string;
  disabled?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  interactive = false,
  showValue = false,
  className = '',
  disabled = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleStarClick = (starRating: number) => {
    if (!interactive || disabled) return;
    
    setCurrentRating(starRating);
    onRatingChange?.(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (!interactive || disabled) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || currentRating;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= displayRating;
    const isPartiallyFilled = displayRating > i - 1 && displayRating < i;
    
    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => handleStarClick(i)}
        onMouseEnter={() => handleStarHover(i)}
        className={`
          relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded
          ${interactive && !disabled ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
          ${disabled ? 'opacity-50' : ''}
        `}
        disabled={!interactive || disabled}
        aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
      >
        {isFilled ? (
          <StarIcon
            className={`
              ${sizeClasses[size]}
              ${hoverRating >= i ? 'text-yellow-400 drop-shadow-lg' : 'text-yellow-500 drop-shadow-md'}
              ${interactive && !disabled ? 'filter drop-shadow-sm' : ''}
              transition-all duration-200
            `}
          />
        ) : isPartiallyFilled ? (
          <div className="relative">
            <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${(displayRating - (i - 1)) * 100}%` }}
            >
              <StarIcon className={`${sizeClasses[size]} text-yellow-500 drop-shadow-md`} />
            </div>
          </div>
        ) : (
          <StarOutlineIcon
            className={`
              ${sizeClasses[size]}
              ${hoverRating >= i ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600'}
              transition-all duration-200
            `}
          />
        )}
      </button>
    );
  }

  return (
    <div 
      className={`flex items-center space-x-1 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center space-x-0.5">
        {stars}
      </div>
      
      {showValue && (
        <span className={`ml-2 font-medium text-gray-700 dark:text-gray-300 ${textSizeClasses[size]}`}>
          {displayRating.toFixed(1)}
        </span>
      )}
      
      {interactive && hoverRating > 0 && (
        <span className={`ml-2 text-gray-500 dark:text-gray-400 ${textSizeClasses[size]}`}>
          ({hoverRating} star{hoverRating !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default StarRating;
