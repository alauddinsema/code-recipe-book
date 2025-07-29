import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecipeDetail } from '../components';
import { RecipeService } from '../services';
import type { Recipe } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const RecipeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('This is a temporary AI-generated recipe. Please save it to view details.');
        toast.error('AI-generated recipes need to be saved first');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Recipe Detail Component */}
        <RecipeDetail recipe={recipe} />
      </div>
    </div>
  );
};

export default RecipeDetails;
