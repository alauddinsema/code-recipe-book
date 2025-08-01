import { supabase } from './supabase';
import type { Recipe } from '../types';

// Meal Planning types
export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_template: boolean;
  template_id?: string;
  total_recipes: number;
  estimated_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface MealPlanRecipe {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  recipe?: Recipe;
}

export interface WeeklySchedule {
  id: string;
  meal_plan_id: string;
  week_start_date: string;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id?: string;
  servings: number;
  is_completed: boolean;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  recipe?: Recipe;
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  duration_days: number;
  total_recipes: number;
  estimated_cost?: number;
  dietary_tags: string[];
  is_public: boolean;
  created_by: string;
  usage_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface MealPlanStats {
  total_plans: number;
  active_plans: number;
  completed_meals: number;
  favorite_meal_type: string;
  most_used_recipes: Recipe[];
  weekly_completion_rate: number;
}

export class MealPlanningService {
  /**
   * Get user's meal plans
   */
  static async getMealPlans(userId: string, includeTemplates = false): Promise<MealPlan[]> {
    try {
      let query = supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!includeTemplates) {
        query = query.eq('is_template', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MealPlan[];

    } catch (error) {
      console.error('Failed to get meal plans:', error);
      throw error;
    }
  }

  /**
   * Create new meal plan
   */
  static async createMealPlan(planData: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<MealPlan> {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as MealPlan;

    } catch (error) {
      console.error('Failed to create meal plan:', error);
      throw error;
    }
  }

  /**
   * Get weekly schedule for a meal plan
   */
  static async getWeeklySchedule(mealPlanId: string, weekStartDate: string): Promise<WeeklySchedule[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_schedules')
        .select(`
          *,
          recipes(*)
        `)
        .eq('meal_plan_id', mealPlanId)
        .eq('week_start_date', weekStartDate)
        .order('day_of_week')
        .order('meal_type');

      if (error) throw error;
      return data as WeeklySchedule[];

    } catch (error) {
      console.error('Failed to get weekly schedule:', error);
      throw error;
    }
  }

