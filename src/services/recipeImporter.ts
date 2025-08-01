import { supabase } from './supabase';
import axios from 'axios';
import type { Recipe, RecipeFormData } from '../types';
import { RecipeService } from './recipes';

// Recipe import types
export interface RecipeImportRequest {
  url: string;
  userId: string;
  userName?: string;
}

export interface RecipeImportResult {
  success: boolean;
  recipe?: Recipe;
  importId?: string;
  error?: string;
  confidence?: number;
}

export interface ScrapedRecipeData {
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  image_url?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  tags?: string[];
}

export interface RecipeImportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  recipe_id?: string;
  error_message?: string;
}

export class RecipeImporterService {
  private static readonly TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  /**
   * Import recipe from URL using AI parsing
   */
  static async importRecipeFromUrl(request: RecipeImportRequest): Promise<RecipeImportResult> {
    try {
      console.log('Starting recipe import from URL:', request.url);

      // Create import record
      const importRecord = await this.createImportRecord(request);
      
      // Update status to processing
      await this.updateImportStatus(importRecord.id, 'processing', 10, 'Fetching recipe data...');

      // Scrape and parse recipe using AI
      const scrapedData = await this.scrapeRecipeWithAI(request.url);
      
      // Update status
      await this.updateImportStatus(importRecord.id, 'processing', 60, 'Processing recipe data...');

      // Convert to recipe format
      const recipeData = await this.convertToRecipeFormat(scrapedData, request.url);
      
      // Update status
      await this.updateImportStatus(importRecord.id, 'processing', 80, 'Saving recipe...');

      // Create recipe in database
      const recipe = await RecipeService.createRecipe(recipeData, request.userId, request.userName);

      // Update import record with final recipe
      await this.updateImportRecord(importRecord.id, {
        status: 'completed',
        final_recipe_id: recipe.id,
        final_title: recipe.title,
        final_description: recipe.description,
        final_ingredients: recipe.ingredients,
        final_instructions: recipe.steps,
        final_image_url: recipe.image_url,
        final_prep_time: recipe.prep_time,
        final_cook_time: recipe.cook_time,
        final_servings: recipe.servings,
        final_difficulty: recipe.difficulty,
        final_category: recipe.category,
        final_tags: recipe.tags,
        import_completed_at: new Date().toISOString(),
        user_approved: true
      });

      // Final status update
      await this.updateImportStatus(importRecord.id, 'completed', 100, 'Recipe imported successfully!');

      return {
        success: true,
        recipe,
        importId: importRecord.id,
        confidence: scrapedData.confidence || 0.8
      };

    } catch (error) {
      console.error('Recipe import failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get import status by ID
   */
  static async getImportStatus(importId: string): Promise<RecipeImportStatus | null> {
    try {
      const { data, error } = await supabase
        .from('recipe_imports')
        .select('id, status, final_recipe_id, error_message')
        .eq('id', importId)
        .single();

      if (error || !data) return null;

      // Calculate progress based on status
      let progress = 0;
      let message = '';
      
      switch (data.status) {
        case 'pending':
          progress = 0;
          message = 'Import queued...';
          break;
        case 'processing':
          progress = 50;
          message = 'Processing recipe...';
          break;
        case 'completed':
          progress = 100;
          message = 'Import completed successfully!';
          break;
        case 'failed':
          progress = 0;
          message = data.error_message || 'Import failed';
          break;
        default:
          progress = 0;
          message = 'Unknown status';
      }

      return {
        id: data.id,
        status: data.status,
        progress,
        message,
        recipe_id: data.final_recipe_id,
        error_message: data.error_message
      };

    } catch (error) {
      console.error('Failed to get import status:', error);
      return null;
    }
  }

  /**
   * Get user's import history
   */
  static async getImportHistory(userId: string, limit = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_imports')
        .select(`
          id,
          source_url,
          source_domain,
          status,
          final_title,
          final_recipe_id,
          ai_confidence_score,
          import_started_at,
          import_completed_at,
          error_message
        `)
        .eq('user_id', userId)
        .order('import_started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get import history:', error);
      return [];
    }
  }

  /**
   * Create import record in database
   */
  private static async createImportRecord(request: RecipeImportRequest) {
    const url = new URL(request.url);
    const domain = url.hostname.replace('www.', '');

    const { data, error } = await supabase
      .from('recipe_imports')
      .insert({
        user_id: request.userId,
        source_url: request.url,
        source_domain: domain,
        import_method: 'url_parse',
        status: 'pending',
        import_started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create import record: ${error.message}`);
    return data;
  }

  /**
   * Update import record
   */
  private static async updateImportRecord(importId: string, updates: any) {
    const { error } = await supabase
      .from('recipe_imports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', importId);

    if (error) {
      console.error('Failed to update import record:', error);
    }
  }

  /**
   * Update import status (for progress tracking)
   */
  private static async updateImportStatus(importId: string, status: string, progress: number, message: string) {
    // This would typically update a separate status table or use real-time updates
    // For now, we'll update the main import record
    await this.updateImportRecord(importId, {
      status,
      // Store progress/message in a JSON field if needed
    });
  }

  /**
   * Scrape recipe using AI via Netlify function
   */
  private static async scrapeRecipeWithAI(url: string): Promise<ScrapedRecipeData & { confidence?: number }> {
    try {
      // Use existing Netlify function pattern from gemini.ts
      const functionUrl = import.meta.env.DEV
        ? 'https://recipebook-gpt.netlify.app/.netlify/functions/generate-recipe'
        : '/.netlify/functions/generate-recipe';

      // Use AI to parse the URL and extract recipe data
      const response = await axios.post(functionUrl, {
        ingredients: [], // Empty for URL parsing
        preferences: `Parse recipe from URL: ${url}`,
        dietary_restrictions: [],
        importUrl: url, // Special flag for import mode
        parseMode: true
      }, {
        timeout: this.TIMEOUT
      });

      if (!response.data) {
        throw new Error('No data received from AI service');
      }

      // Convert AI response to scraped data format
      return {
        title: response.data.title,
        description: response.data.description,
        ingredients: response.data.ingredients,
        instructions: response.data.steps,
        image_url: response.data.image_url,
        prep_time: response.data.prep_time,
        cook_time: response.data.cook_time,
        servings: response.data.servings,
        category: 'General',
        difficulty: 'medium',
        confidence: 0.8
      };

    } catch (error) {
      console.error('AI scraping failed:', error);

      // Fallback to basic scraping if AI fails
      return this.fallbackScraping(url);
    }
  }

  /**
   * Fallback scraping method (basic parsing)
   */
  private static async fallbackScraping(url: string): Promise<ScrapedRecipeData> {
    // This would implement basic HTML parsing as fallback
    // For now, return minimal data
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    return {
      title: `Imported Recipe from ${domain}`,
      description: `Recipe imported from ${url}`,
      ingredients: ['Please add ingredients manually'],
      instructions: ['Please add cooking instructions manually'],
      category: 'General',
      difficulty: 'medium'
    };
  }

  /**
   * Convert scraped data to recipe format
   */
  private static async convertToRecipeFormat(
    scrapedData: ScrapedRecipeData, 
    sourceUrl: string
  ): Promise<RecipeFormData> {
    return {
      title: scrapedData.title || 'Imported Recipe',
      description: scrapedData.description || `Recipe imported from ${sourceUrl}`,
      ingredients: scrapedData.ingredients || [],
      steps: scrapedData.instructions || [],
      prep_time: scrapedData.prep_time,
      cook_time: scrapedData.cook_time,
      servings: scrapedData.servings,
      difficulty: (scrapedData.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      category: scrapedData.category || 'General',
      tags: scrapedData.tags || ['imported'],
      image_url: scrapedData.image_url,
      // Add source URL as a tag for reference
      code_snippet: `// Recipe imported from: ${sourceUrl}\n// Import date: ${new Date().toISOString()}`
    };
  }

  /**
   * Validate URL format
   */
  static isValidRecipeUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get supported domains
   */
  static async getSupportedDomains(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_import_sources')
        .select('domain, name')
        .eq('is_supported', true)
        .order('name');

      if (error) throw error;
      return data?.map(source => source.domain) || [];

    } catch (error) {
      console.error('Failed to get supported domains:', error);
      return [
        'allrecipes.com',
        'food.com',
        'foodnetwork.com',
        'epicurious.com',
        'bonappetit.com',
        'seriouseats.com',
        'tasty.co',
        'yummly.com'
      ];
    }
  }
}
