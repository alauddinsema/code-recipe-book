// Netlify Function for Health Check
// Simple endpoint to verify the functions are working

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';
    
    // Check if required environment variables are present
    const envCheck = {
      supabase_url: !!process.env.VITE_SUPABASE_URL,
      supabase_key: !!process.env.VITE_SUPABASE_ANON_KEY,
      gemini_key: !!process.env.VITE_GEMINI_API_KEY,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        timestamp,
        environment,
        version: '1.0.0',
        service: 'Code Recipe Book API',
        environment_variables: envCheck,
        functions: {
          'generate-recipe': 'available',
          'health-check': 'available'
        }
      }),
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
