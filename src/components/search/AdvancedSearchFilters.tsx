import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { RECIPE_CATEGORIES, DIFFICULTY_LEVELS } from '../../utils/constants';

export interface SearchFilters {
  query: string;
  category: string;
  difficulty: string;
  tags: string[];
  prepTimeRange: [number, number];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  minRating: number;
  minRatingCount: number;
  sortBy: 'newest' | 'oldest' | 'prep_time' | 'cook_time' | 'difficulty' | 'title' | 'rating' | 'popularity';
  sortOrder: 'asc' | 'desc';
  searchIn: ('title' | 'description' | 'ingredients' | 'code')[];
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading?: boolean;
  initialFilters?: Partial<SearchFilters>;
}

const DIETARY_TAGS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
  'low-carb', 'keto', 'paleo', 'healthy', 'quick', 'one-pot'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'prep_time', label: 'Prep Time' },
  { value: 'cook_time', label: 'Cook Time' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'title', label: 'Alphabetical' }
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  onFiltersChange,
  onSearch,
  loading = false,
  initialFilters = {}
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    difficulty: '',
    tags: [],
    prepTimeRange: [0, 240], // 0 to 4 hours
    cookTimeRange: [0, 480], // 0 to 8 hours
    servingsRange: [1, 12],
    minRating: 0,
    minRatingCount: 0,
    sortBy: 'newest',
    sortOrder: 'desc',
    searchIn: ['title', 'description'],
    ...initialFilters
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleSearchIn = (field: 'title' | 'description' | 'ingredients' | 'code') => {
    setFilters(prev => ({
      ...prev,
      searchIn: prev.searchIn.includes(field)
        ? prev.searchIn.filter(f => f !== field)
        : [...prev.searchIn, field]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      category: '',
      difficulty: '',
      tags: [],
      prepTimeRange: [0, 240],
      cookTimeRange: [0, 480],
      servingsRange: [1, 12],
      minRating: 0,
      minRatingCount: 0,
      sortBy: 'newest',
      sortOrder: 'desc',
      searchIn: ['title', 'description']
    });
  };

  const hasActiveFilters = () => {
    return filters.query || filters.category || filters.difficulty || 
           filters.tags.length > 0 || filters.prepTimeRange[0] > 0 || 
           filters.prepTimeRange[1] < 240 || filters.cookTimeRange[0] > 0 || 
           filters.cookTimeRange[1] < 480 || filters.servingsRange[0] > 1 || 
           filters.servingsRange[1] < 12;
  };

  const formatTimeRange = (range: [number, number]) => {
    const [min, max] = range;
    const formatTime = (minutes: number) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };
    
    if (min === 0 && max >= 240) return 'Any';
    if (min === 0) return `Up to ${formatTime(max)}`;
    if (max >= 240) return `${formatTime(min)}+`;
    return `${formatTime(min)} - ${formatTime(max)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center space-x-2 ${
              showAdvanced || hasActiveFilters()
                ? 'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters() && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[filters.category, filters.difficulty, ...filters.tags].filter(Boolean).length}
              </span>
            )}
          </button>
          
          <button
            onClick={onSearch}
            disabled={loading}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
          {/* Quick Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {RECIPE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Levels</option>
                {DIFFICULTY_LEVELS.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Search In Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search In
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'title', label: 'Title' },
                { key: 'description', label: 'Description' },
                { key: 'ingredients', label: 'Ingredients' },
                { key: 'code', label: 'Code Snippets' }
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => toggleSearchIn(option.key as any)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.searchIn.includes(option.key as any)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dietary & Style Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <TagIcon className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Time and Serving Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Prep Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Prep Time: {formatTimeRange(filters.prepTimeRange)}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="240"
                  step="15"
                  value={filters.prepTimeRange[1]}
                  onChange={(e) => updateFilter('prepTimeRange', [filters.prepTimeRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Cook Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Cook Time: {formatTimeRange(filters.cookTimeRange)}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="15"
                  value={filters.cookTimeRange[1]}
                  onChange={(e) => updateFilter('cookTimeRange', [filters.cookTimeRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Servings Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servings: {filters.servingsRange[0]} - {filters.servingsRange[1]}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={filters.servingsRange[1]}
                  onChange={(e) => updateFilter('servingsRange', [filters.servingsRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rating Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Rating: {filters.minRating > 0 ? `${filters.minRating} stars` : 'Any'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Any</span>
                  <span>5 stars</span>
                </div>
              </div>

              {/* Minimum Rating Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Reviews: {filters.minRatingCount > 0 ? `${filters.minRatingCount}+` : 'Any'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={filters.minRatingCount}
                  onChange={(e) => updateFilter('minRatingCount', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Any</span>
                  <span>50+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
