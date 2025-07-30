import React from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  refreshingTimeout?: number;
  pullIndicator?: React.ReactNode;
  refreshingIndicator?: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  refreshingTimeout = 2000,
  pullIndicator,
  refreshingIndicator
}) => {
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    canRefresh,
    pullProgress,
    containerRef
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled,
    refreshingTimeout
  });

  const showIndicator = isPulling || isRefreshing;
  const indicatorHeight = isRefreshing ? threshold : pullDistance;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 ease-out z-10 ${
          showIndicator ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          height: `${Math.max(indicatorHeight, 0)}px`,
          transform: `translateY(${showIndicator ? indicatorHeight - threshold : -threshold}px)`
        }}
      >
        {isRefreshing ? (
          refreshingIndicator || <DefaultRefreshingIndicator />
        ) : (
          pullIndicator || <DefaultPullIndicator canRefresh={canRefresh} progress={pullProgress} />
        )}
      </div>

      {/* Content container */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="h-full overflow-auto"
        style={{
          transform: `translateY(${showIndicator ? indicatorHeight : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Default pull indicator
const DefaultPullIndicator: React.FC<{ canRefresh: boolean; progress: number }> = ({
  canRefresh,
  progress
}) => (
  <div className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 py-4">
    <div
      className={`w-8 h-8 rounded-full border-2 border-current transition-transform duration-200 ${
        canRefresh ? 'rotate-180' : ''
      }`}
      style={{
        transform: `rotate(${progress * 180}deg)`
      }}
    >
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
    <p className="text-sm mt-2 font-medium">
      {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
    </p>
  </div>
);

// Default refreshing indicator
const DefaultRefreshingIndicator: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-primary-600 dark:text-primary-400 py-4">
    <div className="w-8 h-8 animate-spin">
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </div>
    <p className="text-sm mt-2 font-medium">Refreshing...</p>
  </div>
);

// Simplified wrapper for common use cases
export const SimplePullToRefresh: React.FC<{
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}> = ({ onRefresh, children, className = '', enabled = true }) => (
  <PullToRefresh
    onRefresh={onRefresh}
    className={className}
    enabled={enabled}
    threshold={60}
    resistance={2}
    refreshingTimeout={1500}
  >
    {children}
  </PullToRefresh>
);

export default PullToRefresh;
