const https = require('https');
const http = require('http');
const { URL } = require('url');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' })
      };
    }

    // Fetch the webpage
    const html = await fetchWebpage(url);
    
    // Extract recipe data
    const recipeData = extractRecipeData(html, url);
    
    if (!recipeData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No recipe data found on this page' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recipeData)
    };

  } catch (error) {
    console.error('Recipe scraping error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to scrape recipe',
        details: error.message 
      })
    };
  }
};

function fetchWebpage(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function extractRecipeData(html, url) {
  try {
    // Try to extract JSON-LD structured data first
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          const data = JSON.parse(jsonContent);
          
          // Handle both single objects and arrays
          const recipes = Array.isArray(data) ? data : [data];
          
          for (const item of recipes) {
            if (item['@type'] === 'Recipe' || (item['@graph'] && item['@graph'].some(g => g['@type'] === 'Recipe'))) {
              const recipe = item['@type'] === 'Recipe' ? item : item['@graph'].find(g => g['@type'] === 'Recipe');
              
              if (recipe) {
                return parseJsonLdRecipe(recipe);
              }
            }
          }
        } catch (e) {
          // Continue to next JSON-LD block
          continue;
        }
      }
    }

    // Fallback to basic HTML parsing
    return parseHtmlRecipe(html, url);
    
  } catch (error) {
    console.error('Error extracting recipe data:', error);
    return null;
  }
}

function parseJsonLdRecipe(recipe) {
  const getTextContent = (item) => {
    if (typeof item === 'string') return item;
    if (item && item.text) return item.text;
    if (item && item.name) return item.name;
    if (Array.isArray(item)) return item.map(getTextContent).join(', ');
    return '';
  };

  const parseTime = (duration) => {
    if (!duration) return undefined;
    const match = duration.match(/PT(\d+)M/);
    return match ? parseInt(match[1]) : undefined;
  };

  return {
    title: getTextContent(recipe.name) || 'Imported Recipe',
    description: getTextContent(recipe.description) || 'Recipe imported from web',
    ingredients: Array.isArray(recipe.recipeIngredient) 
      ? recipe.recipeIngredient.map(getTextContent).filter(Boolean)
      : [getTextContent(recipe.recipeIngredient)].filter(Boolean),
    steps: Array.isArray(recipe.recipeInstructions)
      ? recipe.recipeInstructions.map(instruction => getTextContent(instruction)).filter(Boolean)
      : [getTextContent(recipe.recipeInstructions)].filter(Boolean),
    prep_time: parseTime(recipe.prepTime),
    cook_time: parseTime(recipe.cookTime),
    servings: recipe.recipeYield ? parseInt(recipe.recipeYield) : undefined,
    category: getTextContent(recipe.recipeCategory),
    image_url: recipe.image ? (Array.isArray(recipe.image) ? recipe.image[0] : recipe.image) : undefined
  };
}

function parseHtmlRecipe(html, url) {
  // Basic HTML parsing as fallback
  // This is a simplified version - in production you'd want more robust parsing
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Imported Recipe';
  
  // Try to find meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : 'Recipe imported from web';
  
  // Look for common recipe patterns in HTML
  const ingredientPatterns = [
    /<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/li>/gi,
    /<div[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<p[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/p>/gi
  ];
  
  const stepPatterns = [
    /<li[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)<\/li>/gi,
    /<div[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<p[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)<\/p>/gi,
    /<li[^>]*class="[^"]*step[^"]*"[^>]*>([^<]+)<\/li>/gi
  ];
  
  let ingredients = [];
  let steps = [];
  
  // Extract ingredients
  for (const pattern of ingredientPatterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 0) {
      ingredients = matches.map(match => match[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      break;
    }
  }
  
  // Extract steps
  for (const pattern of stepPatterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 0) {
      steps = matches.map(match => match[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      break;
    }
  }
  
  // If we couldn't find structured ingredients/steps, return null
  if (ingredients.length === 0 || steps.length === 0) {
    return null;
  }
  
  return {
    title,
    description,
    ingredients,
    steps,
    category: 'imported'
  };
}
