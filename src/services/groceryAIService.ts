import axios from 'axios';
import type {
  IngredientAnalysis,
  GroceryItem,
  GroceryList,
  GroceryCategory,
  PriceEstimate
} from '../types/grocery';
import {
  DEFAULT_GROCERY_CATEGORIES,
  INGREDIENT_CATEGORY_MAPPING,
  UNIT_CONVERSIONS
} from '../types/grocery';
import type { Recipe } from '../types';

export class GroceryAIService {
  private apiBaseUrl: string;

  constructor() {
    // Use Netlify functions for AI calls (same pattern as existing services)
    this.apiBaseUrl = import.meta.env.DEV
      ? 'https://recipebook-gpt.netlify.app/.netlify/functions'
      : '/.netlify/functions';
  }

  /**
   * Analyze ingredients from recipes and extract grocery items
   */
  async analyzeIngredientsFromRecipes(recipes: Recipe[]): Promise<IngredientAnalysis[]> {
    try {
      const allIngredients = recipes.flatMap(recipe =>
        recipe.ingredients.map(ingredient => ({
          text: ingredient,
          recipe_id: recipe.id,
          recipe_title: recipe.title
        }))
      );

      const response = await axios.post(`${this.apiBaseUrl}/analyze-ingredients`, {
        ingredients: allIngredients
      }, {
        timeout: 30000
      });

      return this.parseIngredientAnalysis(response.data.analysis, allIngredients);
    } catch (error) {
      console.error('Error analyzing ingredients:', error);
      // Fallback to local parsing if AI service fails
      return allIngredients.map(ing => this.fallbackIngredientParsing(ing.text));
    }
  }

  /**
   * Generate optimized grocery list from multiple recipes
   */
  async generateGroceryList(
    recipes: Recipe[], 
    servingAdjustments?: Record<string, number>
  ): Promise<Omit<GroceryList, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {
    try {
      // Analyze ingredients
      const analyses = await this.analyzeIngredientsFromRecipes(recipes);
      
      // Consolidate similar ingredients
      const consolidatedItems = this.consolidateIngredients(analyses, servingAdjustments);
      
      // Generate grocery items
      const groceryItems = consolidatedItems.map(this.createGroceryItem);
      
      // Estimate total price
      const totalPrice = await this.estimateTotalPrice(groceryItems);

      return {
        title: this.generateListTitle(recipes),
        description: this.generateListDescription(recipes),
        items: groceryItems,
        recipe_ids: recipes.map(r => r.id),
        total_estimated_price: totalPrice,
        is_shared: false,
        status: 'draft'
      };
    } catch (error) {
      console.error('Error generating grocery list:', error);
      throw new Error('Failed to generate grocery list');
    }
  }

