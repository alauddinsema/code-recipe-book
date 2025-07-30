import type { NutritionInfo, IngredientNutrition } from '../types';

// Common nutrition data per 100g for popular ingredients
const NUTRITION_DATABASE: Record<string, NutritionInfo> = {
  // Proteins
  'chicken breast': { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0, sodium: 74 },
  'salmon': { calories: 208, protein: 22, carbohydrates: 0, fat: 12, fiber: 0, sodium: 59 },
  'beef': { calories: 250, protein: 26, carbohydrates: 0, fat: 15, fiber: 0, sodium: 72 },
  'eggs': { calories: 155, protein: 13, carbohydrates: 1.1, fat: 11, fiber: 0, sodium: 124 },
  'tofu': { calories: 76, protein: 8, carbohydrates: 1.9, fat: 4.8, fiber: 0.3, sodium: 7 },
  
  // Grains & Starches
  'rice': { calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4, sodium: 1 },
  'pasta': { calories: 131, protein: 5, carbohydrates: 25, fat: 1.1, fiber: 1.8, sodium: 6 },
  'bread': { calories: 265, protein: 9, carbohydrates: 49, fat: 3.2, fiber: 2.7, sodium: 491 },
  'potato': { calories: 77, protein: 2, carbohydrates: 17, fat: 0.1, fiber: 2.2, sodium: 6 },
  'flour': { calories: 364, protein: 10, carbohydrates: 76, fat: 1, fiber: 2.7, sodium: 2 },
  
  // Vegetables
  'tomato': { calories: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2, sodium: 5 },
  'onion': { calories: 40, protein: 1.1, carbohydrates: 9.3, fat: 0.1, fiber: 1.7, sodium: 4 },
  'carrot': { calories: 41, protein: 0.9, carbohydrates: 9.6, fat: 0.2, fiber: 2.8, sodium: 69 },
  'broccoli': { calories: 34, protein: 2.8, carbohydrates: 7, fat: 0.4, fiber: 2.6, sodium: 33 },
  'spinach': { calories: 23, protein: 2.9, carbohydrates: 3.6, fat: 0.4, fiber: 2.2, sodium: 79 },
  'bell pepper': { calories: 31, protein: 1, carbohydrates: 7, fat: 0.3, fiber: 2.5, sodium: 4 },
  'mushroom': { calories: 22, protein: 3.1, carbohydrates: 3.3, fat: 0.3, fiber: 1, sodium: 5 },
  
  // Fruits
  'apple': { calories: 52, protein: 0.3, carbohydrates: 14, fat: 0.2, fiber: 2.4, sodium: 1 },
  'banana': { calories: 89, protein: 1.1, carbohydrates: 23, fat: 0.3, fiber: 2.6, sodium: 1 },
  'orange': { calories: 47, protein: 0.9, carbohydrates: 12, fat: 0.1, fiber: 2.4, sodium: 0 },
  'lemon': { calories: 29, protein: 1.1, carbohydrates: 9, fat: 0.3, fiber: 2.8, sodium: 2 },
  
  // Dairy
  'milk': { calories: 42, protein: 3.4, carbohydrates: 5, fat: 1, fiber: 0, sodium: 44 },
  'cheese': { calories: 113, protein: 7, carbohydrates: 1, fat: 9, fiber: 0, sodium: 621 },
  'butter': { calories: 717, protein: 0.9, carbohydrates: 0.1, fat: 81, fiber: 0, sodium: 11 },
  'yogurt': { calories: 59, protein: 10, carbohydrates: 3.6, fat: 0.4, fiber: 0, sodium: 36 },
  
  // Oils & Fats
  'olive oil': { calories: 884, protein: 0, carbohydrates: 0, fat: 100, fiber: 0, sodium: 2 },
  'coconut oil': { calories: 862, protein: 0, carbohydrates: 0, fat: 100, fiber: 0, sodium: 0 },
  
  // Nuts & Seeds
  'almonds': { calories: 579, protein: 21, carbohydrates: 22, fat: 50, fiber: 12, sodium: 1 },
  'walnuts': { calories: 654, protein: 15, carbohydrates: 14, fat: 65, fiber: 7, sodium: 2 },
  
  // Legumes
  'beans': { calories: 127, protein: 8.7, carbohydrates: 23, fat: 0.5, fiber: 6.4, sodium: 2 },
  'lentils': { calories: 116, protein: 9, carbohydrates: 20, fat: 0.4, fiber: 7.9, sodium: 2 },
  
  // Spices & Seasonings (per 1g)
  'salt': { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sodium: 38758 },
  'sugar': { calories: 387, protein: 0, carbohydrates: 100, fat: 0, fiber: 0, sodium: 1 },
  'garlic': { calories: 149, protein: 6.4, carbohydrates: 33, fat: 0.5, fiber: 2.1, sodium: 17 },
};

