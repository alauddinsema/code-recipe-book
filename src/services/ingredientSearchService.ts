import { supabase } from './supabase';
import { PantryService } from './pantryService';
import { RecipeService } from './recipes';
import type { Recipe } from '../types';

export interface IngredientSearchResult {
  recipe: Recipe;
  matchScore: number;
  availableIngredients: string[];
  missingIngredients: string[];
  substitutionSuggestions: Array<{
    missing: string;
    substitute: string;
    confidence: number;
  }>;
  canMakeWithSubstitutions: boolean;
}

export interface SearchFilters {
  maxMissingIngredients?: number;
  allowSubstitutions?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  maxPrepTime?: number;
  dietaryRestrictions?: string[];
}

export class IngredientSearchService {
  /**
   * Find recipes based on available pantry ingredients
   */
  static async findRecipesByIngredients(
    userId: string,
    additionalIngredients: string[] = [],
    filters: SearchFilters = {}
  ): Promise<IngredientSearchResult[]> {
    try {
      // Get user's pantry items
      const pantryItems = await PantryService.getPantryItems(userId);
      const availableIngredients = pantryItems.map(item => item.name.toLowerCase());
      
      // Add any additional ingredients specified by user
      const allAvailableIngredients = [
        ...availableIngredients,
        ...additionalIngredients.map(ing => ing.toLowerCase())
      ];

      // Get all recipes
      const allRecipes = await RecipeService.getRecipes();
      
      // Filter recipes based on basic criteria first
      let filteredRecipes = allRecipes;
      
      if (filters.difficulty) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.difficulty === filters.difficulty);
      }
      
