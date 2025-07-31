/**
 * Netlify Function for AI Image Generation
 * Generates food images using Google's Imagen API
 */

const axios = require('axios');

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
    // Parse request body
    const { title, description, ingredients } = JSON.parse(event.body);

    // Validate required fields
    if (!title || !description || !ingredients) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: title, description, ingredients' 
        }),
      };
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Build image generation prompt
    const prompt = buildImagePrompt(title, description, ingredients);
    
    console.log('Generating image for recipe:', title);
    console.log('Prompt:', prompt);

    // Call Imagen API
    const response = await axios.post(
      `${IMAGEN_API_URL}?key=${apiKey}`,
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
        timeout: 45000, // 45 second timeout
      }
    );

    // Process response
    if (response.data?.images?.[0]?.bytesBase64Encoded) {
      const base64Data = response.data.images[0].bytesBase64Encoded;
      const mimeType = response.data.images[0].mimeType || 'image/png';
      const imageUrl = `data:${mimeType};base64,${base64Data}`;
      
      console.log('Image generated successfully for:', title);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          imageUrl,
          success: true,
          message: 'Image generated successfully'
        }),
      };
    } else {
      console.warn('No image data received from Imagen API for:', title);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          imageUrl: null,
          success: false,
          message: 'No image data received from API'
        }),
      };
    }

  } catch (error) {
    console.error('Image generation error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Handle specific API errors
    if (error.response?.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        }),
      };
    }

    if (error.response?.status === 403) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'API access forbidden. Please check your API key and permissions.'
        }),
      };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ 
          error: 'Image generation timeout. Please try again.'
        }),
      };
    }

    // Generic error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate image',
        details: error.message
      }),
    };
  }
};

/**
 * Build an optimized prompt for food image generation
 */
function buildImagePrompt(title, description, ingredients) {
  // Extract key ingredients for the prompt (limit to 5)
  const keyIngredients = ingredients.slice(0, 5).join(', ');
  
  // Create a detailed, food-photography focused prompt
  const prompt = `Professional food photography of ${title.toLowerCase()}, ${description.toLowerCase()}. 

Key ingredients visible: ${keyIngredients}. 

Style: High-quality food photography, appetizing presentation, natural lighting, clean white or wooden background, restaurant-quality plating, vibrant colors, sharp focus, professional composition, mouth-watering appearance.

Camera: Shot with professional DSLR, shallow depth of field, perfect exposure, no harsh shadows.

Presentation: Beautifully plated, garnished appropriately, steam rising if hot dish, fresh ingredients visible, artistic but realistic styling.`;

  return prompt.trim();
}
