import { supabase } from './supabase';

// Pantry types
export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  category_id: string;
  purchase_date?: string;
  expiration_date?: string;
  opened_date?: string;
  storage_location?: string;
  barcode?: string;
  purchase_price?: number;
  store_purchased?: string;
  notes?: string;
  is_running_low: boolean;
  low_stock_threshold: number;
  auto_add_to_shopping: boolean;
  recipe_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PantryCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  storage_location?: string;
  typical_shelf_life_days?: number;
  created_at: string;
  updated_at: string;
}

export interface ExpirationAlert {
  id: string;
  pantry_item_id: string;
  user_id: string;
  expiration_date: string;
  notification_sent: boolean;
  notification_date?: string;
  days_before_expiry: number;
  status: 'fresh' | 'expiring_soon' | 'expired' | 'consumed';
  consumed_date?: string;
  waste_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PantryStats {
  total_items: number;
  expiring_soon: number;
  expired_items: number;
  low_stock_items: number;
  total_value: number;
  categories_count: number;
}

export class PantryService {
  /**
   * Get all pantry items for a user
   */
  static async getPantryItems(userId: string, categoryId?: string): Promise<PantryItem[]> {
    try {
      let query = supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PantryItem[];

    } catch (error) {
      console.error('Failed to get pantry items:', error);
      throw error;
    }
  }

  /**
   * Add item to pantry
   */
  static async addPantryItem(itemData: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>): Promise<PantryItem> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert({
          ...itemData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as PantryItem;

    } catch (error) {
      console.error('Failed to add pantry item:', error);
      throw error;
    }
  }

  /**
   * Update pantry item
   */
  static async updatePantryItem(itemId: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as PantryItem;

    } catch (error) {
      console.error('Failed to update pantry item:', error);
      throw error;
    }
  }

  /**
   * Delete pantry item
   */
  static async deletePantryItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to delete pantry item:', error);
      throw error;
    }
  }

  /**
   * Get pantry categories
   */
  static async getPantryCategories(): Promise<PantryCategory[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as PantryCategory[];

    } catch (error) {
      console.error('Failed to get pantry categories:', error);
      throw error;
    }
  }

  /**
   * Get expiring items
   */
  static async getExpiringItems(userId: string, daysAhead = 7): Promise<PantryItem[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', futureDate.toISOString().split('T')[0])
        .gt('quantity', 0)
        .order('expiration_date');

      if (error) throw error;
      return data as PantryItem[];

    } catch (error) {
      console.error('Failed to get expiring items:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(userId: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_running_low', true)
        .order('quantity');

      if (error) throw error;
      return data as PantryItem[];

    } catch (error) {
      console.error('Failed to get low stock items:', error);
      throw error;
    }
  }

  /**
   * Get pantry statistics
   */
  static async getPantryStats(userId: string): Promise<PantryStats> {
    try {
      // Get all pantry items
      const items = await this.getPantryItems(userId);
      
      // Get expiring items (next 7 days)
      const expiringItems = await this.getExpiringItems(userId, 7);
      
      // Get low stock items
      const lowStockItems = await this.getLowStockItems(userId);

      // Calculate expired items
      const today = new Date().toISOString().split('T')[0];
      const expiredItems = items.filter(item => 
        item.expiration_date && item.expiration_date < today && item.quantity > 0
      );

      // Calculate total value
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.purchase_price || 0) * item.quantity;
      }, 0);

      // Get unique categories
      const uniqueCategories = new Set(items.map(item => item.category_id));

      return {
        total_items: items.length,
        expiring_soon: expiringItems.length,
        expired_items: expiredItems.length,
        low_stock_items: lowStockItems.length,
        total_value: totalValue,
        categories_count: uniqueCategories.size
      };

    } catch (error) {
      console.error('Failed to get pantry stats:', error);
      throw error;
    }
  }

  /**
   * Use pantry item (reduce quantity)
   */
  static async usePantryItem(itemId: string, quantityUsed: number, recipeId?: string): Promise<PantryItem> {
    try {
      // Get current item
      const { data: currentItem, error: fetchError } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = Math.max(0, currentItem.quantity - quantityUsed);

      // Update item quantity
      const updatedItem = await this.updatePantryItem(itemId, {
        quantity: newQuantity
      });

      // Record usage history
      await supabase
        .from('pantry_usage_history')
        .insert({
          pantry_item_id: itemId,
          user_id: currentItem.user_id,
          recipe_id: recipeId,
          quantity_used: quantityUsed,
          unit: currentItem.unit,
          remaining_quantity: newQuantity,
          usage_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      return updatedItem;

    } catch (error) {
      console.error('Failed to use pantry item:', error);
      throw error;
    }
  }

  /**
   * Search pantry items
   */
  static async searchPantryItems(userId: string, query: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('name');

      if (error) throw error;
      return data as PantryItem[];

    } catch (error) {
      console.error('Failed to search pantry items:', error);
      throw error;
    }
  }

  /**
   * Get items by storage location
   */
  static async getItemsByLocation(userId: string, location: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .eq('storage_location', location)
        .order('name');

      if (error) throw error;
      return data as PantryItem[];

    } catch (error) {
      console.error('Failed to get items by location:', error);
      throw error;
    }
  }

  /**
   * Mark item as consumed
   */
  static async markItemAsConsumed(itemId: string): Promise<void> {
    try {
      await this.updatePantryItem(itemId, {
        quantity: 0
      });

      // Update expiration tracking
      await supabase
        .from('expiration_tracking')
        .update({
          status: 'consumed',
          consumed_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('pantry_item_id', itemId);

    } catch (error) {
      console.error('Failed to mark item as consumed:', error);
      throw error;
    }
  }

  /**
   * Get shopping suggestions based on pantry
   */
  static async getShoppingSuggestions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_shopping_suggestions')
        .select(`
          *,
          pantry_categories(name, icon, color)
        `)
        .eq('user_id', userId)
        .eq('is_added_to_shopping', false)
        .gt('expires_at', new Date().toISOString())
        .order('priority')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get shopping suggestions:', error);
      throw error;
    }
  }
}
