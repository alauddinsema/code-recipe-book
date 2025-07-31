import axios from 'axios';
import type { GeminiRecipeRequest, GeminiRecipeResponse } from '../types';

export class GeminiService {
  // Fallback mock recipe for when API is unavailable
  private static getMockRecipe(ingredients: string[]): GeminiRecipeResponse {
    return {
      title: `Delicious ${ingredients[0]} Recipe`,
      description: `A wonderful dish featuring ${ingredients.slice(0, 3).join(', ')} with a tech twist!`,
      ingredients: [
        ...ingredients.slice(0, 5),
        'Salt and pepper to taste',
        'Olive oil',
        'Fresh herbs'
      ],
      steps: [
        'Prepare all ingredients and set up your cooking station',
        `Heat olive oil in a large pan over medium heat`,
        `Add ${ingredients[0]} and cook for 5-7 minutes`,
        'Season with salt, pepper, and herbs',
        'Cook until tender and golden',
        'Serve hot and enjoy!'
      ],
      code_snippet: `// Smart cooking timer for ${ingredients[0]}
const cookingTimer = {
  ingredient: '${ingredients[0]}',
  optimalTemp: 180, // Celsius
  cookTime: 15, // minutes

  startCooking() {
    console.log(\`Starting to cook \${this.ingredient}\`);
    setTimeout(() => {
      console.log('Cooking complete! Time to serve.');
    }, this.cookTime * 60000);
  }
};

cookingTimer.startCooking();`,
      language: 'javascript',
      prep_time: 15,
      cook_time: 25,
      servings: 4
    };
  }

  static async generateRecipe(request: GeminiRecipeRequest): Promise<GeminiRecipeResponse> {
    // Always use Netlify function for both development and production
    // This simplifies the setup and uses the tested production functions
    return this.generateRecipeViaNetlify(request);
  }

  // Removed unused buildPrompt method - now handled by Netlify function

  // Removed unused parseRecipeResponse method - now handled by Netlify function

  // Removed getRecipeSuggestions method - not currently used

  // New method for production - uses Netlify function
  private static async generateRecipeViaNetlify(request: GeminiRecipeRequest): Promise<GeminiRecipeResponse> {
    try {
      console.log('Using production Netlify function for recipe generation...');

      // Use production Netlify function URL for both development and production
      const functionUrl = import.meta.env.DEV
        ? 'https://recipebook-gpt.netlify.app/.netlify/functions/generate-recipe'
        : '/.netlify/functions/generate-recipe';

      const response = await axios.post(functionUrl, {
        ingredients: request.ingredients,
        preferences: request.preferences,
        dietary_restrictions: request.dietary_restrictions,
        generateImage: true // Request image generation
      }, {
        timeout: 90000 // Increase timeout for image generation
      });

      if (response.data && response.data.title) {
        return response.data;
      } else {
        throw new Error('Invalid response from Netlify function');
      }
    } catch (error) {
      console.error('Netlify function error, falling back to mock recipe:', error);

      // Fallback to mock recipe if Netlify function fails
      return this.getMockRecipe(request.ingredients);
    }
  }
}
