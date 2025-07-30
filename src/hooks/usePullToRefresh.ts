import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  refreshingTimeout?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  refreshingTimeout = 2000
}: UsePullToRefreshOptions) => {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const containerRef = useRef<HTMLElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isAtTop = useRef<boolean>(true);

  // Check if container is at top
  const checkIfAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;
    
    isAtTop.current = checkIfAtTop();
    if (!isAtTop.current) return;

    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  }, [enabled, state.isRefreshing, checkIfAtTop]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing || !isAtTop.current) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault();
      
      const pullDistance = Math.min(deltaY / resistance, threshold * 1.5);
      const canRefresh = pullDistance >= threshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));
    }
  }, [enabled, state.isRefreshing, resistance, threshold]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.isRefreshing || !state.isPulling) return;

    if (state.canRefresh) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }

      // Keep refreshing state for minimum time for better UX
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }, refreshingTimeout);
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [enabled, state.isRefreshing, state.isPulling, state.canRefresh, onRefresh, threshold, refreshingTimeout]);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Handle scroll to update isAtTop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isAtTop.current = checkIfAtTop();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfAtTop]);

  return {
    ...state,
    containerRef,
    pullProgress: Math.min(state.pullDistance / threshold, 1),
    refreshTrigger: async () => {
      if (state.isRefreshing) return;
      
      setState(prev => ({ ...prev, isRefreshing: true }));
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setState(prev => ({ ...prev, isRefreshing: false }));
        }, refreshingTimeout);
      }
    }
  };
};

export default usePullToRefresh;
