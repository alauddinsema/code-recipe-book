import { supabase } from './supabase';
import type { Recipe } from '../types';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  recipe_count: number;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface CollectionRecipe {
  id: string;
  collection_id: string;
  recipe_id: string;
  added_at: string;
  recipe?: Recipe;
}

export class FavoritesService {
  // Add recipe to favorites
  static async addToFavorites(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        recipe_id: recipeId
      });

    if (error) throw error;
  }

  // Remove recipe from favorites
  static async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }

  // Check if recipe is favorited by user
  static async isFavorited(userId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  // Get user's favorite recipes
  static async getFavoriteRecipes(userId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        recipe_id,
        recipes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => item.recipes).filter(Boolean) as Recipe[];
  }

  // Get favorite recipe IDs for user (for quick lookup)
  static async getFavoriteRecipeIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item: any) => item.recipe_id);
  }

  // Create a new collection
  static async createCollection(
    userId: string, 
    name: string, 
    description?: string,
    isPublic: boolean = false
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name,
        description,
        is_public: isPublic
      })
      .select()
      .single();

    if (error) throw error;
    return data as Collection;
  }

  // Get user's collections
  static async getUserCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_recipes (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((collection: any) => ({
      ...collection,
      recipe_count: collection.collection_recipes?.[0]?.count || 0
    })) as Collection[];
  }

  // Add recipe to collection
  static async addToCollection(collectionId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_recipes')
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId
      });

    if (error) throw error;
  }

  // Remove recipe from collection
  static async removeFromCollection(collectionId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_recipes')
      .delete()
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }

  // Get recipes in a collection
  static async getCollectionRecipes(collectionId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select(`
        recipe_id,
        added_at,
        recipes (*)
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => item.recipes).filter(Boolean) as Recipe[];
  }

  // Update collection
  static async updateCollection(
    collectionId: string, 
    updates: { name?: string; description?: string; is_public?: boolean }
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .select()
      .single();

    if (error) throw error;
    return data as Collection;
  }

  // Delete collection
  static async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);

    if (error) throw error;
  }

  // Get collections that contain a specific recipe
  static async getRecipeCollections(userId: string, recipeId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select(`
        collection_id,
        collections!inner (*)
      `)
      .eq('recipe_id', recipeId)
      .eq('collections.user_id', userId);

    if (error) throw error;
    return (data || []).map((item: any) => item.collections).filter(Boolean) as Collection[];
  }

  // Check if recipe is in collection
  static async isInCollection(collectionId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('collection_recipes')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('recipe_id', recipeId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  }

  // Get public collections (for discovery)
  static async getPublicCollections(limit: number = 20): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_recipes (count),
        profiles (full_name)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((collection: any) => ({
      ...collection,
      recipe_count: collection.collection_recipes?.[0]?.count || 0,
      author_name: collection.profiles?.full_name
    })) as Collection[];
  }


}
