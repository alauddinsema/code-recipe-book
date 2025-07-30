import { supabase } from './supabase';
import type { Database } from './supabase';
import type { Recipe, RecipeFormData } from '../types';

type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

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
    return { recipes: data as Recipe[], count };
  }

  // Get recipe by ID
  static async getRecipeById(id: string): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  // Get recipes by user
  static async getRecipesByUser(userId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Recipe[];
  }

  // Get recipes by author (alias for getRecipesByUser with count)
  static async getRecipesByAuthor(userId: string) {
    const { data, error, count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { recipes: data as Recipe[], count };
  }

  // Create new recipe
  static async createRecipe(recipeData: RecipeFormData, userId: string, userName?: string): Promise<Recipe> {
    const insertData: RecipeInsert = {
      ...recipeData,
      author_id: userId,
      author_name: userName || 'Anonymous',
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  // Update recipe
  static async updateRecipe(id: string, updates: Partial<RecipeFormData>): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates as RecipeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  // Delete recipe
  static async deleteRecipe(id: string) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Search recipes
  static async searchRecipes(query: string, filters?: {
    category?: string;
    difficulty?: string;
    tags?: string[];
  }) {
    let supabaseQuery = supabase
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      supabaseQuery = supabaseQuery.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      supabaseQuery = supabaseQuery.eq('difficulty', filters.difficulty);
    }

    if (filters?.tags && filters.tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', filters.tags);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data as Recipe[];
  }

  // Get recipe categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('recipes')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    const categories = [...new Set(data.map(item => item.category))];
    return categories.filter(Boolean);
  }

  // Get popular tags
  static async getPopularTags(limit = 20) {
    const { data, error } = await supabase
      .from('recipes')
      .select('tags')
      .not('tags', 'is', null);

    if (error) throw error;

    const allTags = data.flatMap(item => item.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}
