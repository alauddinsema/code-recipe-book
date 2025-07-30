/**
 * Utility functions for recipe permissions and ownership
 */

import type { Recipe } from '../types';
import type { User } from '@supabase/supabase-js';

/**
 * Check if a user owns a recipe
 * @param recipe - The recipe to check
 * @param user - The current user
 * @returns True if the user owns the recipe
 */
export function canEditRecipe(recipe: Recipe, user: User | null): boolean {
  if (!user || !recipe) return false;
  return recipe.author_id === user.id;
}

/**
 * Check if a user can duplicate a recipe
 * @param recipe - The recipe to check
 * @param user - The current user
 * @returns True if the user can duplicate the recipe
 */
export function canDuplicateRecipe(recipe: Recipe, user: User | null): boolean {
  if (!user || !recipe) return false;
  // Users can duplicate any recipe (including their own)
  return true;
}

/**
 * Check if a user can delete a recipe
 * @param recipe - The recipe to check
 * @param user - The current user
 * @returns True if the user can delete the recipe
 */
export function canDeleteRecipe(recipe: Recipe, user: User | null): boolean {
  if (!user || !recipe) return false;
  return recipe.author_id === user.id;
}

/**
 * Get the display name for recipe ownership
 * @param recipe - The recipe
 * @param user - The current user
 * @returns Display text for ownership
 */
export function getOwnershipText(recipe: Recipe, user: User | null): string {
  if (!user) return 'Sign in to edit recipes';
  
  if (canEditRecipe(recipe, user)) {
    return 'You own this recipe';
  }
  
  return `Created by ${recipe.author_name || 'Unknown'}`;
}

/**
 * Generate a unique title for a duplicated recipe
 * @param originalTitle - The original recipe title
 * @param userName - The user's name
 * @returns A new title for the duplicated recipe
 */
export function generateDuplicateTitle(originalTitle: string, userName?: string): string {
  const userPrefix = userName ? `${userName}'s` : 'My';

  // Check if the title already contains "Copy" to avoid nested copies
  if (originalTitle.toLowerCase().includes('copy')) {
    return `${userPrefix} Version of ${originalTitle}`;
  }

  return `${userPrefix} Copy of ${originalTitle}`;
}

/**
 * Create a clean copy of recipe data for duplication
 * @param recipe - The original recipe
 * @param newTitle - The new title for the duplicate
 * @returns Recipe data ready for creation
 */
export function createRecipeDuplicate(recipe: Recipe, newTitle: string): Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'author_id' | 'author_name'> {
  return {
    title: newTitle,
    description: `${recipe.description}\n\n(Adapted from "${recipe.title}")`,
    ingredients: [...recipe.ingredients],
    steps: [...recipe.steps],
    code_snippet: recipe.code_snippet,
    language: recipe.language,
    difficulty: recipe.difficulty,
    category: recipe.category,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    servings: recipe.servings,
    image_url: recipe.image_url, // Keep the same image
    tags: recipe.tags ? [...recipe.tags, 'adapted'] : ['adapted'],
    nutrition: recipe.nutrition ? { ...recipe.nutrition } : undefined,
    // Reset rating fields for new recipe
    average_rating: undefined,
    rating_count: undefined,
    total_rating_points: undefined,
  };
}

/**
 * Check if a recipe has been modified from its original state
 * @param original - The original recipe data
 * @param current - The current recipe data
 * @returns True if the recipe has been modified
 */
export function hasRecipeChanged(original: Recipe, current: Partial<Recipe>): boolean {
  const fieldsToCheck: (keyof Recipe)[] = [
    'title', 'description', 'ingredients', 'steps', 'code_snippet', 
    'language', 'difficulty', 'category', 'prep_time', 'cook_time', 
    'servings', 'tags', 'image_url'
  ];

  return fieldsToCheck.some(field => {
    const originalValue = original[field];
    const currentValue = current[field];
    
    // Handle array comparison
    if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
      return JSON.stringify(originalValue) !== JSON.stringify(currentValue);
    }
    
    return originalValue !== currentValue;
  });
}

/**
 * Validate recipe ownership before performing actions
 * @param recipe - The recipe to validate
 * @param user - The current user
 * @param action - The action being performed
 * @throws Error if user doesn't have permission
 */
export function validateRecipePermission(
  recipe: Recipe, 
  user: User | null, 
  action: 'edit' | 'delete' | 'duplicate'
): void {
  if (!user) {
    throw new Error('You must be signed in to perform this action');
  }

  switch (action) {
    case 'edit':
    case 'delete':
      if (!canEditRecipe(recipe, user)) {
        throw new Error('You can only edit your own recipes');
      }
      break;
    case 'duplicate':
      if (!canDuplicateRecipe(recipe, user)) {
        throw new Error('You cannot duplicate this recipe');
      }
      break;
    default:
      throw new Error('Invalid action');
  }
}
