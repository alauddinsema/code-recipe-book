// Netlify Function for AI Recipe Generation
// This function acts as a proxy to the Gemini API to keep API keys secure

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { ingredients } = JSON.parse(event.body);

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid ingredients provided' }),
      };
    }

    // Get Gemini API key from environment variables
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Gemini API key not configured' }),
      };
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a detailed recipe using these ingredients: ${ingredients.join(', ')}. 
              
              Please respond with a JSON object in this exact format:
              {
                "title": "Recipe Name",
                "description": "Brief description",
                "ingredients": ["ingredient 1", "ingredient 2"],
                "steps": ["step 1", "step 2"],
                "prep_time": 15,
                "cook_time": 30,
                "servings": 4,
                "difficulty": "easy",
                "category": "main",
                "tags": ["tag1", "tag2"],
                "code_snippet": "// Optional JavaScript code for smart cooking timer or calculations",
                "language": "javascript"
              }
              
              Make it creative and include a useful code snippet for smart cooking or calculations.`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    // Parse the JSON response from Gemini
    let recipeData;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      // Fallback to a mock recipe if parsing fails
      recipeData = {
        title: `Delicious ${ingredients[0]} Recipe`,
        description: `A wonderful recipe featuring ${ingredients.join(', ')}`,
        ingredients: ingredients,
        steps: [
          "Prepare all ingredients",
          "Follow cooking instructions",
          "Serve and enjoy!"
        ],
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: "medium",
        category: "main",
        tags: ["homemade", "delicious"],
        code_snippet: `// Smart cooking timer\nconst cookingTimer = (minutes) => {\n  console.log(\`Cooking for \${minutes} minutes\`);\n  setTimeout(() => {\n    console.log('Cooking complete!');\n  }, minutes * 60000);\n};\n\ncookingTimer(30);`,
        language: "javascript"
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to generate recipe',
        details: error.message 
      }),
    };
  }
};
