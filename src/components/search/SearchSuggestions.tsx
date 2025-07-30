import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  ClockIcon, 
  FireIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'ingredient' | 'category';
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  onClearRecent?: () => void;
  isVisible: boolean;
  onClose: () => void;
}

// Popular ingredients and search terms
const POPULAR_INGREDIENTS = [
  'chicken', 'beef', 'pasta', 'rice', 'eggs', 'cheese', 'tomatoes', 
  'onions', 'garlic', 'potatoes', 'salmon', 'shrimp', 'mushrooms',
  'spinach', 'carrots', 'bell peppers', 'broccoli', 'avocado'
];

const POPULAR_CATEGORIES = [
  'breakfast', 'lunch', 'dinner', 'dessert', 'snacks', 'appetizers',
  'salads', 'soups', 'pasta', 'pizza', 'sandwiches', 'smoothies'
];

const TRENDING_SEARCHES = [
  'quick meals', 'healthy recipes', 'vegetarian', 'one pot', 'air fryer',
  'meal prep', 'low carb', 'gluten free', 'comfort food', 'holiday recipes'
];

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  onClearRecent,
  isVisible,
  onClose
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    onClearRecent?.();
  };

  const handleSuggestionClick = (suggestion: string) => {
    saveRecentSearch(suggestion);
    onSuggestionSelect(suggestion);
    onClose();
  };

  const getFilteredSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase().trim();

    // Recent searches (always show if no query)
    if (!queryLower && recentSearches.length > 0) {
      suggestions.push(...recentSearches.slice(0, 5).map(search => ({
        id: `recent-${search}`,
        text: search,
        type: 'recent' as const
      })));
    }

    // If there's a query, filter suggestions
    if (queryLower) {
      // Matching ingredients
      const matchingIngredients = POPULAR_INGREDIENTS
        .filter(ingredient => ingredient.toLowerCase().includes(queryLower))
        .slice(0, 4)
        .map(ingredient => ({
          id: `ingredient-${ingredient}`,
          text: ingredient,
          type: 'ingredient' as const
        }));

      // Matching categories
      const matchingCategories = POPULAR_CATEGORIES
        .filter(category => category.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(category => ({
          id: `category-${category}`,
          text: category,
          type: 'category' as const
        }));

      // Matching trending searches
      const matchingTrending = TRENDING_SEARCHES
        .filter(trend => trend.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(trend => ({
          id: `trending-${trend}`,
          text: trend,
          type: 'popular' as const
        }));

      suggestions.push(...matchingIngredients, ...matchingCategories, ...matchingTrending);
    } else {
      // Show popular suggestions when no query
      suggestions.push(
        ...TRENDING_SEARCHES.slice(0, 4).map(trend => ({
          id: `trending-${trend}`,
          text: trend,
          type: 'popular' as const
        }))
      );
    }

    return suggestions;
  };

  const suggestions = getFilteredSuggestions();

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
      case 'popular':
        return <FireIcon className="w-4 h-4 text-orange-500" />;
      case 'ingredient':
        return <span className="w-4 h-4 text-green-500 text-xs">🥬</span>;
      case 'category':
        return <span className="w-4 h-4 text-blue-500 text-xs">📂</span>;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return 'Recent';
      case 'popular':
        return 'Trending';
      case 'ingredient':
        return 'Ingredient';
      case 'category':
        return 'Category';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      {/* Header */}
      {!query && recentSearches.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-600">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</span>
          <button
            onClick={clearRecentSearches}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
            title="Clear recent searches"
          >
            <XMarkIcon className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Suggestions List */}
      <div className="py-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => handleSuggestionClick(suggestion.text)}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
          >
            {getSuggestionIcon(suggestion.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 dark:text-white truncate">
                  {suggestion.text}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getSuggestionLabel(suggestion.type)}
                </span>
              </div>
            </div>
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Footer for trending when there's a query */}
      {query && suggestions.length === 0 && (
        <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
          No suggestions found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
