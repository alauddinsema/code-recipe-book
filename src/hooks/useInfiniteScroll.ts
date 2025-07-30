import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchMore: (page: number, pageSize: number) => Promise<{
    items: T[];
    hasMore: boolean;
    total?: number;
  }>;
  pageSize?: number;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  resetDependencies?: any[];
}

interface InfiniteScrollState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  total?: number;
}

export const useInfiniteScroll = <T>({
  fetchMore,
  pageSize = 20,
  threshold = 0.1,
  rootMargin = '100px',
  enabled = true,
  resetDependencies = []
}: UseInfiniteScrollOptions<T>) => {
  const [state, setState] = useState<InfiniteScrollState<T>>({
    items: [],
    loading: false,
    hasMore: true,
    error: null,
    page: 0,
    total: undefined
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  // Reset state when dependencies change
  useEffect(() => {
    setState({
      items: [],
      loading: false,
      hasMore: true,
      error: null,
      page: 0,
      total: undefined
    });
  }, resetDependencies);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !state.hasMore || !enabled) {
      return;
    }

    isLoadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const nextPage = state.page + 1;
      const result = await fetchMore(nextPage, pageSize);

      setState(prev => ({
        ...prev,
        items: [...prev.items, ...result.items],
        hasMore: result.hasMore,
        page: nextPage,
        total: result.total,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading more items:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load more items'
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchMore, pageSize, state.hasMore, state.page, enabled]);

  // Initial load
  useEffect(() => {
    if (state.items.length === 0 && !isLoadingRef.current && enabled) {
      loadMore();
    }
  }, [loadMore, state.items.length, enabled]);

  // Set up intersection observer
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && state.hasMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadMore, state.hasMore, threshold, rootMargin, enabled]);

  // Refresh function to reload from the beginning
  const refresh = useCallback(async () => {
    setState({
      items: [],
      loading: false,
      hasMore: true,
      error: null,
      page: 0,
      total: undefined
    });
  }, []);

  // Retry function for error states
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    loadMore();
  }, [loadMore]);

  return {
    ...state,
    loadMore,
    refresh,
    retry,
    loadingRef
  };
};

// Simplified hook for basic infinite scroll
export const useSimpleInfiniteScroll = <T>(
  fetchFunction: (page: number) => Promise<T[]>,
  pageSize: number = 20
) => {
  return useInfiniteScroll({
    fetchMore: async (page, size) => {
      const items = await fetchFunction(page);
      return {
        items,
        hasMore: items.length === size
      };
    },
    pageSize
  });
};

// Hook with search/filter support
export const useInfiniteScrollWithFilters = <T, F>(
  fetchFunction: (page: number, pageSize: number, filters: F) => Promise<{
    items: T[];
    hasMore: boolean;
    total?: number;
  }>,
  filters: F,
  pageSize: number = 20
) => {
  return useInfiniteScroll({
    fetchMore: (page, size) => fetchFunction(page, size, filters),
    pageSize,
    resetDependencies: [filters]
  });
};

export default useInfiniteScroll;
