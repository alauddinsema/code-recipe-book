import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Loading, SEOHead } from '../components';
import { RecipeForm } from '../components/forms';
import { useAuth } from '../contexts/AuthContext';
import { RecipeService } from '../services/recipes';
import { canEditRecipe } from '../utils/recipePermissions';
import type { Recipe, RecipeFormData } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.HOME);
      return;
    }

    if (!user) {
      navigate(ROUTES.LOGIN, { 
        state: { from: { pathname: `/recipe/${id}/edit` } } 
      });
      return;
    }

    loadRecipe(id);
  }, [id, user, navigate]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadRecipe = async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const recipeData = await RecipeService.getRecipeById(recipeId);
      
      // Check if user can edit this recipe
      if (!canEditRecipe(recipeData, user)) {
        setError('You can only edit your own recipes');
        return;
      }
      
      setRecipe(recipeData);
    } catch (error) {
      console.error('Error loading recipe:', error);
      setError('Failed to load recipe');
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (formData: RecipeFormData) => {
    if (!recipe || !user) return;

    try {
      setSaving(true);
      
      const updatedRecipe = await RecipeService.updateRecipe(recipe.id, formData);
      
      setRecipe(updatedRecipe);
      setHasUnsavedChanges(false);
      
      toast.success('Recipe updated successfully!');
      navigate(`/recipe/${recipe.id}`);
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error('Failed to update recipe');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    
    navigate(`/recipe/${recipe?.id || ''}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Recipe not found'}
          </h1>
          <Button onClick={() => navigate(ROUTES.HOME)}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Edit ${recipe.title}`}
        description={`Edit your recipe: ${recipe.description}`}
      />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Recipe
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {recipe.title}
              </p>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Form */}
        <RecipeForm
          initialData={{
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            code_snippet: recipe.code_snippet,
            language: recipe.language,
            difficulty: recipe.difficulty,
            category: recipe.category,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            servings: recipe.servings,
            tags: recipe.tags,
            image_url: recipe.image_url,
            nutrition: recipe.nutrition,
          }}
          onSubmit={handleSubmit}
          loading={saving}
          submitText={saving ? 'Saving...' : 'Save Changes'}
        />

        {/* Cancel Button */}
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
};

export default EditRecipe;
