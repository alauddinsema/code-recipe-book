import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DocumentArrowUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { RecipeCard, RecipeSuggestion, SEOHead, LazyRecipeCard, SimplePullToRefresh, InfiniteScrollContainer, ImportModal, ExportModal } from '../components';
import { AdvancedSearchFilters, type SearchFilters } from '../components/search';
import { RecipeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useInfiniteScrollWithFilters } from '../hooks';
import type { Recipe, GeminiRecipeResponse } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
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

  // Infinite scroll implementation
  const fetchRecipes = useCallback(async (page: number, pageSize: number, filters: SearchFilters) => {
    try {
      const offset = (page - 1) * pageSize;

      if (!filters.query.trim() && !hasActiveFiltersForSearch(filters)) {
        // No search query or filters, load all recipes
        const { recipes, count } = await RecipeService.getRecipes(offset, pageSize);
        return {
          items: recipes,
          hasMore: recipes.length === pageSize,
          total: count || undefined
        };
      } else {
        // Perform advanced search with pagination
        const searchResults = await RecipeService.searchRecipes(filters.query, {
          category: filters.category || undefined,
          difficulty: filters.difficulty || undefined,
          tags: filters.tags.length > 0 ? filters.tags : undefined,
          prepTimeRange: filters.prepTimeRange,
          cookTimeRange: filters.cookTimeRange,
          servingsRange: filters.servingsRange,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          searchIn: filters.searchIn,
          offset,
          limit: pageSize
        });

        return {
          items: searchResults,
          hasMore: searchResults.length === pageSize
        };
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      throw error;
    }
  }, []);

  const {
    items: recipes,
    loading,
    hasMore,
    error,
    loadingRef,
    refresh,
    retry
  } = useInfiniteScrollWithFilters(fetchRecipes, searchFilters, 20);

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Recipes refreshed!');
    } catch (error) {
      console.error('Failed to refresh recipes:', error);
      toast.error('Failed to refresh recipes');
    }
  };

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleDebouncedSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleSearch = useCallback(() => {
    // Trigger refresh with current filters
    refresh();
  }, [refresh]);

  const hasActiveFilters = () => {
    return searchFilters.category || searchFilters.difficulty ||
           searchFilters.tags.length > 0 || searchFilters.prepTimeRange[0] > 0 ||
           searchFilters.prepTimeRange[1] < 240 || searchFilters.cookTimeRange[0] > 0 ||
           searchFilters.cookTimeRange[1] < 480 || searchFilters.servingsRange[0] > 1 ||
           searchFilters.servingsRange[1] < 12;
  };

  const hasActiveFiltersForSearch = (filters: SearchFilters) => {
    return filters.category || filters.difficulty ||
           filters.tags.length > 0 || filters.prepTimeRange[0] > 0 ||
           filters.prepTimeRange[1] < 240 || filters.cookTimeRange[0] > 0 ||
           filters.cookTimeRange[1] < 480 || filters.servingsRange[0] > 1 ||
           filters.servingsRange[1] < 12;
  };

  const handleAIRecipeGenerated = (aiRecipe: GeminiRecipeResponse) => {
    // Create a temporary recipe object to display
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tempRecipe: Recipe = {
      id: `ai-${Date.now()}`,
      title: aiRecipe.title,
      description: aiRecipe.description,
      ingredients: aiRecipe.ingredients,
      steps: aiRecipe.steps,
      code_snippet: aiRecipe.code_snippet || undefined,
      language: aiRecipe.language || undefined,
      difficulty: 'medium',
      category: undefined,
      prep_time: aiRecipe.prep_time || undefined,
      cook_time: aiRecipe.cook_time || undefined,
      servings: aiRecipe.servings || undefined,
      author_id: user?.id || '',
      author_name: user?.user_metadata?.full_name || 'AI Generated',
      image_url: undefined,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add the AI-generated recipe to the top of the list
    // Note: This is a temporary addition, will be replaced when saved
    setShowAISuggestion(false);

    // Scroll to top to show the new recipe
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) {
      toast.error('Please log in to save recipes');
      return;
    }

    try {
      // Remove the AI prefix from the ID and other temporary fields
      const recipeToSave = {
        ...recipe,
        id: undefined, // Let Supabase generate a new ID
        author_id: user.id,
        author_name: user.user_metadata?.full_name || user.email || 'Anonymous',
        is_public: true,
        created_at: undefined, // Let Supabase set the timestamp
        updated_at: undefined
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const savedRecipe = await RecipeService.createRecipe(recipeToSave, user!.id, user!.user_metadata?.full_name);

      // Refresh the list to show the saved recipe
      await refresh();

      toast.success('Recipe saved successfully!');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error('Failed to save recipe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Home"
        description="Discover amazing cooking recipes with code snippets. Browse our collection of tech-inspired culinary creations from developers around the world."
        keywords="recipes, cooking, code snippets, programming, food, developers, culinary, tech recipes"
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Code Recipe Book
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Discover delicious recipes with code snippets for smart cooking
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    to={ROUTES.ADD_RECIPE}
                    className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Recipe
                  </Link>
                  <button
                    onClick={() => setShowAISuggestion(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Generate Recipe
                  </button>
                </>
              ) : (
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <SimplePullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Advanced Search and Filters */}
          <div className="mb-8">
            <AdvancedSearchFilters
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              onDebouncedSearch={handleDebouncedSearch}
              loading={loading}
              initialFilters={searchFilters}
              enableAutoSearch={true}
              searchDelay={500}
            />
          </div>

        {/* View Mode Toggle and Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading...' : `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`}
          </p>

          <div className="flex items-center space-x-2">
            {/* Import/Export buttons */}
            {user && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  title="Import Recipes"
                >
                  <DocumentArrowUpIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  title="Export Recipes"
                  disabled={recipes.length === 0}
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              </>
            )}

            {/* View mode buttons */}
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recipe Grid/List with Infinite Scroll */}
        <InfiniteScrollContainer
          items={recipes}
          loading={loading}
          hasMore={hasMore}
          error={error}
          loadingRef={loadingRef as React.RefObject<HTMLDivElement>}
          onRetry={retry}
          onRefresh={refresh}
          renderItem={(recipe) => (
            <LazyRecipeCard
              fallback={
                <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
              }
            >
              <RecipeCard
                recipe={recipe}
                onSaveRecipe={handleSaveRecipe}
              />
            </LazyRecipeCard>
          )}
          renderSkeleton={() => (
            <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          )}
          skeletonCount={8}
          emptyMessage={
            searchFilters.query || hasActiveFilters()
              ? 'No recipes found. Try adjusting your search criteria.'
              : 'No recipes found. Be the first to add a recipe!'
          }
          emptyIcon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          gridCols={viewMode === 'grid' ? 4 : 1}
          gap="lg"
          className="mb-8"
        />
        </div>
      </SimplePullToRefresh>

      {/* AI Recipe Suggestion Modal */}
      {showAISuggestion && (
        <RecipeSuggestion
          onRecipeGenerated={handleAIRecipeGenerated}
          onClose={() => setShowAISuggestion(false)}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={(result) => {
          // Refresh the recipes list after import
          if (result.success.length > 0) {
            refresh();
          }
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        recipes={recipes}
        title="Export Recipes"
      />
    </div>
  );
};

export default Home;