  /**
   * Add recipe to meal plan
   */
  static async addRecipeToMealPlan(
    mealPlanId: string,
    recipeId: string,
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    servings = 1
  ): Promise<MealPlanRecipe> {
    try {
      const { data, error } = await supabase
        .from('meal_plan_recipes')
        .insert({
          meal_plan_id: mealPlanId,
          recipe_id: recipeId,
          day_of_week: dayOfWeek,
          meal_type: mealType,
          servings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as MealPlanRecipe;

    } catch (error) {
      console.error('Failed to add recipe to meal plan:', error);
      throw error;
    }
  }

  /**
   * Update meal plan recipe
   */
  static async updateMealPlanRecipe(
    mealPlanRecipeId: string,
    updates: Partial<MealPlanRecipe>
  ): Promise<MealPlanRecipe> {
    try {
      const { data, error } = await supabase
        .from('meal_plan_recipes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mealPlanRecipeId)
        .select()
        .single();

      if (error) throw error;
      return data as MealPlanRecipe;

    } catch (error) {
      console.error('Failed to update meal plan recipe:', error);
      throw error;
    }
  }

  /**
   * Remove recipe from meal plan
   */
  static async removeRecipeFromMealPlan(mealPlanRecipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meal_plan_recipes')
        .delete()
        .eq('id', mealPlanRecipeId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to remove recipe from meal plan:', error);
      throw error;
    }
  }

  /**
   * Get meal plan recipes with full recipe details
   */
  static async getMealPlanRecipes(mealPlanId: string): Promise<MealPlanRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('meal_plan_recipes')
        .select(`
          *,
          recipes(*)
        `)
        .eq('meal_plan_id', mealPlanId)
        .order('day_of_week')
        .order('meal_type');

      if (error) throw error;
      return data as MealPlanRecipe[];

    } catch (error) {
      console.error('Failed to get meal plan recipes:', error);
      throw error;
    }
  }

  /**
   * Generate shopping list from meal plan
   */
  static async generateShoppingListFromMealPlan(mealPlanId: string): Promise<any[]> {
    try {
      // Get all recipes in the meal plan
      const mealPlanRecipes = await this.getMealPlanRecipes(mealPlanId);
      
      // Aggregate ingredients by recipe servings
      const ingredientMap = new Map<string, { quantity: number; unit: string; recipes: string[] }>();

      mealPlanRecipes.forEach(mealPlanRecipe => {
        if (mealPlanRecipe.recipe) {
          const recipe = mealPlanRecipe.recipe;
          const servingMultiplier = mealPlanRecipe.servings / (recipe.servings || 1);

          recipe.ingredients.forEach(ingredient => {
            // Simple ingredient parsing (could be enhanced with AI)
            const ingredientKey = ingredient.toLowerCase().trim();
            
            if (ingredientMap.has(ingredientKey)) {
              const existing = ingredientMap.get(ingredientKey)!;
              existing.recipes.push(recipe.title);
            } else {
              ingredientMap.set(ingredientKey, {
                quantity: servingMultiplier,
                unit: 'serving',
                recipes: [recipe.title]
              });
            }
          });
        }
      });

      // Convert to shopping list format
      return Array.from(ingredientMap.entries()).map(([ingredient, data]) => ({
        ingredient,
        quantity: data.quantity,
        unit: data.unit,
        recipes: data.recipes,
        checked: false
      }));

    } catch (error) {
      console.error('Failed to generate shopping list:', error);
      throw error;
    }
  }

  /**
   * Get meal plan templates
   */
  static async getMealPlanTemplates(category?: string): Promise<MealPlanTemplate[]> {
    try {
      let query = supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MealPlanTemplate[];

    } catch (error) {
      console.error('Failed to get meal plan templates:', error);
      throw error;
    }
  }

  /**
   * Apply template to create new meal plan
   */
  static async applyTemplate(templateId: string, userId: string, startDate: string): Promise<MealPlan> {
    try {
      // Get template details
      const { data: template, error: templateError } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + template.duration_days - 1);

      // Create meal plan from template
      const mealPlan = await this.createMealPlan({
        user_id: userId,
        name: `${template.name} - ${start.toLocaleDateString()}`,
        description: template.description,
        start_date: startDate,
        end_date: end.toISOString().split('T')[0],
        is_template: false,
        template_id: templateId,
        total_recipes: template.total_recipes,
        estimated_cost: template.estimated_cost
      });

      // Get template recipes and add to meal plan
      const { data: templateRecipes, error: recipesError } = await supabase
        .from('meal_plan_template_recipes')
        .select('*')
        .eq('template_id', templateId);

      if (recipesError) throw recipesError;

      // Add recipes to the new meal plan
      for (const templateRecipe of templateRecipes) {
        await this.addRecipeToMealPlan(
          mealPlan.id,
          templateRecipe.recipe_id,
          templateRecipe.day_of_week,
          templateRecipe.meal_type,
          templateRecipe.servings
        );
      }

      // Update template usage count
      await supabase
        .from('meal_plan_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      return mealPlan;

    } catch (error) {
      console.error('Failed to apply template:', error);
      throw error;
    }
  }

  /**
   * Get meal planning statistics
   */
  static async getMealPlanStats(userId: string): Promise<MealPlanStats> {
    try {
      const plans = await this.getMealPlans(userId);
      
      // Calculate basic stats
      const totalPlans = plans.length;
      const activePlans = plans.filter(plan => {
        const endDate = new Date(plan.end_date);
        return endDate >= new Date();
      }).length;

      return {
        total_plans: totalPlans,
        active_plans: activePlans,
        completed_meals: 0, // Would need to query weekly_schedules
        favorite_meal_type: 'dinner', // Would need to analyze meal_plan_recipes
        most_used_recipes: [], // Would need to analyze recipe usage
        weekly_completion_rate: 0.85 // Would need to calculate from completed meals
      };

    } catch (error) {
      console.error('Failed to get meal plan stats:', error);
      throw error;
    }
  }

  /**
   * Mark meal as completed
   */
  static async markMealCompleted(scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('weekly_schedules')
        .update({
          is_completed: true,
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to mark meal as completed:', error);
      throw error;
    }
  }

  /**
   * Get current week's meal plan
   */
  static async getCurrentWeekMealPlan(userId: string): Promise<{ mealPlan: MealPlan | null; schedule: WeeklySchedule[] }> {
    try {
      // Get current week start (Sunday)
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Find active meal plan for current week
      const { data: activePlans, error: plansError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_template', false)
        .lte('start_date', weekStartStr)
        .gte('end_date', weekStartStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (plansError) throw plansError;

      const mealPlan = activePlans?.[0] || null;
      let schedule: WeeklySchedule[] = [];

      if (mealPlan) {
        schedule = await this.getWeeklySchedule(mealPlan.id, weekStartStr);
      }

      return { mealPlan, schedule };

    } catch (error) {
      console.error('Failed to get current week meal plan:', error);
      throw error;
    }
  }
}
