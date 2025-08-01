const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url, parseWithAI = true } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'URL is required' 
        }),
      };
    }

    console.log('Importing recipe from URL:', url);

    // Fetch the webpage content
    const webpageContent = await fetchWebpageContent(url);
    
    if (!webpageContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch webpage content' 
        }),
      };
    }

    // Parse recipe using AI
    const recipe = await parseRecipeWithAI(webpageContent, url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recipe: recipe
      }),
    };

  } catch (error) {
    console.error('Recipe import error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
    };
  }
};

/**
 * Fetch webpage content
 */
async function fetchWebpageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Basic HTML cleaning - remove scripts, styles, and extract text content
    const cleanedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedHtml.substring(0, 8000); // Limit content size for AI processing

  } catch (error) {
    console.error('Failed to fetch webpage:', error);
    return null;
  }
}

/**
 * Parse recipe using Gemini AI
 */
async function parseRecipeWithAI(content, sourceUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a recipe extraction expert. Parse the following webpage content and extract recipe information in JSON format.

Webpage URL: ${sourceUrl}
Content: ${content}

Extract and return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2", "..."],
  "instructions": ["step 1", "step 2", "..."],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "easy",
  "category": "Main Course",
  "tags": ["tag1", "tag2"],
  "image_url": "https://example.com/image.jpg"
}

Rules:
1. Return ONLY the JSON object, no additional text
2. If prep_time, cook_time, or servings are not found, use reasonable estimates
3. Difficulty should be "easy", "medium", or "hard"
4. Category should be one of: "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Appetizer", "Main Course", "Side Dish"
5. Extract actual ingredients and steps from the content
6. If no image URL is found, omit the image_url field
7. Make ingredients and instructions as detailed and accurate as possible
8. Ensure all strings are properly escaped for JSON

Focus on finding structured recipe data like ingredient lists, cooking instructions, timing, and serving information.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text);

    // Try to parse the JSON response
    let parsedRecipe;
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedRecipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Fallback: create a basic recipe structure
      parsedRecipe = {
        title: `Recipe from ${new URL(sourceUrl).hostname}`,
        description: 'Recipe imported from web page',
        ingredients: ['Please add ingredients manually'],
        instructions: ['Please add cooking instructions manually'],
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'medium',
        category: 'Main Course',
        tags: ['imported']
      };
    }

    // Validate and clean the parsed recipe
    const cleanedRecipe = {
      title: parsedRecipe.title || `Recipe from ${new URL(sourceUrl).hostname}`,
      description: parsedRecipe.description || 'Recipe imported from web page',
      ingredients: Array.isArray(parsedRecipe.ingredients) ? parsedRecipe.ingredients : ['Please add ingredients manually'],
      instructions: Array.isArray(parsedRecipe.instructions) ? parsedRecipe.instructions : ['Please add cooking instructions manually'],
      prep_time: typeof parsedRecipe.prep_time === 'number' ? parsedRecipe.prep_time : 15,
      cook_time: typeof parsedRecipe.cook_time === 'number' ? parsedRecipe.cook_time : 30,
      servings: typeof parsedRecipe.servings === 'number' ? parsedRecipe.servings : 4,
      difficulty: ['easy', 'medium', 'hard'].includes(parsedRecipe.difficulty) ? parsedRecipe.difficulty : 'medium',
      category: parsedRecipe.category || 'Main Course',
      tags: Array.isArray(parsedRecipe.tags) ? parsedRecipe.tags : ['imported'],
      image_url: parsedRecipe.image_url || undefined
    };

    console.log('Cleaned recipe:', cleanedRecipe);
    return cleanedRecipe;

  } catch (error) {
    console.error('AI parsing failed:', error);
    
    // Return fallback recipe
    return {
      title: `Recipe from ${new URL(sourceUrl).hostname}`,
      description: 'Recipe imported from web page. AI parsing failed, please review and edit.',
      ingredients: ['Please add ingredients manually'],
      instructions: ['Please add cooking instructions manually'],
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      difficulty: 'medium',
      category: 'Main Course',
      tags: ['imported', 'needs-review']
    };
  }
}
