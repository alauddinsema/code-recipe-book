import React from 'react';
import StarRating from './StarRating';

interface RatingDisplayProps {
  averageRating: number;
  ratingCount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCount?: boolean;
  showValue?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  averageRating,
  ratingCount,
  size = 'md',
  showCount = true,
  showValue = true,
  className = '',
  layout = 'horizontal'
}) => {
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const formatRatingCount = (count: number) => {
    if (count === 0) return 'No ratings';
    if (count === 1) return '1 rating';
    if (count < 1000) return `${count} ratings`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k ratings`;
    return `${(count / 1000000).toFixed(1)}M ratings`;
  };

  const getRatingCategory = (rating: number, count: number) => {
    if (count === 0) return null;
    if (count >= 10 && rating >= 4.5) return 'Excellent';
    if (count >= 5 && rating >= 4.0) return 'Very Good';
    if (count >= 3 && rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Below Average';
  };

  if (ratingCount === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <StarRating rating={0} size={size} />
        <span className={`text-gray-500 dark:text-gray-400 ${textSizeClasses[size]}`}>
          No ratings yet
        </span>
      </div>
    );
  }

  const category = getRatingCategory(averageRating, ratingCount);

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-start space-y-1 ${className}`}>
        <StarRating 
          rating={averageRating} 
          size={size} 
          showValue={showValue}
        />
        
        {showCount && (
          <div className="flex flex-col space-y-0.5">
            <span className={`text-gray-600 dark:text-gray-400 ${textSizeClasses[size]}`}>
              {formatRatingCount(ratingCount)}
            </span>
            {category && (
              <span className={`font-medium ${textSizeClasses[size]} ${
                averageRating >= 4.0 
                  ? 'text-green-600 dark:text-green-400' 
                  : averageRating >= 3.0 
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {category}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <StarRating 
        rating={averageRating} 
        size={size} 
        showValue={showValue}
      />
      
      {showCount && (
        <div className="flex items-center space-x-2">
          <span className={`text-gray-600 dark:text-gray-400 ${textSizeClasses[size]}`}>
            ({formatRatingCount(ratingCount)})
          </span>
          
          {category && (
            <span className={`font-medium ${textSizeClasses[size]} ${
              averageRating >= 4.0 
                ? 'text-green-600 dark:text-green-400' 
                : averageRating >= 3.0 
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              • {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
