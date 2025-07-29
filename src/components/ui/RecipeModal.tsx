import React from 'react';
import Button from './Button';
import type { Recipe } from '../../types';

interface RecipeModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (recipe: Recipe) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(recipe);
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.title}</h2>
            {recipe.id.startsWith('ai-') && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                AI Generated
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">{recipe.description}</p>

          {/* Recipe Meta */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
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
            {recipe.difficulty && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Difficulty: {recipe.difficulty}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white text-sm font-medium rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Code Snippet */}
          {recipe.code_snippet && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.5 12L5.5 9L8.5 6L7 4.5L2.5 9L7 13.5L8.5 12ZM15.5 12L18.5 9L15.5 6L17 4.5L21.5 9L17 13.5L15.5 12Z"/>
                </svg>
                <span>Code Snippet</span>
                {recipe.language && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {recipe.language}
                  </span>
                )}
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-800 dark:text-gray-200">{recipe.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
          {recipe.id.startsWith('ai-') && onSave && (
            <Button onClick={handleSave} variant="primary">
              Save Recipe
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
