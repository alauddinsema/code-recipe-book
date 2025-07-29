import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../../types';
import { ROUTES, DIFFICULTY_LEVELS } from '../../utils/constants';
import { RecipeModal } from '../ui';

interface RecipeCardProps {
  recipe: Recipe;
  onSaveRecipe?: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSaveRecipe }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 group">
      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-t-lg overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-primary-400 dark:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        
        {/* Difficulty Badge */}
        {recipe.difficulty && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
              {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
            </span>
          </div>
        )}

        {/* Code Badge */}
        {recipe.code_snippet && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 12L5.5 9L8.5 6L7 4.5L2.5 9L7 13.5L8.5 12ZM15.5 12L18.5 9L15.5 6L17 4.5L21.5 9L17 13.5L15.5 12Z"/>
              </svg>
              <span>{recipe.language || 'Code'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {recipe.title}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Recipe Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-3">
            {recipe.prep_time && (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(recipe.prep_time)}</span>
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{recipe.servings} servings</span>
              </span>
            )}
          </div>
          {recipe.author_name && (
            <span className="text-primary-600 dark:text-primary-400">
              by {recipe.author_name}
            </span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Recipe Button */}
        {recipe.id.startsWith('ai-') ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="block w-full text-center btn-primary text-sm py-2"
          >
            View Recipe
          </button>
        ) : (
          <Link
            to={ROUTES.RECIPE_DETAILS.replace(':id', recipe.id)}
            className="block w-full text-center btn-primary text-sm py-2"
          >
            View Recipe
          </Link>
        )}
      </div>

      {/* Recipe Modal for AI-generated recipes */}
      <RecipeModal
        recipe={recipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRecipe}
      />
    </div>
  );
};

export default RecipeCard;