  /**
   * Get price estimates for grocery items
   */
  async getPriceEstimates(items: string[]): Promise<PriceEstimate[]> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/estimate-prices`, {
        items
      }, {
        timeout: 30000
      });

      return this.parsePriceEstimates(response.data.estimates, items);
    } catch (error) {
      console.error('Error getting price estimates:', error);
      // Return fallback estimates
      return items.map(item => ({
        item_name: item,
        estimated_price: 3.99, // Default estimate
        price_range: { min: 2.99, max: 5.99 },
        last_updated: new Date().toISOString()
      }));
    }
  }

  /**
   * Optimize grocery list for shopping efficiency
   */
  async optimizeShoppingList(groceryList: GroceryList): Promise<GroceryList> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/optimize-shopping`, {
        groceryList
      }, {
        timeout: 30000
      });

      const optimizations = this.parseShoppingOptimizations(response.data.optimizations);

      return {
        ...groceryList,
        items: this.applyShoppingOptimizations(groceryList.items, optimizations)
      };
    } catch (error) {
      console.error('Error optimizing shopping list:', error);
      return groceryList; // Return original if optimization fails
    }
  }

  /**
   * Build ingredient analysis prompt
   */
  private buildIngredientAnalysisPrompt(ingredients: Array<{text: string, recipe_id: string, recipe_title: string}>): string {
    const categories = DEFAULT_GROCERY_CATEGORIES.map(cat => `${cat.name} (${cat.icon})`).join(', ');
    
    return `
You are a grocery shopping assistant. Analyze these recipe ingredients and extract structured grocery information.

INGREDIENTS TO ANALYZE:
${ingredients.map((ing, i) => `${i + 1}. "${ing.text}" (from ${ing.recipe_title})`).join('\n')}

AVAILABLE CATEGORIES: ${categories}

For each ingredient, provide:
1. Parsed name (clean ingredient name without quantities)
2. Quantity (number)
3. Unit (standardized unit like cups, lbs, pieces, etc.)
4. Category (from the available categories)
5. Confidence (0-1 how confident you are in the parsing)

Return ONLY a JSON array with this exact structure:
[
  {
    "original_text": "2 cups all-purpose flour",
    "parsed_name": "all-purpose flour",
    "quantity": 2,
    "unit": "cups",
    "category": "Baking",
    "confidence": 0.95
  }
]

Rules:
- Always return valid JSON
- Use singular form for parsed_name
- Standardize units (tbsp, tsp, cups, lbs, oz, pieces, etc.)
- Choose the most appropriate category
- If quantity is unclear, use 1 and unit "piece"
- Confidence should reflect parsing certainty
`;
  }

  /**
   * Build price estimation prompt
   */
  private buildPriceEstimationPrompt(items: string[]): string {
    return `
You are a grocery price estimation expert. Provide realistic price estimates for these grocery items in USD.

ITEMS TO PRICE:
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Return ONLY a JSON array with this exact structure:
[
  {
    "item_name": "all-purpose flour",
    "estimated_price": 3.49,
    "price_range": {"min": 2.99, "max": 4.99},
    "store_suggestions": ["Walmart", "Target", "Kroger"]
  }
]

Rules:
- Prices should be realistic for average US grocery stores
- Include price range with min/max
- Suggest 2-3 common stores where item is available
- Consider typical package sizes (e.g., flour comes in 5lb bags)
- Return valid JSON only
`;
  }

  /**
   * Build shopping optimization prompt
   */
  private buildShoppingOptimizationPrompt(groceryList: GroceryList): string {
    const itemsByCategory = groceryList.items.reduce((acc, item) => {
      const category = item.category.name;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item.name);
      return acc;
    }, {} as Record<string, string[]>);

    return `
You are a shopping efficiency expert. Optimize this grocery list for efficient store navigation.

CURRENT LIST BY CATEGORY:
${Object.entries(itemsByCategory).map(([cat, items]) => 
  `${cat}: ${items.join(', ')}`
).join('\n')}

Provide optimization suggestions:
1. Optimal shopping order (which categories to visit first)
2. Items that can be substituted or combined
3. Bulk buying opportunities
4. Items to buy last (perishables, frozen)

Return ONLY a JSON object:
{
  "shopping_order": ["Produce", "Meat & Seafood", "Dairy & Eggs", "Frozen"],
  "substitutions": [{"original": "item1", "substitute": "item2", "reason": "cheaper/better"}],
  "bulk_opportunities": ["item1", "item2"],
  "buy_last": ["item1", "item2"]
}
`;
  }

  /**
   * Parse ingredient analysis response
   */
  private parseIngredientAnalysis(
    response: any,
    originalIngredients: Array<{text: string, recipe_id: string, recipe_title: string}>
  ): IngredientAnalysis[] {
    try {
      // If response is already parsed JSON from API
      if (Array.isArray(response)) {
        return response.map((item: any, index: number) => ({
          ...item,
          recipe_id: originalIngredients[index]?.recipe_id,
          recipe_title: originalIngredients[index]?.recipe_title
        }));
      }

      // If response is a string, try to parse it
      if (typeof response === 'string') {
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanResponse);

        return parsed.map((item: any, index: number) => ({
          ...item,
          recipe_id: originalIngredients[index]?.recipe_id,
          recipe_title: originalIngredients[index]?.recipe_title
        }));
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error parsing ingredient analysis:', error);
      // Fallback parsing
      return originalIngredients.map(ing => this.fallbackIngredientParsing(ing.text));
    }
  }

  /**
   * Parse price estimates response
   */
  private parsePriceEstimates(response: any, items: string[]): PriceEstimate[] {
    try {
      // If response is already parsed JSON from API
      if (Array.isArray(response)) {
        return response.map((estimate: any) => ({
          ...estimate,
          last_updated: new Date().toISOString()
        }));
      }

      // If response is a string, try to parse it
      if (typeof response === 'string') {
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanResponse);

        return parsed.map((estimate: any) => ({
          ...estimate,
          last_updated: new Date().toISOString()
        }));
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error parsing price estimates:', error);
      // Return fallback estimates
      return items.map(item => ({
        item_name: item,
        estimated_price: 3.99,
        price_range: { min: 2.99, max: 5.99 },
        last_updated: new Date().toISOString()
      }));
    }
  }

  /**
   * Parse shopping optimizations response
   */
  private parseShoppingOptimizations(response: any): any {
    try {
      // If response is already parsed JSON from API
      if (typeof response === 'object' && response !== null) {
        return response;
      }

      // If response is a string, try to parse it
      if (typeof response === 'string') {
        const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanResponse);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error parsing shopping optimizations:', error);
      return {
        shopping_order: [],
        substitutions: [],
        bulk_opportunities: [],
        buy_last: []
      };
    }
  }

  /**
   * Consolidate similar ingredients
   */
  private consolidateIngredients(
    analyses: IngredientAnalysis[], 
    servingAdjustments?: Record<string, number>
  ): IngredientAnalysis[] {
    const consolidated = new Map<string, IngredientAnalysis>();

    analyses.forEach(analysis => {
      const key = `${analysis.parsed_name.toLowerCase()}-${analysis.category.name}`;
      const adjustment = servingAdjustments?.[analysis.recipe_id || ''] || 1;
      const adjustedQuantity = analysis.quantity * adjustment;

      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        // Convert to common unit and add quantities
        const combinedQuantity = this.combineQuantities(
          existing.quantity, existing.unit,
          adjustedQuantity, analysis.unit
        );
        
        consolidated.set(key, {
          ...existing,
          quantity: combinedQuantity.quantity,
          unit: combinedQuantity.unit,
          original_text: `${existing.original_text} + ${analysis.original_text}`
        });
      } else {
        consolidated.set(key, {
          ...analysis,
          quantity: adjustedQuantity
        });
      }
    });

    return Array.from(consolidated.values());
  }

  /**
   * Combine quantities with unit conversion
   */
  private combineQuantities(
    qty1: number, unit1: string,
    qty2: number, unit2: string
  ): { quantity: number; unit: string } {
    // If units are the same, just add
    if (unit1.toLowerCase() === unit2.toLowerCase()) {
      return { quantity: qty1 + qty2, unit: unit1 };
    }

    // Try to convert to common base unit
    const conversion1 = UNIT_CONVERSIONS[unit1.toLowerCase()];
    const conversion2 = UNIT_CONVERSIONS[unit2.toLowerCase()];

    if (conversion1 && conversion2 && conversion1.base_unit === conversion2.base_unit) {
      const baseQty1 = qty1 * conversion1.factor;
      const baseQty2 = qty2 * conversion2.factor;
      const totalBase = baseQty1 + baseQty2;
      
      // Convert back to the first unit
      return {
        quantity: totalBase / conversion1.factor,
        unit: unit1
      };
    }

    // If no conversion possible, keep separate (this shouldn't happen in consolidation)
    return { quantity: qty1 + qty2, unit: `${unit1}+${unit2}` };
  }

  /**
   * Create grocery item from analysis
   */
  private createGroceryItem = (analysis: IngredientAnalysis): Omit<GroceryItem, 'id' | 'created_at' | 'updated_at'> => {
    const category = DEFAULT_GROCERY_CATEGORIES.find(cat => 
      cat.name === analysis.category.name
    ) || DEFAULT_GROCERY_CATEGORIES.find(cat => cat.id === 'other')!;

    return {
      name: analysis.parsed_name,
      quantity: analysis.quantity,
      unit: analysis.unit,
      category,
      is_checked: false,
      recipe_id: analysis.recipe_id,
      recipe_title: analysis.recipe_title
    };
  };

  /**
   * Estimate total price for grocery items
   */
  private async estimateTotalPrice(items: Omit<GroceryItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<number> {
    try {
      const itemNames = items.map(item => item.name);
      const estimates = await this.getPriceEstimates(itemNames);
      
      return estimates.reduce((total, estimate) => total + estimate.estimated_price, 0);
    } catch (error) {
      console.error('Error estimating total price:', error);
      return items.length * 3.99; // Fallback estimate
    }
  }

  /**
   * Generate grocery list title
   */
  private generateListTitle(recipes: Recipe[]): string {
    if (recipes.length === 1) {
      return `Grocery List for ${recipes[0].title}`;
    } else if (recipes.length <= 3) {
      return `Grocery List for ${recipes.map(r => r.title).join(', ')}`;
    } else {
      return `Grocery List for ${recipes.length} Recipes`;
    }
  }

  /**
   * Generate grocery list description
   */
  private generateListDescription(recipes: Recipe[]): string {
    const categories = [...new Set(recipes.map(r => r.category))];
    return `Shopping list for ${recipes.length} recipe${recipes.length > 1 ? 's' : ''} including ${categories.join(', ')} dishes.`;
  }

  /**
   * Apply shopping optimizations
   */
  private applyShoppingOptimizations(items: GroceryItem[], optimizations: any): GroceryItem[] {
    // This would apply the AI suggestions to reorder items, add notes, etc.
    // For now, return items as-is
    return items;
  }

  /**
   * Fallback ingredient parsing when AI fails
   */
  private fallbackIngredientParsing(text: string): IngredientAnalysis {
    // Simple regex-based parsing as fallback
    const match = text.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s*(.+)$/);
    
    if (match) {
      const [, quantity, unit, name] = match;
      const categoryId = this.guessCategory(name);
      const category = DEFAULT_GROCERY_CATEGORIES.find(cat => cat.id === categoryId) 
        || DEFAULT_GROCERY_CATEGORIES.find(cat => cat.id === 'other')!;

      return {
        original_text: text,
        parsed_name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit || 'piece',
        category,
        confidence: 0.5
      };
    }

    // Ultimate fallback
    const categoryId = this.guessCategory(text);
    const category = DEFAULT_GROCERY_CATEGORIES.find(cat => cat.id === categoryId) 
      || DEFAULT_GROCERY_CATEGORIES.find(cat => cat.id === 'other')!;

    return {
      original_text: text,
      parsed_name: text,
      quantity: 1,
      unit: 'piece',
      category,
      confidence: 0.3
    };
  }

  /**
   * Guess category from ingredient name
   */
  private guessCategory(ingredient: string): string {
    const lowerIngredient = ingredient.toLowerCase();
    
    for (const [key, category] of Object.entries(INGREDIENT_CATEGORY_MAPPING)) {
      if (lowerIngredient.includes(key)) {
        return category;
      }
    }
    
    return 'other';
  }
}

// Export singleton instance
export const groceryAIService = new GroceryAIService();