// Unit conversion factors to grams
const UNIT_CONVERSIONS: Record<string, number> = {
  // Volume to weight conversions (approximate)
  'cup': 240, // ml, varies by ingredient
  'cups': 240,
  'tbsp': 15,
  'tablespoon': 15,
  'tablespoons': 15,
  'tsp': 5,
  'teaspoon': 5,
  'teaspoons': 5,
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'fl oz': 30,
  'fluid ounce': 30,
  'fluid ounces': 30,
  
  // Weight conversions
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'oz': 28.35,
  'ounce': 28.35,
  'ounces': 28.35,
  'lb': 453.6,
  'pound': 453.6,
  'pounds': 453.6,
  
  // Count conversions (approximate)
  'piece': 100,
  'pieces': 100,
  'item': 100,
  'items': 100,
  'medium': 150,
  'large': 200,
  'small': 75,
};

// Ingredient-specific weight conversions
const INGREDIENT_WEIGHTS: Record<string, Record<string, number>> = {
  'flour': { 'cup': 120, 'cups': 120 },
  'sugar': { 'cup': 200, 'cups': 200 },
  'rice': { 'cup': 185, 'cups': 185 },
  'milk': { 'cup': 240, 'cups': 240 },
  'water': { 'cup': 240, 'cups': 240 },
  'oil': { 'cup': 220, 'cups': 220 },
  'butter': { 'cup': 227, 'cups': 227, 'tbsp': 14, 'tablespoon': 14 },
};

export interface ParsedIngredient {
  original: string;
  ingredient: string;
  amount?: number;
  unit?: string;
  weightInGrams?: number;
}

