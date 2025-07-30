// Netlify Function for Contact Form Submissions
// Handles contact form submissions and can send emails or store in database

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

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
    const { name, email, subject, message } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: name, email, and message are required' 
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Here you could:
    // 1. Send an email using a service like SendGrid, Mailgun, etc.
    // 2. Store the message in your Supabase database
    // 3. Send to a Slack channel or Discord webhook
    // 4. Log to a monitoring service

    // For now, we'll just log the submission and return success
    console.log('Contact form submission:', {
      name,
      email,
      subject: subject || 'No subject',
      message,
      timestamp: new Date().toISOString(),
      userAgent: event.headers['user-agent'],
      ip: event.headers['x-forwarded-for'] || event.headers['x-bb-ip'],
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('Contact form error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process contact form submission',
        details: error.message,
      }),
    };
  }
};
