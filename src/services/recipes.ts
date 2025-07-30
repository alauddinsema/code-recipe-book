import { supabase } from './supabase';
import type { Database } from './supabase';
import type { Recipe, RecipeFormData, NutritionInfo } from '../types';

type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

// Helper functions for nutrition data conversion
const nutritionToDbFields = (nutrition?: NutritionInfo) => {
  if (!nutrition) return {};

  return {
    nutrition_calories: nutrition.calories || null,
    nutrition_protein: nutrition.protein || null,
    nutrition_carbohydrates: nutrition.carbohydrates || null,
    nutrition_fat: nutrition.fat || null,
    nutrition_fiber: nutrition.fiber || null,
    nutrition_sugar: nutrition.sugar || null,
    nutrition_sodium: nutrition.sodium || null,
    nutrition_cholesterol: nutrition.cholesterol || null,
    nutrition_saturated_fat: nutrition.saturated_fat || null,
    nutrition_trans_fat: nutrition.trans_fat || null,
    nutrition_vitamin_a: nutrition.vitamin_a || null,
    nutrition_vitamin_c: nutrition.vitamin_c || null,
    nutrition_calcium: nutrition.calcium || null,
    nutrition_iron: nutrition.iron || null,
    nutrition_potassium: nutrition.potassium || null,
    nutrition_per_serving: nutrition.per_serving ?? true,
  };
};

const dbFieldsToNutrition = (row: any): NutritionInfo | undefined => {
  if (!row.nutrition_calories && !row.nutrition_protein && !row.nutrition_carbohydrates && !row.nutrition_fat) {
    return undefined;
  }

  return {
    calories: row.nutrition_calories || undefined,
    protein: row.nutrition_protein || undefined,
    carbohydrates: row.nutrition_carbohydrates || undefined,
    fat: row.nutrition_fat || undefined,
    fiber: row.nutrition_fiber || undefined,
    sugar: row.nutrition_sugar || undefined,
    sodium: row.nutrition_sodium || undefined,
    cholesterol: row.nutrition_cholesterol || undefined,
    saturated_fat: row.nutrition_saturated_fat || undefined,
    trans_fat: row.nutrition_trans_fat || undefined,
    vitamin_a: row.nutrition_vitamin_a || undefined,
    vitamin_c: row.nutrition_vitamin_c || undefined,
    calcium: row.nutrition_calcium || undefined,
    iron: row.nutrition_iron || undefined,
    potassium: row.nutrition_potassium || undefined,
    per_serving: row.nutrition_per_serving ?? true,
  };
};

const transformDbRowToRecipe = (row: any): Recipe => {
  const nutrition = dbFieldsToNutrition(row);

  return {
    ...row,
    nutrition,
  } as Recipe;
};

export class RecipeService {
  // Get all recipes with pagination
  static async getRecipes(page = 0, limit = 10, category?: string, difficulty?: string) {
    let query = supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { recipes: data.map(transformDbRowToRecipe), count };
  }

