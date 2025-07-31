import { supabase } from './supabase';
import type { Recipe } from '../types';

export interface Rating {
  id: string;
  user_id: string;
  recipe_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  recipe_id: string;
  rating_id?: string;
  title?: string;
  comment: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

export interface RecipeRatingStats {
  recipe_id: string;
  average_rating: number;
  rating_count: number;
  total_rating_points: number;
  rating_category: 'highly_rated' | 'well_rated' | 'rated' | 'unrated';
}

export class RatingService {
  // Add or update a rating
  static async rateRecipe(userId: string, recipeId: string, rating: number): Promise<Rating> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // AI-generated recipes can't be rated in the database
    if (recipeId.startsWith('ai-')) {
      throw new Error('AI-generated recipes cannot be rated. Please save the recipe first.');
    }

    const { data, error } = await supabase
      .from('ratings')
      .upsert({
        user_id: userId,
        recipe_id: recipeId,
        rating: rating
      }, {
        onConflict: 'user_id,recipe_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Rating;
  }

  // Get user's rating for a recipe
  static async getUserRating(userId: string, recipeId: string): Promise<Rating | null> {
    // AI-generated recipes don't have ratings in the database
    if (recipeId.startsWith('ai-')) {
      return null;
    }

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as Rating | null;
  }

  // Get all ratings for a recipe
  static async getRecipeRatings(recipeId: string): Promise<Rating[]> {
    // AI-generated recipes don't have ratings in the database
    if (recipeId.startsWith('ai-')) {
      return [];
    }

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Rating[];
  }

  // Get recipe rating statistics
  static async getRecipeRatingStats(recipeId: string): Promise<RecipeRatingStats | null> {
    const { data, error } = await supabase
      .from('recipe_ratings_summary')
      .select('*')
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as RecipeRatingStats | null;
  }

  // Delete a rating
  static async deleteRating(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }

  // Add or update a review
  static async addReview(
    userId: string, 
    recipeId: string, 
    comment: string, 
    title?: string,
    rating?: number
  ): Promise<Review> {
    let ratingId: string | undefined;

    // If rating is provided, create/update the rating first
    if (rating !== undefined) {
      const ratingData = await this.rateRecipe(userId, recipeId, rating);
      ratingId = ratingData.id;
    }

    const { data, error } = await supabase
      .from('reviews')
      .upsert({
        user_id: userId,
        recipe_id: recipeId,
        rating_id: ratingId,
        title: title,
        comment: comment
      }, {
        onConflict: 'user_id,recipe_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  }

  // Get user's review for a recipe
  static async getUserReview(userId: string, recipeId: string): Promise<Review | null> {
    // AI-generated recipes don't have reviews in the database
    if (recipeId.startsWith('ai-')) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_reviews_with_profile')
      .select('*')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Review | null;
  }

  // Get all reviews for a recipe
  static async getRecipeReviews(recipeId: string, limit: number = 20): Promise<Review[]> {
    // AI-generated recipes have temporary IDs and don't exist in the database
    // Return empty array to avoid 400 errors
    if (recipeId.startsWith('ai-')) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_reviews_with_profile')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Review[];
  }

  // Update a review
  static async updateReview(
    reviewId: string, 
    updates: { title?: string; comment?: string }
  ): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data as Review;
  }

  // Delete a review
  static async deleteReview(userId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }

  // Get popular recipes based on ratings
  static async getPopularRecipes(limit: number = 20): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('popular_recipes')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data as Recipe[];
  }

  // Get highly rated recipes
  static async getHighlyRatedRecipes(limit: number = 20): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .gte('average_rating', 4.0)
      .gte('rating_count', 5)
      .order('average_rating', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Recipe[];
  }

  // Get user's ratings
  static async getUserRatings(userId: string, limit: number = 50): Promise<(Rating & { recipe: Recipe })[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        recipes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      recipe: item.recipes
    })) as (Rating & { recipe: Recipe })[];
  }

  // Get user's reviews
  static async getUserReviews(userId: string, limit: number = 50): Promise<(Review & { recipe: Recipe })[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        recipes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      recipe: item.recipes
    })) as (Review & { recipe: Recipe })[];
  }

  // Get rating distribution for a recipe
  static async getRatingDistribution(recipeId: string): Promise<{ [key: number]: number }> {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('recipe_id', recipeId);

    if (error) throw error;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (data || []).forEach((rating: any) => {
      distribution[rating.rating as keyof typeof distribution]++;
    });

    return distribution;
  }
}