export class NutritionService {
  // Parse ingredient string to extract amount, unit, and ingredient name
  static parseIngredient(ingredientStr: string): ParsedIngredient {
    const original = ingredientStr.trim();
    
    // Patterns for parsing ingredients
    const patterns = [
      // "2 cups flour" or "2 cup flour"
      /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pieces?|items?|medium|large|small)\s+(.+)$/i,
      // "1/2 cup flour"
      /^(\d+\/\d+)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pieces?|items?|medium|large|small)\s+(.+)$/i,
      // "flour, 2 cups"
      /^(.+),\s*(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pieces?|items?|medium|large|small)$/i,
      // "2 medium apples"
      /^(\d+(?:\.\d+)?)\s+(medium|large|small)\s+(.+)$/i,
    ];

    for (const pattern of patterns) {
      const match = original.match(pattern);
      if (match) {
        let amount: number;
        let unit: string;
        let ingredient: string;

        if (pattern.source.includes('(.+),')) {
          // "flour, 2 cups" format
          ingredient = match[1].trim();
          const amountStr = match[2];
          unit = match[3].toLowerCase();
          
          if (amountStr.includes('/')) {
            const [numerator, denominator] = amountStr.split('/').map(Number);
            amount = numerator / denominator;
          } else {
            amount = parseFloat(amountStr);
          }
        } else {
          // Standard "2 cups flour" format
          const amountStr = match[1];
          unit = match[2].toLowerCase();
          ingredient = match[3].trim();
          
          if (amountStr.includes('/')) {
            const [numerator, denominator] = amountStr.split('/').map(Number);
            amount = numerator / denominator;
          } else {
            amount = parseFloat(amountStr);
          }
        }

        const weightInGrams = this.convertToGrams(amount, unit, ingredient);
        
        return {
          original,
          ingredient: ingredient.toLowerCase(),
          amount,
          unit,
          weightInGrams
        };
      }
    }

    // If no pattern matches, return just the ingredient name
    return {
      original,
      ingredient: original.toLowerCase()
    };
  }

  // Convert amount and unit to grams
  static convertToGrams(amount: number, unit: string, ingredient: string): number {
    const cleanUnit = unit.toLowerCase().replace(/s$/, ''); // Remove plural 's'
    const cleanIngredient = ingredient.toLowerCase();
    
    // Check for ingredient-specific conversions first
    if (INGREDIENT_WEIGHTS[cleanIngredient] && INGREDIENT_WEIGHTS[cleanIngredient][unit]) {
      return amount * INGREDIENT_WEIGHTS[cleanIngredient][unit];
    }
    
    // Use general unit conversions
    const conversionFactor = UNIT_CONVERSIONS[unit] || UNIT_CONVERSIONS[cleanUnit] || 100;
    return amount * conversionFactor;
  }

  // Find nutrition data for an ingredient
  static findNutritionData(ingredient: string): NutritionInfo | null {
    const cleanIngredient = ingredient.toLowerCase().trim();
    
    // Direct match
    if (NUTRITION_DATABASE[cleanIngredient]) {
      return NUTRITION_DATABASE[cleanIngredient];
    }
    
    // Partial match - find ingredients that contain the search term
    for (const [key, nutrition] of Object.entries(NUTRITION_DATABASE)) {
      if (cleanIngredient.includes(key) || key.includes(cleanIngredient)) {
        return nutrition;
      }
    }
    
    return null;
  }

  // Calculate nutrition for a single ingredient
  static calculateIngredientNutrition(ingredientStr: string): IngredientNutrition | null {
    const parsed = this.parseIngredient(ingredientStr);
    const nutritionPer100g = this.findNutritionData(parsed.ingredient);
    
    if (!nutritionPer100g || !parsed.weightInGrams) {
      return null;
    }
    
    const factor = parsed.weightInGrams / 100;
    const nutrition: NutritionInfo = {};
    
    // Scale nutrition values based on actual weight
    Object.entries(nutritionPer100g).forEach(([key, value]) => {
      if (typeof value === 'number') {
        (nutrition as any)[key] = Math.round((value * factor) * 100) / 100;
      }
    });
    
    return {
      ingredient: parsed.original,
      amount: parsed.amount,
      unit: parsed.unit,
      nutrition
    };
  }

  // Calculate total nutrition for a recipe
  static calculateRecipeNutrition(ingredients: string[], servings: number = 1): NutritionInfo {
    const totalNutrition: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturated_fat: 0,
      trans_fat: 0,
      vitamin_a: 0,
      vitamin_c: 0,
      calcium: 0,
      iron: 0,
      potassium: 0,
      per_serving: true
    };

    ingredients.forEach(ingredientStr => {
      const ingredientNutrition = this.calculateIngredientNutrition(ingredientStr);
      if (ingredientNutrition) {
        Object.entries(ingredientNutrition.nutrition).forEach(([key, value]) => {
          if (typeof value === 'number' && key !== 'per_serving') {
            const currentValue = totalNutrition[key as keyof NutritionInfo] as number || 0;
            (totalNutrition as any)[key] = currentValue + value;
          }
        });
      }
    });

    // Divide by servings to get per-serving values
    if (servings > 1) {
      Object.entries(totalNutrition).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'per_serving') {
          (totalNutrition as any)[key] = Math.round((value / servings) * 100) / 100;
        }
      });
    }

    return totalNutrition;
  }

  // Get nutrition summary for display
  static getNutritionSummary(nutrition: NutritionInfo): { label: string; value: string; unit: string }[] {
    const summary = [];
    
    if (nutrition.calories !== undefined) {
      summary.push({ label: 'Calories', value: nutrition.calories.toString(), unit: 'kcal' });
    }
    if (nutrition.protein !== undefined) {
      summary.push({ label: 'Protein', value: nutrition.protein.toFixed(1), unit: 'g' });
    }
    if (nutrition.carbohydrates !== undefined) {
      summary.push({ label: 'Carbs', value: nutrition.carbohydrates.toFixed(1), unit: 'g' });
    }
    if (nutrition.fat !== undefined) {
      summary.push({ label: 'Fat', value: nutrition.fat.toFixed(1), unit: 'g' });
    }
    if (nutrition.fiber !== undefined) {
      summary.push({ label: 'Fiber', value: nutrition.fiber.toFixed(1), unit: 'g' });
    }
    if (nutrition.sodium !== undefined) {
      summary.push({ label: 'Sodium', value: nutrition.sodium.toFixed(0), unit: 'mg' });
    }
    
    return summary;
  }

  // Validate nutrition data
  static validateNutrition(nutrition: Partial<NutritionInfo>): boolean {
    // Basic validation - calories should be reasonable
    if (nutrition.calories !== undefined && (nutrition.calories < 0 || nutrition.calories > 10000)) {
      return false;
    }
    
    // Macronutrients should be non-negative
    const macros = ['protein', 'carbohydrates', 'fat', 'fiber'];
    for (const macro of macros) {
      const value = nutrition[macro as keyof NutritionInfo];
      if (value !== undefined && (typeof value !== 'number' || value < 0)) {
        return false;
      }
    }
    
    return true;
  }
}
