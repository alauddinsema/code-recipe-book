import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import type { Recipe } from '../../types';
import { DIFFICULTY_LEVELS } from '../../utils/constants';
import CodeSnippet from './CodeSnippet';
import InteractiveSteps from './InteractiveSteps';
import TimerPanel from './TimerPanel';
import IngredientScaler from './IngredientScaler';
import RecipeActions from './RecipeActions';
import { RatingDisplay, RatingModal, ReviewList, RatingStatistics } from '../rating';
import { ExportModal } from '../export';
import { ShareButton } from '../social';
import { NutritionDisplay, NutritionCalculator } from '../nutrition';
import { useAuth } from '../../contexts/AuthContext';
import { RecipeService } from '../../services/recipes';

interface RecipeDetailProps {
  recipe: Recipe;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe }) => {
  const { user } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [currentRecipe, setCurrentRecipe] = useState(recipe);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSaveScaledRecipe = async (scaledIngredients: string[], targetServings: number) => {
    if (!user) {
      alert('Please log in to save recipes.');
      return;
    }

    try {
      const scaledRecipe = {
        title: `${recipe.title} (${targetServings} servings)`,
        description: `${recipe.description}\n\nScaled from original ${recipe.servings || 1} servings to ${targetServings} servings.`,
        ingredients: scaledIngredients,
        steps: recipe.steps,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: targetServings,
        difficulty: recipe.difficulty,
        category: recipe.category,
        tags: recipe.tags,
        code_snippet: recipe.code_snippet,
        language: recipe.language,
        nutrition: recipe.nutrition ? {
          ...recipe.nutrition,
          // Scale nutrition proportionally
          calories: recipe.nutrition.calories ? Math.round(recipe.nutrition.calories * targetServings / (recipe.servings || 1)) : undefined,
          protein: recipe.nutrition.protein ? Math.round(recipe.nutrition.protein * targetServings / (recipe.servings || 1) * 100) / 100 : undefined,
          carbohydrates: recipe.nutrition.carbohydrates ? Math.round(recipe.nutrition.carbohydrates * targetServings / (recipe.servings || 1) * 100) / 100 : undefined,
          fat: recipe.nutrition.fat ? Math.round(recipe.nutrition.fat * targetServings / (recipe.servings || 1) * 100) / 100 : undefined,
        } : undefined
      };

      await RecipeService.createRecipe(scaledRecipe, user.id, user.user_metadata?.full_name || user.email || 'Anonymous');
      alert('Scaled recipe saved successfully!');
    } catch (error) {
      console.error('Error saving scaled recipe:', error);
      alert('Failed to save scaled recipe. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
            {recipe.title}
          </h1>
          {recipe.difficulty && (
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
              {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
            </span>
          )}
        </div>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {recipe.description}
        </p>

        {/* Recipe Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {recipe.prep_time && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Prep: {formatTime(recipe.prep_time)}</span>
            </div>
          )}
          {recipe.cook_time && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span>Cook: {formatTime(recipe.cook_time)}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{recipe.servings} servings</span>
            </div>
          )}
          {recipe.author_name && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>by {recipe.author_name}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{formatDate(recipe.created_at)}</span>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4 sm:mb-0">
            <RatingDisplay
              averageRating={currentRecipe.average_rating || 0}
              ratingCount={currentRecipe.rating_count || 0}
              size="lg"
              showValue={true}
              showCount={true}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recipe Actions (Edit, Duplicate, Delete) */}
            <RecipeActions
              recipe={recipe}
              onRecipeUpdated={(updatedRecipe) => setCurrentRecipe(updatedRecipe)}
              onRecipeDeleted={() => {
                // This will be handled by navigation in RecipeActions
              }}
              onRecipeDuplicated={() => {
                // Navigation is handled in RecipeActions
              }}
              showLabels={true}
              variant="buttons"
              className="flex-shrink-0"
            />

            {user && (
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                Rate Recipe
              </button>
            )}
            <ShareButton
              recipe={currentRecipe}
              size="sm"
              className="text-sm px-4 py-2"
            />
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn-outline text-sm px-4 py-2 flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.image_url && (
        <div className="mb-8">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ingredient Scaler */}
          <IngredientScaler
            ingredients={recipe.ingredients}
            originalServings={recipe.servings || 4}
            onScaledIngredientsChange={() => {}}
            onSaveScaledRecipe={handleSaveScaledRecipe}
          />

          {/* Interactive Instructions */}
          <InteractiveSteps
            steps={recipe.steps}
            recipeId={recipe.id}
            prepTime={recipe.prep_time}
            cookTime={recipe.cook_time}
          />

          {/* Code Snippet */}
          {recipe.code_snippet && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Code Snippet
              </h2>
              <CodeSnippet
                code={recipe.code_snippet}
                language={recipe.language || undefined}
                title="Smart Cooking Code"
              />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cooking Timers */}
          <TimerPanel
            prepTime={recipe.prep_time}
            cookTime={recipe.cook_time}
            recipeTitle={recipe.title}
          />

          {/* Nutrition Information */}
          {recipe.nutrition ? (
            <NutritionDisplay
              nutrition={recipe.nutrition}
              servings={recipe.servings || 1}
              className="card"
            />
          ) : (
            <div className="card">
              <NutritionCalculator
                ingredients={recipe.ingredients}
                servings={recipe.servings || 1}
              />
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          {recipe.category && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Category
              </h3>
              <span className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                {recipe.category}
              </span>
            </div>
          )}

          {/* Quick Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatTime((recipe.prep_time || 0) + (recipe.cook_time || 0)) || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {recipe.difficulty || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Servings:</span>
                <span className="text-gray-900 dark:text-white">
                  {recipe.servings || 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Statistics Section */}
      {(currentRecipe.rating_count || 0) > 0 && (
        <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rating Statistics
          </h3>
          <RatingStatistics
            recipeId={recipe.id}
            averageRating={currentRecipe.average_rating || 0}
            ratingCount={currentRecipe.rating_count || 0}
            showDistribution={true}
          />
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-12">
        <ReviewList
          recipeId={recipe.id}
          onReviewUpdate={() => {
            // Refresh recipe data to get updated rating stats
            window.location.reload();
          }}
        />
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        recipeId={recipe.id}
        recipeName={recipe.title}
        onRatingSubmitted={(_rating, _review) => {
          // Update local recipe state with new rating
          setCurrentRecipe(prev => ({
            ...prev,
            // Note: In a real app, you'd want to refetch the recipe data
            // For now, we'll just refresh the page to get updated stats
          }));
          window.location.reload();
        }}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        recipes={[currentRecipe]}
        title="Export Recipe"
      />
    </div>
  );
};

export default RecipeDetail;
