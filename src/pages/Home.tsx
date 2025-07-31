import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RecipeCard, SEOHead } from '../components';
import { RecipeSuggestion } from '../components/ai';
import { AdvancedSearchFilters, type SearchFilters } from '../components/search';
import { RecipeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe, GeminiRecipeResponse } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAISuggestion, setShowAISuggestion] = useState(false);

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

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const { recipes: fetchedRecipes } = await RecipeService.getRecipes(0, 50);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);

      if (!searchFilters.query.trim() && !hasActiveFilters()) {
        // No search query or filters, load all recipes
        const { recipes: fetchedRecipes } = await RecipeService.getRecipes(0, 50);
        setRecipes(fetchedRecipes);
      } else {
        // Perform advanced search
        const searchResults = await RecipeService.searchRecipes(searchFilters.query, {
          category: searchFilters.category || undefined,
          difficulty: searchFilters.difficulty || undefined,
          tags: searchFilters.tags.length > 0 ? searchFilters.tags : undefined,
          prepTimeRange: searchFilters.prepTimeRange,
          cookTimeRange: searchFilters.cookTimeRange,
          servingsRange: searchFilters.servingsRange,
          sortBy: searchFilters.sortBy,
          sortOrder: searchFilters.sortOrder,
          searchIn: searchFilters.searchIn
        });
        setRecipes(searchResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = () => {
    return searchFilters.category || searchFilters.difficulty ||
           searchFilters.tags.length > 0 || searchFilters.prepTimeRange[0] > 0 ||
           searchFilters.prepTimeRange[1] < 240 || searchFilters.cookTimeRange[0] > 0 ||
           searchFilters.cookTimeRange[1] < 480 || searchFilters.servingsRange[0] > 1 ||
           searchFilters.servingsRange[1] < 12;
  };



  const handleAIRecipeGenerated = (aiRecipe: GeminiRecipeResponse) => {
    // Convert AI recipe to Recipe format and add to the list
    const recipe: Recipe = {
      id: `ai-${Date.now()}`, // Temporary ID for AI-generated recipes
      title: aiRecipe.title,
      description: aiRecipe.description,
      ingredients: aiRecipe.ingredients,
      instructions: aiRecipe.instructions,
      prep_time: aiRecipe.prep_time,
      cook_time: aiRecipe.cook_time,
      servings: aiRecipe.servings,
      difficulty: aiRecipe.difficulty,
      category: aiRecipe.category,
      tags: aiRecipe.tags || [],
      code_snippet: aiRecipe.code_snippet || '',
      author_id: 'ai',
      author_name: 'AI Chef',
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      average_rating: 0,
      rating_count: 0,
      is_ai_generated: true
    };

    // Add the AI recipe to the top of the list
    setRecipes(prev => [recipe, ...prev]);
    setShowAISuggestion(false);
    toast.success('AI recipe generated successfully!');
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

      const savedRecipe = await RecipeService.createRecipe(recipeToSave, user!.id, user!.user_metadata?.full_name);

      // Remove the AI recipe from the list and add the saved one
      setRecipes(prev => prev.filter(r => r.id !== recipe.id));
      setRecipes(prev => [savedRecipe, ...prev]);

      toast.success('Recipe saved successfully!');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast.error('Failed to save recipe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <SEOHead
        title="Home"
        description="Discover amazing cooking recipes with code snippets. Browse our collection of tech-inspired culinary creations from developers around the world."
        keywords="recipes, cooking, code snippets, programming, food, developers, culinary, tech recipes"
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Code Recipe Book
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Discover delicious recipes with code snippets for smart cooking
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {user ? (
                <>
                  <Link
                    to={ROUTES.ADD_RECIPE}
                    className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors duration-200 shadow-large"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Recipe
                  </Link>
                  <button
                    onClick={() => setShowAISuggestion(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-2xl hover:from-accent-600 hover:to-accent-700 transition-all duration-200 shadow-large hover:shadow-glow-accent"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Generate Recipe
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.REGISTER}
                    className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors duration-200 shadow-large"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Get Started
                  </Link>
                  <button
                    onClick={() => setShowAISuggestion(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-2xl hover:from-accent-600 hover:to-accent-700 transition-all duration-200 shadow-large hover:shadow-glow-accent"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Generate Recipe
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Search and Filters */}
        <div className="mb-8">
          <AdvancedSearchFilters
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            loading={loading}
            initialFilters={searchFilters}
          />
        </div>

        {/* View Mode Toggle and Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading...' : `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`}
          </p>

          <div className="flex items-center space-x-2">
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchFilters.query || hasActiveFilters()
                ? 'Try adjusting your search criteria'
                : 'Be the first to add a recipe!'}
            </p>
            {user && (
              <Link to={ROUTES.ADD_RECIPE} className="btn-primary">
                Add Recipe
              </Link>
            )}
          </div>
        )}

        {/* Recipe Grid/List */}
        {!loading && recipes.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSaveRecipe={handleSaveRecipe}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Recipe Suggestion Modal */}
      {showAISuggestion && (
        <RecipeSuggestion
          onRecipeGenerated={handleAIRecipeGenerated}
          onClose={() => setShowAISuggestion(false)}
        />
      )}
    </div>
  );
};

export default Home;
