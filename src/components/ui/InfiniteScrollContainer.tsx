import React from 'react';
import { Loading } from './Loading';
import { Button } from './Button';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface InfiniteScrollContainerProps<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadingRef: React.RefObject<HTMLDivElement>;
  onRetry: () => void;
  onRefresh?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: () => React.ReactNode;
  skeletonCount?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;
  showRefreshButton?: boolean;
  gridCols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const InfiniteScrollContainer = <T,>({
  items,
  loading,
  hasMore,
  error,
  loadingRef,
  onRetry,
  onRefresh,
  renderItem,
  renderSkeleton,
  skeletonCount = 3,
  emptyMessage = 'No items found',
  emptyIcon,
  className = '',
  itemClassName = '',
  loadingClassName = '',
  errorClassName = '',
  showRefreshButton = true,
  gridCols = 1,
  gap = 'md'
}: InfiniteScrollContainerProps<T>) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  // Show skeleton loading for initial load
  if (loading && items.length === 0) {
    return (
      <div className={`grid ${gridClasses[gridCols]} ${gapClasses[gap]} ${className}`}>
        {renderSkeleton
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <div key={`skeleton-${index}`} className={itemClassName}>
                {renderSkeleton()}
              </div>
            ))
          : Array.from({ length: skeletonCount }, (_, index) => (
              <div
                key={`skeleton-${index}`}
                className={`h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg ${itemClassName}`}
              />
            ))
        }
      </div>
    );
  }

  // Show empty state
  if (!loading && items.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon && (
          <div className="mb-4 text-gray-400 dark:text-gray-500">
            {emptyIcon}
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400 mb-4">{emptyMessage}</p>
        {showRefreshButton && onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Items Grid */}
      <div className={`grid ${gridClasses[gridCols]} ${gapClasses[gap]}`}>
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading More Indicator */}
      {hasMore && !error && (
        <div
          ref={loadingRef}
          className={`flex justify-center py-8 ${loadingClassName}`}
        >
          {loading && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Loading size="sm" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`flex flex-col items-center justify-center py-8 ${errorClassName}`}>
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* End of List Indicator */}
      {!hasMore && !loading && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              You've reached the end!
            </p>
            {showRefreshButton && onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="flex items-center space-x-2 mx-auto"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollContainer;
