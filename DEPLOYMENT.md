# 🚀 Deployment Guide

This guide provides step-by-step instructions for deploying the Code Recipe Book application to various platforms.

## 📋 Pre-deployment Checklist

Before deploying, ensure you have:

- [ ] Supabase project set up with database schema
- [ ] Gemini API key from Google AI Studio
- [ ] Environment variables configured
- [ ] Application tested locally
- [ ] Repository pushed to GitHub (for automatic deployments)

## 🌐 Netlify Deployment (Recommended)

Netlify provides the best experience for React applications with automatic deployments, environment variable management, and CDN distribution.

### Step 1: Prepare Your Repository

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify Build Locally**
   ```bash
   npm run build
   npm run preview
   ```

### Step 2: Connect to Netlify

1. **Sign up/Login to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up or login with your GitHub account

2. **Import Repository**
   - Click "New site from Git"
   - Choose GitHub as your Git provider
   - Select your `code-recipe-book` repository

### Step 3: Configure Build Settings

Netlify should auto-detect the settings, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18` (set in netlify.toml)

### Step 4: Set Environment Variables

In Netlify dashboard, go to **Site settings > Environment variables**:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_APP_NAME=Code Recipe Book
VITE_APP_VERSION=1.0.0
```

### Step 5: Deploy

1. Click **Deploy site**
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be available at a random Netlify URL
4. Optionally, configure a custom domain

### Step 6: Set Up Continuous Deployment

- Every push to `main` branch will trigger automatic deployment
- Pull request previews are automatically generated
- Build logs are available in the Netlify dashboard

## ⚡ Vercel Deployment

Vercel is another excellent option for React applications.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your personal account
# - Link to existing project? No
# - Project name? code-recipe-book
# - Directory? ./
# - Override settings? No
```

### Step 3: Set Environment Variables

```bash
# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY

# Redeploy with environment variables
vercel --prod
```

## 🐳 Docker Deployment

For containerized deployments or self-hosting.

### Step 1: Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Create nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Step 3: Build and Run

```bash
# Build the Docker image
docker build -t code-recipe-book .

# Run the container
docker run -p 8080:80 code-recipe-book
```

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file for production-specific settings:

```env
# Production Supabase Configuration
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Production Gemini Configuration
VITE_GEMINI_API_KEY=your_production_gemini_key

# Production App Configuration
VITE_APP_NAME=Code Recipe Book
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different API keys for development and production
   - Rotate API keys regularly

2. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Configure proper authentication policies
   - Use HTTPS in production

3. **Content Security Policy**
   - The `netlify.toml` includes CSP headers
   - Adjust CSP rules based on your needs
   - Monitor for CSP violations

## 🔍 Monitoring and Analytics

### Build Monitoring

- **Netlify**: Built-in build logs and deploy notifications
- **Vercel**: Real-time build logs and performance insights
- **GitHub Actions**: Set up CI/CD workflows for testing

### Application Monitoring

Consider adding:

- **Sentry** for error tracking
- **Google Analytics** for user analytics
- **Supabase Analytics** for database insights

### Performance Monitoring

- **Lighthouse CI** for performance testing
- **Web Vitals** monitoring
- **Bundle analyzer** for optimization

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable names (must start with `VITE_`)
   - Verify values don't contain special characters

3. **Supabase Connection Issues**
   - Verify URL and API key are correct
   - Check network connectivity
   - Ensure RLS policies allow access

4. **Gemini API Issues**
   - Verify API key is valid
   - Check API quotas and limits
   - Ensure proper error handling

### Debug Commands

```bash
# Check build output
npm run build -- --debug

# Analyze bundle size
npm run build -- --analyze

# Test production build locally
npm run preview
```

## 📈 Post-Deployment

### Performance Optimization

1. **Enable Compression**
   - Netlify/Vercel enable this automatically
   - For custom deployments, enable gzip/brotli

2. **CDN Configuration**
   - Static assets are automatically cached
   - Configure cache headers for optimal performance

3. **Image Optimization**
   - Use WebP format for images
   - Implement lazy loading
   - Consider image CDN services

### Monitoring Setup

1. **Set up error tracking** with Sentry or similar
2. **Configure uptime monitoring** 
3. **Set up performance monitoring**
4. **Enable analytics** for user insights

---

**Your Code Recipe Book is now live! 🎉**

For support or questions about deployment, please check the main README or create an issue in the repository.