  // Get recipe by ID
  static async getRecipeById(id: string): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return transformDbRowToRecipe(data);
  }

  // Get recipes by user
  static async getRecipesByUser(userId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(transformDbRowToRecipe);
  }

  // Get recipes by author (alias for getRecipesByUser with count)
  static async getRecipesByAuthor(userId: string) {
    const { data, error, count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { recipes: data.map(transformDbRowToRecipe), count };
  }

  // Create new recipe
  static async createRecipe(recipeData: RecipeFormData, userId: string, userName?: string): Promise<Recipe> {
    try {
      // Explicitly map only the fields we know exist in the database
      const insertData = {
        title: recipeData.title,
        description: recipeData.description,
        ingredients: recipeData.ingredients,
        steps: recipeData.steps,
        code_snippet: recipeData.code_snippet || null,
        language: recipeData.language || null,
        difficulty: recipeData.difficulty || null,
        category: recipeData.category || null,
        prep_time: recipeData.prep_time || null,
        cook_time: recipeData.cook_time || null,
        servings: recipeData.servings || null,
        author_id: userId,
        author_name: userName || 'Anonymous',
        image_url: recipeData.image_url || null,
        tags: recipeData.tags || null,
        ...nutritionToDbFields(recipeData.nutrition),
      };

      console.log('Creating recipe with data:', { ...insertData, ingredients: insertData.ingredients?.length, steps: insertData.steps?.length });

      const { data, error } = await supabase
        .from('recipes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create recipe: ${error.message}`);
      }

      console.log('Recipe created successfully:', data);
      return transformDbRowToRecipe(data);
    } catch (error) {
      console.error('Recipe creation error:', error);
      throw error;
    }
  }

  // Update recipe
  static async updateRecipe(id: string, updates: Partial<RecipeFormData>): Promise<Recipe> {
    // Convert nutrition data to database fields
    const updateData = {
      ...updates,
      ...nutritionToDbFields(updates.nutrition),
    };

    // Remove the nutrition field since it's now converted to individual fields
    delete updateData.nutrition;

    const { data, error } = await supabase
      .from('recipes')
      .update(updateData as RecipeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDbRowToRecipe(data);
  }

  // Delete recipe
  static async deleteRecipe(id: string) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Advanced search recipes
  static async searchRecipes(query: string, filters?: {
    category?: string;
    difficulty?: string;
    tags?: string[];
    prepTimeRange?: [number, number];
    cookTimeRange?: [number, number];
    servingsRange?: [number, number];
    minRating?: number;
    minRatingCount?: number;
    sortBy?: 'newest' | 'oldest' | 'prep_time' | 'cook_time' | 'difficulty' | 'title' | 'rating' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    searchIn?: ('title' | 'description' | 'ingredients' | 'code')[];
    offset?: number;
    limit?: number;
  }) {
    let supabaseQuery = supabase.from('recipes').select('*');

    // Build search conditions based on searchIn fields
    if (query.trim()) {
      const searchFields = filters?.searchIn || ['title', 'description'];
      const searchConditions: string[] = [];

      if (searchFields.includes('title')) {
        searchConditions.push(`title.ilike.%${query}%`);
      }
      if (searchFields.includes('description')) {
        searchConditions.push(`description.ilike.%${query}%`);
      }
      if (searchFields.includes('ingredients')) {
        // Search in ingredients array - PostgreSQL array contains text
        searchConditions.push(`ingredients.cs.{${query}}`);
      }
      if (searchFields.includes('code')) {
        searchConditions.push(`code_snippet.ilike.%${query}%`);
      }

      if (searchConditions.length > 0) {
        supabaseQuery = supabaseQuery.or(searchConditions.join(','));
      }
    }

    // Apply filters
    if (filters?.category) {
      supabaseQuery = supabaseQuery.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      supabaseQuery = supabaseQuery.eq('difficulty', filters.difficulty);
    }

    if (filters?.tags && filters.tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', filters.tags);
    }

    // Time range filters
    if (filters?.prepTimeRange) {
      const [min, max] = filters.prepTimeRange;
      if (min > 0) {
        supabaseQuery = supabaseQuery.gte('prep_time', min);
      }
      if (max < 240) {
        supabaseQuery = supabaseQuery.lte('prep_time', max);
      }
    }

    if (filters?.cookTimeRange) {
      const [min, max] = filters.cookTimeRange;
      if (min > 0) {
        supabaseQuery = supabaseQuery.gte('cook_time', min);
      }
      if (max < 480) {
        supabaseQuery = supabaseQuery.lte('cook_time', max);
      }
    }

    if (filters?.servingsRange) {
      const [min, max] = filters.servingsRange;
      if (min > 1) {
        supabaseQuery = supabaseQuery.gte('servings', min);
      }
      if (max < 12) {
        supabaseQuery = supabaseQuery.lte('servings', max);
      }
    }

    // Rating filters
    if (filters?.minRating && filters.minRating > 0) {
      supabaseQuery = supabaseQuery.gte('average_rating', filters.minRating);
    }

    if (filters?.minRatingCount && filters.minRatingCount > 0) {
      supabaseQuery = supabaseQuery.gte('rating_count', filters.minRatingCount);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'newest';
    const sortOrder = filters?.sortOrder || 'desc';
    const ascending = sortOrder === 'asc';

    switch (sortBy) {
      case 'newest':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      case 'oldest':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: true });
        break;
      case 'prep_time':
        supabaseQuery = supabaseQuery.order('prep_time', { ascending, nullsFirst: false });
        break;
      case 'cook_time':
        supabaseQuery = supabaseQuery.order('cook_time', { ascending, nullsFirst: false });
        break;
      case 'difficulty':
        // Custom ordering for difficulty: easy < medium < hard
        supabaseQuery = supabaseQuery.order('difficulty', { ascending });
        break;
      case 'title':
        supabaseQuery = supabaseQuery.order('title', { ascending });
        break;
      case 'rating':
        supabaseQuery = supabaseQuery
          .order('average_rating', { ascending: false, nullsFirst: false })
          .order('rating_count', { ascending: false });
        break;
      case 'popularity':
        // Sort by a combination of rating and rating count for popularity
        supabaseQuery = supabaseQuery
          .order('rating_count', { ascending: false })
          .order('average_rating', { ascending: false, nullsFirst: false });
        break;
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (filters?.offset !== undefined) {
      supabaseQuery = supabaseQuery.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    } else if (filters?.limit !== undefined) {
      supabaseQuery = supabaseQuery.limit(filters.limit);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data.map(transformDbRowToRecipe);
  }

  // Get recipe categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('recipes')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    const categories = [...new Set(data.map((item: any) => item.category))];
    return categories.filter(Boolean);
  }

  // Get popular tags
  static async getPopularTags(limit = 20) {
    const { data, error } = await supabase
      .from('recipes')
      .select('tags')
      .not('tags', 'is', null);

    if (error) throw error;

    const allTags = data.flatMap((item: any) => item.tags || []);
    const tagCounts = allTags.reduce((acc: any, tag: any) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}
