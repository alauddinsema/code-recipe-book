import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OfflineStorageService, type OfflineRecipe } from '../services/offlineStorage';
import { OfflineStorageStats, OfflineBanner } from '../components/offline';
import { RecipeCard } from '../components/recipe';

import { Loading } from '../components/ui';
import { SEOHead } from '../components';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const OfflineRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<OfflineRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<OfflineRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'accessed'>('recent');
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    loadOfflineRecipes();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchQuery, sortBy]);

  const loadOfflineRecipes = async () => {
    try {
      setLoading(true);
      const offlineRecipes = await OfflineStorageService.getOfflineRecipes();
      setRecipes(offlineRecipes);
    } catch (error) {
      console.error('Failed to load offline recipes:', error);
      toast.error('Failed to load offline recipes');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRecipes = () => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.category?.toLowerCase().includes(query) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'accessed':
          return b.access_count - a.access_count;
        case 'recent':
        default:
          return new Date(b.download_date).getTime() - new Date(a.download_date).getTime();
      }
    });

    setFilteredRecipes(filtered);
  };

  // const handleRemoveRecipe = async (recipeId: string) => {
  //   try {
  //     await OfflineStorageService.removeOfflineRecipe(recipeId);
  //     await loadOfflineRecipes(); // Refresh the list
  //     toast.success('Recipe removed from offline storage');
  //   } catch (error) {
  //     console.error('Failed to remove recipe:', error);
  //     toast.error('Failed to remove recipe');
  //   }
  // };

  const handleClearAll = async () => {
    try {
      // Remove all recipes
      for (const recipe of recipes) {
        await OfflineStorageService.removeOfflineRecipe(recipe.id);
      }
      
      setRecipes([]);
      setShowClearAllModal(false);
      toast.success('All offline recipes cleared');
    } catch (error) {
      console.error('Failed to clear all recipes:', error);
      toast.error('Failed to clear all recipes');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <SEOHead
        title="Offline Recipes"
        description="Access your downloaded recipes offline. Perfect for cooking without internet connection."
        keywords="offline recipes, downloaded recipes, cooking offline, mobile recipes"
      />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <CloudArrowDownIcon className="w-8 h-8 text-primary-600" />
                <span>Offline Recipes</span>
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} available offline
              </p>
            </div>
            
            {recipes.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Storage Stats */}
          <div className="mt-4">
            <OfflineStorageStats />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recipes.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <CloudArrowDownIcon className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No offline recipes yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Download recipes for offline access by clicking the download button on any recipe card.
            </p>
            <div className="mt-6">
              <Link
                to={ROUTES.HOME}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Browse Recipes
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search offline recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="sm:w-48">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="recent">Recently Downloaded</option>
                    <option value="accessed">Most Accessed</option>
                    <option value="title">Alphabetical</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={loadOfflineRecipes}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh offline recipes"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Results Count */}
              {searchQuery && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredRecipes.length} result{filteredRecipes.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>

            {/* Recipe Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No recipes found
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.offline_id} className="relative">
                    <RecipeCard
                      recipe={recipe}
                      onFavoriteToggle={() => {}}
                    />
                    
                    {/* Offline Metadata */}
                    <div className="mt-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between items-center">
                        <span>Downloaded: {formatDate(recipe.download_date)}</span>
                        <span>Accessed: {recipe.access_count} times</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Clear All Offline Recipes
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove all {recipes.length} offline recipes? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineRecipes;
