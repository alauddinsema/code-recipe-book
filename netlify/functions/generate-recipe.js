// Netlify Function for AI Recipe Generation with Image Generation
// This function acts as a proxy to the Gemini API to keep API keys secure

const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage';

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { ingredients, preferences, dietary_restrictions, generateImage = true } = JSON.parse(event.body);

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid ingredients provided' }),
      };
    }

    // Get API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Gemini API key not configured' }),
      };
    }

    // Build enhanced prompt
    const prompt = buildRecipePrompt(ingredients, preferences, dietary_restrictions);

    console.log('Generating recipe for ingredients:', ingredients);

    // Call Gemini API for recipe generation
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
        timeout: 30000,
      }
    );

    if (response.status !== 200) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    // Parse the JSON response from Gemini
    let recipeData;
    try {
      const cleanText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      recipeData = JSON.parse(cleanText);

      // Validate required fields
      if (!recipeData.title || !recipeData.description || !recipeData.ingredients || !recipeData.steps) {
        throw new Error('Invalid recipe format');
      }
    } catch (parseError) {
      console.error('Recipe parsing error:', parseError);
      // Fallback to a mock recipe if parsing fails
      recipeData = getMockRecipe(ingredients);
    }

    // Generate image if requested
    if (generateImage) {
      console.log('Generating image for recipe:', recipeData.title);
      try {
        const imageUrl = await generateRecipeImage(
          recipeData.title,
          recipeData.description,
          recipeData.ingredients,
          GEMINI_API_KEY
        );

        if (imageUrl) {
          recipeData.image_url = imageUrl;
          console.log('Image generated successfully');
        } else {
          console.warn('Failed to generate image');
        }
      } catch (imageError) {
        console.error('Image generation error:', imageError);
        // Continue without image - it's optional
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recipeData),
    };

  } catch (error) {
    console.error('Function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate recipe',
        details: error.message
      }),
    };
  }
};

// Helper function to build recipe prompt
function buildRecipePrompt(ingredients, preferences, dietary_restrictions) {
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

// Helper function to generate recipe image
async function generateRecipeImage(title, description, ingredients, apiKey) {
  try {
    const keyIngredients = ingredients.slice(0, 5).join(', ');

    const prompt = `Professional food photography of ${title.toLowerCase()}, ${description.toLowerCase()}.

Key ingredients visible: ${keyIngredients}.

Style: High-quality food photography, appetizing presentation, natural lighting, clean white or wooden background, restaurant-quality plating, vibrant colors, sharp focus, professional composition, mouth-watering appearance.

Camera: Shot with professional DSLR, shallow depth of field, perfect exposure, no harsh shadows.

Presentation: Beautifully plated, garnished appropriately, steam rising if hot dish, fresh ingredients visible, artistic but realistic styling.`;

    const response = await axios.post(
      `${IMAGEN_API_URL}?key=${apiKey}`,
      {
        prompt: {
          text: prompt.trim()
        },
        numberOfImages: 1,
        aspectRatio: 'ASPECT_RATIO_1_1',
        negativePrompt: 'blurry, low quality, distorted, text overlay, watermark, logo, cartoon, anime, drawing, sketch, black and white'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    if (response.data?.images?.[0]?.bytesBase64Encoded) {
      const base64Data = response.data.images[0].bytesBase64Encoded;
      const mimeType = response.data.images[0].mimeType || 'image/png';
      return `data:${mimeType};base64,${base64Data}`;
    }

    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

// Helper function for mock recipe
function getMockRecipe(ingredients) {
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
