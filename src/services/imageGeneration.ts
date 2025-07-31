/**
 * Image Generation Service using Google's Imagen API
 * Generates food images for recipes using AI
 */

import axios from 'axios';

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: 'ASPECT_RATIO_1_1' | 'ASPECT_RATIO_9_16' | 'ASPECT_RATIO_16_9' | 'ASPECT_RATIO_4_3' | 'ASPECT_RATIO_3_4';
  negativePrompt?: string;
  numberOfImages?: number;
}

export interface ImageGenerationResponse {
  images: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
}

export class ImageGenerationService {
  /**
   * Generate a food image based on recipe details
   */
  static async generateRecipeImage(
    recipeTitle: string,
    recipeDescription: string,
    ingredients: string[]
  ): Promise<string | undefined> {
    try {
      // Always use Netlify functions to avoid CORS issues
      // This works in both development (netlify dev) and production
      return this.generateImageViaNetlify(recipeTitle, recipeDescription, ingredients);

    } catch (error: any) {
      console.error('Image generation error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return undefined instead of throwing - image generation is optional
      return undefined;
    }
  }

  // Removed unused buildImagePrompt method - now handled by Netlify function

  /**
   * Generate image via Netlify function for production
   */
  private static async generateImageViaNetlify(
    recipeTitle: string,
    recipeDescription: string,
    ingredients: string[]
  ): Promise<string | undefined> {
    try {
      console.log('Using production Netlify function for image generation...');

      // Use production Netlify function URL for both development and production
      const functionUrl = import.meta.env.DEV
        ? 'https://recipebook-gpt.netlify.app/.netlify/functions/generate-image'
        : '/.netlify/functions/generate-image';

      const response = await axios.post(functionUrl, {
        title: recipeTitle,
        description: recipeDescription,
        ingredients: ingredients.slice(0, 5) // Limit ingredients to avoid long prompts
      }, {
        timeout: 60000 // 60 second timeout for Netlify function
      });

      if (response.data?.imageUrl) {
        return response.data.imageUrl;
      }

      console.warn('No image URL received from Netlify function');
      return undefined;

    } catch (error: any) {
      console.error('Netlify image generation error:', error);
      return undefined;
    }
  }

  /**
   * Generate multiple recipe images for batch processing
   */
  static async generateMultipleRecipeImages(
    recipes: Array<{
      title: string;
      description: string;
      ingredients: string[];
    }>
  ): Promise<Array<{ index: number; imageUrl?: string }>> {
    const results: Array<{ index: number; imageUrl?: string }> = [];
    
    // Process in batches to avoid rate limiting
    const batchSize = 3;
    const delay = 2000; // 2 second delay between batches
    
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      
      console.log(`Processing image generation batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipes.length / batchSize)}`);
      
      const batchPromises = batch.map(async (recipe, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const imageUrl = await this.generateRecipeImage(
            recipe.title,
            recipe.description,
            recipe.ingredients
          );
          return { index: globalIndex, imageUrl };
        } catch (error) {
          console.error(`Failed to generate image for recipe ${globalIndex}:`, error);
          return { index: globalIndex, imageUrl: undefined };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  /**
   * Validate if a generated image URL is accessible
   */
  static async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      // For data URLs, just check if they're properly formatted
      if (imageUrl.startsWith('data:image/')) {
        return imageUrl.length > 100; // Basic validation
      }
      
      // For regular URLs, try to fetch them
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image validation error:', error);
      return false;
    }
  }

  /**
   * Get fallback image URLs for different recipe categories
   */
  static getFallbackImageUrl(category: string): string {
    const fallbackImages: Record<string, string> = {
      'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&h=600&fit=crop',
      'lunch': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
      'dinner': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
      'dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
      'beverage': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
      'snack': 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&h=600&fit=crop',
      'vegetarian': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
      'vegan': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop',
      'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'
    };
    
    return fallbackImages[category.toLowerCase()] || fallbackImages.default;
  }
}
