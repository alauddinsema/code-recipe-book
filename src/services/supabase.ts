import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
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
          name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
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
