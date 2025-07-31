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
  image_url?: string;
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
