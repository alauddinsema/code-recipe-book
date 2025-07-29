import React from 'react';
import type { Recipe } from '../../types';
import { DIFFICULTY_LEVELS } from '../../utils/constants';
import CodeSnippet from './CodeSnippet';

interface RecipeDetailProps {
  recipe: Recipe;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe }) => {
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
          {/* Ingredients */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
                  <span className="text-gray-700 dark:text-gray-300">{ingredient}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Instructions
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>

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
    </div>
  );
};

export default RecipeDetail;
