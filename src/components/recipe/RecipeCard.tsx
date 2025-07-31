import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../../types';
import { ROUTES, DIFFICULTY_LEVELS } from '../../utils/constants';
import { RecipeModal } from '../ui';
import { FavoriteButton, CollectionModal } from '../favorites';
import { RatingDisplay } from '../rating';

interface RecipeCardProps {
  recipe: Recipe;
  onSaveRecipe?: (recipe: Recipe) => void;
  onFavoriteToggle?: (isFavorited: boolean) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSaveRecipe, onFavoriteToggle }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
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
    <div className="card-interactive">
      {/* Recipe Image */}
      <div className="relative h-52 gradient-primary rounded-t-2xl overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl"></div>
              <svg className="relative w-20 h-20 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

        {/* Top Right Corner - Difficulty Badge and Favorite Button */}
        <div className="absolute top-4 right-4 flex items-center space-x-3">
          {recipe.difficulty && (
            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md border border-white/20 ${getDifficultyColor(recipe.difficulty)}`}>
              {DIFFICULTY_LEVELS.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
            </span>
          )}
          <div className="backdrop-blur-md bg-white/20 dark:bg-gray-800/20 rounded-full p-1">
            <FavoriteButton
              recipeId={recipe.id}
              size="sm"
              onToggle={onFavoriteToggle}
            />
          </div>
        </div>

        {/* Code Badge */}
        {recipe.code_snippet && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md bg-accent-500/90 text-white border border-white/20 flex items-center space-x-1.5 shadow-glow">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 12L5.5 9L8.5 6L7 4.5L2.5 9L7 13.5L8.5 12ZM15.5 12L18.5 9L15.5 6L17 4.5L21.5 9L17 13.5L15.5 12Z"/>
              </svg>
              <span>{recipe.language || 'Code'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-gradient-primary transition-all duration-300">
            {recipe.title}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

        {/* Rating Display */}
        {(recipe.rating_count || 0) > 0 && (
          <div className="mb-4">
            <RatingDisplay
              averageRating={recipe.average_rating || 0}
              ratingCount={recipe.rating_count || 0}
              size="sm"
              showValue={false}
            />
          </div>
        )}

        {/* Recipe Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-3">
            {recipe.prep_time && (
              <span className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formatTime(recipe.prep_time)}</span>
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">{recipe.servings}</span>
              </span>
            )}
          </div>
          {recipe.author_name && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              by {recipe.author_name}
            </span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="badge-primary text-xs"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Recipe Button */}
        <Link
          to={ROUTES.RECIPE_DETAILS.replace(':id', recipe.id)}
          className="block w-full btn-primary text-sm font-semibold py-3 rounded-xl group-hover:shadow-glow-primary transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>View Recipe</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>

      {/* Recipe Modal for AI-generated recipes */}
      <RecipeModal
        recipe={recipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRecipe}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        recipeId={recipe.id}
        recipeName={recipe.title}
      />
    </div>
  );
};

export default RecipeCard;
