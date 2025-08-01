import React, { useState, useEffect } from 'react';
import { IngredientSearchService, type IngredientSearchResult, type SearchFilters } from '../../services/ingredientSearchService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

interface WhatCanIMakeProps {
  onClose?: () => void;
  isModal?: boolean;
}

const WhatCanIMake: React.FC<WhatCanIMakeProps> = ({ onClose, isModal = false }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<IngredientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [additionalIngredients, setAdditionalIngredients] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({
    maxMissingIngredients: 3,
    allowSubstitutions: true,
    difficulty: undefined,
    category: '',
    maxPrepTime: undefined
  });
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  useEffect(() => {
    if (user) {
      searchRecipes();
    }
  }, [user, filters, activeTab]);

  const searchRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let searchResults: IngredientSearchResult[] = [];

      const additionalIngs = additionalIngredients
        .split(',')
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0);

      switch (activeTab) {
        case 'expiring':
          searchResults = await IngredientSearchService.getExpiringIngredientRecipes(user.id);
          break;
        case 'breakfast':
        case 'lunch':
        case 'dinner':
        case 'snack':
          searchResults = await IngredientSearchService.getMealTypeRecipes(user.id, activeTab, additionalIngs);
          break;
        default:
          searchResults = await IngredientSearchService.findRecipesByIngredients(user.id, additionalIngs, filters);
      }

      setResults(searchResults);

    } catch (error) {
      console.error('Failed to search recipes:', error);
      toast.error('Failed to search recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreText = (score: number) => {
    if (score >= 0.8) return 'Perfect Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Partial Match';
    return 'Few Ingredients';
  };

  const tabs = [
    { id: 'all', label: 'All Recipes', icon: '🍽️' },
    { id: 'expiring', label: 'Use Soon', icon: '⏰' },
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '☀️' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snack', label: 'Snacks', icon: '🍎' }
  ];

  const content = (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">What Can I Make?</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Find recipes based on ingredients you have
          </p>
        </div>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-1 mb-6 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Additional Ingredients */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Ingredients
              </label>
              <input
                type="text"
                value={additionalIngredients}
                onChange={(e) => setAdditionalIngredients(e.target.value)}
                placeholder="e.g., chicken, rice, tomatoes"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>

            {/* Max Missing Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Missing
              </label>
              <select
                value={filters.maxMissingIngredients || ''}
                onChange={(e) => handleFilterChange('maxMissingIngredients', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any</option>
                <option value="0">0 (Perfect match)</option>
                <option value="1">1 ingredient</option>
                <option value="2">2 ingredients</option>
                <option value="3">3 ingredients</option>
                <option value="5">5 ingredients</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.allowSubstitutions}
                onChange={(e) => handleFilterChange('allowSubstitutions', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Allow ingredient substitutions
              </span>
            </label>

            <Button onClick={searchRecipes} disabled={loading} size="sm">
              {loading ? 'Searching...' : 'Search Recipes'}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or adding more ingredients to your pantry
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <div
                key={result.recipe.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Recipe Image */}
                {result.recipe.image_url && (
                  <img
                    src={result.recipe.image_url}
                    alt={result.recipe.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}

                <div className="p-4">
                  {/* Match Score */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${getMatchScoreColor(result.matchScore)}`}>
                      {getMatchScoreText(result.matchScore)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(result.matchScore * 100)}% match
                    </span>
                  </div>

                  {/* Recipe Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {result.recipe.title}
                  </h3>

                  {/* Ingredient Status */}
                  <div className="space-y-2 mb-4">
                    {result.availableIngredients.length > 0 && (
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Have: {result.availableIngredients.length} ingredients
                        </p>
                      </div>
                    )}
                    
                    {result.missingIngredients.length > 0 && (
                      <div>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ✗ Need: {result.missingIngredients.slice(0, 3).join(', ')}
                          {result.missingIngredients.length > 3 && ` +${result.missingIngredients.length - 3} more`}
                        </p>
                      </div>
                    )}

                    {result.substitutionSuggestions.length > 0 && (
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          🔄 Substitutions available: {result.substitutionSuggestions.length}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recipe Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span>{result.recipe.category}</span>
                    <span>{result.recipe.prep_time || 0}min</span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={ROUTES.RECIPE_DETAILS.replace(':id', result.recipe.id)}
                    className="block w-full text-center bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </div>
    );
  }

  return <div className="p-6">{content}</div>;
};

export default WhatCanIMake;
