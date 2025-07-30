import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';
import { createMockSupabaseClient } from './mockSupabase';

// Safe defaults to prevent null errors
const DEFAULT_SUPABASE_URL = 'https://xjclhzrhfxqvwzwqmupi.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqY2xoenJoZnhxdnd6d3FtdXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NzE4NzQsImV4cCI6MjA1MTE0Nzg3NH0.4f6A4LWqkwDMuBwjANbJs9WpvwPJVzZvpUyVBxVqAGU';

// Ensure we always have valid strings (never null/undefined)
const supabaseUrl = SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

// Additional safety check - ensure they're actually strings
const finalUrl = typeof supabaseUrl === 'string' ? supabaseUrl : DEFAULT_SUPABASE_URL;
const finalKey = typeof supabaseKey === 'string' ? supabaseKey : DEFAULT_SUPABASE_KEY;

console.log('🔧 Supabase initialization:', {
  url: finalUrl ? `${finalUrl.substring(0, 20)}...` : 'MISSING',
  key: finalKey ? `${finalKey.substring(0, 20)}...` : 'MISSING',
  urlType: typeof finalUrl,
  keyType: typeof finalKey,
  originalUrl: SUPABASE_URL ? 'present' : 'missing',
  originalKey: SUPABASE_ANON_KEY ? 'present' : 'missing'
});

// Validate final values before creating client
if (!finalUrl || typeof finalUrl !== 'string' || !finalUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL:', finalUrl);
  throw new Error('Invalid Supabase URL configuration');
}

if (!finalKey || typeof finalKey !== 'string' || !finalKey.includes('.')) {
  console.error('Invalid Supabase key:', finalKey);
  throw new Error('Invalid Supabase key configuration');
}

// Create Supabase client with comprehensive error handling
let supabase: any;

try {
  // Attempt to create real Supabase client
  supabase = createClient(finalUrl, finalKey);
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client, using mock:', error);
  supabase = createMockSupabaseClient();
}

export { supabase };

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
