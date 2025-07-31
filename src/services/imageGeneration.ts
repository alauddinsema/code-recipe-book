/**
 * Image Generation Service using Google's Imagen API
 * Generates food images for recipes using AI
 */

import axios from 'axios';
import { GEMINI_API_KEY } from '../utils/constants';

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage';

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
      // Use Netlify function for secure API calls in production
      const isProduction = window.location.hostname !== 'localhost';
      
      if (isProduction) {
        return this.generateImageViaNetlify(recipeTitle, recipeDescription, ingredients);
      }

      // Development mode - direct API call
      if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, skipping image generation');
        return undefined;
      }

      const prompt = this.buildImagePrompt(recipeTitle, recipeDescription, ingredients);
      
      console.log('Generating recipe image with prompt:', prompt);
      
      const response = await axios.post(
        `${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`,
        {
          prompt: {
            text: prompt
          },
          numberOfImages: 1,
          aspectRatio: 'ASPECT_RATIO_1_1',
          negativePrompt: 'blurry, low quality, distorted, text overlay, watermark, logo, cartoon, anime, drawing, sketch, black and white'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 45000, // 45 second timeout for image generation
        }
      );

      if (response.data?.images?.[0]?.bytesBase64Encoded) {
        // Convert base64 to data URL
        const base64Data = response.data.images[0].bytesBase64Encoded;
        const mimeType = response.data.images[0].mimeType || 'image/png';
        return `data:${mimeType};base64,${base64Data}`;
      }

      console.warn('No image data received from Imagen API');
      return undefined;

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

  /**
   * Build an optimized prompt for food image generation
   */
  private static buildImagePrompt(
    title: string,
    description: string,
    ingredients: string[]
  ): string {
    // Extract key ingredients for the prompt
    const keyIngredients = ingredients.slice(0, 5).join(', ');
    
    // Create a detailed, food-photography focused prompt
    const prompt = `Professional food photography of ${title.toLowerCase()}, ${description.toLowerCase()}. 
    
Key ingredients visible: ${keyIngredients}. 

Style: High-quality food photography, appetizing presentation, natural lighting, clean white or wooden background, restaurant-quality plating, vibrant colors, sharp focus, professional composition, mouth-watering appearance.

Camera: Shot with professional DSLR, shallow depth of field, perfect exposure, no harsh shadows.

Presentation: Beautifully plated, garnished appropriately, steam rising if hot dish, fresh ingredients visible, artistic but realistic styling.`;

    return prompt.trim();
  }

  /**
   * Generate image via Netlify function for production
   */
  private static async generateImageViaNetlify(
    recipeTitle: string,
    recipeDescription: string,
    ingredients: string[]
  ): Promise<string | undefined> {
    try {
      console.log('Using Netlify function for image generation...');

      const response = await axios.post('/.netlify/functions/generate-image', {
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
