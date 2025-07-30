import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  DocumentDuplicateIcon, 
  TrashIcon,
  EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { RecipeService } from '../../services/recipes';
import { RecipeDuplicationService } from '../../services/recipeDuplication';
import { 
  canEditRecipe, 
  canDuplicateRecipe, 
  canDeleteRecipe,
  generateDuplicateTitle 
} from '../../utils/recipePermissions';
import type { Recipe } from '../../types';
import toast from 'react-hot-toast';

interface RecipeActionsProps {
  recipe: Recipe;
  onRecipeUpdated?: (recipe: Recipe) => void;
  onRecipeDeleted?: () => void;
  onRecipeDuplicated?: (newRecipe: Recipe) => void;
  showLabels?: boolean;
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

const RecipeActions: React.FC<RecipeActionsProps> = ({
  recipe,
  onRecipeDeleted,
  onRecipeDuplicated,
  showLabels = false,
  variant = 'buttons',
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const canEdit = canEditRecipe(recipe, user);
  const canDuplicate = canDuplicateRecipe(recipe, user);
  const canDelete = canDeleteRecipe(recipe, user);

  const handleEdit = () => {
    if (!canEdit) {
      toast.error('You can only edit your own recipes');
      return;
    }
    navigate(`/recipe/${recipe.id}/edit`);
  };

  const handleDuplicate = async () => {
    if (!canDuplicate || !user) {
      toast.error('You must be signed in to duplicate recipes');
      return;
    }

    try {
      setLoading('duplicate');
      const newTitle = generateDuplicateTitle(
        recipe.title, 
        user.user_metadata?.name || user.email?.split('@')[0]
      );
      
      const duplicatedRecipe = await RecipeDuplicationService.duplicateRecipe(
        recipe,
        user,
        { newTitle }
      );

      toast.success('Recipe duplicated successfully!');
      onRecipeDuplicated?.(duplicatedRecipe);
      
      // Navigate to the new recipe
      navigate(`/recipe/${duplicatedRecipe.id}`);
    } catch (error) {
      console.error('Error duplicating recipe:', error);
      toast.error('Failed to duplicate recipe');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You can only delete your own recipes');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading('delete');
      await RecipeService.deleteRecipe(recipe.id);
      toast.success('Recipe deleted successfully');
      onRecipeDeleted?.();
      navigate('/profile');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      key: 'edit',
      label: 'Edit Recipe',
      icon: PencilIcon,
      onClick: handleEdit,
      show: canEdit,
      loading: loading === 'edit'
    },
    {
      key: 'duplicate',
      label: 'Duplicate Recipe',
      icon: DocumentDuplicateIcon,
      onClick: handleDuplicate,
      show: canDuplicate,
      loading: loading === 'duplicate'
    },
    {
      key: 'delete',
      label: 'Delete Recipe',
      icon: TrashIcon,
      onClick: handleDelete,
      show: canDelete,
      loading: loading === 'delete',
      variant: 'danger' as const
    }
  ].filter(action => action.show);

  if (actions.length === 0) {
    return null;
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          title="Recipe actions"
          aria-label="Recipe actions"
          className="p-2"
        >
          <EllipsisVerticalIcon className="w-5 h-5" />
        </Button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="py-1">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      action.onClick();
                    }}
                    disabled={action.loading}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      action.variant === 'danger' 
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'text-gray-700 dark:text-gray-300'
                    } ${action.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <action.icon className="w-4 h-4" />
                    <span>{action.loading ? 'Loading...' : action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {actions.map((action) => (
        <Button
          key={action.key}
          type="button"
          variant={action.variant === 'danger' ? 'danger' : 'secondary'}
          size="sm"
          onClick={action.onClick}
          disabled={action.loading}
          title={action.label}
          aria-label={action.label}
          className="flex items-center space-x-1"
        >
          <action.icon className="w-4 h-4" />
          {showLabels && (
            <span className="hidden sm:inline">
              {action.loading ? 'Loading...' : action.label}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default RecipeActions;
