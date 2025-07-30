import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced search functionality
 * @param searchFunction - The function to call when search is triggered
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns Object with search state and trigger function
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string, ...args: any[]) => Promise<T>,
  delay: number = 500
) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<T | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setSearchResults(null);
      setSearchError(null);
    }
  }, [debouncedQuery]);

  const performSearch = async (query: string, ...args: any[]) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const results = await searchFunction(query, ...args);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const triggerSearch = (query: string, ...args: any[]) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
  };

  return {
    isSearching,
    searchQuery,
    searchResults,
    searchError,
    triggerSearch,
    clearSearch,
    debouncedQuery
  };
}

export default useDebounce;