      if (filters.category) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.category === filters.category);
      }
      
      if (filters.maxPrepTime) {
        filteredRecipes = filteredRecipes.filter(recipe => 
          (recipe.prep_time || 0) <= filters.maxPrepTime!
        );
      }

      // Analyze each recipe for ingredient matches
      const searchResults: IngredientSearchResult[] = [];

      for (const recipe of filteredRecipes) {
        const analysis = await this.analyzeRecipeIngredients(
          recipe,
          allAvailableIngredients,
          filters
        );

        // Apply filters
        if (filters.maxMissingIngredients !== undefined && 
            analysis.missingIngredients.length > filters.maxMissingIngredients) {
          continue;
        }

        // Only include recipes where we can make something meaningful
        if (analysis.matchScore > 0.2 || analysis.canMakeWithSubstitutions) {
          searchResults.push(analysis);
        }
      }

      // Sort by match score (best matches first)
      searchResults.sort((a, b) => {
        // Prioritize recipes we can make completely
        if (a.missingIngredients.length === 0 && b.missingIngredients.length > 0) return -1;
        if (b.missingIngredients.length === 0 && a.missingIngredients.length > 0) return 1;
        
        // Then by match score
        return b.matchScore - a.matchScore;
      });

      return searchResults.slice(0, 50); // Limit results

    } catch (error) {
      console.error('Failed to find recipes by ingredients:', error);
      throw error;
    }
  }

  /**
   * Analyze a single recipe against available ingredients
   */
  private static async analyzeRecipeIngredients(
    recipe: Recipe,
    availableIngredients: string[],
    filters: SearchFilters
  ): Promise<IngredientSearchResult> {
    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
    const availableSet = new Set(availableIngredients);
    
    const availableInRecipe: string[] = [];
    const missingInRecipe: string[] = [];

    // Check each recipe ingredient
    for (const ingredient of recipeIngredients) {
      const cleanIngredient = this.cleanIngredientName(ingredient);
      
      if (this.hasIngredient(cleanIngredient, availableIngredients)) {
        availableInRecipe.push(ingredient);
      } else {
        missingInRecipe.push(ingredient);
      }
    }

    // Calculate match score
    const matchScore = recipeIngredients.length > 0 
      ? availableInRecipe.length / recipeIngredients.length 
      : 0;

    // Get substitution suggestions for missing ingredients
    const substitutionSuggestions = filters.allowSubstitutions 
      ? await this.getSubstitutionSuggestions(missingInRecipe, availableIngredients)
      : [];

    // Check if we can make with substitutions
    const canMakeWithSubstitutions = substitutionSuggestions.length > 0 && 
      (missingInRecipe.length - substitutionSuggestions.length) <= (filters.maxMissingIngredients || 2);

    return {
      recipe,
      matchScore,
      availableIngredients: availableInRecipe,
      missingIngredients: missingInRecipe,
      substitutionSuggestions,
      canMakeWithSubstitutions
    };
  }

  /**
   * Clean ingredient name for better matching
   */
  private static cleanIngredientName(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .replace(/^\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|ml|liters?)\s*/i, '') // Remove quantities
      .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical notes
      .replace(/,.*$/, '') // Remove everything after comma
      .replace(/\s*(chopped|diced|sliced|minced|fresh|dried|ground|whole)\s*/gi, '') // Remove preparation words
      .trim();
  }

  /**
   * Check if we have an ingredient (with fuzzy matching)
   */
  private static hasIngredient(targetIngredient: string, availableIngredients: string[]): boolean {
    const target = targetIngredient.toLowerCase();
    
    for (const available of availableIngredients) {
      const availableClean = available.toLowerCase();
      
      // Exact match
      if (target === availableClean) return true;
      
      // Partial match (ingredient contains available or vice versa)
      if (target.includes(availableClean) || availableClean.includes(target)) return true;
      
      // Check for common variations
      if (this.areIngredientsSimilar(target, availableClean)) return true;
    }
    
    return false;
  }

  /**
   * Check if two ingredients are similar (common variations)
   */
  private static areIngredientsSimilar(ingredient1: string, ingredient2: string): boolean {
    const variations: Record<string, string[]> = {
      'tomato': ['tomatoes', 'cherry tomatoes', 'roma tomatoes'],
      'onion': ['onions', 'yellow onion', 'white onion', 'red onion'],
      'garlic': ['garlic cloves', 'garlic powder', 'minced garlic'],
      'cheese': ['cheddar cheese', 'mozzarella cheese', 'parmesan cheese'],
      'milk': ['whole milk', 'skim milk', '2% milk', 'almond milk'],
      'oil': ['olive oil', 'vegetable oil', 'canola oil', 'coconut oil'],
      'flour': ['all-purpose flour', 'wheat flour', 'bread flour'],
      'sugar': ['white sugar', 'brown sugar', 'granulated sugar'],
      'pepper': ['black pepper', 'white pepper', 'ground pepper'],
      'salt': ['table salt', 'sea salt', 'kosher salt']
    };

    for (const [base, variants] of Object.entries(variations)) {
      if ((ingredient1.includes(base) || variants.some(v => ingredient1.includes(v))) &&
          (ingredient2.includes(base) || variants.some(v => ingredient2.includes(v)))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get AI-powered substitution suggestions
   */
  private static async getSubstitutionSuggestions(
    missingIngredients: string[],
    availableIngredients: string[]
  ): Promise<Array<{ missing: string; substitute: string; confidence: number }>> {
    // Common substitution rules
    const substitutionRules: Record<string, Array<{ substitute: string; confidence: number }>> = {
      'butter': [
        { substitute: 'oil', confidence: 0.8 },
        { substitute: 'margarine', confidence: 0.9 },
        { substitute: 'coconut oil', confidence: 0.7 }
      ],
      'milk': [
        { substitute: 'almond milk', confidence: 0.8 },
        { substitute: 'soy milk', confidence: 0.8 },
        { substitute: 'water', confidence: 0.5 }
      ],
      'egg': [
        { substitute: 'applesauce', confidence: 0.6 },
        { substitute: 'banana', confidence: 0.6 },
        { substitute: 'flax seed', confidence: 0.7 }
      ],
      'onion': [
        { substitute: 'shallot', confidence: 0.8 },
        { substitute: 'garlic', confidence: 0.6 },
        { substitute: 'onion powder', confidence: 0.7 }
      ],
      'garlic': [
        { substitute: 'garlic powder', confidence: 0.8 },
        { substitute: 'onion', confidence: 0.5 },
        { substitute: 'shallot', confidence: 0.6 }
      ]
    };

    const suggestions: Array<{ missing: string; substitute: string; confidence: number }> = [];

    for (const missing of missingIngredients) {
      const cleanMissing = this.cleanIngredientName(missing);
      
      // Check if we have substitution rules for this ingredient
      for (const [ingredient, subs] of Object.entries(substitutionRules)) {
        if (cleanMissing.includes(ingredient)) {
          for (const sub of subs) {
            if (this.hasIngredient(sub.substitute, availableIngredients)) {
              suggestions.push({
                missing,
                substitute: sub.substitute,
                confidence: sub.confidence
              });
              break; // Only suggest one substitution per missing ingredient
            }
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Get smart recipe suggestions based on what's expiring soon
   */
  static async getExpiringIngredientRecipes(userId: string): Promise<IngredientSearchResult[]> {
    try {
      // Get items expiring in the next 3 days
      const expiringItems = await PantryService.getExpiringItems(userId, 3);
      
      if (expiringItems.length === 0) {
        return [];
      }

      const expiringIngredients = expiringItems.map(item => item.name);
      
      // Find recipes that use these expiring ingredients
      return await this.findRecipesByIngredients(userId, [], {
        maxMissingIngredients: 3,
        allowSubstitutions: true
      });

    } catch (error) {
      console.error('Failed to get expiring ingredient recipes:', error);
      throw error;
    }
  }

  /**
   * Get recipe suggestions for a specific meal type
   */
  static async getMealTypeRecipes(
    userId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    additionalIngredients: string[] = []
  ): Promise<IngredientSearchResult[]> {
    try {
      const categoryMap = {
        breakfast: 'breakfast',
        lunch: ['lunch', 'salad', 'sandwich'],
        dinner: ['dinner', 'main-course'],
        snack: ['snack', 'appetizer', 'dessert']
      };

      const categories = Array.isArray(categoryMap[mealType]) 
        ? categoryMap[mealType] 
        : [categoryMap[mealType]];

      const allResults: IngredientSearchResult[] = [];

      for (const category of categories) {
        const results = await this.findRecipesByIngredients(userId, additionalIngredients, {
          category: category as string,
          maxMissingIngredients: 2,
          allowSubstitutions: true
        });
        allResults.push(...results);
      }

      // Remove duplicates and sort
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.recipe.id === result.recipe.id)
      );

      return uniqueResults.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);

    } catch (error) {
      console.error('Failed to get meal type recipes:', error);
      throw error;
    }
  }
}
