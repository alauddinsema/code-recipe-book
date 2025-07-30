// Type definitions for the application

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  code_snippet?: string;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  tags?: string[];
  // Rating fields
  average_rating?: number;
  rating_count?: number;
  total_rating_points?: number;
  // Nutritional information
  nutrition?: NutritionInfo;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number; // grams
  carbohydrates?: number; // grams
  fat?: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // milligrams
  cholesterol?: number; // milligrams
  saturated_fat?: number; // grams
  trans_fat?: number; // grams
  vitamin_a?: number; // IU
  vitamin_c?: number; // milligrams
  calcium?: number; // milligrams
  iron?: number; // milligrams
  potassium?: number; // milligrams
  // Per serving values
  per_serving?: boolean;
}

export interface IngredientNutrition {
  ingredient: string;
  amount?: number;
  unit?: string;
  nutrition: NutritionInfo;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  code_snippet?: string;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  tags?: string[];
  image_url?: string;
  nutrition?: NutritionInfo;
}

export interface GeminiRecipeRequest {
  ingredients: string[];
  preferences?: string;
  dietary_restrictions?: string[];
}

export interface GeminiRecipeResponse {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  code_snippet?: string;
  language?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
