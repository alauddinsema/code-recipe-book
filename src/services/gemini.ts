import axios from 'axios';
import { GEMINI_API_KEY } from '../utils/constants';
import type { GeminiRecipeRequest, GeminiRecipeResponse } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = this.buildPrompt(request);

    try {
      console.log('Making request to Gemini API...');
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('Gemini API response received:', response.status);
      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.parseRecipeResponse(generatedText);
    } catch (error: any) {
      console.error('Gemini API error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`
      });

      // Use fallback mock recipe for development/testing
      console.warn('Using fallback mock recipe due to API error');
      return this.getMockRecipe(request.ingredients);
    }
  }

  private static buildPrompt(request: GeminiRecipeRequest): string {
    const { ingredients, preferences, dietary_restrictions } = request;

    let prompt = `Create a detailed cooking recipe using these ingredients: ${ingredients.join(', ')}.

Please provide the response in the following JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": ["step 1", "step 2", ...],
  "code_snippet": "optional code snippet for cooking automation or calculation",
  "language": "programming language if code_snippet is provided",
  "prep_time": number_in_minutes,
  "cook_time": number_in_minutes,
  "servings": number_of_servings
}

Requirements:
- Use primarily the provided ingredients
- Include realistic cooking steps
- If possible, add a creative code snippet (Python, JavaScript, etc.) that could help with cooking automation, timing, calculations, or smart kitchen integration
- Make it practical and delicious`;

    if (preferences) {
      prompt += `\n- Consider these preferences: ${preferences}`;
    }

    if (dietary_restrictions && dietary_restrictions.length > 0) {
      prompt += `\n- Follow these dietary restrictions: ${dietary_restrictions.join(', ')}`;
    }

    prompt += '\n\nProvide only the JSON response, no additional text.';

    return prompt;
  }

  private static parseRecipeResponse(text: string): GeminiRecipeResponse {
    try {
      // Clean the response text
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.ingredients || !parsed.steps) {
        throw new Error('Invalid recipe format');
      }

      return {
        title: parsed.title,
        description: parsed.description,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        code_snippet: parsed.code_snippet || undefined,
        language: parsed.language || undefined,
        prep_time: parsed.prep_time || undefined,
        cook_time: parsed.cook_time || undefined,
        servings: parsed.servings || undefined,
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Failed to parse recipe response');
    }
  }

  // Generate recipe suggestions based on dietary preferences
  static async getRecipeSuggestions(preferences: string[]): Promise<string[]> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `Based on these dietary preferences: ${preferences.join(', ')}, suggest 5 popular recipe names that would be suitable. Return only a JSON array of recipe names, no additional text.

Example format: ["Recipe Name 1", "Recipe Name 2", "Recipe Name 3", "Recipe Name 4", "Recipe Name 5"]`;

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 512,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      const cleanText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to get recipe suggestions:', error);
      return [];
    }
  }
}
