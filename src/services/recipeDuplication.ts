/**
 * Service for recipe duplication and version management
 */

import { RecipeService } from './recipes';
import type { Recipe, RecipeFormData } from '../types';
import type { User } from '@supabase/supabase-js';
import { 
  validateRecipePermission, 
  generateDuplicateTitle, 
  createRecipeDuplicate 
} from '../utils/recipePermissions';

export interface DuplicationOptions {
  newTitle?: string;
  includeNutrition?: boolean;
  includeCodeSnippet?: boolean;
  includeTags?: boolean;
  customDescription?: string;
}

export interface RecipeVersion {
  id: string;
  originalRecipeId: string;
  version: number;
  title: string;
  description: string;
  createdAt: string;
  changes: string[];
}

export class RecipeDuplicationService {
  /**
   * Duplicate a recipe for the current user
   * @param originalRecipe - The recipe to duplicate
   * @param user - The current user
   * @param options - Duplication options
   * @returns The newly created recipe
   */
  static async duplicateRecipe(
    originalRecipe: Recipe,
    user: User,
    options: DuplicationOptions = {}
  ): Promise<Recipe> {
    // Validate permissions
    validateRecipePermission(originalRecipe, user, 'duplicate');

    // Generate new title if not provided
    const newTitle = options.newTitle || generateDuplicateTitle(
      originalRecipe.title, 
      user.user_metadata?.name || user.email?.split('@')[0]
    );

    // Create duplicate data
    const duplicateData = createRecipeDuplicate(originalRecipe, newTitle);

    // Apply options
    const recipeFormData: RecipeFormData = {
      ...duplicateData,
      description: options.customDescription || duplicateData.description,
      code_snippet: options.includeCodeSnippet !== false ? duplicateData.code_snippet : undefined,
      nutrition: options.includeNutrition !== false ? duplicateData.nutrition : undefined,
      tags: options.includeTags !== false ? duplicateData.tags : [],
    };

    // Create the new recipe
    const newRecipe = await RecipeService.createRecipe(
      recipeFormData,
      user.id,
      user.user_metadata?.name || user.email?.split('@')[0]
    );

    return newRecipe;
  }

  /**
   * Create a recipe with version tracking
   * @param recipeData - The recipe data
   * @param user - The current user
   * @param originalRecipeId - ID of the original recipe (for version tracking)
   * @returns The newly created recipe
   */
  static async createRecipeVersion(
    recipeData: RecipeFormData,
    user: User,
    originalRecipeId?: string
  ): Promise<Recipe> {
    // Add version tracking to description if this is a version
    if (originalRecipeId) {
      const versionNote = `\n\n---\n*This is an adapted version. Original recipe ID: ${originalRecipeId}*`;
      recipeData.description = (recipeData.description || '') + versionNote;
    }

    return await RecipeService.createRecipe(
      recipeData,
      user.id,
      user.user_metadata?.name || user.email?.split('@')[0]
    );
  }

  /**
   * Get recipes that are versions/adaptations of a base recipe
   * @param originalRecipeId - The original recipe ID
   * @returns Array of recipe versions
   */
  static async getRecipeVersions(originalRecipeId: string): Promise<Recipe[]> {
    try {
      // Search for recipes that mention the original recipe ID in their description
      const recipes = await RecipeService.searchRecipes(
        `Original recipe ID: ${originalRecipeId}`,
        {
          searchIn: ['description'],
          limit: 50
        }
      );

      return recipes || [];
    } catch (error) {
      console.error('Error fetching recipe versions:', error);
      return [];
    }
  }

  /**
   * Duplicate recipe with smart ingredient scaling
   * @param originalRecipe - The recipe to duplicate
   * @param user - The current user
   * @param newServings - New serving size
   * @param options - Additional options
   * @returns The newly created scaled recipe
   */
  static async duplicateWithScaling(
    originalRecipe: Recipe,
    user: User,
    newServings: number,
    options: DuplicationOptions = {}
  ): Promise<Recipe> {
    validateRecipePermission(originalRecipe, user, 'duplicate');

    const originalServings = originalRecipe.servings || 4;
    const scaleFactor = newServings / originalServings;

    // Scale ingredients (basic implementation)
    const scaledIngredients = originalRecipe.ingredients.map(ingredient => {
      // This is a simplified scaling - in a real app you'd want more sophisticated parsing
      const numberMatch = ingredient.match(/^(\d+(?:\.\d+)?)\s*(.+)/);
      if (numberMatch) {
        const amount = parseFloat(numberMatch[1]);
        const rest = numberMatch[2];
        const scaledAmount = (amount * scaleFactor).toFixed(2).replace(/\.?0+$/, '');
        return `${scaledAmount} ${rest}`;
      }
      return ingredient;
    });

    // Scale nutrition if available
    let scaledNutrition = originalRecipe.nutrition;
    if (scaledNutrition && scaleFactor !== 1) {
      scaledNutrition = {
        ...scaledNutrition,
        calories: scaledNutrition.calories ? scaledNutrition.calories * scaleFactor : undefined,
        protein: scaledNutrition.protein ? scaledNutrition.protein * scaleFactor : undefined,
        carbohydrates: scaledNutrition.carbohydrates ? scaledNutrition.carbohydrates * scaleFactor : undefined,
        fat: scaledNutrition.fat ? scaledNutrition.fat * scaleFactor : undefined,
        fiber: scaledNutrition.fiber ? scaledNutrition.fiber * scaleFactor : undefined,
        sugar: scaledNutrition.sugar ? scaledNutrition.sugar * scaleFactor : undefined,
        sodium: scaledNutrition.sodium ? scaledNutrition.sodium * scaleFactor : undefined,
      };
    }

    const newTitle = options.newTitle || `${originalRecipe.title} (${newServings} servings)`;
    const scalingNote = `Scaled from ${originalServings} to ${newServings} servings`;
    
    const recipeFormData: RecipeFormData = {
      title: newTitle,
      description: `${originalRecipe.description}\n\n*${scalingNote}*`,
      ingredients: scaledIngredients,
      steps: [...originalRecipe.steps],
      code_snippet: options.includeCodeSnippet !== false ? originalRecipe.code_snippet : undefined,
      language: originalRecipe.language,
      difficulty: originalRecipe.difficulty,
      category: originalRecipe.category,
      prep_time: originalRecipe.prep_time,
      cook_time: originalRecipe.cook_time,
      servings: newServings,
      image_url: originalRecipe.image_url,
      tags: [...(originalRecipe.tags || []), 'scaled', 'adapted'],
      nutrition: scaledNutrition,
    };

    return await RecipeService.createRecipe(
      recipeFormData,
      user.id,
      user.user_metadata?.name || user.email?.split('@')[0]
    );
  }

  /**
   * Get duplication statistics for a recipe
   * @param recipeId - The recipe ID
   * @returns Statistics about duplications
   */
  static async getDuplicationStats(recipeId: string): Promise<{
    duplicateCount: number;
    versionCount: number;
    popularAdaptations: Recipe[];
  }> {
    try {
      // This is a simplified implementation
      // In a real app, you might want to track duplications in a separate table
      const versions = await this.getRecipeVersions(recipeId);
      
      return {
        duplicateCount: versions.length,
        versionCount: versions.length,
        popularAdaptations: versions.slice(0, 5), // Top 5 adaptations
      };
    } catch (error) {
      console.error('Error fetching duplication stats:', error);
      return {
        duplicateCount: 0,
        versionCount: 0,
        popularAdaptations: [],
      };
    }
  }
}
