// Grocery List Types and Interfaces

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
  estimated_price?: number;
  is_checked: boolean;
  recipe_id?: string;
  recipe_title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GroceryList {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  items: GroceryItem[];
  recipe_ids: string[];
  total_estimated_price?: number;
  is_shared: boolean;
  shared_with?: string[];
  status: GroceryListStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface GroceryCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface IngredientAnalysis {
  original_text: string;
  parsed_name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
  confidence: number;
  alternatives?: string[];
}

export interface PriceEstimate {
  item_name: string;
  estimated_price: number;
  price_range: {
    min: number;
    max: number;
  };
  store_suggestions?: string[];
  last_updated: string;
}

export interface GroceryListTemplate {
  id: string;
  name: string;
  description: string;
  items: Omit<GroceryItem, 'id' | 'is_checked' | 'created_at' | 'updated_at'>[];
  is_public: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
}

export interface ShoppingSession {
  id: string;
  grocery_list_id: string;
  started_at: string;
  completed_at?: string;
  items_checked: string[];
  total_spent?: number;
  store_visited?: string;
  notes?: string;
}

export type GroceryListStatus = 
  | 'draft'
  | 'active'
  | 'shopping'
  | 'completed'
  | 'archived';

export type GroceryUnit = 
  | 'piece' | 'pieces'
  | 'cup' | 'cups'
  | 'tablespoon' | 'tablespoons' | 'tbsp'
  | 'teaspoon' | 'teaspoons' | 'tsp'
  | 'pound' | 'pounds' | 'lb' | 'lbs'
  | 'ounce' | 'ounces' | 'oz'
  | 'gram' | 'grams' | 'g'
  | 'kilogram' | 'kilograms' | 'kg'
  | 'liter' | 'liters' | 'l'
  | 'milliliter' | 'milliliters' | 'ml'
  | 'gallon' | 'gallons'
  | 'quart' | 'quarts'
  | 'pint' | 'pints'
  | 'fluid ounce' | 'fluid ounces' | 'fl oz'
  | 'bunch' | 'bunches'
  | 'package' | 'packages' | 'pkg'
  | 'can' | 'cans'
  | 'bottle' | 'bottles'
  | 'jar' | 'jars'
  | 'box' | 'boxes'
  | 'bag' | 'bags'
  | 'loaf' | 'loaves'
  | 'dozen'
  | 'slice' | 'slices'
  | 'clove' | 'cloves'
  | 'head' | 'heads'
  | 'stalk' | 'stalks'
  | 'sprig' | 'sprigs'
  | 'pinch' | 'pinches'
  | 'dash' | 'dashes';

// Default grocery categories
export const DEFAULT_GROCERY_CATEGORIES: GroceryCategory[] = [
  {
    id: 'produce',
    name: 'Produce',
    icon: '🥬',
    color: '#10B981',
    sort_order: 1
  },
  {
    id: 'meat-seafood',
    name: 'Meat & Seafood',
    icon: '🥩',
    color: '#EF4444',
    sort_order: 2
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    icon: '🥛',
    color: '#F59E0B',
    sort_order: 3
  },
  {
    id: 'pantry',
    name: 'Pantry',
    icon: '🏺',
    color: '#8B5CF6',
    sort_order: 4
  },
  {
    id: 'grains-bread',
    name: 'Grains & Bread',
    icon: '🍞',
    color: '#D97706',
    sort_order: 5
  },
  {
    id: 'frozen',
    name: 'Frozen',
    icon: '🧊',
    color: '#06B6D4',
    sort_order: 6
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: '🥤',
    color: '#3B82F6',
    sort_order: 7
  },
  {
    id: 'snacks',
    name: 'Snacks',
    icon: '🍿',
    color: '#F97316',
    sort_order: 8
  },
  {
    id: 'condiments',
    name: 'Condiments',
    icon: '🍯',
    color: '#84CC16',
    sort_order: 9
  },
  {
    id: 'spices-herbs',
    name: 'Spices & Herbs',
    icon: '🌿',
    color: '#22C55E',
    sort_order: 10
  },
  {
    id: 'baking',
    name: 'Baking',
    icon: '🧁',
    color: '#EC4899',
    sort_order: 11
  },
  {
    id: 'household',
    name: 'Household',
    icon: '🧽',
    color: '#6B7280',
    sort_order: 12
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    color: '#9CA3AF',
    sort_order: 13
  }
];

// Ingredient to category mapping for AI analysis
export const INGREDIENT_CATEGORY_MAPPING: Record<string, string> = {
  // Produce
  'apple': 'produce', 'banana': 'produce', 'orange': 'produce', 'lemon': 'produce',
  'onion': 'produce', 'garlic': 'produce', 'tomato': 'produce', 'potato': 'produce',
  'carrot': 'produce', 'celery': 'produce', 'bell pepper': 'produce', 'spinach': 'produce',
  'lettuce': 'produce', 'cucumber': 'produce', 'broccoli': 'produce', 'mushroom': 'produce',
  
  // Meat & Seafood
  'chicken': 'meat-seafood', 'beef': 'meat-seafood', 'pork': 'meat-seafood', 'turkey': 'meat-seafood',
  'salmon': 'meat-seafood', 'tuna': 'meat-seafood', 'shrimp': 'meat-seafood', 'fish': 'meat-seafood',
  'ground beef': 'meat-seafood', 'chicken breast': 'meat-seafood', 'bacon': 'meat-seafood',
  
  // Dairy & Eggs
  'milk': 'dairy-eggs', 'cheese': 'dairy-eggs', 'butter': 'dairy-eggs', 'yogurt': 'dairy-eggs',
  'eggs': 'dairy-eggs', 'cream': 'dairy-eggs', 'sour cream': 'dairy-eggs', 'cottage cheese': 'dairy-eggs',
  
  // Pantry
  'olive oil': 'pantry', 'vegetable oil': 'pantry', 'vinegar': 'pantry', 'soy sauce': 'pantry',
  'pasta': 'pantry', 'rice': 'pantry', 'beans': 'pantry', 'lentils': 'pantry',
  'canned tomatoes': 'pantry', 'tomato sauce': 'pantry', 'broth': 'pantry', 'stock': 'pantry',
  
  // Grains & Bread
  'bread': 'grains-bread', 'flour': 'grains-bread', 'oats': 'grains-bread', 'quinoa': 'grains-bread',
  'tortilla': 'grains-bread', 'bagel': 'grains-bread', 'cereal': 'grains-bread',
  
  // Spices & Herbs
  'salt': 'spices-herbs', 'pepper': 'spices-herbs', 'basil': 'spices-herbs', 'oregano': 'spices-herbs',
  'thyme': 'spices-herbs', 'rosemary': 'spices-herbs', 'paprika': 'spices-herbs', 'cumin': 'spices-herbs',
  'garlic powder': 'spices-herbs', 'onion powder': 'spices-herbs', 'chili powder': 'spices-herbs',
  
  // Baking
  'sugar': 'baking', 'brown sugar': 'baking', 'baking powder': 'baking', 'baking soda': 'baking',
  'vanilla': 'baking', 'vanilla extract': 'baking', 'cocoa powder': 'baking', 'chocolate chips': 'baking'
};

// Common unit conversions for consolidation
export const UNIT_CONVERSIONS: Record<string, { base_unit: string; factor: number }> = {
  // Volume
  'cup': { base_unit: 'ml', factor: 236.588 },
  'cups': { base_unit: 'ml', factor: 236.588 },
  'tablespoon': { base_unit: 'ml', factor: 14.787 },
  'tablespoons': { base_unit: 'ml', factor: 14.787 },
  'tbsp': { base_unit: 'ml', factor: 14.787 },
  'teaspoon': { base_unit: 'ml', factor: 4.929 },
  'teaspoons': { base_unit: 'ml', factor: 4.929 },
  'tsp': { base_unit: 'ml', factor: 4.929 },
  'liter': { base_unit: 'ml', factor: 1000 },
  'liters': { base_unit: 'ml', factor: 1000 },
  'l': { base_unit: 'ml', factor: 1000 },
  
  // Weight
  'pound': { base_unit: 'g', factor: 453.592 },
  'pounds': { base_unit: 'g', factor: 453.592 },
  'lb': { base_unit: 'g', factor: 453.592 },
  'lbs': { base_unit: 'g', factor: 453.592 },
  'ounce': { base_unit: 'g', factor: 28.3495 },
  'ounces': { base_unit: 'g', factor: 28.3495 },
  'oz': { base_unit: 'g', factor: 28.3495 },
  'kilogram': { base_unit: 'g', factor: 1000 },
  'kilograms': { base_unit: 'g', factor: 1000 },
  'kg': { base_unit: 'g', factor: 1000 }
};
