import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeForm } from '../components';
import { RecipeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { RecipeFormData } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const AddRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: RecipeFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a recipe');
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setLoading(true);
      const recipe = await RecipeService.createRecipe(formData, user!.id, user!.user_metadata?.full_name);
      toast.success('Recipe created successfully!');
      navigate(`${ROUTES.RECIPE_DETAILS}/${recipe.id}`);
    } catch (error) {
      console.error('Failed to create recipe:', error);
      toast.error('Failed to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to create a recipe.
          </p>
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Recipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your culinary creation with code snippets for smart cooking
          </p>
        </div>

        {/* Form */}
        <RecipeForm
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Create Recipe"
        />
      </div>
    </div>
  );
};

export default AddRecipe;
