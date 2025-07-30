import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

// Validate environment variables with null safety
const supabaseUrl = SUPABASE_URL || '';
const supabaseKey = SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_ANON_KEY: !!supabaseKey,
    env_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    env_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format with null safety
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Supabase URL must start with https://');
}

// Validate key format (JWT should have 3 parts separated by dots) with null safety
if (!supabaseKey.includes('.') || supabaseKey.split('.').length !== 3) {
  console.error('Invalid Supabase anonymous key format');
  throw new Error('Supabase anonymous key must be a valid JWT token');
}

// Create Supabase client with validated values
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string;
          ingredients: string[];
          steps: string[];
          code_snippet: string | null;
          language: string | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          category: string | null;
          prep_time: number | null;
          cook_time: number | null;
          servings: number | null;
          author_id: string | null;
          author_name: string | null;
          image_url: string | null;
          tags: string[] | null;
          nutrition_calories: number | null;
          nutrition_protein: number | null;
          nutrition_carbohydrates: number | null;
          nutrition_fat: number | null;
          nutrition_fiber: number | null;
          nutrition_sugar: number | null;
          nutrition_sodium: number | null;
          nutrition_cholesterol: number | null;
          nutrition_saturated_fat: number | null;
          nutrition_trans_fat: number | null;
          nutrition_vitamin_a: number | null;
          nutrition_vitamin_c: number | null;
          nutrition_calcium: number | null;
          nutrition_iron: number | null;
          nutrition_potassium: number | null;
          nutrition_per_serving: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          ingredients: string[];
          steps: string[];
          code_snippet?: string | null;
          language?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          category?: string | null;
          prep_time?: number | null;
          cook_time?: number | null;
          servings?: number | null;
          author_id?: string | null;
          author_name?: string | null;
          image_url?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          ingredients?: string[];
          steps?: string[];
          code_snippet?: string | null;
          language?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          category?: string | null;
          prep_time?: number | null;
          cook_time?: number | null;
          servings?: number | null;
          author_id?: string | null;
          author_name?: string | null;
          image_url?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
