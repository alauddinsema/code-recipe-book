# 🚀 Netlify Functions

This directory contains serverless functions for the Code Recipe Book application. These functions run on Netlify's edge network and provide secure backend functionality.

## 📁 Available Functions

### 1. **generate-recipe.js**
**Endpoint**: `/.netlify/functions/generate-recipe`  
**Method**: `POST`  
**Purpose**: Secure proxy for Gemini AI recipe generation

**Request Body**:
```json
{
  "ingredients": ["chicken", "rice", "vegetables"]
}
```

**Response**:
```json
{
  "title": "Chicken Rice Bowl",
  "description": "A delicious and healthy meal",
  "ingredients": ["chicken", "rice", "vegetables"],
  "steps": ["Step 1", "Step 2"],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "easy",
  "category": "main",
  "tags": ["healthy", "quick"],
  "code_snippet": "// JavaScript code for smart cooking",
  "language": "javascript"
}
```

### 2. **health-check.js**
**Endpoint**: `/.netlify/functions/health-check`  
**Method**: `GET`  
**Purpose**: System health monitoring and environment verification

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "service": "Code Recipe Book API",
  "environment_variables": {
    "supabase_url": true,
    "supabase_key": true,
    "gemini_key": true
  },
  "functions": {
    "generate-recipe": "available",
    "health-check": "available"
  }
}
```

### 3. **contact-form.js**
**Endpoint**: `/.netlify/functions/contact-form`  
**Method**: `POST`  
**Purpose**: Handle contact form submissions

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Feature Request",
  "message": "I love the app! Could you add..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon.",
  "timestamp": "2025-01-30T12:00:00.000Z"
}
```

## 🔧 Usage in Frontend

### Using the Recipe Generation Function

```javascript
// In your React component
const generateRecipe = async (ingredients) => {
  try {
    const response = await fetch('/.netlify/functions/generate-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate recipe');
    }

    const recipe = await response.json();
    return recipe;
  } catch (error) {
    console.error('Recipe generation error:', error);
    throw error;
  }
};
```

### Using the Health Check Function

```javascript
// Check system health
const checkHealth = async () => {
  try {
    const response = await fetch('/.netlify/functions/health-check');
    const health = await response.json();
    console.log('System status:', health.status);
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
  }
};
```

### Using the Contact Form Function

```javascript
// Submit contact form
const submitContactForm = async (formData) => {
  try {
    const response = await fetch('/.netlify/functions/contact-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Contact form error:', error);
    throw error;
  }
};
```

## 🔒 Security Features

### Environment Variables
- API keys are securely stored in Netlify environment variables
- Never exposed to the client-side code
- Accessed only by serverless functions

### CORS Headers
- Proper CORS configuration for cross-origin requests
- Secure headers for production deployment
- OPTIONS method handling for preflight requests

### Input Validation
- Request body validation
- Email format validation
- Required field checking
- Error handling and logging

## 🚀 Deployment

### Automatic Deployment
Functions are automatically deployed when you push to your main branch:

1. **Netlify detects** the `netlify/functions` directory
2. **Builds and deploys** each `.js` file as a serverless function
3. **Makes available** at `/.netlify/functions/[function-name]`

### Environment Variables Required
Set these in your Netlify dashboard:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### Testing Functions Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development with functions
netlify dev

# Functions will be available at:
# http://localhost:8888/.netlify/functions/function-name
```

## 📊 Monitoring

### Function Logs
- View function logs in Netlify dashboard
- Monitor performance and errors
- Set up alerts for failures

### Health Monitoring
- Use the health-check function for uptime monitoring
- Integrate with monitoring services
- Check environment variable status

## 🔄 Adding New Functions

To add a new function:

1. **Create a new `.js` file** in `netlify/functions/`
2. **Export a handler function**:
   ```javascript
   exports.handler = async (event, context) => {
     // Your function logic here
     return {
       statusCode: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ message: 'Success!' }),
     };
   };
   ```
3. **Deploy** by pushing to your repository
4. **Access** at `/.netlify/functions/your-function-name`

## 🛠️ Best Practices

- **Keep functions small** and focused on single tasks
- **Handle errors gracefully** with proper status codes
- **Validate input** to prevent security issues
- **Use environment variables** for sensitive data
- **Add CORS headers** for browser compatibility
- **Log important events** for debugging
- **Return consistent JSON** responses

---

**Your Netlify Functions are ready to power your Code Recipe Book! 🍳⚡**
