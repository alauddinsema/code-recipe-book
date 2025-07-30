import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import StarRating from './StarRating';
import { RatingService } from '../../services/ratings';

interface RatingStatisticsProps {
  recipeId: string;
  averageRating: number;
  ratingCount: number;
  className?: string;
  showDistribution?: boolean;
  showTrends?: boolean;
}

const RatingStatistics: React.FC<RatingStatisticsProps> = ({
  recipeId,
  averageRating,
  ratingCount,
  className = '',
  showDistribution = true,
  showTrends = false
}) => {
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showDistribution && ratingCount > 0) {
      loadDistribution();
    }
  }, [recipeId, ratingCount, showDistribution]);

  const loadDistribution = async () => {
    try {
      setLoading(true);
      const dist = await RatingService.getRatingDistribution(recipeId);
      setDistribution(dist);
    } catch (error) {
      console.error('Failed to load rating distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (count: number) => {
    return ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0;
  };

  const getRatingCategory = () => {
    if (ratingCount >= 10 && averageRating >= 4.0) return 'Highly Rated';
    if (ratingCount >= 5 && averageRating >= 3.5) return 'Well Rated';
    if (ratingCount >= 1) return 'Rated';
    return 'Not Rated';
  };

  const getCategoryColor = () => {
    if (ratingCount >= 10 && averageRating >= 4.0) return 'text-green-600 dark:text-green-400';
    if (ratingCount >= 5 && averageRating >= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    if (ratingCount >= 1) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  if (ratingCount === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No ratings yet
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Rating */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {averageRating.toFixed(1)}
        </div>
        <StarRating rating={averageRating} size="lg" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Based on {ratingCount} review{ratingCount !== 1 ? 's' : ''}
        </p>
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${getCategoryColor()} bg-current bg-opacity-10`}>
          {getRatingCategory()}
        </span>
      </div>

      {/* Rating Distribution */}
      {showDistribution && !loading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Rating Distribution
          </h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = distribution[rating] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {rating}
                  </span>
                  <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                    {percentage}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                    ({count})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state for distribution */}
      {showDistribution && loading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Rating Distribution
          </h4>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Rating Trends (placeholder for future implementation) */}
      {showTrends && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Rating Trends
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Trend analysis coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingStatistics;
