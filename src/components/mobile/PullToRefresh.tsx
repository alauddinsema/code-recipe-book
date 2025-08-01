import React, { useState, useRef, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull-to-refresh if we're at the top of the page
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow pulling down
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      
      // Apply resistance to the pull
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current || disabled) return;
    
    isDragging.current = false;
    
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      // Animate back to original position
      setPullDistance(0);
      setCanRefresh(false);
    }
  };

  // Reset state when disabled changes
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      setCanRefresh(false);
      isDragging.current = false;
    }
  }, [disabled]);

  const getRefreshIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / threshold, 1);
    const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);
    const rotation = (pullDistance / threshold) * 180;
    
    return {
      opacity,
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      transition: isDragging.current ? 'none' : 'all 0.3s ease-out'
    };
  };

  const getContainerStyle = () => {
    return {
      transform: `translateY(${pullDistance}px)`,
      transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
    };
  };

  const getStatusText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (canRefresh) return 'Release to refresh';
    if (pullDistance > 0) return 'Pull to refresh';
    return '';
  };

  return (
    <div className="relative overflow-hidden">
      {/* Pull-to-refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ 
          height: `${Math.max(pullDistance, 0)}px`,
          background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)'
        }}
      >
        <div 
          className="flex flex-col items-center justify-center space-y-2"
          style={getRefreshIndicatorStyle()}
        >
          <div className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg ${
            isRefreshing ? 'animate-spin' : ''
          }`}>
            <ArrowPathIcon className={`w-6 h-6 ${
              canRefresh 
                ? 'text-primary-500' 
                : 'text-gray-400'
            }`} />
          </div>
          
          {pullDistance > 20 && (
            <span className={`text-sm font-medium ${
              canRefresh 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {getStatusText()}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        ref={containerRef}
        style={getContainerStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        {children}
      </div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 py-3">
          <div className="flex items-center justify-center space-x-2">
            <ArrowPathIcon className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Refreshing recipes...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PullToRefresh;
