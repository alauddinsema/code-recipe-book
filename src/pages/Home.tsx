import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RecipeCard, RecipeSuggestion, SEOHead } from '../components';
import { RecipeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe, GeminiRecipeResponse } from '../types';
import { ROUTES, RECIPE_CATEGORIES, DIFFICULTY_LEVELS } from '../utils/constants';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, [selectedCategory, selectedDifficulty]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const { recipes: fetchedRecipes } = await RecipeService.getRecipes(
        0,
        20,
        selectedCategory || undefined,
        selectedDifficulty || undefined
      );
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRecipes();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await RecipeService.searchRecipes(searchQuery, {
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
      });
      setRecipes(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    loadRecipes();
  };

  const handleAIRecipeGenerated = (aiRecipe: GeminiRecipeResponse) => {
    // Create a temporary recipe object to display
    const tempRecipe: Recipe = {
      id: `ai-${Date.now()}`,
      title: aiRecipe.title,
      description: aiRecipe.description,
      ingredients: aiRecipe.ingredients,
      steps: aiRecipe.steps,
      code_snippet: aiRecipe.code_snippet || null,
      language: aiRecipe.language || null,
      difficulty: 'medium',
      category: null,
      prep_time: aiRecipe.prep_time || null,
      cook_time: aiRecipe.cook_time || null,
      servings: aiRecipe.servings || null,
      author_id: user?.id || '',
      author_name: user?.user_metadata?.full_name || 'AI Generated',
      image_url: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add the AI-generated recipe to the top of the list
    setRecipes(prev => [tempRecipe, ...prev]);
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

      const savedRecipe = await RecipeService.createRecipe(recipeToSave);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-10 w-full"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {RECIPE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="input-field"
              >
                <option value="">All Difficulties</option>
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSearch}
                className="btn-primary whitespace-nowrap"
              >
                Search
              </button>

              {(searchQuery || selectedCategory || selectedDifficulty) && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
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
              {searchQuery || selectedCategory || selectedDifficulty
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
