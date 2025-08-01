import { supabase } from './supabase';
import { groceryAIService } from './groceryAIService';
import type {
  GroceryList,
  GroceryItem,
  ShoppingSession
} from '../types/grocery';
import type { Recipe } from '../types';

export class GroceryListService {
  /**
   * Create a new grocery list from recipes
   */
  static async createGroceryListFromRecipes(
    recipes: Recipe[], 
    userId: string,
    servingAdjustments?: Record<string, number>
  ): Promise<GroceryList> {
    try {
      // Generate grocery list using AI
      const groceryListData = await groceryAIService.generateGroceryList(recipes, servingAdjustments);
      
      // Save to database
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          ...groceryListData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Save grocery items
      const itemsWithListId = groceryListData.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        grocery_list_id: data.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('grocery_items')
        .insert(itemsWithListId);

      if (itemsError) throw itemsError;

      return {
        ...data,
        items: itemsWithListId
      };
    } catch (error) {
      console.error('Error creating grocery list:', error);
      throw new Error('Failed to create grocery list');
    }
  }

  /**
   * Get all grocery lists for a user
   */
  static async getUserGroceryLists(userId: string): Promise<GroceryList[]> {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          grocery_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(list => ({
        ...list,
        items: list.grocery_items || []
      }));
    } catch (error) {
      console.error('Error fetching grocery lists:', error);
      throw new Error('Failed to fetch grocery lists');
    }
  }

  /**
   * Get a specific grocery list by ID
   */
  static async getGroceryListById(listId: string, userId: string): Promise<GroceryList | null> {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          grocery_items (*)
        `)
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        items: data.grocery_items || []
      };
    } catch (error) {
      console.error('Error fetching grocery list:', error);
      throw new Error('Failed to fetch grocery list');
    }
  }

  /**
   * Update grocery list
   */
  static async updateGroceryList(
    listId: string, 
    userId: string, 
    updates: Partial<Omit<GroceryList, 'id' | 'user_id' | 'created_at'>>
  ): Promise<GroceryList> {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', listId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Get updated items
      const { data: items, error: itemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', listId);

      if (itemsError) throw itemsError;

      return {
        ...data,
        items: items || []
      };
    } catch (error) {
      console.error('Error updating grocery list:', error);
      throw new Error('Failed to update grocery list');
    }
  }

  /**
   * Delete grocery list
   */
  static async deleteGroceryList(listId: string, userId: string): Promise<void> {
    try {
      // Delete items first (cascade should handle this, but being explicit)
      await supabase
        .from('grocery_items')
        .delete()
        .eq('grocery_list_id', listId);

      // Delete the list
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      throw new Error('Failed to delete grocery list');
    }
  }

  /**
   * Update grocery item
   */
  static async updateGroceryItem(
    itemId: string, 
    updates: Partial<Omit<GroceryItem, 'id' | 'created_at'>>
  ): Promise<GroceryItem> {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating grocery item:', error);
      throw new Error('Failed to update grocery item');
    }
  }

  /**
   * Add item to grocery list
   */
  static async addItemToGroceryList(
    listId: string, 
    item: Omit<GroceryItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<GroceryItem> {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({
          ...item,
          id: crypto.randomUUID(),
          grocery_list_id: listId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding grocery item:', error);
      throw new Error('Failed to add grocery item');
    }
  }

  /**
   * Remove item from grocery list
   */
  static async removeItemFromGroceryList(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing grocery item:', error);
      throw new Error('Failed to remove grocery item');
    }
  }

  /**
   * Toggle item checked status
   */
  static async toggleItemChecked(itemId: string, isChecked: boolean): Promise<GroceryItem> {
    return this.updateGroceryItem(itemId, { is_checked: isChecked });
  }

  /**
   * Share grocery list with other users
   */
  static async shareGroceryList(
    listId: string, 
    userId: string, 
    shareWithEmails: string[]
  ): Promise<GroceryList> {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .update({
          is_shared: true,
          shared_with: shareWithEmails,
          updated_at: new Date().toISOString()
        })
        .eq('id', listId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Get items
      const { data: items, error: itemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', listId);

      if (itemsError) throw itemsError;

      return {
        ...data,
        items: items || []
      };
    } catch (error) {
      console.error('Error sharing grocery list:', error);
      throw new Error('Failed to share grocery list');
    }
  }

  /**
   * Get shared grocery lists
   */
  static async getSharedGroceryLists(userEmail: string): Promise<GroceryList[]> {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          grocery_items (*)
        `)
        .eq('is_shared', true)
        .contains('shared_with', [userEmail])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(list => ({
        ...list,
        items: list.grocery_items || []
      }));
    } catch (error) {
      console.error('Error fetching shared grocery lists:', error);
      throw new Error('Failed to fetch shared grocery lists');
    }
  }

  /**
   * Start shopping session
   */
  static async startShoppingSession(listId: string, userId: string): Promise<ShoppingSession> {
    try {
      // Update list status to shopping
      await this.updateGroceryList(listId, userId, { status: 'shopping' });

      // Create shopping session
      const { data, error } = await supabase
        .from('shopping_sessions')
        .insert({
          id: crypto.randomUUID(),
          grocery_list_id: listId,
          started_at: new Date().toISOString(),
          items_checked: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting shopping session:', error);
      throw new Error('Failed to start shopping session');
    }
  }

  /**
   * Complete shopping session
   */
  static async completeShoppingSession(
    sessionId: string, 
    listId: string, 
    userId: string,
    totalSpent?: number,
    storeVisited?: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update shopping session
      await supabase
        .from('shopping_sessions')
        .update({
          completed_at: new Date().toISOString(),
          total_spent: totalSpent,
          store_visited: storeVisited,
          notes
        })
        .eq('id', sessionId);

      // Update list status to completed
      await this.updateGroceryList(listId, userId, { 
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing shopping session:', error);
      throw new Error('Failed to complete shopping session');
    }
  }

  /**
   * Optimize grocery list for shopping
   */
  static async optimizeGroceryList(listId: string, userId: string): Promise<GroceryList> {
    try {
      const groceryList = await this.getGroceryListById(listId, userId);
      if (!groceryList) throw new Error('Grocery list not found');

      const optimizedList = await groceryAIService.optimizeShoppingList(groceryList);
      
      return await this.updateGroceryList(listId, userId, {
        items: optimizedList.items,
        title: optimizedList.title,
        description: optimizedList.description
      });
    } catch (error) {
      console.error('Error optimizing grocery list:', error);
      throw new Error('Failed to optimize grocery list');
    }
  }
}
