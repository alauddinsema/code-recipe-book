import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RecipeDetail } from '../components';
import { CookingModeLayout } from '../components/cooking/CookingModeLayout';
import { RecipeService } from '../services';
import type { Recipe } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const RecipeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.HOME);
      return;
    }

    loadRecipe(id);
  }, [id, navigate]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if this is an AI-generated recipe (temporary ID)
      if (recipeId.startsWith('ai-')) {
        // Try to get the recipe from navigation state first
        const stateRecipe = location.state?.recipe as Recipe;
        if (stateRecipe && stateRecipe.id === recipeId) {
          setRecipe(stateRecipe);
          return;
        }

        // If no state recipe, try to find it in sessionStorage (fallback)
        const storedRecipes = sessionStorage.getItem('aiGeneratedRecipes');
        if (storedRecipes) {
          const aiRecipes: Recipe[] = JSON.parse(storedRecipes);
          const foundRecipe = aiRecipes.find(r => r.id === recipeId);
          if (foundRecipe) {
            setRecipe(foundRecipe);
            return;
          }
        }

        // If still not found, show error
        setError('This AI-generated recipe is no longer available. Please generate a new one.');
        toast.error('AI-generated recipe not found');
        return;
      }

      const fetchedRecipe = await RecipeService.getRecipeById(recipeId);
      setRecipe(fetchedRecipe);
    } catch (error) {
      console.error('Failed to load recipe:', error);
      setError('Recipe not found or failed to load');
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Recipe Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The recipe you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Handle cooking mode
  const handleStartCooking = () => {
    setIsCookingMode(true);
  };

  const handleExitCooking = () => {
    setIsCookingMode(false);
  };

  // Render cooking mode if active
  if (isCookingMode && recipe) {
    return (
      <CookingModeLayout
        recipe={recipe}
        onExit={handleExitCooking}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fixed Back Button */}
        <div className="sticky top-4 z-50 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Recipe Detail Component */}
        <RecipeDetail
          recipe={recipe}
          onStartCooking={handleStartCooking}
        />
      </div>
    </div>
  );
};

export default RecipeDetails;
