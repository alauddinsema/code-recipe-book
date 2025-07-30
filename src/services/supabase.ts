import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', SUPABASE_URL);
  throw new Error('Supabase URL must start with https://');
}

// Validate key format (JWT should have 3 parts separated by dots)
if (!SUPABASE_ANON_KEY.includes('.') || SUPABASE_ANON_KEY.split('.').length !== 3) {
  console.error('Invalid Supabase anonymous key format');
  throw new Error('Supabase anonymous key must be a valid JWT token');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
